# Ask User Question 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 WorkBuddy 对话流中实现 AI 向用户提问的交互组件，支持单选、多选、排序三种题型。

**Architecture:** 在 `scenario.js` 中新增 `askUser` action 类型，包含问题数据。在 `engine/` 中新增 `ask-question.js` 模块处理问答卡片的渲染和交互逻辑。问答卡片替换 composer 区域（而非用 sheet），提交后恢复 composer 并继续播放。播放引擎通过 Promise 暂停等待用户作答。

**Tech Stack:** 原生 JS (ES Module)、CSS (无框架)、Figma 设计稿规范

**设计规范文档:** `docs/plans/2026-06-12-ask-user-question-design.md`

---

## Task 1: 新增 CSS 样式文件

**Files:**
- Create: `styles/ask-question.css`
- Modify: `index.html` (引入新 CSS)

**Step 1: 创建 ask-question.css 基础骨架**

在 `styles/ask-question.css` 中定义所有 CSS 变量和问答卡片的样式。

```css
/* ── Ask User Question ─────────────────────────────── */
:root {
  --aq-bg: #FFFFFF;
  --aq-radius: 20px;
  --aq-padding: 20px;
  --aq-shadow: 0px 4px 20px 0px rgba(0, 0, 0, 0.1);
  --aq-width: 350px;

  --aq-text: #3D3D3D;
  --aq-text-regular: 400;
  --aq-text-semibold: 600;
  --aq-font: 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif;
  --aq-font-sm: 12px;
  --aq-font-base: 14px;
  --aq-font-lg: 17px;
  --aq-line-height: 24px;

  --aq-option-bg: #FAFAFA;
  --aq-option-selected-bg: #F2F2F2;
  --aq-option-height: 46px;
  --aq-option-radius: 10px;
  --aq-option-gap: 10px;
  --aq-option-padding: 10px;

  --aq-badge-bg: #F2F2F2;
  --aq-badge-radius: 180px;
  --aq-badge-padding: 2px 12px;

  --aq-num-size: 20px;
  --aq-num-radius: 90px;
  --aq-num-bg: #F2F2F2;

  --aq-checkbox-size: 20px;
  --aq-checkbox-radius: 8px;
  --aq-checkbox-border: #D5D5D5;
  --aq-checkbox-checked-bg: #3D3D3D;

  --aq-btn-skip-bg: #F4F2F2;
  --aq-btn-action-bg: #3D3D3D;
  --aq-btn-height: 30px;
  --aq-btn-radius: 120px;
  --aq-btn-padding: 1px 12px;

  --aq-close-size: 36px;
  --aq-close-radius: 120px;
  --aq-close-bg: rgba(255, 255, 255, 0.3);
  --aq-close-shadow: 0px 6px 30px 0px rgba(0, 0, 0, 0.1);

  --aq-input-height: 50px;
  --aq-input-placeholder-opacity: 0.3;
}
```

**Step 2: 添加问答卡片容器样式**

```css
/* 卡片整体 — 替换 composer 显示在相同位置 */
.ask-question {
  display: none;
  flex-shrink: 0;
  padding: 0 var(--composer-padding-x) var(--composer-padding-bottom);
  position: relative;
}
.ask-question.is-active {
  display: flex;
  justify-content: center;
}

.ask-question-card {
  width: var(--aq-width);
  background: var(--aq-bg);
  border-radius: var(--aq-radius);
  box-shadow: var(--aq-shadow);
  padding: var(--aq-padding) var(--aq-padding) 10px;
  display: flex;
  flex-direction: column;
  gap: 0;
  animation: aq-slide-up 0.3s ease-out;
}

@keyframes aq-slide-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Step 3: 添加顶栏样式**

```css
/* 顶栏：左箭头 + 步骤 + 右箭头 + 关闭 */
.aq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 310px;
  align-self: center;
}

.aq-nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.aq-nav-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 16px;
  height: 16px;
  padding: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--aq-text);
}
.aq-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.aq-step-indicator {
  font-family: var(--aq-font);
  font-weight: var(--aq-text-semibold);
  font-size: var(--aq-font-sm);
  line-height: var(--aq-line-height);
  color: var(--aq-text);
}

.aq-close-btn {
  width: var(--aq-close-size);
  height: var(--aq-close-size);
  border-radius: var(--aq-close-radius);
  background: var(--aq-close-bg);
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--aq-close-shadow);
}
```

**Step 4: 添加问题区样式**

```css
/* 问题区：标签 + 文字 */
.aq-question-area {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 16px 0;
  width: 310px;
  align-self: center;
}

.aq-badge {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: var(--aq-badge-padding);
  background: var(--aq-badge-bg);
  border-radius: var(--aq-badge-radius);
  font-family: var(--aq-font);
  font-weight: var(--aq-text-semibold);
  font-size: var(--aq-font-sm);
  line-height: var(--aq-line-height);
  color: var(--aq-text);
  flex-shrink: 0;
}

.aq-question-text {
  font-family: var(--aq-font);
  font-weight: var(--aq-text-semibold);
  font-size: var(--aq-font-lg);
  line-height: var(--aq-line-height);
  color: var(--aq-text);
  text-align: left;
  flex: 1;
  min-width: 0;
}
```

**Step 5: 添加选项行样式**

```css
/* 选项列表 */
.aq-options {
  display: flex;
  flex-direction: column;
  gap: var(--aq-option-gap);
  align-self: stretch;
}

/* 单个选项行 */
.aq-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  padding: var(--aq-option-padding);
  height: var(--aq-option-height);
  background: var(--aq-option-bg);
  border-radius: var(--aq-option-radius);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.aq-option.is-selected {
  background: var(--aq-option-selected-bg);
}

/* 排序行 */
.aq-option.is-sort {
  cursor: grab;
}
.aq-option.is-sort.is-dragging {
  opacity: 0.6;
  cursor: grabbing;
}

/* 选项左侧：序号 + 文字 */
.aq-option-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.aq-option-num {
  width: var(--aq-num-size);
  height: var(--aq-num-size);
  border-radius: var(--aq-num-radius);
  background: var(--aq-num-bg);
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: var(--aq-font);
  font-weight: var(--aq-text-regular);
  font-size: var(--aq-font-sm);
  line-height: var(--aq-line-height);
  color: var(--aq-text);
  flex-shrink: 0;
}
.aq-option.is-selected .aq-option-num {
  font-weight: var(--aq-text-semibold);
}

.aq-option-text {
  font-family: var(--aq-font);
  font-weight: var(--aq-text-regular);
  font-size: var(--aq-font-base);
  line-height: var(--aq-line-height);
  color: var(--aq-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.aq-option.is-selected .aq-option-text {
  font-weight: var(--aq-text-semibold);
}

/* 选项右侧：单选 ✓ / 多选 ☑ / 排序 ≡ */
.aq-option-right {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* 单选选中图标 */
.aq-check-icon {
  width: 16px;
  height: 16px;
}

/* 多选复选框 */
.aq-checkbox {
  width: var(--aq-checkbox-size);
  height: var(--aq-checkbox-size);
  border-radius: var(--aq-checkbox-radius);
  background: var(--aq-bg);
  border: 1px solid var(--aq-checkbox-border);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background 0.15s, border-color 0.15s;
}
.aq-option.is-selected .aq-checkbox {
  background: var(--aq-checkbox-checked-bg);
  border-color: var(--aq-checkbox-checked-bg);
}

/* 排序拖拽手柄 */
.aq-drag-handle {
  width: 16px;
  height: 16px;
  color: var(--aq-text);
  opacity: 0.4;
}
```

**Step 6: 添加底部输入栏样式**

```css
/* 底部输入栏 */
.aq-input-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 310px;
  height: var(--aq-input-height);
  align-self: center;
  margin-top: var(--aq-option-gap);
}

.aq-input-field {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--aq-font);
  font-weight: var(--aq-text-regular);
  font-size: var(--aq-font-base);
  line-height: var(--aq-line-height);
  color: var(--aq-text);
  padding: 0;
}
.aq-input-field::placeholder {
  color: var(--aq-text);
  opacity: var(--aq-input-placeholder-opacity);
}

.aq-action-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: var(--aq-btn-padding);
  height: var(--aq-btn-height);
  border-radius: var(--aq-btn-radius);
  border: none;
  cursor: pointer;
  font-family: var(--aq-font);
  font-weight: var(--aq-text-semibold);
  font-size: var(--aq-font-sm);
  line-height: var(--aq-line-height);
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}
.aq-action-btn.is-skip {
  background: var(--aq-btn-skip-bg);
  color: var(--aq-text);
}
.aq-action-btn.is-action {
  background: var(--aq-btn-action-bg);
  color: #FFFFFF;
}
```

**Step 7: 在 index.html 中引入 CSS**

在 `<link rel="stylesheet" href="./styles/demo-controls.css">` 之后添加：
```html
<link rel="stylesheet" href="./styles/ask-question.css">
```

**Step 8: 提交**

```bash
git add styles/ask-question.css index.html
git commit -m "feat(ui/ask-question): 新增问答卡片 CSS 样式文件"
```

---

## Task 2: 新增 HTML 容器

**Files:**
- Modify: `index.html`

**Step 1: 在 composer 旁边添加问答卡片容器**

在 `index.html` 的 `.composer` div 之后（约第 135 行后），添加问答卡片的容器：

```html
  <!-- Ask User Question (replaces composer when active) -->
  <div class="ask-question" id="askQuestion">
    <div class="ask-question-card">
      <!-- 顶栏 -->
      <div class="aq-header">
        <div class="aq-nav">
          <button class="aq-nav-btn aq-prev-btn" id="aqPrev" type="button" aria-label="上一题">
            <svg width="4" height="8" viewBox="0 0 4 8" fill="none"><path d="M3.4243 7.8485L-0.6615 3.7627L-0.6808 3.7434Q-1.2803 3.1439 -1.4689 2.8959Q-1.8373 2.411 -1.8373 1.9243Q-1.8373 1.4375 -1.4689 0.9526Q-1.2803 0.7046 -0.6808 0.1051L-0.6615 0.0858L3.4243 -4L4.2728 -3.1515L0.187 -0.9343L0.1677 0.9536Q-0.0387 1.1599 -0.1921 1.3242L10.8485 1.3242L10.8485 2.5243L-0.1921 2.5243Q-0.0387 2.6886 0.1677 2.8949L0.1773 2.9045L0.187 2.9142L4.2728 7L3.4243 7.8485Z" transform="matrix(-1 0 0 1 2.0757 8)" fill="currentColor" fill-rule="evenodd"/></svg>
          </button>
          <span class="aq-step-indicator" id="aqStep">1 / 4</span>
          <button class="aq-nav-btn aq-next-btn" id="aqNext" type="button" aria-label="下一题">
            <svg width="4" height="8" viewBox="0 0 4 8" fill="none"><path d="M7.4243 11.8485L11.51 7.7627L11.5294 7.7434Q12.1289 7.1439 12.3174 6.8959Q12.6858 6.411 12.6858 5.9243Q12.6858 5.4375 12.3174 4.9526Q12.1289 4.7046 11.5294 4.1051L11.51 4.0858L7.4243 0L6.5757 0.8485L10.6615 4.9343L10.6808 4.9536Q10.8872 5.1599 11.0406 5.3242L0 5.3242L0 6.5243L11.0406 6.5243Q10.8872 6.6886 10.6808 6.8949L10.6712 6.9045L10.6615 6.9142L6.5757 11L7.4243 11.8485Z" fill="currentColor" fill-rule="evenodd"/></svg>
          </button>
        </div>
        <button class="aq-close-btn" id="aqClose" type="button" aria-label="关闭">
          <svg width="10.87" height="10.87" viewBox="0 0 11 11" fill="none">
            <path d="M1 1L10 10M10 1L1 10" stroke="#3D3D3D" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <!-- 问题区 -->
      <div class="aq-question-area" id="aqQuestionArea"></div>
      <!-- 选项列表 -->
      <div class="aq-options" id="aqOptions"></div>
      <!-- 输入栏 -->
      <div class="aq-input-bar">
        <input class="aq-input-field" id="aqInput" type="text" autocomplete="off">
        <button class="aq-action-btn is-skip" id="aqAction" type="button">跳过</button>
      </div>
    </div>
  </div>
```

**Step 2: 提交**

```bash
git add index.html
git commit -m "feat(ui/ask-question): 添加问答卡片 HTML 容器"
```

---

## Task 3: 新增 engine/ask-question.js 核心模块

**Files:**
- Create: `engine/ask-question.js`

这是核心模块，包含状态管理、渲染逻辑和事件处理。

**Step 1: 创建模块骨架，包含状态管理和工具函数**

```js
// ============================================================
// ASK QUESTION — 问答卡片渲染 · 交互 · 状态管理
// ============================================================

const CHECK_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const DRAG_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="5.5" cy="3.5" r="1.5" fill="currentColor"/><circle cx="10.5" cy="3.5" r="1.5" fill="currentColor"/><circle cx="5.5" cy="8" r="1.5" fill="currentColor"/><circle cx="10.5" cy="8" r="1.5" fill="currentColor"/><circle cx="5.5" cy="12.5" r="1.5" fill="currentColor"/><circle cx="10.5" cy="12.5" r="1.5" fill="currentColor"/></svg>';

// ── 问答会话状态 ─────────────────────────────────
let askState = null;     // { questions, answers[], stepIndex, resolve }
let dragState = null;    // { startIndex, currentIndex, placeholder }

function resetAskState(questions) {
  return {
    questions,
    answers: questions.map(q => ({
      type: q.type,
      selected: q.type === 'single' ? null : q.type === 'sort' ? q.options.map((_, i) => i) : [],
      customInput: '',
    })),
    stepIndex: 0,
    resolve: null,
  };
}
```

**Step 2: 实现状态计算函数**

```js
function isAnswered(question, answer) {
  if (question.type === 'sort') return true;
  if (question.type === 'single') {
    return answer.selected !== null || answer.customInput.trim() !== '';
  }
  if (question.type === 'multiple') {
    return answer.selected.length > 0 || answer.customInput.trim() !== '';
  }
  return false;
}

function getButtonLabel(stepIndex, totalSteps, question, answer) {
  const isLast = stepIndex === totalSteps - 1;
  if (question.type === 'sort') {
    return isLast ? '提交' : '下一步';
  }
  if (isAnswered(question, answer)) {
    return isLast ? '提交' : '下一步';
  }
  return '跳过';
}
```

**Step 3: 实现渲染函数**

```js
function renderAskQuestion() {
  if (!askState) return;
  const { questions, answers, stepIndex } = askState;
  const q = questions[stepIndex];
  const a = answers[stepIndex];
  const total = questions.length;

  // 步骤指示器
  const stepEl = document.getElementById('aqStep');
  if (stepEl) stepEl.textContent = `${stepIndex + 1} / ${total}`;

  // 导航按钮
  const prevBtn = document.getElementById('aqPrev');
  const nextBtn = document.getElementById('aqNext');
  if (prevBtn) prevBtn.disabled = stepIndex <= 0;
  if (nextBtn) nextBtn.disabled = stepIndex >= total - 1;

  // 问题区
  const questionArea = document.getElementById('aqQuestionArea');
  if (questionArea) {
    let html = '';
    if (q.type === 'multiple') {
      html += '<span class="aq-badge">多选</span>';
    } else if (q.type === 'sort') {
      html += '<span class="aq-badge">排序</span>';
    }
    html += `<span class="aq-question-text">${escapeAQHtml(q.question)}</span>`;
    questionArea.innerHTML = html;
  }

  // 选项列表
  renderOptions(q, a);

  // 输入栏
  const inputEl = document.getElementById('aqInput');
  if (inputEl) {
    inputEl.value = a.customInput;
    inputEl.placeholder = q.type === 'single'
      ? '以上都不是，我来告诉你'
      : '我来额外补充说明';
  }

  // 按钮
  updateActionButton();
}

function escapeAQHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderOptions(q, a) {
  const container = document.getElementById('aqOptions');
  if (!container) return;
  container.innerHTML = '';

  if (q.type === 'sort') {
    // 排序：按 answer.selected 顺序渲染
    a.selected.forEach((optIdx, posIdx) => {
      container.appendChild(createOptionRow(optIdx, q.options[optIdx], posIdx + 1, q.type, true));
    });
  } else {
    q.options.forEach((opt, i) => {
      const isSelected = q.type === 'single'
        ? a.selected === i
        : a.selected.includes(i);
      container.appendChild(createOptionRow(i, opt, i + 1, q.type, isSelected));
    });
  }
}

function createOptionRow(index, text, displayNum, type, isSelected) {
  const row = document.createElement('div');
  row.className = 'aq-option' + (isSelected ? ' is-selected' : '') + (type === 'sort' ? ' is-sort' : '');
  row.dataset.index = index;

  let rightHtml = '';
  if (type === 'single' && isSelected) {
    rightHtml = `<div class="aq-option-right"><span class="aq-check-icon">${CHECK_SVG}</span></div>`;
  } else if (type === 'multiple') {
    rightHtml = `<div class="aq-option-right"><span class="aq-checkbox">${isSelected ? CHECK_SVG : ''}</span></div>`;
  } else if (type === 'sort') {
    rightHtml = `<div class="aq-option-right"><span class="aq-drag-handle">${DRAG_SVG}</span></div>`;
  } else if (type === 'single' && !isSelected) {
    rightHtml = '<div class="aq-option-right"></div>';
  }

  row.innerHTML = `
    <div class="aq-option-left">
      <span class="aq-option-num">${displayNum}</span>
      <span class="aq-option-text">${escapeAQHtml(text)}</span>
    </div>
    ${rightHtml}
  `;

  return row;
}

function updateActionButton() {
  if (!askState) return;
  const { questions, answers, stepIndex } = askState;
  const btn = document.getElementById('aqAction');
  if (!btn) return;

  const label = getButtonLabel(stepIndex, questions.length, questions[stepIndex], answers[stepIndex]);
  btn.textContent = label;
  btn.className = 'aq-action-btn ' + (label === '跳过' ? 'is-skip' : 'is-action');
}
```

**Step 4: 实现事件处理函数**

```js
function onOptionClick(optionIndex) {
  if (!askState) return;
  const { questions, answers, stepIndex } = askState;
  const q = questions[stepIndex];
  const a = answers[stepIndex];

  if (q.type === 'single') {
    if (a.selected === optionIndex) {
      a.selected = null;
      a.customInput = '';
    } else {
      a.selected = optionIndex;
      a.customInput = '';
    }
    renderAskQuestion();

    // 非最后一题自动前进
    if (a.selected !== null && stepIndex < questions.length - 1) {
      setTimeout(() => goToStep(stepIndex + 1), 300);
    }
  }

  if (q.type === 'multiple') {
    const idx = a.selected.indexOf(optionIndex);
    if (idx >= 0) a.selected.splice(idx, 1);
    else a.selected.push(optionIndex);
    renderAskQuestion();
  }
}

function onInputChange(text) {
  if (!askState) return;
  const { questions, answers, stepIndex } = askState;
  const q = questions[stepIndex];
  const a = answers[stepIndex];

  a.customInput = text;
  if (q.type === 'single') {
    a.selected = null;
  }
  updateActionButton();
  // 单选需要重新渲染选项行（去掉选中态）
  if (q.type === 'single') renderOptions(q, a);
}

function goToStep(index) {
  if (!askState) return;
  if (index < 0 || index >= askState.questions.length) return;
  askState.stepIndex = index;
  renderAskQuestion();
}

function onActionClick() {
  if (!askState) return;
  const { questions, answers, stepIndex } = askState;
  const label = getButtonLabel(stepIndex, questions.length, questions[stepIndex], answers[stepIndex]);

  if (stepIndex === questions.length - 1 && (label === '提交' || label === '跳过')) {
    submitAnswers();
  } else {
    goToStep(stepIndex + 1);
  }
}

function onCloseAsk() {
  submitAnswers();
}

function submitAnswers() {
  if (!askState || !askState.resolve) return;
  const result = askState.questions.map((q, i) => ({
    questionId: q.id,
    type: q.type,
    selected: askState.answers[i].selected,
    customInput: askState.answers[i].customInput.trim() || null,
  }));
  const resolve = askState.resolve;
  hideAskQuestion();
  resolve(result);
}
```

**Step 5: 实现排序拖拽**

```js
function initDragSort() {
  const container = document.getElementById('aqOptions');
  if (!container) return;

  let dragEl = null;
  let startY = 0;
  let startIdx = 0;

  container.addEventListener('pointerdown', (e) => {
    if (!askState) return;
    const q = askState.questions[askState.stepIndex];
    if (q.type !== 'sort') return;

    const handle = e.target.closest('.aq-drag-handle');
    if (!handle) return;

    const row = handle.closest('.aq-option');
    if (!row) return;

    e.preventDefault();
    dragEl = row;
    startY = e.clientY;
    startIdx = Array.from(container.children).indexOf(row);
    row.classList.add('is-dragging');
    row.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    if (!dragEl) return;
    e.preventDefault();
    const containerRect = container.getBoundingClientRect();
    const rows = Array.from(container.children);
    const currentY = e.clientY;

    // 判断拖拽位置应插入到哪一行之前
    for (let i = 0; i < rows.length; i++) {
      const rowRect = rows[i].getBoundingClientRect();
      const midY = rowRect.top + rowRect.height / 2;
      if (currentY < midY && i !== startIdx) {
        if (i < startIdx) {
          container.insertBefore(dragEl, rows[i]);
        } else {
          container.insertBefore(dragEl, rows[i].nextSibling);
        }
        startIdx = Array.from(container.children).indexOf(dragEl);
        break;
      }
    }
  });

  container.addEventListener('pointerup', () => {
    if (!dragEl || !askState) return;
    dragEl.classList.remove('is-dragging');

    // 从 DOM 顺序更新 answer.selected
    const container = document.getElementById('aqOptions');
    const a = askState.answers[askState.stepIndex];
    const newOrder = Array.from(container.children).map(el => parseInt(el.dataset.index));
    a.selected = newOrder;

    // 更新序号显示
    container.querySelectorAll('.aq-option').forEach((row, i) => {
      row.querySelector('.aq-option-num').textContent = i + 1;
    });

    dragEl = null;
  });
}
```

**Step 6: 实现显示/隐藏和事件绑定**

```js
function showAskQuestion(questions) {
  return new Promise((resolve) => {
    askState = resetAskState(questions);
    askState.resolve = resolve;

    // 隐藏 composer，显示问答卡片
    const composer = document.querySelector('.composer');
    const askEl = document.getElementById('askQuestion');
    if (composer) composer.style.display = 'none';
    if (askEl) askEl.classList.add('is-active');

    renderAskQuestion();
    initDragSort();
  });
}

function hideAskQuestion() {
  const composer = document.querySelector('.composer');
  const askEl = document.getElementById('askQuestion');
  if (composer) composer.style.display = '';
  if (askEl) askEl.classList.remove('is-active');

  askState = null;
}

// 绑定一次性事件（在 DOMContentLoaded 后调用）
function bindAskQuestionEvents() {
  // 选项点击
  document.getElementById('aqOptions')?.addEventListener('click', (e) => {
    const row = e.target.closest('.aq-option');
    if (!row || !askState) return;
    const q = askState.questions[askState.stepIndex];
    if (q.type === 'sort') return; // 排序不用点击
    onOptionClick(parseInt(row.dataset.index));
  });

  // 输入框
  document.getElementById('aqInput')?.addEventListener('input', (e) => {
    onInputChange(e.target.value);
  });

  // 按钮
  document.getElementById('aqAction')?.addEventListener('click', onActionClick);

  // 导航
  document.getElementById('aqPrev')?.addEventListener('click', () => {
    if (askState) goToStep(askState.stepIndex - 1);
  });
  document.getElementById('aqNext')?.addEventListener('click', () => {
    if (askState) goToStep(askState.stepIndex + 1);
  });

  // 关闭
  document.getElementById('aqClose')?.addEventListener('click', onCloseAsk);
}

export { showAskQuestion, hideAskQuestion, bindAskQuestionEvents };
```

**Step 7: 提交**

```bash
git add engine/ask-question.js
git commit -m "feat(engine/ask-question): 新增问答卡片核心模块"
```

---

## Task 4: 集成到播放引擎

**Files:**
- Modify: `engine/player.js`
- Modify: `scenario.js`

**Step 1: 在 scenario.js 中添加 askUser 数据**

在 `scenario.nodes` 的某个 node 的 `actions` 数组中插入一个 `askUser` action，用于演示。在最后一个 status action 之后、markdown action 之前添加：

```js
{
  type: 'askUser',
  questions: [
    {
      id: 'q1',
      type: 'single',
      question: '你希望住宿偏向哪种风格？',
      options: ['商务酒店', '日式旅馆', '民宿', '青旅']
    },
    {
      id: 'q2',
      type: 'multiple',
      question: '你希望行程包含哪些类型？',
      options: ['寺庙神社', '自然风光', '购物美食', '文化体验']
    },
    {
      id: 'q3',
      type: 'sort',
      question: '请按优先级排列你的出行考量',
      options: ['性价比', '舒适度', '特色体验', '交通便利']
    },
    {
      id: 'q4',
      type: 'single',
      question: '行程节奏你更偏好哪种？',
      options: ['紧凑高效', '适中均衡', '悠闲随性']
    }
  ]
}
```

**Step 2: 在 player.js 中导入 ask-question 模块**

在 `engine/player.js` 顶部的 import 区域添加：

```js
import { showAskQuestion, bindAskQuestionEvents } from './ask-question.js';
```

**Step 3: 在 player.js 的 init 或 DOMContentLoaded 中绑定事件**

找到 `engine/player.js` 中初始化相关代码，在合适位置添加：

```js
bindAskQuestionEvents();
```

**Step 4: 在 player.js 中处理 askUser action 类型**

在 `runFlatAction` 函数中添加 `askUser` 类型的处理：

```js
if (action.type === 'askUser') {
  const result = await showAskQuestion(action.questions);
  // result 是用户的回答数组，可以输出到控制台或后续处理
  console.log('[AskUser] answers:', result);
}
```

同时在 `directorActionLabel` 中添加：

```js
if (action.type === 'askUser') return '向用户提问';
```

**Step 5: 提交**

```bash
git add engine/player.js scenario.js
git commit -m "feat(engine/ask-question): 集成问答卡片到播放引擎和剧本数据"
```

---

## Task 5: 调试与视觉校验

**Files:**
- 可能微调 `styles/ask-question.css`
- 可能微调 `engine/ask-question.js`

**Step 1: 启动本地服务器**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080
```

打开 `http://localhost:8080`，观察自动播放。

**Step 2: 验证问答卡片出现**

- 当播放到 `askUser` action 时，composer 应隐藏，问答卡片应出现
- 检查卡片是否在正确位置（phone-shell 底部，与 composer 同位置）

**Step 3: 验证单选交互**

- 点击选项 → 选中，其他取消，右侧出现 ✓
- 非最后一题 → 自动前进
- 最后一题 → 不自动前进，按钮变"提交"
- 输入文字 → 选项清空
- 点击已选中项 → 取消选中

**Step 4: 验证多选交互**

- 点击选项 → toggle，右侧复选框切换
- 输入文字 → 选项不清空
- 有选中 → 按钮变"下一步"/"提交"
- 全部取消 → 按钮回"跳过"

**Step 5: 验证排序交互**

- 长按拖拽手柄 → 可拖动调整顺序
- 序号随位置更新
- 按钮始终为"下一步"/"提交"

**Step 6: 验证导航**

- 左右箭头切题，状态保留
- 关闭按钮退出并提交

**Step 7: 验证提交后恢复**

- 提交后问答卡片消失，composer 恢复，播放继续

**Step 8: 修复发现的问题，提交**

```bash
git add -u
git commit -m "fix(ui/ask-question): 修复杂交卡片视觉和交互细节"
```

---

## Task 6: 版本圆点颜色变更 + 最终提交

**Files:**
- Modify: `styles/base.css` (版本圆点颜色)

**Step 1: 更新版本圆点颜色**

在 `styles/base.css` 中搜索 `=== VERSION DOT`，将 `.status-version-dot` 的 `background` 改为一种新颜色。

**Step 2: 最终提交**

```bash
git add styles/base.css
git commit -m "chore(ui/status-bar): 更新版本指示圆点颜色"
```
