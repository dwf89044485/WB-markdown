// ============================================================
// ASK QUESTION — 问答卡片渲染 · 交互 · 状态管理
// ============================================================

const CHECK_BLACK_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK_WHITE_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const DRAG_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 2.5C4.5 1.9477 4.9477 1.5 5.5 1.5C6.0523 1.5 6.5 1.9477 6.5 2.5C6.5 3.0523 6.0523 3.5 5.5 3.5C4.9477 3.5 4.5 3.0523 4.5 2.5ZM9.5 2.5C9.5 1.9477 9.9477 1.5 10.5 1.5C11.0523 1.5 11.5 1.9477 11.5 2.5C11.5 3.0523 11.0523 3.5 10.5 3.5C9.9477 3.5 9.5 3.0523 9.5 2.5ZM4.5 6.1667C4.5 5.6144 4.9477 5.1667 5.5 5.1667C6.0523 5.1667 6.5 5.6144 6.5 6.1667C6.5 6.719 6.0523 7.1667 5.5 7.1667C4.9477 7.1667 4.5 6.719 4.5 6.1667ZM9.5 6.1667C9.5 5.6144 9.9477 5.1667 10.5 5.1667C11.0523 5.1667 11.5 5.6144 11.5 6.1667C11.5 6.719 11.0523 7.1667 10.5 7.1667C9.9477 7.1667 9.5 6.719 9.5 6.1667ZM4.5 9.8333C4.5 9.281 4.9477 8.8333 5.5 8.8333C6.0523 8.8333 6.5 9.281 6.5 9.8333C6.5 10.3856 6.0523 10.8333 5.5 10.8333C4.9477 10.8333 4.5 10.3856 4.5 9.8333ZM9.5 9.8333C9.5 9.281 9.9477 8.8333 10.5 8.8333C11.0523 8.8333 11.5 9.281 11.5 9.8333C11.5 10.3856 11.0523 10.8333 10.5 10.8333C9.9477 10.8333 9.5 10.3856 9.5 9.8333ZM4.5 13.5C4.5 12.9477 4.9477 12.5 5.5 12.5C6.0523 12.5 6.5 12.9477 6.5 13.5C6.5 14.0523 6.0523 14.5 5.5 14.5C4.9477 14.5 4.5 14.0523 4.5 13.5ZM9.5 13.5C9.5 12.9477 9.9477 12.5 10.5 12.5C11.0523 12.5 11.5 12.9477 11.5 13.5C11.5 14.0523 11.0523 14.5 10.5 14.5C9.9477 14.5 9.5 14.0523 9.5 13.5Z" fill="black"/></svg>';

// ── 问答会话状态 ─────────────────────────────────
let askState = null;     // { questions, answers[], stepIndex, resolve }

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

  // 问题区：每个类型都显示对应 badge
  const questionArea = document.getElementById('aqQuestionArea');
  if (questionArea) {
    let badgeLabel = '';
    if (q.type === 'single') badgeLabel = '单选';
    else if (q.type === 'multiple') badgeLabel = '多选';
    else if (q.type === 'sort') badgeLabel = '排序';
    const badgeHtml = `<span class="aq-badge">${badgeLabel}</span>`;
    questionArea.innerHTML = badgeHtml + `<span class="aq-question-text">${escapeAQHtml(q.question)}</span>`;
  }

  // 选项列表
  renderOptions(q, a);

  // 排序题：初始化 SortableJS；非排序题：销毁实例
  if (q.type === 'sort') {
    initDragSort();
  } else if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

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
    // 排序：按 answer.selected 顺序渲染，不使用选中态
    a.selected.forEach((optIdx, posIdx) => {
      container.appendChild(createOptionRow(optIdx, q.options[optIdx], posIdx + 1, q.type, false));
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
  clearSortHint();
  sortHintFirstShow = true;
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

// ── 排序拖拽提示（循环：等2秒 → 显示3秒 → 消失 → 等2秒 → …）──────
let sortHintTimer = null;     // 等待/触发定时器
let sortHintDismiss = null;   // 自动消失定时器
let sortHintEl = null;        // pop 提示 DOM 元素

let sortHintFirstShow = true;  // 首次显示标志

function startSortHint() {
  clearSortHint();
  const container = document.getElementById('aqOptions');
  if (!container) return;
  // 首次1.5s，后续2s
  const delay = sortHintFirstShow ? 1500 : 2000;
  sortHintTimer = setTimeout(() => {
    showSortHint();
  }, delay);
}

function showSortHint() {
  const container = document.getElementById('aqOptions');
  if (!container) return;
  const rows = container.querySelectorAll('.aq-option.is-sort');
  if (rows.length < 2) return;
  const target = rows[1];
  // 同时添加白底+投影高亮 和 pop 提示
  target.classList.add('aq-sort-hint');
  const pop = document.createElement('div');
  pop.className = 'aq-sort-hint-pop';
  pop.textContent = '拖动可调整顺序';
  target.appendChild(pop);
  sortHintEl = pop;
  // 标记首次已显示
  sortHintFirstShow = false;
  // 3秒后消失（带消失动效），再等2秒循环
  sortHintDismiss = setTimeout(() => {
    hideSortHintWithAnimation(() => {
      sortHintTimer = setTimeout(() => showSortHint(), 2000);
    });
  }, 3000);
}

function hideSortHint() {
  if (sortHintDismiss) { clearTimeout(sortHintDismiss); sortHintDismiss = null; }
  // 移除高亮（带过渡）
  const container = document.getElementById('aqOptions');
  if (container) container.querySelectorAll('.aq-sort-hint').forEach(el => {
    el.classList.add('aq-sort-hint-out');
    el.classList.remove('aq-sort-hint');
  });
  // 移除 pop（带动画）
  if (sortHintEl) {
    sortHintEl.classList.add('aq-sort-hint-pop-out');
    const popRef = sortHintEl;
    setTimeout(() => { if (popRef.parentNode) popRef.parentNode.removeChild(popRef); }, 250);
    sortHintEl = null;
  }
}

function hideSortHintWithAnimation(callback) {
  hideSortHint();
  // 等消失动画完成（250ms）后再回调
  setTimeout(callback, 260);
}

function clearSortHint() {
  if (sortHintTimer) { clearTimeout(sortHintTimer); sortHintTimer = null; }
  if (sortHintDismiss) { clearTimeout(sortHintDismiss); sortHintDismiss = null; }
  sortHintFirstShow = true;
  // 移除高亮及动画残留
  const container = document.getElementById('aqOptions');
  if (container) container.querySelectorAll('.aq-sort-hint, .aq-sort-hint-out').forEach(el => {
    el.classList.remove('aq-sort-hint', 'aq-sort-hint-out');
  });
  // 移除 pop
  if (sortHintEl && sortHintEl.parentNode) { sortHintEl.parentNode.removeChild(sortHintEl); }
  sortHintEl = null;
}

// ── 排序拖拽（SortableJS）─────────────────────────────────
let sortableInstance = null;  // SortableJS 实例

function initDragSort() {
  const container = document.getElementById('aqOptions');
  if (!container || typeof Sortable === 'undefined') return;

  // 如果已有实例，先销毁
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }

  sortableInstance = Sortable.create(container, {
    animation: 200,                   // 松手落位动画时长 ms
    easing: 'cubic-bezier(0.2, 0, 0, 1)',
    ghostClass: 'aq-sort-ghost',     // 原位占位样式（完全隐藏）
    chosenClass: 'aq-sort-chosen',   // 被选中（按下）的原始行样式
    forceFallback: true,             // 用克隆元素跟随手指，可完全控制样式
    fallbackClass: 'aq-sort-fallback', // 克隆元素的 class
    fallbackOnBody: true,            // 克隆挂到 body
    fallbackTolerance: 3,            // 拖动 3px 后才开始，防止误触
    direction: 'vertical',           // 只允许纵向排序
    fallbackAxis: 'y',               // 锁定 X 轴：克隆元素只能纵向移动
    fallbackBounds: function() {     // 限制 Y 轴：克隆元素不得超出选项容器矩形
      return container.getBoundingClientRect();
    },
    onStart: function() {
      clearSortHint();               // 拖拽开始时立即清除提示
    },
    onEnd: function() {
      commitSortFromDOM();
    },
  });

  // 启动3秒提示定时器
  startSortHint();
}



// 从 DOM 顺序同步回数据源
function commitSortFromDOM() {
  if (!askState) return;
  const a = askState.answers[askState.stepIndex];
  const container = document.getElementById('aqOptions');
  if (!container) return;
  const rows = [...container.querySelectorAll('.aq-option')];
  a.selected = rows.map(el => parseInt(el.dataset.index));
  // 更新序号显示
  rows.forEach((row, i) => {
    const num = row.querySelector('.aq-option-num');
    if (num) num.textContent = i + 1;
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
  // 销毁 SortableJS 实例
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
  clearSortHint();

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