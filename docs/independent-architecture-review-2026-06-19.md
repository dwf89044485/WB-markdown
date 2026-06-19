# WorkBuddy 独立架构审查报告

> **审查日期**：2026-06-19
> **审查身份**：独立第三方资深前端架构师（基于全量源码逐行审读，不依赖初轮审查结论）
> **审查对象**：WorkBuddy 动态原型项目全量源码（21 个文件，~7500 行）+ `docs/pad-mode-architecture.md` 方案
> **核心诉求**：改得动 · 改得准 · 改得对 · 改得好
> **参照初轮**：`docs/architecture-review-2026-06-19.md`（With × Knot 双视角，评分 6.5/10）

---

## 一、7 条共识逐条评价

### 共识 1：scenario.js 数据驱动架构是项目最强设计点

**我的评价：✅ 完全同意，但需补充边界。**

源码验证：`scenario.js` 确实是唯一真相源——675 行承载了 playback/nav/preChat/agent/todosBaseline/thinking/sheetFrames/nodes/final 全部剧本数据。`engine/player.js` 的 `buildDirectorTimeline()` 从 `scenario.nodes` 读取 action 并归一化，`engine/sheet.js` 的 `getFrames()` 从 `scenario.sheetFrames` 按键名取帧，数据与渲染的分离边界清晰。

**但"最强设计点"这个判断需要加注**：数据驱动的前提是数据结构本身足够健壮。当前 `todoOverrides` 的索引模式（`{index, status}`）和 `sheetFrames` 的缩写键名（`T.a`, `F1.c`）恰恰是数据驱动的薄弱环节——改数据时没有类型校验，没有 schema 约束，错了不报错。数据驱动的价值上限 = 数据结构的健壮性下限。

### 共识 2：player.js 1188 行单体是当前最大架构风险

**我的评价：✅ 同意，严重度评级上调至 🔴🔴。**

逐行审读 `engine/player.js`（1180 行，59KB）后，我统计出 **17 个职责域**（比初轮报告的 15+ 更精确）：

| # | 职责域 | 行数范围 | 代码行（估） |
|---|--------|----------|-------------|
| 1 | 常量定义（AGENT_AVATAR_SVG / RESPONSE_SVGS） | L1-120 | ~120 |
| 2 | 状态管理（displayMode / toolCallStyle / execOpen / stepsOpen / stepSeq / directorTimeline 等） | L121-140 | ~20 |
| 3 | 工具函数（truncate / toDoneLabel / toRunningLabel / joinLabels / stripChevron / splitStatusLabels） | L141-175 | ~35 |
| 4 | Status line 创建与更新 | L176-210 | ~35 |
| 5 | normalizeActions 归一化 | L211-225 | ~15 |
| 6 | runStatusGroup / runStatus 执行器 | L226-290 | ~65 |
| 7 | runFlatAction 分发器 | L291-320 | ~30 |
| 8 | runThinkingStatus 思考态渲染 | L321-350 | ~30 |
| 9 | renderTiming / renderFinalActions / renderFinal | L351-500 | ~150 |
| 10 | makeResponseActionsHtml / renderStaticPreChat | L501-575 | ~75 |
| 11 | showUserMessage / showAgentShell / showThinkingLoading | L576-610 | ~35 |
| 12 | collapseProcessIntoTiming / resetPlaybackDom | L611-670 | ~60 |
| 13 | setupNavMeta | L671-690 | ~20 |
| 14 | Director timeline 构建 / 步进 / auto-loop / jump | L691-870 | ~180 |
| 15 | toggleToolCallStyle / collapseToStack / bindPanelControls / setupDemoControls | L871-1020 | ~150 |
| 16 | Phone drawer 系统 | L1021-1100 | ~80 |
| 17 | 播放生命周期 + 公开 API + 启动 | L1101-1180 | ~80 |

单体化的核心危害不是行数多，而是**修改半径不可预测**。举例：改一个按钮 SVG 样式，你改的是 `RESPONSE_SVGS`（职责域 9 附近），但如果你不小心改动了 `normalizeActions`（职责域 5）的换行或缩进，可能导致 `feature-jump.js` 的 DRY 复现逻辑与此处行为分叉——而两处分叉不会报错，只会让锚点跳转定位偏移。

### 共识 3：表格全屏 ~150 行应优先抽离为 engine/table-fullscreen.js

**我的评价：✅ 同意，且认为优先级应更高。**

审读 `index.html` 底部第三个 `<script>` 块（普通 script，非 module），确认了约 150 行表格全屏交互代码包含：COPY_SVG/CHECK_SVG 常量定义、4 个工具栏按钮事件监听（tbl-copy/tbl-save-image/tbl-share/tbl-maximize）、overlay 开关、复制到剪贴板逻辑、Canvas 截图保存逻辑、Web Share API 调用。这段代码与 HTML 骨架零耦合——它只依赖 `#tblOverlay` 和 `.phone-shell` 两个 DOM 节点，完全可以独立为 ES Module。

**为什么优先级应更高**：这段代码是 index.html 中最大的内联脚本块，抽离后 index.html 内联脚本从 ~250 行降至 ~100 行，而改动风险极低（功能完全内聚，无外部依赖）。

### 共识 4：todoOverrides 索引模式是静默错乱型 bug

**我的评价：✅ 同意，补充具体错乱路径。**

源码定位：`engine/sheet.js` L75-85 的 `computeTodoSnapshot()`：

```javascript
(lastOverrideFrame.todoOverrides || []).forEach(o => { overrideMap[o.index] = o.status; });
return baseline.map((text, i) => ({ text, status: overrideMap[i] || 'todo' }));
```

错乱路径：假设 `todosBaseline` 有 6 条（当前实际值），如果某人在 `scenario.js` 的 `todosBaseline` 数组头部插入一条新待办，则所有 `todoOverrides` 的 `index` 值全部偏移 +1——但代码不会报错，只会让"搜索网页"的状态覆盖到"创建文件"上，"创建文件"的状态覆盖到"读取文件"上，以此类推。

**这是整个项目中最危险的静默 bug**，因为：① 不报错 ② 视觉上看不出来（只是状态标记贴错了任务）③ 触发条件很日常（加一条待办）。

### 共识 5：feature-panel.js 对 player.js 的场景参数硬编码

**我的评价：✅ 同意，补充完整硬编码清单。**

审读 `engine/feature-panel.js` L120-210 的操作按钮事件代理，硬编码场景引用完整清单：

| action 值 | 硬编码帧 ID 字符串 | 行号 |
|-----------|-------------------|------|
| `disclosure-3` | `'F1.c,F1.d,F1.e,F1.f,F1.g,F1.h,F1.i'` | L147 |
| `disclosure-4` | `'F3.4b,F3.4c,F3.4d'` | L155 |
| `infoarch-l3` | `'F3.4a,F3.4b,F3.4c,F3.4d'` | L182 |
| `infoarch-l4` | `'F3.4b,F3.4c,F3.4d'` | L193 |

这些帧 ID 字符串与 `scenario.js` 的 `sheetFrames` 键名必须保持同步，但没有任何约束机制。改了 scenario 的帧 ID 而忘了改 feature-panel.js → 跳转后 Sheet 显示空内容，不报错。

### 共识 6：不要把所有重构和 pad 模式混在一个 PR 里

**我的评价：✅ 强烈同意，这是本次审查最重要的工程纪律。**

分区原则应该是：**pad 必须动的才动，顺手能改的才改，无关的不动**。一个 PR 做太多事，回滚时无法定位问题源头。

### 共识 7：conversation.css 718px 硬编码必须改 flex:1

**我的评价：✅ 同意，但补充：718px 出现了两次，是两个不同位置。**

| 位置 | 文件 | 选择器 | 当前值 | 语义 |
|------|------|--------|--------|------|
| ① | `styles/conversation.css` | `.conversation { height: 718px }` | 718px | 对话区高度 |
| ② | `styles/feature-panel.css` | `.fp-feature-header h1 { width: 718px }` | 718px | Feature 标题宽度 |

① 是 phone-shell 内部的高度约束，确实应改为 `flex:1`（phone-shell 本身已有 `flex-direction:column`，conversation 只需撑满剩余空间）。② 是 Feature Panel 区的排版宽度约束，pad 模式下这个宽度需要跟随 pad 设备快照宽度变化——不能简单改为 flex:1，需要改为 CSS 变量引用。

### 共识 8（原共识清单标为 #8）：scroll-nav.js +40 偏移需变量化

**我的评价：✅ 同意，定位到具体代码。**

`engine/scroll-nav.js` L88 的 `navBarOverlap()` 函数：

```javascript
return Math.max(0, barRect.bottom - convRect.top) + 40;
```

这个 `+40` 是 nav-bar 遮挡区 + 额外间距的硬编码。pad 模式下 nav-bar 高度可能变化，40px 偏移不再适用。改为 CSS 变量（如 `--scroll-nav-overlap-extra`）是正确方向。

---

## 二、5 条分歧逐条评价

### 分歧 1：player.js 拆分时机——With(L3) vs Knot(pad 时一起做)

**我的判断：倾向 With，但附带一个具体条件。**

**反对 Knot"和 pad 一起做"的理由**：pad 模式的核心改动是 CSS 变量化 + buildGrid 动态化（Phase 0+1），不涉及 player.js 内部逻辑重构。player.js 拆分是纯粹的内部重构，与 pad 功能开发是正交的两件事。把正交的两件事放在同一个 PR 里，违背了共识 6 的分区原则。

**但附条件**：如果 pad 模式需要调整 player.js 内的某些逻辑（比如 phone drawer 在 pad 下的行为、setupDemoControls 的屏宽适配），那么**只拆与 pad 改动直接相关的部分**（如 player-ui.js），其余留到后续。

**最佳策略**：Phase 0+1 先行，player.js 拆分独立为 Phase 3，在 pad 核心跑通后做。这样 pad 验证和重构验证不会互相干扰。

### 分歧 2：todoOverrides 改 key-value 的时机——With(L4 远期) vs Knot(pad 时做)

**我的判断：折中——pad 前先做防御性保护，全面改造留到触发时。**

Knot 估 30min 偏乐观——改数据结构 + 改 `computeTodoSnapshot` 合并逻辑 + 改 `applyTodoOverridesToDom` + 改 `scenario.js` 全部 override 数据 + 回归验证 Sheet 渲染，实际 1-2h。但纯索引模式的风险是真实的。

**我建议的折中方案**：pad 之前，在 `computeTodoSnapshot` 中加一行 **防御性校验**——如果 `o.index >= baseline.length` 则 console.warn 并跳过。这只需 3 行代码，不改变数据结构，但把静默错乱变成显式告警。全面改 key-value 留到"新增 todo 项"时触发。

### 分歧 3：buildGrid() 是否抽为 engine/grid.js——With(pad 后再考虑) vs Knot(建议抽离)

**我的判断：Knot 对，应该抽。**

`index.html` 内联脚本中的 `buildGrid()` 函数依赖 `document.querySelector('.phone-shell').getBoundingClientRect()` 来计算网格参数，COLS=6/ROWS=12 是硬编码。pad 模式的核心改动之一就是让这些参数随设备尺寸动态变化。既然 pad 必须动这段代码，它就应该从 index.html 内联脚本中独立出来——不是为了"更整洁"，而是因为 **pad 模式需要在不同设备下调用不同参数的 buildGrid**，这必须在独立模块中才能实现。

### 分歧 4：TCN mode loop 逻辑泄露——Knot 发现，With 未提及

**我的判断：Knot 对，这是一个确认的 DRY 违反。**

源码验证：`engine/feature-panel.js` L260-330 的 `startTcnModeLoop()` 函数，在 `applyPhase()` 中直接调用了 `icons.js` 导出的 `statusLineHTML()` 和 `statusStackHTML()`——这两个函数同时也是 `player.js` 创建 status line 的核心渲染函数。问题不是"复用了 icons.js 的函数"（这本身没问题），而是 **TCN mode 自行定义了 TCN_PHASES 常量和 phase 循环逻辑**，而 player.js 的 `runStatusGroup` 也有类似的状态机逻辑。两处逻辑如果分叉（比如 status line 的 DOM 结构变了），需要同时改两处。

### 分歧 5：player.js 拆分方案——With(5 文件) vs Knot(4 文件)

**我的判断：采用 Knot 的 4 文件方案，但调整职责划分。**

Knot 的方案更符合单一职责原则：

| 新文件 | 来源职责 | 预估行数 |
|--------|----------|---------|
| `engine/player.js` | Director timeline + 步进控制 + 播放生命周期 + 公开 API re-export | ~450 |
| `engine/player-dom.js` | resetPlaybackDom / renderStaticPreChat / showUserMessage / showAgentShell / collapseProcessIntoTiming / toggleExec / toggleSteps | ~250 |
| `engine/player-final.js` | renderFinal / renderFinalActions / makeResponseActionsHtml / RESPONSE_SVGS | ~200 |
| `engine/player-ui.js` | syncToolCallStyleUI / toggleToolCallStyle / collapseToStack / bindPanelControls / setupDemoControls / phone drawer | ~280 |

**我的调整**：`AGENT_AVATAR_SVG` 不移入 `icons.js`，移入 `player-dom.js`——因为它只在 DOM 渲染（showAgentShell / renderStaticPreChat）中使用，不属于图标系统。同时 `icons.js` 的 `icons-inline.js` 是自动生成的，往里面加内容会被覆盖。

---

## 三、独立评分

### 我的评分：**6.0 / 10**

比初轮 6.5/10 低 0.5，理由如下：

#### 加分项（+3.0）

| # | 加分点 | 分值 | 说明 |
|---|--------|------|------|
| 1 | scenario.js 数据驱动架构 | +1.0 | 唯一真相源，数据与渲染分离边界清晰 |
| 2 | Feature 注册中心 + 合规路径 | +0.8 | features/index.js + features/*.js + feature-panel.js 三层分离，新增 feature 成本低 |
| 3 | Sheet 浮层统一入口 | +0.7 | renderSheet / openSheet / streamSheetContent 一条链路走完，新增浮层类型只需加 case |
| 4 | overlay-registry.js 注册表模式 | +0.5 | 新增面板类型只需 registerOverlayCleanup，无需改消费方——这个设计虽小但极优雅 |

#### 扣分项（-4.0）

| # | 扣分点 | 分值 | 说明 |
|---|--------|------|------|
| 1 | player.js 单体化 | -1.2 | 1180 行 17 职责域，修改半径不可预测，合并冲突高发 |
| 2 | todoOverrides 索引脆弱性 | -0.8 | 静默错乱型 bug，触发条件日常，不报错 |
| 3 | index.html ~250 行内联脚本 | -0.6 | 违反架构分离原则，尤其表格全屏 ~150 行 |
| 4 | feature-panel.js 硬编码帧 ID | -0.5 | 4 处帧 ID 字符串与 scenario.js 隐式耦合 |
| 5 | feature-jump.js DRY 违反 | -0.4 | normalizeActions 扫描逻辑独立复现，idx=4 偏移与 player.js 隐式耦合 |
| 6 | features/ask-question.js 硬编码常量 | -0.3 | STEP_ASK_QUESTION=2, ASKUSER_ACTION_OFFSET=10，scenario 结构变化即失效 |
| 7 | AGENT_AVATAR_SVG 重复定义 | -0.2 | player.js 和 index.html 各一份 ~2KB SVG |

#### 与初轮评分差异说明

初轮 6.5/10 的扣分中，player.js 单体化 -1.5 但 todoOverrides 只有 -0.5——我认为这个权重反了。player.js 单体化是"改着累"的问题（可以通过 IDE 搜索和代码阅读克服），但 todoOverrides 是"改错了不知道"的问题（运行时不报错，只在特定操作下才暴露），后者对项目可维护性的杀伤力更大。因此我把 todoOverrides 的扣分从 -0.5 上调到 -0.8，同时将 player.js 微调到 -1.2。

另外初轮报告没有单独扣分 `features/ask-question.js` 的硬编码常量问题——`STEP_ASK_QUESTION = 2` 和 `ASKUSER_ACTION_OFFSET = 10` 与 scenario.nodes 的结构隐式耦合，如果 nodes 数组的顺序或 action 数量变化，这两个常量即失效且不报错。这也是静默错乱型风险，扣 -0.3。

---

## 四、5 个 Phase 过度工程化评估

### Phase 0：CSS 核心变量化（~65 行改动）

**判定：✅ 必须**

14+1 处硬编码尺寸是 pad 适配的前置阻塞项。不改变量化，pad 模式只能用全局搜索替换硬编码值——这比变量化更危险（替换时可能误触同值不同语义的代码）。

7 个设备变量（`--device-width` / `--device-height` / `--left-area-width` / `--layout-min-width` / `--design-notes-min-width` / `--design-notes-flex-basis` / `--paper-bg-left`）+ `.device-pad` 覆盖层，方案简洁，无过度工程化风险。

### Phase 1：buildGrid() 独立化 + 动态化

**判定：✅ 必须**

pad 模式的网格参数（6×12 → 10×15 / 12×17 / 12×16）必须动态计算，而 buildGrid() 当前硬编码在 index.html 内联脚本中。抽为 `engine/grid.js` 并参数化是 pad 功能的必要条件，不是过度工程化。

### Phase 2：表格全屏抽离

**判定：🟡 可选——但强烈推荐**

表格全屏抽离与 pad 模式无直接关联（表格全屏在 phone 和 pad 下行为可能不同，但核心逻辑不变）。但考虑到：
- index.html 内联脚本从 ~250 行降至 ~100 行（降幅 60%）
- 抽离风险极低（功能完全内聚，无外部依赖）
- 为后续 table-fullscreen 在 pad 下的适配留好扩展点

**建议**：如果 pad PR 工期允许，同期做；如果工期紧，pad 合并后第二个 PR 做。

### Phase 3：player.js 拆分

**判定：🟡 可选——但应作为下一个技术债清理周期的首要任务**

player.js 拆分是纯粹的内部重构，与任何功能开发正交。拆分的收益是：
- 降低修改半径（改 status line 不用看 RESPONSE_SVGS）
- 降低合并冲突（多人同时改 player.js 不同部分不再冲突）
- 提高 code review 效率

但拆分本身有风险——内部函数间的隐式依赖（比如 `directorTimeline` / `directorRuntime` / `currentDirectorIndex` 等状态变量被多个职责域共享）需要仔细梳理，不能简单按行数切割。

**建议**：Phase 0+1 合并验证通过后，独立 PR 做 player.js 拆分，不在 pad PR 中做。

### Phase 4：DRY 修复 + 数据结构优化

**判定：⚠️ 分项评估——大部分过度，少数必须**

| 子项 | 判定 | 理由 |
|------|------|------|
| 4-1 feature-jump.js 消除 normalizeActions 复现 | ✅ 必须 | DRY 违反是确认的，且 idx=4 偏移耦合是隐患。直接 import player.js 的 normalizeActions 并 export 即可 |
| 4-2 TCN mode loop 复用 status line 渲染 | 🟡 可选 | TCN 的 5 phase 循环逻辑与 player.js 的 runStatusGroup 差异较大（一个是一次性顺序执行，一个是循环播放），强行复用可能引入更多复杂性 |
| 4-3 feature-panel.js 场景引用提取为 ANCHOR_MAP | 🟡 可选 | 集中管理帧 ID 引用是好实践，但 4 处硬编码的改动频率取决于剧本迭代频率。如果剧本不常改，优先级不高 |
| 4-4 todoOverrides 改 key-value | 🟡 触发型 | 前面已建议：先加防御性校验（3 行代码），全面改造留到"新增 todo 项"时 |
| 4-5 sheetFrames 键名加语义前缀 + JSDoc | ⚠️ 过度 | 键名是开发者内部约定，加前缀（如 `node1-search-F1.a`）会大幅增加 scenario.js 的行宽和阅读成本。JSDoc 可加，键名重命名不急 |

---

## 五、最小可行方案与最优方案

### 最小可行方案（MVP：只做 pad 必须的）

```
Phase 0: CSS 核心变量化（7 变量 + 14+1 处替换 + 718px→flex:1 + scroll-nav +40 变量化）
Phase 1: buildGrid() 抽为 engine/grid.js + 参数动态化
```

**工作量**：Phase 0 ~65 行改动 + Phase 1 ~60 行改动 = ~125 行
**风险**：极低——只改 CSS 变量引用和 1 个 JS 函数的文件位置
**效果**：pad 模式的 CSS 变量化通路打通，buildGrid 支持动态参数，pad 功能可以开始开发

### 最优方案（MVP + 低风险收益项）

```
Phase 0 + Phase 1（同上）
+ Phase 2: 表格全屏抽离为 engine/table-fullscreen.js
+ Phase 4-1: feature-jump.js import normalizeActions（消除 DRY 违反）
+ todoOverrides 防御性校验（3 行代码）
```

**增量工作量**：Phase 2 ~150 行搬迁 + 4-1 ~10 行改动 + 3 行校验 = ~163 行
**增量风险**：低——Phase 2 是纯搬迁，4-1 是 import 替换
**增量效果**：index.html 内联脚本从 ~250 行降至 ~100 行；feature-jump.js 与 player.js 的隐式耦合消除；todoOverrides 从"绝对静默"变为"至少有 console.warn"

---

## 六、遗漏风险补充

### 1. CSS 变量化边界 case：同值不同语义

初轮报告列出了 14+1 处硬编码，但未区分"同值同语义"和"同值不同语义"的情况。

**已确认的同值不同语义案例**：

| 值 | 位置 1 | 语义 1 | 位置 2 | 语义 2 |
|----|--------|--------|--------|--------|
| 718px | conversation.css `.conversation { height }` | 对话区高度 | feature-panel.css `.fp-feature-header h1 { width }` | 标题排版宽度 |

变量化时，这两个 718px **必须使用不同的 CSS 变量名**（如 `--device-conversation-height` 和 `--fp-feature-header-width`），否则 pad 模式下改一个值会意外影响另一个。

**潜在的同值不同语义风险**：`524px` 在 base.css 中同时出现在 `.left-area { width: 524px }` 和 `.paper-bg::before { left: 524px }`——但这两个实际上是同一语义（左栏宽度），可以共用一个变量。需要逐个确认。

### 2. pad 模式交互盲区：Feature Panel 屏宽阈值

当前 `engine/feature-panel.js` L23 的判断：

```javascript
if (window.matchMedia('(max-width: 599px)').matches) {
  rootEl.innerHTML = '';
  return;
}
```

pad 模式下，如果是横屏 iPad（屏幕宽度 > 600px），Feature Panel 会正常初始化。但如果是竖屏 iPad mini（768px 宽），左侧 phone-shell + 右侧 Feature Panel 的并排布局可能让 phone-shell 被挤到很窄。

**遗漏风险**：pad 模式需要一个中间断点（比如 600-1024px），让 Feature Panel 从"并排"变为"抽屉式侧滑"或"tab 切换"。这不在 CSS 变量化范围内，但属于 pad 模式的交互设计盲区。

### 3. features/ask-question.js 的硬编码常量未纳入初轮审查

```javascript
const STEP_ASK_QUESTION = 2;
const ASKUSER_ACTION_OFFSET = 10;
```

这两个常量被 6 个锚点引用（`single-appear` / `appear-animation` / `scroll-and-select` / `navigate-questions` / `rank-order` / `validate-submit`），含义是"scenario.nodes[2] 的第 10 个 action 是 askUser"。如果 nodes 数组的顺序变化或 n3 内的 action 数量变化，所有 6 个锚点同时失效——且不报错。

这比 `feature-panel.js` 的帧 ID 硬编码更危险，因为帧 ID 失效只会导致 Sheet 内容为空（视觉可感知），而 nodeIndex/actionOffset 失效会导致跳转到完全错误的播放位置（视觉上可能看不出来，只是跳到了"看似正确但实际偏移了一两步"的位置）。

### 4. standalone 模式下的 pad 适配冲突

`styles/base.css` 有完整的 standalone 模式样式（`html.force-standalone` / `html.is-standalone` + `@media (max-width: 599px)`）。pad 模式如果通过 class 切换（`.device-pad`），需要确保 standalone 模式和 pad 模式不会同时生效导致样式冲突。

具体场景：iPad 上用 Safari 打开 `?standalone=1`，此时 `html.force-standalone` 和 `.device-pad` 可能同时作用于 `.phone-shell`，需要明确优先级。

### 5. resetPlaybackDom 的全局清理是否过度

`engine/player.js` 的 `resetPlaybackDom()` 调用了 `hideAllOverlays()`，而 `goToStep()` → `jumpDirectorTo()` 在非 `keepUserShell` 路径下也调用 `resetPlaybackDom()`。这意味着任何一次 `goToStep()` 调用都会清理所有覆层面板（包括 askUser 卡片、approvePermission 卡片）。

在当前场景下这不是问题（因为跳转后会在目标位置重新渲染对应面板），但如果未来新增了"跳转时不应该清理的覆层面板"，需要调整这个全局清理策略。目前不急，但需要记录。

---

## 七、最终建议

### Go / No-Go 决策

**✅ GO——pad 适配方案可行，核心架构风险可控。**

理由：
- 数据驱动架构（scenario.js）为 pad 适配提供了坚实的数据层——改尺寸不影响剧本逻辑
- CSS 变量化方案（Phase 0）极简（~65 行改动），技术风险极低
- 最大的架构风险（player.js 单体化、todoOverrides 索引脆弱）与 pad 适配正交，可以并行但不混同处理

### 推荐执行 Phase 及顺序

```
Phase 0 ─→ Phase 1 ─→ [pad 功能开发] ─→ Phase 2 ─→ Phase 3 ─→ Phase 4(按触发)
 │            │                              │           │
 │            │                              │           └─ 独立 PR，pad 确认后做
 │            │                              └─ 独立 PR，pad 功能后做
 │            └─ pad 的前置必要条件
 └─ pad 的前置必要条件
```

**Phase 0+1 是 pad 的阻塞项，必须先行。** Phase 2 可选同期做。Phase 3 独立做。Phase 4 分项按触发条件做。

### 绝对不要做的事

| # | 禁令 | 理由 |
|---|------|------|
| 1 | **不要在一个 PR 里同时做 pad 适配 + player.js 拆分** | 正交的两件事混在一起，回滚时无法定位问题源头 |
| 2 | **不要把 todoOverrides 的 key-value 改造和 pad 变量化放同一个 PR** | 数据结构变更 + CSS 变量化是两个完全不同的改动域 |
| 3 | **不要在 Phase 0 变量化时使用同一个变量名引用两个不同语义的同值硬编码** | 718px 在 conversation.css 和 feature-panel.css 是不同语义，必须分变量 |
| 4 | **不要在 pad 模式适配时忽略 standalone 模式的优先级冲突** | `html.force-standalone .phone-shell` 和 `.device-pad .phone-shell` 的样式优先级需要明确定义 |
| 5 | **不要把 AGENT_AVATAR_SVG 移入 icons-inline.js** | icons-inline.js 是自动生成的（28KB），手动修改会被下次生成覆盖 |

### 一句话忠告

> **pad 是加法，重构是减法——同一时间只做一个方向。** pad 适配是为项目增加新能力，架构重构是为项目消除旧债务。加法和减法混做，你既不知道新能力是否正确，也不知道旧债务是否清完。先做 pad（Phase 0+1），验证通过；再做减法（Phase 2-4），逐步清理。每一步都可验证，每一步都可回滚。

---

*报告完。*
