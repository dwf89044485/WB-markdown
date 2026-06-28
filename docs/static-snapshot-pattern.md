# 静态快照复用模式

## 问题

右侧 Feature Panel 需要展示左侧 Demo 组件的静态快照（无交互、按钮 disabled），但快照的 HTML 结构和样式必须与左侧 Demo 完全一致。如果为右侧重写一套渲染函数，会导致：

- 两份代码维护，改左边忘了右边
- 两边视觉不一致
- 代码膨胀

## 方案：统一渲染函数 + `mode` 参数

核心思路：**只写一套渲染函数，通过 `mode` 参数区分 live/static 行为。**

### 架构

```
┌─────────────────────────────────────────────────────┐
│                  统一渲染函数                          │
│          renderXxxHTML(data, options = {})            │
│                                                       │
│  options.mode = 'live'  →  正常交互 HTML              │
│  options.mode = 'static' →  disabled 按钮 + 无 id    │
└──────────────┬──────────────────────────┬────────────┘
               │                          │
               ▼                          ▼
     左侧 Demo 调用                   右侧文档调用
     renderXxx()                      renderStaticXxx()
     └→ mode: 'live'                  └→ mode: 'static'
```

### 三步实现

#### 第一步：统一渲染函数

在 engine 层写一个函数，接收 `options` 参数，其中 `mode` 控制静态/动态差异：

```js
// engine/xxx.js
function renderXxxHTML(data, options = {}) {
  const { mode = 'live' } = options;
  const isStatic = mode === 'static';

  // 所有差异点用 isStatic 判断
  const disabled = isStatic ? ' disabled' : '';
  const idAttr = isStatic ? '' : ' id="xxx-container"';

  return `
    <div${idAttr} class="xxx-card">
      <button class="xxx-btn"${disabled}>操作</button>
      <div class="xxx-body">${data.content}</div>
    </div>
  `;
}
```

**关键原则**：静态和动态的 HTML 结构、class 名必须完全一致，只差在 `disabled`、`id`、`data-action` 等交互属性上。这样 CSS 样式才能同时生效。

#### 第二步：左侧 Demo 调用（live 模式）

```js
// engine/xxx.js
function renderXxx() {
  container.innerHTML = renderXxxHTML(data, { mode: 'live' });
  // 绑定事件...
}
```

#### 第三步：右侧文档调用（static 模式）

```js
// engine/xxx.js
export function renderStaticXxx(data, options = {}) {
  return renderXxxHTML(data, { mode: 'static', ...options });
}
```

右侧 Feature Panel 直接导入 `renderStaticXxx` 使用：

```js
// features/some-feature.js
import { renderStaticXxx } from '../engine/xxx.js';
```

### 项目中的实际案例

| 组件 | 引擎文件 | 统一函数 | 静态入口 | 差异点 |
|------|----------|----------|----------|--------|
| 问答卡片 | `engine/ask-question.js` | `renderAskQuestionHTML(questions, stepIndex, answers, options)` | `renderStaticAskQuestion()` | static 时按钮 disabled，无 id/data-action |
| 事件 Sheet | `engine/sheet.js` | `renderEvent(event)` / `renderTodo(todo)` | `renderStaticEventSheet(frameRefs)` | 直接复用 live 函数，取 outerHTML |
| 代码 Sheet | `engine/code-fullscreen-sheet.js` | `renderCodeSheetHTML(state, options)` | `renderStaticCodeSheet()` / `renderStaticCodeSheetShell()` | mode='static' 时按钮 disabled；live 路径另存 `codeHtml` 保留高亮 |

> **注意**：`renderActionsHtml` / `renderBodyHtml` 是 `renderCodeSheetHTML` 内部调用的辅助函数，不是统一入口。统一入口只有一个 `renderCodeSheetHTML`。

### 关键约束

1. **HTML 结构必须一致**：live 和 static 输出的 DOM 树层级、class 名必须相同。CSS 选择器依赖 class，结构变了样式就丢了。

2. **差异点最小化**：只差在 `disabled`、`id`、`data-action`、`data-*` 等纯交互属性上。不要为 static 模式加额外的 wrapper 或 class。

3. **静态入口必须 export**：`renderStaticXxx` 需要被 `features/*.js` 导入，所以必须 `export`。

4. **数据格式一致**：static 和 live 接收相同的数据结构。如果静态场景需要造样本数据，在 `features/*.js` 里构造，不要改渲染函数。

5. **样式不重复**：静态快照的样式完全复用左侧 Demo 的 CSS。不需要为右侧写额外的样式文件。如果快照需要独立容器约束尺寸，用 `frameCls` 或 shell wrapper 控制，不要在 CSS 中用 `!important` 覆盖。

### 检查清单

新增一个组件的静态快照时，对照以下清单：

- [ ] 统一渲染函数是否已支持 `options.mode`？
- [ ] static 和 live 的 HTML 结构是否一致？
- [ ] 按钮是否在 static 时加了 `disabled`？
- [ ] 静态入口是否 `export` 了？
- [ ] 右侧文档是否从 engine 导入静态入口，而不是自己重写 HTML？
- [ ] 样式是否完全复用左侧 CSS，没有新增样式文件？

---

## 常见问题与踩坑记录

### 1. 内容 HTML 写了两遍

**症状**：live 路径的 `customRenderer` 回调里一段 HTML 模板，static 路径的渲染函数里一段完全一样的 HTML 模板。

**根因**：没有抽统一的 `renderXxxHTML`，两条路径各自拼字符串。

**修复**：抽一个 `renderXxxHTML(state, { mode })` 函数，live 和 static 都调它。改一处两边同步。参考 `renderAskQuestionHTML` 和 `renderCodeSheetHTML`。

### 2. 语法高亮丢失

**症状**：对话流里代码五颜六色（highlight.js），到了代码 Sheet 里全变成纯黑文字。

**根因**：用 `textContent` 取代码，把 `<span class="hljs-*">` 全部丢掉了。

**修复**：保留 `code`（`textContent`，给复制/分享用），同时存一份 `codeHtml`（`innerHTML`，保留高亮标签）。渲染时优先用 `codeHtml`，没有则回退到 `escapeHtml(code)`。

### 3. static 路径漏设状态字段

**症状**：左边 Demo 有行号，右边快照没有。

**根因**：`renderBodyHtml` 里 `if (state.lineNumbers)` 分支，live 路径的 state 设了 `lineNumbers: true`，static 路径没设。

**修复**：所有控制视觉差异的状态字段（`lineNumbers`、`hideHeader` 等），live 和 static 构造 state 时都要设。

### 4. feature-panel.css 覆盖 Demo 样式

**症状**：右边快照的 padding、高度跟左边不一致。

**根因**：`feature-panel.css` 里写了快照专属的组件内部样式（如 `padding: 14px`），独立于组件自己的 CSS。

**修复**：**feature-panel.css 禁止写入组件内部样式**（padding / background / border / height 等）。快照的样式由组件自己的 CSS（`sheet.css` / `markdown.css` 等）统一管理。feature-panel.css 只控制容器定位、尺寸和快照特有的表层差异（如 overlay 透明/深色切换）。

### 5. 通用规则误伤特定组件

**症状**：代码 Sheet 快照被通用规则压成 40% 高度，实际应该是 80%。

**根因**：`feature-panel.css` 有一条 `.fp-sheet-shell-frame .bottom-sheet:not(.auto-height) { height: 40% !important }`，选择器太宽，命中了代码 Sheet。

**修复**：通用规则加 `:not(.code-variant)` 排除，让代码 Sheet 走自己的 CSS。教训：**写通用规则时，确认它不会误伤已有组件**。

### 6. 快照缺少 Demo 有的视觉元素

**症状**：右边快照没有深色遮罩。

**根因**：快照默认 overlay 透明。需要传 `frameCls: 'fp-show-overlay'` 才触发深色遮罩。

**修复**：调 `renderStaticSheetShell` 时传 `frameCls: 'fp-show-overlay'`。

---

## 实操检查清单（给 AI 用）

在 Feature Panel 里新增一个快照时，逐条核对：

| # | 检查项 | 违规指征 |
|---|--------|----------|
| 1 | 渲染函数 live/static 共用同一个 HTML 生成器？ | 两处出现重复的 HTML 模板字符串 |
| 2 | 有没有 `textContent` 导致丢掉内部 HTML？ | 需要保留 `<span>` 的地方用了 `textContent` |
| 3 | CSS 是否由组件自己文件管，feature-panel.css 不插手内部样式？ | `feature-panel.css` 出现 `padding`/`background`/`border` |
| 4 | 通用 CSS 规则会不会误伤这个组件？ | 写 `:not(.auto-height)` 忘了 `:not(.code-variant)` |
| 5 | live state 里设了的字段，static state 里设了吗？ | `lineNumbers` / `hideHeader` 等在两边不一致 |
| 6 | 数据来自 `scenario.js` 还是硬编码在 feature 文件里？ | 大段示例数据写在 `features/<id>.js` 里 |
| 7 | 需要遮罩吗？传 `frameCls: 'fp-show-overlay'` 了吗？ | 快照没有深色半透明背景 |
