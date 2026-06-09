# Commit Hash 显示机制

> 本文档说明项目里"页面右下角显示 7 位 commit hash"这套机制的设计与实现。
> 用户用这个 hash 验证当前看到的页面是否就是最新提交的版本。

## 用户使用方式

1. AI 完成代码变更后自动 `git commit && git push`，并在对话里报告 `hash: xxxxxxx`
2. 用户打开页面（本地 server 或 Vercel 线上），看右下角显示的 hash
3. 两个 hash 一致 = 当前看到的就是最新版

## 实现概览

| 端 | 数据来源 | 时效 |
| --- | --- | --- |
| 本地 `python3 -m http.server` | 浏览器 `fetch('.git/HEAD')` 实时解析 | 每次刷新即最新 HEAD |
| Vercel 线上 | 构建时注入 `<meta name="commit-hash">` 占位符 | 等于本次部署的 commit |

两端**自动分流**，前端无需做任何环境判断：
- 本地：`.git/` 可访问 → 优先走 fetch 链路
- 线上：Vercel 不上传 `.git/` → fetch 全部 404 → 自动 fallback 到 meta 值

## 文件分工

### `commit-hash.js`

唯一的 hash 解析入口。fallback 优先级：

1. `<meta name="commit-hash">` 内容（不是 `__COMMIT_HASH__` 占位符）→ Vercel 注入值
2. `fetch('.git/HEAD')` 解析 ref，再 `fetch('.git/refs/heads/<branch>')` → 本地 loose ref
3. `fetch('.git/packed-refs')` 按 ref 名匹配 → 本地 `git gc` 后场景
4. 全部失败 → 显示 `dev`

实现细节：
- 全部 fetch 加 `cache: 'no-store'`，避免浏览器缓存导致显示旧值
- 始终截取前 7 位
- 暴露 `window.commitHashReady` (Promise)，供其他模块统一消费，避免重复 fetch

### `vercel-build.sh`

仅做一件事：把 `index.html` 里的 `__COMMIT_HASH__` 占位符替换成 `${VERCEL_GIT_COMMIT_SHA:0:7}`。

不再写任何文件（早期版本会写 `COMMIT_HASH` 文件，已废弃）。

### `index.html`

`<head>` 里有一个 `<meta name="commit-hash" content="__COMMIT_HASH__">`，本地永远是占位符（让 commit-hash.js 走 fetch 链路），Vercel 构建时被替换。

页面里有一个 `<span id="ctrlCommitHash">`，由 commit-hash.js 写入。

### `engine/controls-mode.js` / `engine/player.js`

不直接 fetch，只消费 `window.commitHashReady` 的结果，把 hash 写到 DOM 元素。

## 设计取舍

### 为什么不维护一个被 git 跟踪的 hash 文件

任何"把 hash 写入被 git 跟踪文件"的方案物理上都不可能稳定：
- 写入 hash → 文件内容变化 → commit 内容变化 → 新 hash 又不一样 → 无限循环

历史上写过这种 post-commit hook，导致 fork bomb 把进程槽吃光、整机崩溃。**永久禁用 hook 这条路**。

### 为什么本地依赖 `.git/` 暴露

`python3 -m http.server` 默认暴露当前目录下所有文件，包括 `.git/`。这通常被视为安全问题，但本项目是纯本地开发场景，且：
- 线上 Vercel 部署不会上传 `.git/`，无外泄风险
- 它是"零工具、零脚本、零 hook"实现实时 hash 的唯一可行路径

如果本地启动 server 换成其他不暴露 `.git/` 的方案（如某些静态 server），fetch 会全部失败，页面会显示 `dev`，不影响功能但失去验证意义。

### 为什么不输出 prehash → currhash 这种两段式

旧版 AGENTS.md 曾要求 AI 同时报告 `prehash → currhash`，是为了绕过当时本地 hash 永远滞后一个版本的限制。本方案让本地实时显示最新 HEAD，单一 hash 即可校对，已废除这种冗余报告格式。

## 排查指南

### 本地页面 hash 显示 `dev` 或为空

- 浏览器开发者工具 Network 面板，看 `.git/HEAD` 请求是否 200
- 直接访问 `http://localhost:8080/.git/HEAD`，应返回类似 `ref: refs/heads/main`
- 如果 404：你用的不是 `python3 -m http.server`，换回它即可

### 本地页面 hash 不是最新

- 强制刷新（⌘+Shift+R）排除浏览器缓存
- 终端跑 `git rev-parse --short=7 HEAD` 确认本地仓库确实在最新 commit

### 线上页面 hash 还是 `__COMMIT_HASH__` 字符串

- Vercel 构建日志里检查 `vercel-build.sh` 是否被执行
- 确认 Vercel 项目设置里的 Build Command 指向 `vercel-build.sh`

## 严禁修改的部分

- ❌ 不要写任何 git hook 维护 hash 文件
- ❌ 不要重新引入被 git 跟踪的 `COMMIT_HASH` 文件
- ❌ 不要在前端做"我是不是在 Vercel"的环境判断（破坏自动分流）
- ❌ 不要屏蔽或重写 `python3 -m http.server` 对 `.git/` 的访问
