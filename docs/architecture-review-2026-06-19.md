# WorkBuddy 架构审查报告（With × Knot 双视角）

> 审查日期：2026-06-19
> 审查对象：`docs/pad-mode-architecture.md` 架构方案 + 全项目工程架构
> 审查者：With（主审）+ Knot（并行审查）
> 核心诉求：**改得动、改得准、改得对、改得好**

---

## 一、审查背景

本次审查起因于 pad 模式适配需求。用户希望在做 pad 适配前，先对当前架构和 pad 方案做一次全面审查，核心不是"pad 尺寸怎么调"，而是：

1. **改得动**：改 demo 对话流本身时，能否精准明确只改到对话流而不会改错地方？
2. **改得准**：改交互说明区域时，能否清晰明确改对？
3. **改得对**：现有架构和工程实现是否有静默错乱型风险？
4. **改得好**：是否应该/能否在 pad 模式新增诉求中一并做架构优化？方案是否过度工程化？

---

## 二、项目架构概览

### 文件职责矩阵

| 文件/目录 | 职责 | 行数 | 风险等级 |
|-----------|------|------|----------|
| `index.html` | 手机壳、导航、输入框、对话容器、底部浮层等视觉骨架 | 671 | ⚠️ 含 ~250 行内联脚本 |
| `styles/base.css` | Reset、phone-shell、status-bar、nav-bar、glass 按钮系统、composer | — | 低 |
| `styles/conversation.css` | User/agent 消息气泡、timing-bar、exec-area、step-row、status-line、playback 动画 | — | ⚠️ 含 718px 硬编码 |
| `styles/markdown.css` | CSS 变量 tokens、.md 阅读系统、table、typewriter 动效、表格全屏交互样式 | — | 低 |
| `styles/sheet.css` | Bottom sheet、工具事件行、todo 列表、sheet CSS 变量 | — | 低 |
| `styles/demo-controls.css` | 演示控制台、media query | — | 低 |
| `scenario.js` | 剧本数据：playback / nav / nodes / sheetFrames / final / todosBaseline | 675 | ⚠️ todoOverrides 索引脆弱 |
| `engine/core.js` | 播放状态、sleep、scrollToBottom、playback 参数读取 | — | 低 |
| `engine/markdown.js` | Markdown parser；表格渲染入口（工具栏按钮） | — | 低 |
| `engine/icons.js` | 图标系统（SVG 注册表、tool icon 推断、status line 渲染） | — | 低 |
| `engine/typewriter.js` | Token 流式输出 | — | 低 |
| `engine/sheet.js` | 底部浮层渲染（renderSheet、openSheet、renderEvent、renderTodo） | 586 | 低 |
| `engine/player.js` | 播放引擎主入口（Director timeline、步进控制、final render、displayMode） | **1188** | 🔴 **极高风险** |
| `engine/scroll-nav.js` | 快速滚动按钮 | — | ⚠️ +40 偏移硬编码 |
| `engine/controls-speed.js` | 速度滑块绑定 | — | 低 |
| `engine/controls-stepper.js` | 步进控制绑定 | — | 低 |
| `engine/ask-question.js` | 问答卡片渲染与交互 | — | 低 |
| `engine/feature-router.js` | URL 路由工具 | — | 低 |
| `engine/feature-jump.js` | 跳转锚点引擎 | 156 | ⚠️ DRY 违反 |
| `engine/feature-panel.js` | 右侧说明栏主控 | 445 | ⚠️ 硬编码场景引用 |
| `features/index.js` | Feature 注册中心 | 32 | 低 |
| `features/*.js` | 各 Feature 内容定义 | — | 低 |

### 数据流架构

```
scenario.js (唯一真相源)
    ├── nodes[] → player.js (播放引擎渲染)
    │                ├── sheet.js (浮层渲染, 按 key 取 sheetFrames)
    │                ├── typewriter.js (流式输出)
    │                └── icons.js (状态图标)
    ├── sheetFrames{} → sheet.js (getFrames() 按键名取帧)
    ├── todosBaseline[] → sheet.js (renderTodo 合并渲染)
    └── final → player.js (播放结束后渲染)

features/*.js (说明内容)
    └── feature-panel.js (渲染)
         └── player.js (import goToStep/resolveNodeStep/resumePlayback/toggleExec)
```

---

## 三、两方审查评分对照

| 维度 | With 评分 | Knot 评分 | 差异说明 |
|------|-----------|-----------|----------|
| 整体可维护性 | 6.5/10 | 6.5/10 | **一致** |
| 对话流修改精准性 | 高/中/低（三档细分） | 7/10 | With 更细粒度，Knot 更概括 |
| 交互说明修改精准性 | 隔离度好，锚点耦合 | 8/10 | Knot 偏乐观 |
| player.js 单体风险 | 最大隐患，建议暂不拆 | 4/10，建议和 pad 一起拆 | ⚡ 核心分歧 |
| index.html 内联脚本 | L1 优先抽表格全屏 | 5/10，表格全屏优先抽 | **一致** |
| scenario.js 数据结构 | todoOverrides L4 远期 | 6/10，建议 pad 时一并改 | ⚠️ 时机分歧 |
| 模块间耦合 | feature-panel 锚点耦合 | 6/10，建议 ANCHOR_MAP | Knot 方案更具体 |

### With 审查维度详解

#### 1. 对话流修改精准性（三档）

| 修改类型 | 精准度 | 说明 |
|----------|--------|------|
| 文字修改 | **极高** | 改 `scenario.js` 的文本字段，不触渲染逻辑 |
| 结构修改（增删 action） | **中等** | 需理解 action type 和 normalizeActions 合并规则 |
| Sheet 帧数据修改 | **偏低** | 键名 T.a/F1.a 是隐式约定，需先理解命名规则 |

#### 2. 交互说明修改精准性

Feature 之间隔离度好，改一个不影响其他。但锚点与播放状态耦合——改锚点引用的帧 ID 必须与 scenario.js 同步，无保障机制。

#### 3. player.js 单体化

1188 行、58KB，15+ 个职责域。导出 9 个函数：`toggleToolCallStyle`, `toggleStep`, `toggleExec`, `toggleSteps`, `getCurrentStepIndex`, `pauseDirector`, `resumePlayback`, `resolveNodeStep`, `goToStep`。

关键函数 `normalizeActions`：将连续 status action 合并为 statusGroup。此函数被 `feature-jump.js` 独立复现，属于 DRY 违反。

#### 4. 硬编码分布

14+1 处硬编码尺寸：
- `styles/base.css`：6 处
- `styles/conversation.css`：1 处（718px，应改 flex:1）
- `styles/markdown.css`：4 处
- `styles/feature-panel.css`：2 处
- `styles/demo-controls.css`：1 处
- `index.html` 内联脚本：1 处（网格参数 COLS=6/ROWS=12）

#### 5. 内联脚本分布

| 内联脚本 | 行数 | 风险 | 抽离收益 |
|----------|------|------|----------|
| 表格全屏交互 | ~150 | 最高 | 高——独立功能，与 HTML 骨架无关 |
| 网格构建 buildGrid() | ~100 | 中 | 中——可抽到 engine/grid.js |
| 场景按钮绑定 | ~20 | 低 | 低——量小 |
| Feature-panel 初始化 | ~15 | 低 | 低——量小 |

### Knot 审查维度详解

#### 1. 对话流修改精准性（7/10）

**加分**：`scenario.js` 唯一真相源，数据与结构分离原则执行到位。修改对话流只需改 `nodes` 数组，边界清晰。

**扣分**：
- `sheetFrames` 键名用缩写，认知成本高
- `todoOverrides` 使用索引数组，baseline 顺序变化→所有 override 静默失效

**建议**：
- `todoOverrides` 改为 key-value 模式
- `sheetFrames` 键名考虑嵌入节点语义前缀

#### 2. 交互说明修改精准性（8/10）

**加分**：Feature Panel 合规路径设计良好，每个 feature 自包含。

**扣分**：
- `feature-panel.js` 硬编码场景引用
- TCN mode loop 复现了 player.js 的 status line 渲染逻辑

**建议**：
- 场景引用提取为 `ANCHOR_MAP` 常量映射
- TCN mode 的 status line 渲染应复用 player.js 的能力

#### 3. player.js 单体化（4/10——当前最大隐患）

**具体风险**：
- 改一处牵全身：修改按钮 SVG 样式可能误触 Director timeline 步进逻辑
- 认知超载：新接手的人需理解 15+ 职责域
- 合并冲突高发

**建议拆分方案（4 文件）**：

| 新文件 | 来源职责 | 预估行数 |
|--------|----------|----------|
| `engine/player.js` | Director timeline、步进控制、播放生命周期、公开 API 导出 | ~450 |
| `engine/player-dom.js` | resetPlaybackDom、renderStaticPreChat、showUserMessage、showAgentShell、collapseProcessIntoTiming、toggleExec/toggleSteps | ~250 |
| `engine/player-final.js` | renderFinal、renderFinalActions、makeResponseActionsHtml、RESPONSE_SVGS 常量 | ~200 |
| `engine/player-ui.js` | syncToolCallStyleUI、toggleToolCallStyle、collapseToStack、bindPanelControls、setupDemoControls、手机抽屉系列函数 | ~280 |

另外 `AGENT_AVATAR_SVG` 抽到 `engine/icons.js`。

#### 4. index.html 内联脚本（5/10）

4 段内联脚本共约 250+ 行。表格全屏优先抽离为 `engine/table-fullscreen.js`，buildGrid() 抽到 `engine/grid.js`。

#### 5. scenario.js 数据结构（6/10）

- `sheetFrames` 键名是隐式约定，无文档化
- `todoOverrides` 索引脆弱
- `normalizeActions` 的 statusGroup 合并隐含顺序约束
- `final` 对象未复用 nodes 的 action 模型

#### 6. 模块间耦合（6/10）

| 耦合对 | 耦合方式 | 风险 |
|--------|----------|------|
| `feature-panel.js` → `player.js` | 直接 import 4 个函数 + 硬编码场景参数 | 中 |
| `sheet.js` → `scenario.js` | 按键名取帧数据 | 低 |
| `index.html` 内联脚本 → `player.js` | 直接 import | 低 |
| `feature-panel.js` → `scenario.js` | 硬编码帧 ID 字符串 | 中 |
| `player.js` → `icons.js` | import icon 渲染函数 | 低 |

**最值得优化的耦合**：`feature-panel.js` 对 `player.js` 的场景参数硬编码。

**建议**：在 `scenario.js` 中导出 `ANCHORS` 常量对象，集中管理所有帧 ID 引用。

#### 7. 整体架构可维护性（6.5/10）

**加分（+3.5）**：
- 数据驱动架构清晰（scenario.js + engine + features 三层分离）
- Feature 注册中心设计简洁
- Sheet 浮层统一入口
- ES Module 架构正确
- CSS 分层合理

**扣分（-3.5）**：
- `player.js` 单体化（-1.5）
- `index.html` 内联脚本（-0.5）
- `todoOverrides` 索引脆弱性（-0.5）
- `feature-panel.js` 硬编码场景引用（-0.5）
- `AGENT_AVATAR_SVG` 重复定义（-0.5）

---

## 四、两方共识（高置信结论）

| # | 共识 | 影响 |
|---|------|------|
| 1 | `scenario.js` 数据驱动架构是项目最强设计点 | 改对话流只需改 scenario，边界清晰 |
| 2 | `player.js` 1188 行单体是当前最大架构风险 | 改任一功能需通读全文件，合并冲突高发 |
| 3 | `index.html` 表格全屏 ~150 行应优先抽离为 `engine/table-fullscreen.js` | 最大收益点，独立功能无耦合 |
| 4 | `todoOverrides` 索引模式是静默错乱型 bug | baseline 顺序变化→所有 override 静默失效 |
| 5 | `feature-panel.js` 对 player.js 的场景参数硬编码 | 改剧本需同步两处，无保障机制 |
| 6 | 不要把所有重构和 pad 模式混在一个 PR 里 | 分区触碰、顺手优化、无关不动 |
| 7 | conversation.css 718px 硬编码必须改 flex:1 | 五维审查一致认定 |
| 8 | scroll-nav.js +40 偏移需变量化 | pad 模式下偏移量不同 |

---

## 五、两方分歧及最终判断

### 分歧 1：player.js 拆分时机

| | With | Knot |
|---|------|------|
| 时机 | L3，下次大改前做，pad 期间只做拆的准备 | 和 pad 一起做（2-3h），趁必触及时拆 |

**最终判断：倾向 Knot，但加前提条件。**

pad 模式大概率要调整 player.js 的布局逻辑和 UI 控件，趁机拆比之后再拆成本更低。但前提：**pad 核心变量化先跑通，确认 pad 方案可行后，再动 player.js 拆分**。避免"pad 方案还在调+拆分还在合"双重不确定叠加。

### 分歧 2：todoOverrides 改 key-value 的时机

| | With | Knot |
|---|------|------|
| 时机 | L4 远期优化 | pad 时一并做（30min） |

**最终判断：折中——pad 时如果需要新增 todo 项就改，否则不动。**

Knot 的 30min 估算偏乐观（改数据结构+改 renderSheet 合并逻辑+回归验证），但如果 pad 模式要新增 todo，索引模式会更脆弱。按需触发而非主动触发。

### 分歧 3：buildGrid() 是否抽为 engine/grid.js

| | With | Knot |
|---|------|------|
| 看法 | pad 完成后再考虑 | 建议抽离，COLS/ROWS 改参数 |

**最终判断：Knot 方案更合理。**

pad 模式的核心改动之一就是 `buildGrid()` 从固定 COLS=6/ROWS=12 改为动态计算。既然 pad 必须动这段代码，顺手抽成独立模块是最自然的事——代码已经在手上了，改个文件位置和参数化是极低成本高收益。

### 分歧 4：TCN mode loop 逻辑泄露

Knot 发现了 `feature-panel.js` 中 `startTcnModeLoop`/`stopTcnModeLoop` 复现了 player.js 的 status line 渲染逻辑，With 的审查未单独提及。

**最终判断：Knot 对，这是一个 DRY 违反，应纳入 DRY 修复清单。**

### 分歧 5：player.js 拆分方案

| | With（5 文件） | Knot（4 文件） |
|---|------|------|
| 方案 | director/renderer/actions/final/player | player/player-dom/player-final/player-ui |

**最终判断：采用 Knot 的 4 文件方案。** 更简洁，职责聚合更清晰。`player.js` 作为主入口 re-export 公开 API，外部导入路径不变。

---

## 六、最终行动计划

### Phase 0：Pad 核心变量化（原方案 10 步，~65 行）

| 步骤 | 内容 | 涉及文件 |
|------|------|----------|
| 0-1 | `:root` 定义 7 个设备变量 | `styles/base.css` |
| 0-2 | `:root.device-pad` 覆盖变量值 | `styles/base.css` |
| 0-3 | 14 处硬编码替换为变量引用 | 5 个 CSS + 1 个 HTML |
| 0-4 | `togglePadMode()` 实现 | `index.html` 或新模块 |
| 0-5 | conversation.css 718px → flex:1 | `styles/conversation.css` |
| 0-6 | scroll-nav.js +40 偏移变量化 | `engine/scroll-nav.js` |

### Phase 1：buildGrid() 独立化 + 动态化

| 步骤 | 内容 | 涉及文件 |
|------|------|----------|
| 1-1 | 从 index.html 抽离为 `engine/grid.js` | 新建 + index.html |
| 1-2 | COLS/ROWS 改为参数，由 `buildGrid()` 内根据壳子尺寸动态计算 | `engine/grid.js` |
| 1-3 | `togglePadMode()` 调用 `buildGrid()` 刷新网格 | 同 Phase 0 |

### Phase 2：表格全屏抽离

| 步骤 | 内容 | 涉及文件 |
|------|------|----------|
| 2-1 | COPY_SVG/CHECK_SVG 移入 `engine/icons.js` | `engine/icons.js` + index.html |
| 2-2 | 表格全屏 ~150 行抽为 `engine/table-fullscreen.js` | 新建 + index.html |
| 2-3 | 4 个工具栏事件监听、overlay 开关、复制/分享/保存逻辑一并迁入 | `engine/table-fullscreen.js` |

完成后 index.html 内联脚本从 ~250 行降至 ~35 行。

### Phase 3：player.js 拆分（pad 方案确认后）

| 步骤 | 内容 | 涉及文件 |
|------|------|----------|
| 3-1 | 拆 `engine/player-dom.js`（~250 行）：DOM 渲染相关 | 新建 |
| 3-2 | 拆 `engine/player-final.js`（~200 行）：final 渲染 | 新建 |
| 3-3 | 拆 `engine/player-ui.js`（~280 行）：UI 控件、手机抽屉 | 新建 |
| 3-4 | `AGENT_AVATAR_SVG` 移入 `engine/icons.js` | `engine/icons.js` |
| 3-5 | `player.js` 保留 Director + 公开 API + re-export | 瘦身至 ~450 行 |

前置条件：Phase 0 跑通后再动。

### Phase 4：DRY 修复 + 数据结构优化（pad 完成后，触发型）

| 步骤 | 内容 | 触发条件 |
|------|------|----------|
| 4-1 | `feature-jump.js` 消除 normalizeActions 复现 | 任何时候可做 |
| 4-2 | TCN mode loop 复用 player.js 的 status line 渲染 | 任何时候可做 |
| 4-3 | `feature-panel.js` 场景引用提取为 ANCHOR_MAP | 改剧本时触发 |
| 4-4 | `todoOverrides` 改 key-value 模式 | 新增 todo 项时触发 |
| 4-5 | `sheetFrames` 键名加语义前缀 + JSDoc | 大改 sheet 数据时触发 |

**关键原则**：Phase 4 的每一项都是"触发型"——不主动做，等自然触及时顺手改，避免为改而改。

### Pad 模式网格方案（参考）

| 设备 | 网格 | 格子尺寸 |
|------|------|----------|
| iPhone（当前） | 6×12 | 50px |
| iPad mini | 10×15 | 75px |
| iPad Air | 12×17 | 70px |
| iPad Pro | 12×16 | 85px |

---

## 七、核心诉求直接回答

### 改得动吗？

✅ **对话流文字改动**：极高精准度。`scenario.js` 唯一真相源，改文字只改一处，不触渲染。

⚠️ **对话流结构改动（增删 action）**：中等。需理解 action type 和 normalizeActions 合并规则，否则可能意外改变渲染。

⚠️ **Sheet 帧数据改动**：偏低。键名 T.a/F1.a 是隐式约定，需先理解命名规则。

✅ **交互说明改动**：高。Feature 之间隔离度好，改一个不影响其他。

### 改得准吗？

CSS 变量化后（Phase 0），改尺寸精准度从"全文 grep 硬编码值"提升到"改 1 个变量值"。Feature 系统的合规路径保证了改说明内容不会误触渲染逻辑。

### 改得对吗？

`todoOverrides` 索引模式和 `feature-panel.js` 硬编码场景引用是两个"改了 A 忘改 B 不会报错"的静默风险点。Phase 4 按触发条件逐一消除。

### 改得好吗？

当前架构 6.5/10，及格但留有技术债。按 Phase 0→4 执行后，预计可达 **8/10**：
- 变量化消除硬编码（+0.5）
- buildGrid 独立化（+0.5）
- player.js 拆分（+1.0）
- DRY 修复（+0.5）
- 数据结构优化（+0.5，按触发时计）

---

## 八、风险提示

1. **不建议在 pad PR 里一次做完全部 4 个 Phase**。Phase 0+1 和 pad 模式强绑定，一起做；Phase 2 可选同期做；Phase 3 在 pad 确认后做；Phase 4 触发型不排期。
2. **player.js 拆分需回归验证**。拆分后外部 import 路径不变（re-export），但内部函数间的隐式依赖需要逐一测试。
3. **todoOverrides 改 key-value 是破坏性变更**。需一次性迁移所有 override 数据，不可半改。
4. **pad 模式下 Feature Panel 的屏宽阈值**。当前 `< 600px` 不初始化，pad 模式下需重新评估。
