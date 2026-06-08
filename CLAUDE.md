# CLAUDE.md — WorkBuddy 动态原型 AI 协作指南

## 项目简介

WorkBuddy 动态原型是一个手机壳包裹的 Agent 对话流演示页面。它通过剧本数据驱动播放引擎，逐步还原 AI Agent 执行长任务的全过程——从用户输入、思考分解、工具调用（搜索/生图/文件操作/子代理），到最终交付方案文档。

技术栈：纯 HTML + CSS + Vanilla JS，无框架、无构建工具、无 npm。

## 文件职责索引

### 运行时核心文件

| 文件 | 行数 | 职责 | AI 修改频率 |
|------|------|------|------------|
| `index.html` | 128 | 视觉骨架：手机壳、状态栏、导航栏、对话容器、输入框、底部浮层、演示控制 | 低 |
| `styles.css` | 1532 | 所有视觉样式（⚠️ 最大文件，含 v7-v10 补丁层和 50+ `!important`） | 中 |
| `scenario.js` | 981 | 剧本数据：播放配置、导航元数据、用户消息、节点序列、浮层快照、最终输出 | 高 |
| `app.js` | 913 | 播放引擎（⚠️ Fat File：7+ 职责混合，无分区注释） | 中 |
| `icons-inline.js` | 2 | SVG 图标注册表（压缩格式，通常不需修改） | 极低 |

### 参考与规范文件

| 文件 | 职责 |
|------|------|
| `conversation-scene.html` | 设计原型参考（Tailwind CSS），**不参与运行时**，与 index.html 存在 SVG/样式重复 |
| `MARKDOWN_STYLE_TOKENS.md` | Markdown 样式 Design Tokens 规范 v7 |
| `AGENTS.md` | 项目架构约束、Git 工作流、回复规范 |
| `CLAUDE.md` | 本文件：AI 协作指南 |

## app.js 内部职责分区

虽然 `app.js` 当前无分区注释，但其内部可按以下逻辑域理解：

```
┌─────────────────────────────────────────────────┐
│ 全局状态与配置                                     │  L1-18
├─────────────────────────────────────────────────┤
│ 播放控制                                          │  sleep, typeText, typeClone, appendHTMLTypedTo
├─────────────────────────────────────────────────┤
│ DOM 渲染                                          │  createStep, createStatusLine, renderEvent, renderTodo
├─────────────────────────────────────────────────┤
│ Markdown 解析                                     │  escapeHtml, inlineMarkdown, markdownToHtml
├─────────────────────────────────────────────────┤
│ 状态行推进                                        │  runStatus, runStatusGroup, normalizeActions, setStatusLineLabels
├─────────────────────────────────────────────────┤
│ Director 时间线                                    │  buildDirectorTimeline, runDirectorStep, runDirectorAutoLoop
├─────────────────────────────────────────────────┤
│ Sheet 管理                                        │  openSheet, closeSheet, renderSheet, getFrames
├─────────────────────────────────────────────────┤
│ 图标渲染                                          │  renderToolIcon, svgFromRegistry, inferToolIconKey, ICONS, TOOL_ICON_FILES
├─────────────────────────────────────────────────┤
│ 演示控制                                          │  setupDemoControls, updateDirectorControls
├─────────────────────────────────────────────────┤
│ 初始化与重放                                      │  startPlayback, restartPlayback, resetPlaybackDom, initializePlayback
└─────────────────────────────────────────────────┘
```

## 操作指引

### 修改剧本内容
→ 只改 `scenario.js`，不改 HTML 或 app.js

- 修改用户消息：改 `scenario.userMessage`
- 修改节点标题/动作：改 `scenario.nodes[].title` / `scenario.nodes[].actions[]`
- 修改浮层快照：改 `scenario.sheetFrames[id]`
- 修改导航标题：改 `scenario.nav`
- ⚠️ **注意**：sheetFrames 中 todos 极度冗余（同一个 7 项列表在 27 个 frame 中重复），修改待办文本时必须同步所有相关 frame

### 修改播放逻辑
→ 改 `app.js` 中对应职责域

- 修改打字速度/延迟：找 `playback()` 函数和 `scenario.playback` 配置
- 修改 Director 步进行为：找 `buildDirectorTimeline()` 和 `runDirectorStep()`
- 修改浮层展示逻辑：找 `openSheet()` / `renderSheet()`
- ⚠️ **注意**：app.js 是 Fat File（913 行），修改前务必定位到正确的函数，避免误伤其他职责

### 修改视觉样式
→ 改 `styles.css`

- ⚠️ **注意**：同一选择器可能被定义多次，后面的定义覆盖前面的，v7-v10 补丁层大量使用 `!important`
- ⚠️ **建议**：修改前先搜索目标选择器的所有出现位置，确认哪条规则最终生效
- Markdown 样式（`.md`, `.md-node`）占约 600 行，是最大的独立样式块
- Design Tokens 定义在 `:root` 中（约 L900 开始），优先使用 CSS 变量而非硬编码值

### 修改图标
→ 优先使用 `icons-inline.js` 注册表

- `app.js` 中的 `svgFromRegistry()` 通过文件名查找 SVG
- `ICON_ALIASES` 支持别名映射
- ⚠️ HTML 中硬编码的 SVG（状态栏、导航栏、输入框图标）未使用注册表，修改时需手动同步

### 添加新节点
1. 在 `scenario.js` 的 `nodes` 数组末尾添加新节点对象
2. 如果需要浮层快照，在 `sheetFrames` 中添加对应的 frame
3. 在节点的 `actions` 数组中按顺序添加动作（status / markdown / html）
4. Director 时间线会自动包含新节点（`buildDirectorTimeline()` 遍历所有 nodes）

## 禁止行为

1. **禁止将剧本数据写死进 HTML**：用户消息、节点标题、浮层内容等必须通过 `scenario.js` 配置
2. **禁止修改视觉体系的核心参数**：圆角、字号、间距、颜色等遵循现有 Design Tokens，新增样式优先使用 CSS 变量
3. **禁止让浮层变成累积日志**：每条状态行绑定自己的最后一帧，点击时展示对应快照，不是所有帧的累积
4. **禁止在 timing-bar 之前输出最终汇报**：timing-bar 只在全部节点结束后出现
5. **禁止删除或绕过 Director 时间线机制**：所有播放步骤必须通过 `buildDirectorTimeline()` 注册
6. **禁止在 styles.css 中新增 `!important`**：已有 50+ 处 `!important` 是技术债务，不增加新的
7. **禁止使用 npm/构建工具/框架**：本项目是纯静态原型，保持零依赖

## 技术债务

| 编号 | 问题 | 优先级 | 状态 |
|------|------|--------|------|
| TD-1 | `app.js` Fat File（913 行 / 7+ 职责混合，无分区注释） | P0 | 待重构 |
| TD-2 | `styles.css` 最大文件（1532 行），CSS 覆盖链混乱（50+ `!important`） | P0 | 待重构 |
| TD-3 | `scenario.js` sheetFrames todos 极度冗余（600+ 行可压缩到 ~50 行） | P1 | 待重构 |
| TD-4 | `index.html` ↔ `conversation-scene.html` SVG 和样式大量重复 | P1 | 待评估 |
| TD-5 | `app.js` 中 `ICONS` 对象硬编码 SVG 与 `icons-inline.js` 注册表重叠 | P2 | 待统一 |
| TD-6 | `app.js` 全局变量过多（10+），无模块化封装 | P2 | 待重构 |
| TD-7 | HTML 内联 SVG 未使用 `icons-inline.js` 注册表 | P2 | 待迁移 |
| TD-8 | `conversation-scene.html` 使用 Tailwind CDN 与项目纯 CSS 方案不一致 | P2 | 待评估 |

## 关键设计约束（来自 AGENTS.md）

1. 不改视觉体系：沿用现有 class、圆角、字号、间距和组件结构
2. 不把剧本写死进 HTML：后续改剧本时主要改 `scenario.js`
3. 浮层不是累积日志：每条状态行绑定自己的最后一帧
4. timing-bar 只在全部节点结束后出现
5. 旧实现里的节点3删除项未迁入：不再出现"原生中文字符重写整个文件"和"已调用工具"

## 脚本加载顺序

```html
<script src="./scenario.js"></script>    <!-- 1. 剧本数据（全局变量 window.WORKBUDDY_SCENARIO） -->
<script src="./icons-inline.js"></script> <!-- 2. 图标注册表（全局变量 window.WORKBUDDY_INLINE_ICONS, window.WORKBUDDY_ICON_ALIASES） -->
<script src="./app.js"></script>          <!-- 3. 播放引擎（依赖前两者） -->
```

加载顺序不可调换。`app.js` 在加载时立即读取前两个全局变量。
