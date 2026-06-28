# 右侧交互说明快照规范

**核心原则：右边快照不重写代码，直接调左边 Demo 已有的渲染函数。**

---

## 正确模式

`features/<id>.js` 要展示某个组件的截图，调用 `engine/<组件>.js` 导出的静态渲染函数。这个函数内部必须和 live 路径走**同一条 HTML 生成函数**。

```
live 路径                          static 路径
renderXxx()                       renderStaticXxx()
    → 调 renderXxxHTML(mode:'live')  → 调 renderXxxHTML(mode:'static')
    → 注入 DOM + 绑定事件              → 返回 HTML 字符串
```

**唯一真相源是 `renderXxxHTML`。** live 和 static 只是两种消费方式。

---

## 代码 Sheet 案例

### 调用方（`features/sheet.js`）

一行调用，数据来自 `scenario.js` 或本地样例：

```js
import { renderStaticCodeSheetShell } from '../engine/code-fullscreen-sheet.js';

// 指定尺寸
anatomyCode: renderStaticCodeSheetShell({
  lang: 'javascript',
  code: CODE_SAMPLE,
  width: '393px',
  height: '852px',    // 建议用手机壳高度 852px
  borderRadius: '0',
  frameCls: 'fp-show-overlay',  // 有遮罩
}),
```

### 实现方（`engine/code-fullscreen-sheet.js`）

```js
// 统一的 HTML 生成函数（live 和 static 公用）
function renderCodeSheetHTML(state, options = {}) {
  const { mode = 'live' } = options;
  const actionsHtml = renderActionsHtml(state.kind, state, { mode });
  const bodyHtml = renderBodyHtml(state.kind, state);
  return `<header>...</header><div>...</div>`;
}

// live：openCodeSheet → openSheet → customRenderer → renderCodeSheetHTML
// static：renderStaticCodeSheetShell → renderStaticCodeSheet → renderCodeSheetHTML
```

---

## 踩过的坑

### 1. 内容 HTML 写了两遍

**症状**：live 回调里一段 HTML 模板，static 函数里一段完全一样的 HTML 模板。

**原因**：没有抽统一的 `renderXxxHTML`。

**修复**：抽出来，live 和 static 都调它。改一处两边同步。

### 2. 语法高亮丢失

**症状**：对话流里代码五颜六色，代码 Sheet 里全黑。

**原因**：`getCardCode` 用 `textContent` 取代码，把 highlight.js 的 `<span>` 全部丢掉了。

**修复**：保留 `code`（纯文本，给复制/分享用），新增 `codeHtml`（`innerHTML`，保留高亮标签），渲染时优先用 `codeHtml`。

### 3. 行号只在 live 有

**症状**：左边 Demo 有行号，右边快照没有。

**原因**：`renderBodyHtml` 里 `if (state.lineNumbers)` 分支，static 路径的 state 没设 `lineNumbers: true`。

**修复**：给 `renderStaticCodeSheet` 构造的 state 补上。

### 4. feature-panel.css 覆盖了 Demo 样式

**症状**：右边快照 padding 跟左边不一致（14px vs 0）。

**原因**：`feature-panel.css` 里有快照专属 CSS 规则，独立于 `sheet.css`。

**修复**：feature-panel.css **不应该**有组件内部样式覆盖。快照的样式由组件自己的 CSS 管，跟 Demo 走同一套。只在必要时控制容器尺寸和定位。

### 5. 快照高度被通用规则压成 40%

**症状**：代码 Sheet 快照显示 40% 高度，不是 Demo 的 80%。

**原因**：`feature-panel.css` 有一条通用规则 `.fp-sheet-shell-frame .bottom-sheet:not(.auto-height) { height: 40% !important }`，没有排除代码 Sheet，压住了 `sheet.css` 的 80%。

**修复**：通用规则加 `:not(.code-variant)` 排除代码 Sheet。

### 6. 遮罩消失

**症状**：右边快照没有深色半透明遮罩。

**原因**：快照默认 overlay 是透明的，需要 `fp-show-overlay` class 才显示遮罩。调用时漏传了 `frameCls`。

**修复**：传 `frameCls: 'fp-show-overlay'`。

### 7. 尺寸硬编码

**现状**：快照尺寸（width/height）需要在调用方手动传。Demo 手机壳是 `390×852`，快照通常用 `393×852`。

**建议**：长期理想方案是 `renderStaticCodeSheetShell` 不传尺寸时自动读 CSS 变量 `--layout-shell-w` / `--layout-shell-h`，调用方就不用写死数字。

---

## 检查清单

在右侧新增快照前，问自己三个问题：

| # | 问题 | 违规指征 |
|---|------|----------|
| 1 | 渲染函数是否 live/static 共用同一个 HTML 生成器？ | live 和 static 里出现重复的 HTML 模板字符串 |
| 2 | CSS 是否由组件自己的文件管，feature-panel.css 不插手内部样式？ | `feature-panel.css` 里出现 `padding`/`background`/`border` 等组件内部属性 |
| 3 | 数据是否来自 `scenario.js` 或与 Demo 相同的来源？ | 在 feature 文件里硬编码大段示例数据 |
