# AGENTS.md

本文档为 AI 助手提供项目的上下文与工作约束。**修改前请确认与现有规约不冲突。**

## 项目架构

本项目为 WorkBuddy 动态原型，采用以下文件结构：

| 文件/目录                      | 职责                                                                    |
| -------------------------- | --------------------------------------------------------------------- |
| `index.html`               | 手机壳、导航、输入框、对话容器、底部浮层等视觉骨架                                             |
| `styles/base.css`          | Reset、phone-shell、status-bar、nav-bar、glass 按钮系统、composer              |
| `styles/conversation.css`  | User/agent 消息气泡、timing-bar、exec-area、step-row、status-line、playback 动画 |
| `styles/markdown.css`      | CSS 变量 tokens（设计系统源头）、.md 阅读系统、table、typewriter 动效、response-actions。**表格全屏交互样式**（第397行起）：`.tbl-fullscreen-overlay`（全屏浮层）、`.tbl-landscape`（手机壳横屏模式，桌面端 852×393，移动端竖向全屏）、`.tbl-fs-nav`/`.tbl-fs-content`/`.tbl-fs-actions` 等全屏导航组件 |
| `styles/sheet.css`         | Bottom sheet、工具事件行（s-row）、todo 列表、sheet CSS 变量                        |
| `styles/demo-controls.css` | 演示控制台（.demo-controls）、media query                                     |
| `scenario.js`              | 剧本数据：playback / nav / nodes / sheetFrames / final / todosBaseline     |
| `engine/core.js`           | 播放状态（activePlayId、fastRender）、sleep、scrollToBottom、playback 参数读取      |
| `engine/markdown.js`      | Markdown parser（escapeHtml、inlineMarkdown、markdownToHtml）。**表格渲染入口**：检测 `|` 分隔符（第65行），渲染 `<table>` 及 `tbl-toolbar` 工具栏（第73行），包含 4 个按钮：`tbl-copy`（复制）、`tbl-save-image`（保存图片）、`tbl-share`（分享）、`tbl-maximize`（全屏/展开）。SVG 图标常量定义在文件顶部（第3-8行） |
| `engine/icons.js`          | 图标系统（SVG 注册表、tool icon 推断、status line 渲染）                             |
| `engine/typewriter.js`     | Token 流式输出（typeText、appendHTMLTypedTo）                                |
| `engine/sheet.js`          | 底部浮层渲染（renderSheet、openSheet、renderEvent、renderTodo）                  |
| `engine/player.js`         | 播放引擎主入口（Director timeline、步进控制、final render、displayMode）；导出 `goToStep` / `pauseDirector` / `resumePlayback` / `resolveNodeStep` |
| `engine/scroll-nav.js`     | 快速滚动按钮（↑↓）——按 turn 跳转对话消息；`initScrollNav`/`rebuildScrollNav` 由 `player.js` import；内含 `isTblFullscreen` 状态感知，全屏时禁用滚动 |
| `engine/controls-speed.js` | 速度滑块绑定（IIFE，非 ES module）：监听 `#ctrlSpeedSlider`，同步 `scenario.playback.tokensPerSecond`，更新 `#dcSpeedRoValue` 显示；含重播按钮 `#ctrlTweakReload` |
| `engine/controls-stepper.js` | 步进控制绑定（IIFE）：`#ctrlPrevStep`/`#ctrlAutoStep`/`#ctrlNextStep` 绑定到 `player.js` 导出的 `directorPrevStep`/`directorNextStep`/`toggleDirectorAuto` |
| `engine/ask-question.js`   | 问答卡片渲染与交互（单选/多选/排序题、拖拽排序、状态管理、事件绑定）                          |
| `styles/ask-question.css`  | 问答卡片样式（卡片容器、选项行、排序拖拽手柄、导航按钮、输入栏、步骤指示器、玻璃按钮系统）            |
| `engine/feature-router.js` | URL 路由工具：`parseURL` / `buildURL` / `pushRoute` / `onChange`；`?view=overview` / `?view=feature&id=<id>`；未知 view / 缺 id 一律 fallback 到 overview |
| `engine/feature-jump.js`   | 跳转锚点引擎：`jumpToAnchor(anchor)` = 解析 nodeIndex → resolveNodeStep + goToStep（`jumpDirectorTo` fast-render）+ resumePlayback + 轮询 until 条件（8s 超时兜底）+ pauseDirector |
| `engine/feature-panel.js`  | 右侧说明栏主控：读 URL → 渲染对应 feature 内容；下拉菜单导航；锚点按钮事件代理；屏宽 < 600 时不初始化 |
| `features/index.js`        | Feature 注册中心（唯一真相源）：import 各 feature 模块，export `featureList` / `featureMap` / `getFeature`；数组顺序 = 下拉菜单顺序 |
| `features/overview.js`     | 总览「设计思考」feature（v1 占位）；`type: 'overview'`，无锚点 |
| `features/ask-question.js` | AskQuestion feature：完整说明内容（HTML 模板字符串）+ 6 个细粒度锚点（`single-appear` / `single-auto-next` / `multi-appear` / `multi-checked` / `sort-appear` / `sort-after-drag`） |
| `styles/feature-panel.css` | 右侧说明栏样式：`.fp-root` / `.fp-nav` / `.fp-nav-menu` / `.fp-content` / `.fp-anchor-btn` / `.fp-placeholder-block` 等 |
| `icons-inline.js`          | **自动生成，SVG 内联数据，禁止手动修改，AI 操作时无需读取**                                   |

> **注意**：`icons-inline.js` 为自动生成文件（SVG 内联，28KB），禁止手动修改，AI 操作时无需读取此文件。

> **⚠️ 两套 Markdown 样式系统（极易混淆）**：
> - **左侧 Demo 区**（手机壳内对话流）→ 使用 `styles/markdown.css`，CSS 变量以 `--md-` 开头，如 `--md-font-h1: 20px`，h1 字号 20px
> - **右侧 Feature Panel 区**（交互说明栏）→ 使用 GitHub 官方 `github-markdown.css`（CDN 引入），h1 字号为 `2em`（约 32px），样式类名 `.markdown-body`
> - **切勿混淆**：查 h1 样式时，Demo 区去 `styles/markdown.css`，Feature Panel 区去 GitHub 官方样式或 `index.html` 中 CDN 链接
> - **渲染入口**：`engine/markdown.js` 负责 Demo 区解析；`engine/feature-panel.js` 将 feature content 注入 `.fp-content.markdown-body`（Feature Panel 区）

> **速度控制**：输出速度变量为 `scenario.playback.tokensPerSecond`，默认值 `200`。读取入口为 `engine/core.js` 的 `currentTokensPerSecond()`。UI 控件在 `index.html` 的 `#ctrlSpeedSlider`（range slider，5~1500，步进 5），当前值显示在 `#dcSpeedRoValue`。绑定逻辑在 `engine/controls-speed.js`（IIFE，随 `player.js` 模块加载后执行）。`typewriter.js` 用 `typeIntervalForChunk()` 实时读取该值；`core.js` 的 `playbackDelay()` 也按 `200 / tps` 缩放 `frameDelay` 和 `stepDelay`，所以调速对打字速度和步进间隔同时生效。

> **本地开发**：使用 `python3 -m http.server 8080` 或 VS Code Live Server，通过 `http://localhost:8080` 访问，不要直接双击 HTML（`engine/` 模块用 ES Module，`file://` 协议不支持）。

**关键设计约束：**

1. 不改视觉体系：沿用现有 class、圆角、字号、间距和组件结构。
2. 不把剧本写死进 HTML：后续改剧本时主要改 `scenario.js`。
3. timing-bar 只在全部节点结束后出现。
4. 旧实现里的节点3删除项未迁入：不再出现"原生中文字符重写整个文件"和"已调用工具"。
5. todos 数据：`scenario.js` 里 `todosBaseline` 是文本基准，各 sheetFrame 用 `todoOverrides` 只记录 status 变更，engine/sheet.js 的 `renderSheet` 合并两者渲染完整列表。

6. **Sheet 浮层——必须使用现有框架，禁止重新造轮子。** 所有底部浮层必须走 `engine/sheet.js` 的统一渲染入口（`renderSheet`/`openSheet`），数据源必须走 `scenario.js` 的 `sheetFrames` 数组。**每条状态行只绑定自己的帧数据（`btn.dataset.frames`），点击时只展示对应帧的快照，禁止累积多条状态行的帧数据混入同一个 Sheet。** 禁止在 `index.html` 硬编码浮层结构，禁止在 `engine/player.js` 或其他引擎文件里单独写一套浮层渲染逻辑。如需新增浮层内容类型，按以下规则往现有框架里加：
   - **数据** → 在 `scenario.js` 的 `nodes` 中对应 step 的 `sheetFrame` 字段追加新条目
   - **渲染逻辑** → 在 `engine/sheet.js` 的 `renderSheet` 中新增 `case` 分支处理新类型
   - **样式** → 在 `styles/sheet.css` 中扩展对应 class
   - **交互** → 在 `engine/sheet.js` 的交互事件绑定中扩展
   - 以上 4 个文件之外的任何位置出现浮层渲染代码，均视为违规。

8. **设计交付物说明系统——必须走 feature-panel 框架，禁止散写。** 右侧说明栏的所有内容必须走以下分层：
   - **内容** → 在 `features/<id>.js` 里定义 `{ id, type, label, anchors, content }` 对象
   - **注册** → 在 `features/index.js` 的 `featureList` 数组里追加
   - **样式** → 在 `styles/feature-panel.css` 里扩展
   - **锚点** → 在对应 `features/<id>.js` 的 `anchors` 字段里定义 `{ stepIndex, until, label }`
   - 以上 4 个位置之外出现说明内容渲染代码，均视为违规。

   **内容形态约束：交互说明必须图文并茂，禁止纯文本/纯 HTML 字符串。** 合规的形态包括：
   - 构成 / 状态 / 类型 → 带标注的截图（放在 `docs/figures/` 里，用 `<img>` 嵌入）
   - 流程图 → 内联 SVG 或 Mermaid 渲染
   - 动效 → GIF / 内联 mini preview
   - Do's / Don'ts → 视觉对比（两列截图）

   纯文字说明只允许出现在"为什么"这类设计原理章节；描述外观和行为的章节，必须有视觉证据。

   **组件快照系统（Component Snapshot System）—— 嵌入 Demo 实样的方法。**

   在交互说明中嵌入 Demo 组件的实样展示时，使用以下 CSS 布局类（定义在 `styles/feature-panel.css`）：

   | 布局类 | 用途 | HTML 结构 |
   |--------|------|-----------|
   | `.fp-snapshot-side` | 1 个快照 + 右侧文字描述 | `div.fp-snapshot-side > div.fp-snapshot-wrap + div.fp-snapshot-side-desc` |
   | `.fp-snapshot-row` | 多个快照单元横向平铺（数量不限） | `div.fp-snapshot-row > div.fp-snapshot-wrap × N` |
   | 直接使用 `fp-snapshot-wrap` | 单个快照，无布局容器 | 直接放在 `.fp-content.markdown-body` 下 |

   每个快照块的内部结构（由 `labeled()` 辅助函数生成）：
   ```
   div.fp-snapshot-wrap
     span.tag              ← 标签文字（如"未选"、"已选"）
     div.fp-snapshot         ← 组件快照本体
     div.fp-snapshot-caption ← 底部描述（可选）
   ```

   使用步骤：
   ```
   // 1. 在 features/<id>.js 中用 labeled() 辅助函数创建带标签的快照块
   import { renderStaticMyComponent } from 'engine/my-component.js';
   function labeled(label, html) {
     return `<div class="fp-snapshot-wrap"><span class="tag">${label}</span><div class="fp-snapshot">${html}</div></div>`;
   }

   // 2. 用布局容器包裹快照块组
   content: `
     <h2>...</h2>
     <p>...</p>
     <div class="fp-snapshot-row">
       ${labeled('状态A', renderStaticMyComponent({...}))}
       ${labeled('状态B', renderStaticMyComponent({...}))}
       ${labeled('状态C', renderStaticMyComponent({...}))}
     </div>
   `

   // 3. 在 styles/feature-panel.css 中设定组件宽度
   .fp-snapshot > .my-component-class { width: 350px }
   ```

   **核心规则（违反必出 Bug）：**
   - 布局容器（`fp-snapshot-row / fp-snapshot-side`）**禁止设置 `overflow: hidden/auto/scroll`**，否则 box-shadow 会被裁切
   - 布局容器 **禁止有水平 `padding`**（左对齐由 `.markdown-body` 的 `padding: 0 16px` 统一保证）
   - 带投影的组件按照 CSS 默认不会裁切；要裁切它的唯一方式是父容器设了 overflow
   - 不带投影的组件不存在裁切风险，但左对齐规则同样适用

9. **交互与功能——优先使用现成方案，禁止从头造轮子。** 当用户提出交互或功能需求时，必须先搜索是否存在成熟的现成方案（开源库、CDN 可引入的组件、已有生态方案等），优先采用现成方案或在现成方案上做微调和样式适配。只有在确认无任何现成方案可用时，才允许从头实现。搜索途径包括但不限于：Web 搜索（tavily-cli）、npm/GitHub 查找、CDN 目录检索。违反此规则的实现视为违规。

### 表格交互专项说明

表格的渲染和交互涉及以下文件：

| 关注点 | 文件 | 关键位置 |
|--------|------|----------|
| 表格渲染 & 工具栏 | `engine/markdown.js` | 第65-77行（`markdownToHtml` 中检测 `|` 分隔符 → 渲染 `tbl-outer` + `tbl-toolbar` + `<table>`） |
| 工具栏按钮定义 | `engine/markdown.js` | 第73行（`tbl-copy`、`tbl-save-image`、`tbl-share`、`tbl-maximize`） |
| 全屏展开样式 | `styles/markdown.css` | 第397行起（`.tbl-fullscreen-overlay` 全屏浮层、`.tbl-landscape` 横屏模式） |
| 桌面端横屏 | `styles/markdown.css` | `.phone-shell.tbl-landscape`：手机壳变为 852×393，隐藏状态栏/对话流/输入框 |
| 移动端全屏 | `styles/markdown.css` | `html:not(.force-desktop) .phone-shell.tbl-landscape`：竖向全屏，不旋转 |
| 全屏 JS 交互 | `index.html` `<script>` 块 | `tbl-maximize` 点击事件在 `index.html` 底部的内联 `<script>` 中实现（非 engine 文件）；支持桌面端横屏（`tbl-landscape`）+ 移动端全屏（`tbl-mobile`/`tbl-mobile-portrait`/`tbl-mobile-landscape`）；监听 `orientationchange` / `visualViewport.resize` 自动同步方向 |

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

## 部署到 pages.woa.com

本项目部署在 https://workbuddy-markdown.pages.woa.com。

用户说 **"更新pages"** 时，立即执行部署脚本，不等用户确认：

```bash
bash PAGES/deploy-pages.sh
```

部署脚本会收集 index.html、engine/*.js、styles/*.css、features/*.js 等文件打包上传。全文本文件，无需 base64 编码。

另外也有 Python 版可直接调用：

```bash
python3 PAGES/deploy-pages.py && \
curl -X PUT https://pages.woa.com/api/sites/workbuddy-markdown.pages.woa.com \
  -H "X-Api-Key: $OA_PAGES_API_KEY" \
  -H "Content-Type: application/json" \
  -d @/tmp/pages_payload.json
```

API Key 存储在 `~/.zshrc` 中（`export OA_PAGES_API_KEY="..."`）。部署脚本会自动读取，无需手动设置环境变量。

## 页面空白排查

框架可见但内容不加载 → 看 `engine/`.js 文件有无语法错误，尤其检查 patch 残留行号（搜索 `→` 字符）。

## 回复规范

每次回复必须以 `🎯` 作为第一行，正文从第二行开始。

<claude-mem-context>
# Memory Context

# [wb-markdown] recent context, 2026-06-16 7:10pm GMT+8

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 13 obs (2,680t read) | 585,745t work | 100% savings

### Jun 8, 2026
5070 11:12a 🟣 Composer 上方加透明渐变遮罩消除滚动截断
### Jun 16, 2026
5071 5:14p 🔵 AskQuestion nav trigger button located in feature-panel.js
5072 5:15p 🟣 Feature panel nav trigger redesigned as capsule dropdown
5073 5:17p 🟣 AskQuestion 导航触发器改为胶囊下拉样式
5074 " 🔴 修复 feature-panel.css 中孤立 CSS 属性导致下拉菜单异常展开
5075 5:21p ✅ ask-question feature section heading renamed to "2. 组件构成"
5076 " ✅ Version indicator dot color changed from cyan to orange
5077 5:31p 🔵 排序组件状态展示 Bug — 拖拽时与新手指引两个状态未正确渲染
5078 5:34p 🔵 排序组件多状态展示渲染异常
5079 5:35p 🔴 排序组件拖拽态和指引态快照视觉差异修复
5080 " 🔴 排序快照指引态精修：指引仅高亮第2项，去掉多余描边
5081 6:59p 🟣 AskQuestion 导航按钮改为胶囊下拉样式
5082 " 🔵 wb-markdown 项目 CSS 架构与 feature-panel 导航结构

Access 586k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>