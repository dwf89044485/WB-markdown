# AGENTS.md

本文档为 AI 助手提供项目的上下文与工作约束。**修改前请确认与现有规约不冲突。**

## 项目架构

本项目为 WorkBuddy 动态原型，采用以下文件结构：

| 文件/目录                      | 职责                                                                    |
| -------------------------- | --------------------------------------------------------------------- |
| `index.html`               | 手机壳、导航、输入框、对话容器、底部浮层等视觉骨架                                             |
| `styles/base.css`          | Reset、phone-shell、status-bar、nav-bar、glass 按钮系统、composer              |
| `styles/conversation.css`  | User/agent 消息气泡、timing-bar、exec-area、step-row、status-line、playback 动画 |
| `styles/markdown.css`      | CSS 变量 tokens（设计系统源头）、.md 阅读系统、table、typewriter 动效、response-actions   |
| `styles/sheet.css`         | Bottom sheet、工具事件行（s-row）、todo 列表、sheet CSS 变量                        |
| `styles/demo-controls.css` | 演示控制台（.demo-controls）、media query                                     |
| `scenario.js`              | 剧本数据：playback / nav / nodes / sheetFrames / final / todosBaseline     |
| `engine/core.js`           | 播放状态（activePlayId、fastRender）、sleep、scrollToBottom、playback 参数读取      |
| `engine/markdown.js`       | Markdown parser（escapeHtml、inlineMarkdown、markdownToHtml）             |
| `engine/icons.js`          | 图标系统（SVG 注册表、tool icon 推断、status line 渲染）                             |
| `engine/typewriter.js`     | Token 流式输出（typeText、appendHTMLTypedTo）                                |
| `engine/sheet.js`          | 底部浮层渲染（renderSheet、openSheet、renderEvent、renderTodo）                  |
| `engine/player.js`         | 播放引擎主入口（Director timeline、步进控制、final render、displayMode）              |
| `icons-inline.js`          | **自动生成，SVG 内联数据，禁止手动修改，AI 操作时无需读取**                                   |

> **注意**：`icons-inline.js` 为自动生成文件（SVG 内联，28KB），禁止手动修改，AI 操作时无需读取此文件。

> **速度控制**：输出速度变量为 `scenario.playback.tokensPerSecond`，默认值 `200`。读取入口为 `engine/core.js` 的 `currentTokensPerSecond()`。UI 控件在 `index.html` 的 `#ctrlSpeedSlider`（range slider，20~1000，步进 10），当前值显示在 `#ctrlSpeedValue`。`typewriter.js` 用 `typeIntervalForChunk()` 实时读取该值；`core.js` 的 `playbackDelay()` 也按 `200 / tps` 缩放 `frameDelay` 和 `stepDelay`，所以调速对打字速度和步进间隔同时生效。

> **本地开发**：使用 `python3 -m http.server 8080` 或 VS Code Live Server，通过 `http://localhost:8080` 访问，不要直接双击 HTML（`engine/` 模块用 ES Module，`file://` 协议不支持）。

**关键设计约束：**

1. 不改视觉体系：沿用现有 class、圆角、字号、间距和组件结构。
2. 不把剧本写死进 HTML：后续改剧本时主要改 `scenario.js`。
3. 浮层不是累积日志：每条状态行绑定自己的最后一帧，点击时展示对应快照。
4. timing-bar 只在全部节点结束后出现。
5. 旧实现里的节点3删除项未迁入：不再出现"原生中文字符重写整个文件"和"已调用工具"。
6. todos 数据：`scenario.js` 里 `todosBaseline` 是文本基准，各 sheetFrame 用 `todoOverrides` 只记录 status 变更，engine/sheet.js 的 `renderSheet` 合并两者渲染完整列表。

### 执行区间距架构约束（conversation）

1. 外层间距只由 `.agent-msg` 的 `gap` 控制，变量为 `--cv-agent-stack-gap`（用于 header / timing / exec / main 的顶层模块间距）。
2. 内层间距只由执行区容器控制，变量为 `--cv-exec-stack-gap`（用于 `.exec-area` 与 `.flat-container` 内部条目间距）。
3. 禁止用子级 `margin-bottom` 参与跨层间距（例如 `thinking-mount` 不得再给 `exec -> main` 叠加间距）。
4. `#timingMount` 为空时必须隐藏（`#timingMount:empty { display:none; }`），避免空容器占位导致假间距。
5. 间距值必须走 token；禁止在结构间距上新增硬编码 px（如 `<hr>` 的下边距也应使用 token）。

## Git 工作流

**每次做完一件事就 commit**，不等用户说。**commit 后不自动 push**，是否推送由用户决定。

提交范围只包含本次任务直接相关的文件。

### 提交前检查

- 运行相关测试，确保通过
- 运行 lint 检查（如项目有配置）
- 确认只提交本次任务直接相关的文件

### 提交信息规范

用中文书写，使用约定式提交格式：

```
<类型>(<范围>): <具体描述>
<类型>(<大类>/<子模块>): <具体描述>   // 三层写法
```

**三层写法（推荐）**：当改动属于某个大类下的子模块时，用斜杠分隔：

```
fix(ui/nav): 修复导航栏错位问题
fix(ui/sheet): 修复底部浮层关闭动画
fix(ui/composer): 修复输入框 placeholder 颜色
fix(ui/status-bar): 修复状态栏时间显示
feat(ui/theme): 新增暗黑模式切换
refactor(ui/conversation): 重构消息气泡间距
```

**常用大类**：
- `ui` — 视觉/交互/样式相关（你主要用的）
- `engine` — 播放引擎/核心逻辑
- `scenario` — 剧本/数据
- `build` — 构建/部署/配置

**常用子模块**（以 `ui` 为例）：
`nav`、`sheet`、`composer`、`status-bar`、`conversation`、`theme`、`markdown`、`demo-controls`、`icons`

**如果改动涉及多个子模块**，大类后写 `*` 或直接写大类：

```
fix(ui/*): 统一调整所有圆角
fix(ui): 修复多个组件的深色模式兼容问题
```

常用类型：`feat`(新功能)、`fix`(修复)、`refactor`(重构)、`docs`(文档)、`style`(格式)、`test`(测试)

### 回溯查找 UI 类改动

由于你的工作以 UI/UX 体验优化为主，`ui` 类 commit 会非常多。以下命令帮你快速筛选：

```bash
# 查看所有 UI 类提交（按时间倒序）
git log --oneline --grep="(ui"

# 查看某个子模块的所有提交
git log --oneline --grep="(ui/nav)"

# 只看 fix 类型的 UI 提交
git log --oneline --grep="fix(ui"

# 统计各子模块的提交数量
git log --oneline --grep="(ui" | grep -oP '\(ui/[^)]+\)' | sort | uniq -c | sort -rn

# 查看某次 UI 改动的具体内容
git show <hash> --stat
```

### 提交后的动作

提交完成后在对话中告知用户：

```
已提交：{commit message}
hash：{短 hash（8 位）}
```

`hash` 必须取 `git rev-parse HEAD | cut -c1-8`，**始终固定 8 位**，与 `commit-hash.js` 的 `SHORT = 8` 和 `vercel-build.sh` 的 `cut -c1-8` 保持一致。

不要使用 `git rev-parse --short HEAD` 或 `--short=N`——这两种写法只是"至少 N 位"，仓库规模增长时会自动变长，破坏三端一致。

### 主动询问推送

不要求记住计数或状态。每次 commit 后，如果**下一轮对话收到的新请求与上一轮 commit 属于不同的模块/主题**，判断为用户切换了任务，此时应主动询问用户是否需要 push：

```md
上一轮的改动（{模块名}）还没推送到远程。要不要先推送再开始新的？
```

**判断用户切换任务的标准（满足任意一条即可）：**

1. **领域跳转**：新请求涉及的模块/文件和上一轮 commit 属于不同大类（如从 `ui/sheet` 跳到 `ui/nav` / `scenario` / 文档等）
2. **话题终止信号**：用户看完结果后没有要求继续调整，说了"好"、"可以"、"就这样"等收尾词，并且马上提出了新要求
3. **新任务宣言**：用户明确说"现在来看另一个问题"、"还有一件事"、"另外"等
4. **中间无关联查询**：用户问了一个与当前工作无关的问题（如查 Vercel 状态），然后再提新需求——属于同一个会议 session 但任务已切换

**不需要询问的场景：**
- 用户还在当前模块内提调整要求（修改 → 再改 → 再微调 → 最终满意）
- 用户明确说"先不推"

### 用户推送

用户说"推"或"推送"后执行：

```bash
git push
```

如果 push 失败（远程有更新），先 `pull --rebase` 再推送。

### 例外情况

以下情况先确认再提交：

- 用户明确说「先不提交」「等一下再推」
- 当前改动明显是多步任务的中间状态，后续还有关联改动未完成

### Commit hash 显示机制

页面右下角显示的 8 位 hash 用于让用户验证当前页面是否最新版本。机制详见 `docs/commit-hash.md`。

**禁止改动**：

- 不要写任何 git hook 维护 hash 文件
- 不要重新引入被 git 跟踪的 `COMMIT_HASH` 文件
- 不要在前端做"我是不是在 Vercel"的环境判断
- 不要屏蔽 `python3 -m http.server` 对 `.git/` 的访问

如果用户报告 hash 显示有问题，先看 `docs/commit-hash.md` 的"排查指南"。

### 版本指示圆点

`.status-version-dot`（状态栏时间右侧）用于用户确认线上页面是否最新代码。

**git commit 前**（必须执行）：
1. 打开 `styles/base.css`，搜索 `=== VERSION DOT`
2. 把 `.status-version-dot { background: #xxxxxx }` 改成另一种颜色（任意，不重复上次即可）

**git commit 后**：在对话中告知用户 `hash: xxxxxxxx`，同时说明 `圆点颜色：XX色（#xxxxxx）`。

## 回复规范

每次回复必须以 `🎯` 作为第一行，正文从第二行开始。