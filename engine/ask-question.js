// ============================================================
// ASK QUESTION — 问答卡片渲染 · 交互 · 状态管理
// ============================================================

const CHECK_BLACK_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK_WHITE_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const DRAG_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 2.5C4.5 1.9477 4.9477 1.5 5.5 1.5C6.0523 1.5 6.5 1.9477 6.5 2.5C6.5 3.0523 6.0523 3.5 5.5 3.5C4.9477 3.5 4.5 3.0523 4.5 2.5ZM9.5 2.5C9.5 1.9477 9.9477 1.5 10.5 1.5C11.0523 1.5 11.5 1.9477 11.5 2.5C11.5 3.0523 11.0523 3.5 10.5 3.5C9.9477 3.5 9.5 3.0523 9.5 2.5ZM4.5 6.1667C4.5 5.6144 4.9477 5.1667 5.5 5.1667C6.0523 5.1667 6.5 5.6144 6.5 6.1667C6.5 6.719 6.0523 7.1667 5.5 7.1667C4.9477 7.1667 4.5 6.719 4.5 6.1667ZM9.5 6.1667C9.5 5.6144 9.9477 5.1667 10.5 5.1667C11.0523 5.1667 11.5 5.6144 11.5 6.1667C11.5 6.719 11.0523 7.1667 10.5 7.1667C9.9477 7.1667 9.5 6.719 9.5 6.1667ZM4.5 9.8333C4.5 9.281 4.9477 8.8333 5.5 8.8333C6.0523 8.8333 6.5 9.281 6.5 9.8333C6.5 10.3856 6.0523 10.8333 5.5 10.8333C4.9477 10.8333 4.5 10.3856 4.5 9.8333ZM9.5 9.8333C9.5 9.281 9.9477 8.8333 10.5 8.8333C11.0523 8.8333 11.5 9.281 11.5 9.8333C11.5 10.3856 11.0523 10.8333 10.5 10.8333C9.9477 10.8333 9.5 10.3856 9.5 9.8333ZM4.5 13.5C4.5 12.9477 4.9477 12.5 5.5 12.5C6.0523 12.5 6.5 12.9477 6.5 13.5C6.5 14.0523 6.0523 14.5 5.5 14.5C4.9477 14.5 4.5 14.0523 4.5 13.5ZM9.5 13.5C9.5 12.9477 9.9477 12.5 10.5 12.5C11.0523 12.5 11.5 12.9477 11.5 13.5C11.5 14.0523 11.0523 14.5 10.5 14.5C9.9477 14.5 9.5 14.0523 9.5 13.5Z" fill="black"/></svg>';

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

// ── 状态计算函数 ─────────────────────────────────
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

// ── 渲染函数 ─────────────────────────────────
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
    rightHtml = `<div class="aq-option-right"><span class="aq-check-icon">${CHECK_BLACK_SVG}</span></div>`;
  } else if (type === 'multiple') {
    rightHtml = `<div class="aq-option-right"><span class="aq-checkbox">${isSelected ? CHECK_WHITE_SVG : ''}</span></div>`;
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

// ── 事件处理函数 ─────────────────────────────────
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
  if (q.type === 'single' && a.selected !== null) {
    a.selected = null;
    // 轻量更新：只移除选项行的选中态，不全量重渲染
    const container = document.getElementById('aqOptions');
    if (container) container.querySelectorAll('.aq-option.is-selected').forEach(row => {
      row.classList.remove('is-selected');
      const num = row.querySelector('.aq-option-num');
      if (num) num.style.fontWeight = '';
      const txt = row.querySelector('.aq-option-text');
      if (txt) txt.style.fontWeight = '';
      // 移除单选 ✓ 图标
      const icon = row.querySelector('.aq-check-icon');
      if (icon) icon.parentElement.remove();
    });
  }
  updateActionButton();
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

// ── 排序拖拽 ─────────────────────────────────
let dragBound = false;

function initDragSort() {
  if (dragBound) return;
  const container = document.getElementById('aqOptions');
  if (!container) return;
  dragBound = true;

  let dragEl = null;

  container.addEventListener('pointerdown', (e) => {
    if (!askState) return;
    const q = askState.questions[askState.stepIndex];
    if (q.type !== 'sort') return;

    const handle = e.target.closest('.aq-drag-handle, .aq-option-right');
    if (!handle) return;

    const row = handle.closest('.aq-option');
    if (!row) return;

    e.preventDefault();
    dragEl = row;
    row.classList.add('is-dragging');
    row.setPointerCapture(e.pointerId);
  });

  container.addEventListener('pointermove', (e) => {
    if (!dragEl) return;
    e.preventDefault();

    const siblings = [...container.querySelectorAll('.aq-option:not(.is-dragging)')];
    const dragRect = dragEl.getBoundingClientRect();
    const dragMidY = dragRect.top + dragRect.height / 2;

    let insertBefore = null;
    for (const sibling of siblings) {
      const sibRect = sibling.getBoundingClientRect();
      const sibMidY = sibRect.top + sibRect.height / 2;
      if (dragMidY < sibMidY) {
        insertBefore = sibling;
        break;
      }
    }

    if (insertBefore) {
      container.insertBefore(dragEl, insertBefore);
    } else {
      // 拖到末尾
      container.appendChild(dragEl);
    }
  });

  container.addEventListener('pointerup', () => {
    if (!dragEl || !askState) return;
    dragEl.classList.remove('is-dragging');

    // 从 DOM 顺序更新 answer.selected
    const a = askState.answers[askState.stepIndex];
    a.selected = [...container.querySelectorAll('.aq-option')].map(el => parseInt(el.dataset.index));

    // 更新序号显示
    container.querySelectorAll('.aq-option').forEach((row, i) => {
      row.querySelector('.aq-option-num').textContent = i + 1;
    });

    dragEl = null;
  });
}

// ── 显示/隐藏 ─────────────────────────────────
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