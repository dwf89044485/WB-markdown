# Commit Hash 显示机制

> **唯一目标**：让用户在页面右下角看到的 hash，与本次 commit 产生的 hash 一致——这样用户就能确认"我现在看到的页面就是刚刚提交的版本"。
>
> 位数本身无所谓，但**三处必须严格相同**：commit-hash.js 截多少位，vercel-build.sh 注入多少位，AI 报告给用户多少位。

## 用户使用方式

1. AI 完成代码变更后自动 `git commit && git push`，并在对话里报告 hash
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

## hash 长度对齐（**最重要**）

三个位置**必须始终保持完全相同的位数**。当前统一为 **8 位**：

| 位置 | 当前值 |
| --- | --- |
| `commit-hash.js` | `const SHORT = 8`（用 `slice(0, SHORT)` 截断） |
| `vercel-build.sh` | `cut -c1-8` |
| AI 报告给用户的 hash（见 AGENTS.md 提交后的动作） | `git rev-parse HEAD \| cut -c1-8` |

### 不变量

> **如果改长度，三处必须同时改。** 任何一处对不上，用户在页面看到的 hash 就和 AI 报的对不上，整个机制就废了。

### 禁止使用的写法

❌ `git rev-parse --short HEAD`
❌ `git rev-parse --short=N HEAD`

这两种写法只是"**至少** N 位"，仓库规模增长到前缀有歧义时 git 会自动加长返回结果（例如本来 7 位变 8 位）。一旦自动变长，AI 报给用户的 hash 就会比页面截断后的多出几位，对不上。

**只能用 `cut -c1-N`** 这种"硬截断"写法，保证三端长度永远一致。

## 文件分工

### `commit-hash.js`

唯一的 hash 解析入口。fallback 优先级：

1. `<meta name="commit-hash">` 内容（不是 `__COMMIT_HASH__` 占位符）→ Vercel 注入值
2. `fetch('.git/HEAD')` 解析 ref，再 `fetch('.git/refs/heads/<branch>')` → 本地 loose ref
3. `fetch('.git/packed-refs')` 按 ref 名匹配 → 本地 `git gc` 后场景
4. 全部失败 → 显示 `dev`

实现细节：
- 全部 fetch 加 `cache: 'no-store'`，避免浏览器缓存导致显示旧值
- 始终截取前 `SHORT` 位（见上方"hash 长度对齐"）
- 暴露 `window.commitHashReady` (Promise)，供其他模块统一消费，避免重复 fetch

### `vercel-build.sh`

仅做一件事：把 `index.html` 里的 `__COMMIT_HASH__` 占位符替换成 `$VERCEL_GIT_COMMIT_SHA` 经 `cut -c1-8` 截断后的值。

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

## 排查指南

### AI 报的 hash 和页面显示的位数不一致

**这是最常见的故障，本质是三处长度对齐被破坏了。**

立即检查这三处的位数是否相同：

```bash
grep "SHORT" commit-hash.js              # 期望：const SHORT = N
grep "cut -c1" vercel-build.sh           # 期望：cut -c1-N
grep "cut -c1" AGENTS.md                 # 期望：cut -c1-N
```

任意一处的 N 不同 → 改成统一值（不需要纠结 N 是 7 还是 8 还是其他，只要相同即可）。

如果是 AI 报错了 hash（用了 `--short` 而不是 `cut -c1-N`），让它重新跑一次 `git rev-parse HEAD | cut -c1-N`。

### 本地页面 hash 显示 `dev` 或为空

- 浏览器开发者工具 Network 面板，看 `.git/HEAD` 请求是否 200
- 直接访问 `http://localhost:8080/.git/HEAD`，应返回类似 `ref: refs/heads/main`
- 如果 404：你用的不是 `python3 -m http.server`，换回它即可

### 本地页面 hash 不是最新

- 强制刷新（⌘+Shift+R）排除浏览器缓存
- 终端跑 `git rev-parse HEAD | cut -c1-8` 确认本地仓库确实在最新 commit

### 线上页面 hash 还是 `__COMMIT_HASH__` 字符串

- Vercel 构建日志里检查 `vercel-build.sh` 是否被执行
- 确认 Vercel 项目设置里的 Build Command 指向 `vercel-build.sh`

## 严禁修改的部分

- ❌ 不要写任何 git hook 维护 hash 文件
- ❌ 不要重新引入被 git 跟踪的 `COMMIT_HASH` 文件
- ❌ 不要在前端做"我是不是在 Vercel"的环境判断（破坏自动分流）
- ❌ 不要屏蔽或重写 `python3 -m http.server` 对 `.git/` 的访问
- ❌ 不要使用 `git rev-parse --short` 报告 hash（用 `cut -c1-N`，原因见上方"hash 长度对齐"）
