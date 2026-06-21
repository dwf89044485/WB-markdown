# 工具类型系统化重构计划 v2

> 基于 Knot 架构专家审查意见修订，2026-06-20

---

## 一、问题全景

当前工具类型散落在 **3 层隐式耦合** 中：

```
第1层: scenario.js 数据 — 只有 icon/text/dim 字段，无显式 type
       ↓ 隐式耦合（靠字符串内容推断）
第2层: icons.js — 11条正则链 inferToolIconKey() + 12 key TOOL_ICON_FILES 表
       ↓ 隐式耦合（key 不完全对齐）
第3层: sheet.js — 3套不统一的详情渲染路径 (detail/outputs/card)
```

新增一个工具类型 = 改 3 个文件 × 3 处以上，且无编译期检查。

---

## 二、工具类型完整清单（14 种）

### 说明

- **一级 Sheet 事件行**：所有类型都有（`renderEvent()`），展示 icon + text + dim + 可选 chevron
- **二级 Sheet 详情**：仅 `detail.sections[]` → `renderDetailContent` → sd-section/sd-card
- **outputs 子行**：仅 `event.outputs[]` → `renderSearchItem` → s-sub 行
- **内联卡片**：仅 `event.card{}` → event-card div

### 2.1 思考过程

| 字段 | 值 |
|------|-----|
| icon | 🧠 |
| text | `"思考过程"` |
| sheetFrames | T.a / T.b / T.c（3帧） |
| 一级 Sheet | s-row + event-card（card.title + card.body，body 打字机动效） |
| 二级 Sheet | ❌ 无 |
| card 字段 | `{title: "需求识别"/"过程规划"/"执行策略", body: "..."}` |
| 渲染特点 | typeCardBody() 流式打字机逐 chunk 输出 |

### 2.2 创建待办

| 字段 | 值 |
|------|-----|
| icon | ☐ |
| text | `"创建待办"` |
| sheetFrames | F1.a / F1.b（2帧） |
| 一级 Sheet | s-row（无 card、无 detail、无 outputs） |
| 二级 Sheet | ❌ 无 |
| dim | `"任务理解与分解：明确需求、约束和输..."` |
| 渲染特点 | 触发 renderTodoSkeleton() 渲染待办骨架，applyTodoOverridesToDom() 更新状态 |

### 2.3 搜索网页

| 字段 | 值 |
|------|-----|
| icon | 🔍 |
| text | `"搜索网页"` |
| sheetFrames | F1.c / F1.d / F1.e / F1.f / F1.g（5帧） |
| 一级 Sheet | s-row + dim + outputs[]（仅 F1.g 有） |
| 二级 Sheet | ❌ 无（outputs 作为 s-sub 子行渲染在一级 Sheet） |
| dim | `"正在搜索签证/入境政策..."` / `"10项搜索已完成"` |
| outputs | `[{type:"search", text:"搜索结果标题"}]` — 10条 |
| 渲染特点 | renderSearchItem() 渲染为 s-sub 行，带 wb-website.svg 图标 |

### 2.4 更新待办

| 字段 | 值 |
|------|-----|
| icon | ☑️ |
| text | `"更新待办"` |
| sheetFrames | F1.h / F1.i / F2.e / F2.f / F3.6a / F3.6b（6帧） |
| 一级 Sheet | s-row（无 card、无 detail、无 outputs） |
| 二级 Sheet | ❌ 无 |
| dim | `"搜索信息已收集完毕，更新任务进度"` / `"任务理解与分解：..."` |
| 渲染特点 | applyTodoOverridesToDom() 更新已有待办 DOM 状态 |

### 2.5 生成图片

| 字段 | 值 |
|------|-----|
| icon | 🖼️ |
| text | `"生成图片"` |
| sheetFrames | F2.a / F2.b / F2.c / F2.d（4帧） |
| 一级 Sheet | s-row（无 card、无 detail、无 outputs、无 dim） |
| 二级 Sheet | ❌ 无 |
| 渲染特点 | 多帧累计：F2.a 空事件、F2.b 1条、F2.c 2条、F2.d 2条 |

### 2.6 调用技能

| 字段 | 值 |
|------|-----|
| icon | 📖 |
| text | `"调用技能"` |
| sheetFrames | F3.1a / F3.1b（2帧） |
| 一级 Sheet | s-row + dim |
| 二级 Sheet | ❌ 无 |
| dim | `"docx"` |
| 渲染特点 | 标准事件行，无特殊渲染 |

### 2.7 文件创建失败

| 字段 | 值 |
|------|-----|
| icon | ⚠️ |
| text | `"文件创建失败"` |
| sheetFrames | 嵌套在 F3.2b~F3.2e 的 events 数组中 |
| 一级 Sheet | s-row（warning 样式，isWarningEvent=true） |
| 二级 Sheet | ❌ 无 |
| 渲染特点 | isWarningEvent() 检测 → 返回 ICONS.warn SVG，toolKey='warning' |

### 2.8 创建文件

| 字段 | 值 |
|------|-----|
| icon | ✏️ |
| text | `"创建文件"` |
| sheetFrames | F3.2c / F3.2d / F3.2e（与其他类型混在同一帧） |
| 一级 Sheet | s-row + dim（文件名） |
| 二级 Sheet | ❌ 无 |
| dim | `"generate_plan.js"` |
| 渲染特点 | 标准事件行 |

### 2.9 读取文件

| 字段 | 值 |
|------|-----|
| icon | 👀 |
| text | `"读取文件"` |
| sheetFrames | F3.2d / F3.2e（与其他类型混在同一帧） |
| 一级 Sheet | s-row + dim（文件位置） |
| 二级 Sheet | ❌ 无 |
| dim | `"JS …generate_plan.js  308-317"` |
| 渲染特点 | 标准事件行 |

### 2.10 编辑文件

| 字段 | 值 |
|------|-----|
| icon | ✏️ |
| text | `"编辑文件"` |
| sheetFrames | F3.2e / F3.3c（与其他类型混在同一帧） |
| 一级 Sheet | s-row + dim + card（Edit patch 卡片） |
| 二级 Sheet | ❌ 无 |
| dim | `"JS …generate_plan.js  +1 -1"` |
| card | `{title: "Edit patch", body: "+1 -1 · 修正脚本中的异常字符。"}` |
| 渲染特点 | event-card 内联渲染 |

### 2.11 搜索文件

| 字段 | 值 |
|------|-----|
| icon | 🔍 |
| text | `"搜索文件"` |
| sheetFrames | F3.3a / F3.3b / F3.3c（3帧） |
| 一级 Sheet | s-row + dim（搜索关键词） |
| 二级 Sheet | ❌ 无 |
| dim | `"\u81EA\u7136|\u81EA\u7然"`（Unicode 转义） |
| 渲染特点 | 标准事件行。F3.3c 还包含编辑文件事件 |

### 2.12 执行命令 ⭐（唯一有二级 Sheet 详情的类型）

| 字段 | 值 |
|------|-----|
| icon | 🖥️ |
| text | `"执行命令"` |
| sheetFrames | F3.4a / F3.4b / F3.4c / F3.4d（4帧） |
| 一级 Sheet | s-row + dim + › chevron（可点击进入二级） |
| 二级 Sheet | ✅ detail.sections[] → sd-section/sd-card |
| dim | `"python3 -c ..."` / `"cd /sessions/..."` / `"git diff --stat"` |
| detail.sections | `[{label:"输入命令", variant:"code", content:"..."}, {label:"输出结果", variant:"text", content:"..."}, {label:"退出码", variant:"text", content:"0"}]` |
| 渲染特点 | 事件行带 chevron → 点击进入二级详情 → renderDetailContent() → sd-container |

### 2.13 Sub Coding Agent

| 字段 | 值 |
|------|-----|
| icon | 🐱 |
| text | `"Sub Coding Agent"` |
| sheetFrames | F3.5a / F3.5b / F3.5c（3帧） |
| 一级 Sheet | s-row + dim |
| 二级 Sheet | ❌ 无 |
| dim | `"Rewrite docx generator script"` |
| 渲染特点 | 标准事件行 |

### 2.14 嵌套子对话流

| 字段 | 值 |
|------|-----|
| icon | ↳ |
| text | `"嵌套子对话流"` |
| sheetFrames | F3.5c（与 SubAgent 混在同一帧） |
| 一级 Sheet | s-row + card（Subagent result 卡片） |
| 二级 Sheet | ❌ 无 |
| card | `{title: "Subagent result", body: "重写 docx generator script，移除异常转义..."}` |
| 渲染特点 | event-card 内联渲染 |

---

## 三、当前映射对照表

### 3.1 正则 → icon key → SVG 文件 映射

| # | 类型 | text | inferToolIconKey 返回 | TOOL_ICON_FILES key | SVG |
|---|------|------|----------------------|---------------------|-----|
| 1 | 思考过程 | 思考过程 | `'agent'` | `agent` | ai-agent.svg |
| 2 | 创建待办 | 创建待办 | `'plan'` | `plan` | wb-growth-plan.svg |
| 3 | 搜索网页 | 搜索网页 | `'website'`（因 dim 含"网页"） | `website` | wb-website.svg |
| 4 | 更新待办 | 更新待办 | `'plan'` | `plan` | wb-growth-plan.svg |
| 5 | 生成图片 | 生成图片 | `'image'` | `image` | image.svg |
| 6 | 调用技能 | 调用技能 | `'skill'` | `skill` | wb-skills.svg |
| 7 | 文件创建失败 | 文件创建失败 | `'debug'` | `debug` | wb-ai-debug.svg |
| 8 | 创建文件 | 创建文件 | `'edit'` | `edit` | wb-edit.svg |
| 9 | 读取文件 | 读取文件 | `'view'` | `view` | wb-view.svg |
| 10 | 编辑文件 | 编辑文件 | `'edit'` | `edit` | wb-edit.svg |
| 11 | 搜索文件 | 搜索文件 | `'search'` | `search` | wb-search.svg |
| 12 | 执行命令 | 执行命令 | `'terminal'` | `terminal` | wb-terminal-ai.svg |
| 13 | SubAgent | Sub Coding Agent | `'agent'` | `agent` | ai-agent.svg |
| 14 | 嵌套子对话 | 嵌套子对话流 | `'agent'` | `agent` | ai-agent.svg |

### 3.2 关键发现

1. **思考/SubAgent/嵌套** 三者都返回 `'agent'`，共享 `ai-agent.svg` — 这是合理的视觉分组，不应拆
2. **创建待办/更新待办** 两者都返回 `'plan'`，共享 `wb-growth-plan.svg`
3. **创建文件/编辑文件** 两者都返回 `'edit'`，共享 `wb-edit.svg`
4. **搜索网页** 返回 `'website'`（因为 dim 含"网页"），而 **搜索文件** 返回 `'search'`（因为 dim 含"搜索"但 text"搜索文件"中的"搜索"先被匹配到）—— 正则顺序敏感，脆弱
5. `TOOL_ICON_FILES` 有 12 个 key，`inferToolIconKey` 产生 11 个不同 key + 兜底 `'tools'`
6. `TOOL_ICON_FILES` 有一个孤立 key `'think'`，正则永远不会返回 — 死代码

---

## 四、目标架构

```
scenario.js                 engine/tool-types.js          engine/sheet.js
┌──────────────┐           ┌─────────────────────┐       ┌─────────────────┐
│ event {      │           │ TOOL_TYPE 枚举       │       │ renderEvent()   │
│   type:'cmd' │───引用──→│   14 种类型常量      │       │ 读 TOOL_META    │
│   text:'..'  │           │                     │       │ 统一渲染        │
│   dim:'..'   │           │ TOOL_META 注册表     │       │                 │
│   detail:{}  │           │   iconFile           │       │ renderDetail()  │
│   card:{}    │           │   hasDetail          │       │ 按 schema 渲染  │
│   outputs:[] │           │   isWarning          │       │                 │
│ }            │           │   statusLabel        │       │                 │
└──────────────┘           │   displayGroup       │       │                 │
                           └─────────────────────┘       └─────────────────┘
```

---

## 五、修订后的分步计划

### Phase 1：新建 `engine/tool-types.js` + 改造 `icons.js` + 适配 `features/tool-call-node.js`

**改动文件**：`engine/tool-types.js`（新建）、`engine/icons.js`（修改）、`features/tool-call-node.js`（修改）

**内容**：

1. 新建 `engine/tool-types.js`，定义 `TOOL_TYPE` 枚举（14种，SCREAMING_SNAKE → kebab-case 值）和 `TOOL_META` 注册表

```javascript
// engine/tool-types.js
export const TOOL_TYPE = {
  THINK:        'think',
  TODO_CREATE:  'todo-create',
  TODO_UPDATE:  'todo-update',
  SEARCH_WEB:   'search-web',
  SEARCH_FILE:  'search-file',
  GEN_IMAGE:    'gen-image',
  CALL_SKILL:   'call-skill',
  CREATE_FILE:  'create-file',
  READ_FILE:    'read-file',
  EDIT_FILE:    'edit-file',
  FILE_FAIL:    'file-fail',
  EXEC_CMD:     'exec-cmd',
  SUB_AGENT:    'sub-agent',
  NESTED_FLOW:  'nested-flow',
};

export const TOOL_META = {
  [TOOL_TYPE.THINK]:       { iconFile: 'ai-agent.svg',      hasDetail: false, isWarning: false, statusLabel: '思考过程',       displayGroup: 'thinking' },
  [TOOL_TYPE.TODO_CREATE]: { iconFile: 'wb-growth-plan.svg', hasDetail: false, isWarning: false, statusLabel: '创建待办',       displayGroup: 'planning' },
  [TOOL_TYPE.TODO_UPDATE]: { iconFile: 'wb-growth-plan.svg', hasDetail: false, isWarning: false, statusLabel: '更新待办',       displayGroup: 'planning' },
  [TOOL_TYPE.SEARCH_WEB]:  { iconFile: 'wb-website.svg',     hasDetail: false, isWarning: false, statusLabel: '搜索网页',       displayGroup: 'search' },
  [TOOL_TYPE.SEARCH_FILE]: { iconFile: 'wb-search.svg',      hasDetail: false, isWarning: false, statusLabel: '搜索文件',       displayGroup: 'search' },
  [TOOL_TYPE.GEN_IMAGE]:   { iconFile: 'image.svg',          hasDetail: false, isWarning: false, statusLabel: '生成图片',       displayGroup: 'media' },
  [TOOL_TYPE.CALL_SKILL]:  { iconFile: 'wb-skills.svg',      hasDetail: false, isWarning: false, statusLabel: '调用技能',       displayGroup: 'execution' },
  [TOOL_TYPE.CREATE_FILE]: { iconFile: 'wb-edit.svg',        hasDetail: false, isWarning: false, statusLabel: '创建文件',       displayGroup: 'file' },
  [TOOL_TYPE.READ_FILE]:   { iconFile: 'wb-view.svg',        hasDetail: false, isWarning: false, statusLabel: '读取文件',       displayGroup: 'file' },
  [TOOL_TYPE.EDIT_FILE]:   { iconFile: 'wb-edit.svg',        hasDetail: false, isWarning: false, statusLabel: '编辑文件',       displayGroup: 'file' },
  [TOOL_TYPE.FILE_FAIL]:   { iconFile: 'wb-ai-debug.svg',    hasDetail: false, isWarning: true,  statusLabel: '文件创建失败',   displayGroup: 'file' },
  [TOOL_TYPE.EXEC_CMD]:    { iconFile: 'wb-terminal-ai.svg', hasDetail: true,  isWarning: false, statusLabel: '执行命令',       displayGroup: 'execution' },
  [TOOL_TYPE.SUB_AGENT]:   { iconFile: 'ai-agent.svg',       hasDetail: false, isWarning: false, statusLabel: 'Sub Agent',      displayGroup: 'agent' },
  [TOOL_TYPE.NESTED_FLOW]: { iconFile: 'ai-agent.svg',       hasDetail: false, isWarning: false, statusLabel: '嵌套子对话流',   displayGroup: 'agent' },
};

// 从 TOOL_META 自动生成 TOOL_ICON_FILES（保持向后兼容）
export const TOOL_ICON_FILES = Object.fromEntries(
  Object.entries(TOOL_META).map(([type, meta]) => [type, meta.iconFile])
);

// 从 TOOL_META 自动生成 isWarningEvent 逻辑
export function isWarningType(type) {
  return TOOL_META[type]?.isWarning === true;
}
```

2. 修改 `engine/icons.js`：
   - `inferToolIconKey()` 优先读 `item.type` → 查 `TOOL_META`（若 type 存在则直接返回 type 值）；无 type 时走旧正则兜底
   - `isWarningEvent()` 优先读 `item.type` → 查 `isWarningType()`；无 type 时走旧正则兜底
   - `TOOL_ICON_FILES` 改为从 `engine/tool-types.js` re-export，保持向后兼容

3. 修改 `features/tool-call-node.js`：
   - 确认其通过 `statusLineHTML` 和 `renderStaticSheet` 间接使用图标系统，无需直接改动
   - 验证右侧说明栏静态 sheet mock 在新架构下行为不变

**灰度策略**：此阶段 scenario.js 无 type 字段，所有事件走旧正则路径，行为完全不变。

**提交**：`feat(engine/tool-types): 新建工具类型注册表，icons.js 改造支持 type 字段优先读取`

---

### Phase 2：`scenario.js` 所有事件加 `type` 字段

**改动文件**：仅 `scenario.js`

**方式**：用脚本批量注入，不是手动改 54 处。

脚本逻辑（伪代码）：
```
for each frame in scenario.sheetFrames:
  for each event in frame.events:
    infer type from event.icon + event.text + event.dim via old regex
    inject event.type = TOOL_TYPE constant value
```

**验证**：
- 脚本先 dry-run 输出差异报告，人工 review 确认无误后再写入
- 注入后全部事件走新路径，对比新旧路径输出一致

**提交**：`feat(scenario): 所有工具事件增加显式 type 字段（脚本注入）`

---

### Phase 3：清理旧代码

**改动文件**：`engine/icons.js`

**内容**：
- 删除 `inferToolIconKey` 和 `isWarningEvent` 中的旧正则逻辑（保留 type 路径）
- 可选：删除 `TOOL_ICON_FILES` 表（保留 re-export 版本以防外部引用）

**前置条件**：确认 Phase 2 验证无误，所有事件走新路径

**提交**：`refactor(engine/icons): 删除正则推断逻辑，统一走类型注册表`

---

### Phase 4：其他类型统一 detail schema（触发型，不在此次计划内）

等需要给搜索网页、编辑文件等类型加二级详情时，再给 `TOOL_META` 对应条目增加 `detailSchema` 声明。

---

## 六、风险矩阵

| # | 风险 | 等级 | 缓解措施 |
|---|------|------|----------|
| 1 | `features/tool-call-node.js` 通过 `statusLineHTML` 间接依赖图标推断 | 🟡 中 | Phase 1 验证右侧说明栏行为不变 |
| 2 | 54 处手动改 scenario.js 易出错 | 🔴 高 | 改为脚本自动化注入 + dry-run review |
| 3 | Phase 1→2 之间无灰度，一刀切 | 🟡 中 | 拆为 3 步可逆迁移，Phase 1 走旧路径、Phase 2 走新路径、Phase 3 清旧代码 |
| 4 | `TOOL_ICON_FILES` 删除 break 外部引用 | 🟢 低 | 改为从 TOOL_META re-export，保持兼容 |
| 5 | `inferToolIconKey` 返回 key 与 TOOL_TYPE 值不完全对齐 | 🟡 中 | Phase 1 手动校验 14 种映射，脚本 dry-run 验证 |

---

## 七、命名约定

- **常量名**：`SCREAMING_SNAKE_CASE`（如 `TOOL_TYPE.EXEC_CMD`）
- **常量值**：`kebab-case`（如 `'exec-cmd'`）
- **TOOL_META key**：用 `[TOOL_TYPE.XXX]` computed key，确保编译期引用追踪
- **HTML data 属性**：`data-tool-type="exec-cmd"`（与值一致，便于 debug）
