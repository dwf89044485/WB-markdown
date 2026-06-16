// ============================================================
// ASK QUESTION — 问答卡片渲染 · 交互 · 状态管理
// ============================================================

const CHECK_BLACK_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK_WHITE_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const DRAG_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 2.5C4.5 1.9477 4.9477 1.5 5.5 1.5C6.0523 1.5 6.5 1.9477 6.5 2.5C6.5 3.0523 6.0523 3.5 5.5 3.5C4.9477 3.5 4.5 3.0523 4.5 2.5ZM9.5 2.5C9.5 1.9477 9.9477 1.5 10.5 1.5C11.0523 1.5 11.5 1.9477 11.5 2.5C11.5 3.0523 11.0523 3.5 10.5 3.5C9.9477 3.5 9.5 3.0523 9.5 2.5ZM4.5 6.1667C4.5 5.6144 4.9477 5.1667 5.5 5.1667C6.0523 5.1667 6.5 5.6144 6.5 6.1667C6.5 6.719 6.0523 7.1667 5.5 7.1667C4.9477 7.1667 4.5 6.719 4.5 6.1667ZM9.5 6.1667C9.5 5.6144 9.9477 5.1667 10.5 5.1667C11.0523 5.1667 11.5 5.6144 11.5 6.1667C11.5 6.719 11.0523 7.1667 10.5 7.1667C9.9477 7.1667 9.5 6.719 9.5 6.1667ZM4.5 9.8333C4.5 9.281 4.9477 8.8333 5.5 8.8333C6.0523 8.8333 6.5 9.281 6.5 9.8333C6.5 10.3856 6.0523 10.8333 5.5 10.8333C4.9477 10.8333 4.5 10.3856 4.5 9.8333ZM9.5 9.8333C9.5 9.281 9.9477 8.8333 10.5 8.8333C11.0523 8.8333 11.5 9.281 11.5 9.8333C11.5 10.3856 11.0523 10.8333 10.5 10.8333C9.9477 10.8333 9.5 10.3856 9.5 9.8333ZM4.5 13.5C4.5 12.9477 4.9477 12.5 5.5 12.5C6.0523 12.5 6.5 12.9477 6.5 13.5C6.5 14.0523 6.0523 14.5 5.5 14.5C4.9477 14.5 4.5 14.0523 4.5 13.5ZM9.5 13.5C9.5 12.9477 9.9477 12.5 10.5 12.5C11.0523 12.5 11.5 12.9477 11.5 13.5C11.5 14.0523 11.0523 14.5 10.5 14.5C9.9477 14.5 9.5 14.0523 9.5 13.5Z" fill="black"/></svg>';

// ── Glass 按钮 HTML 生成器（与 index.html 中 Demo DOM 结构完全一致）─────────
// 核心原则：右侧文档面板的静态快照必须与左侧实际组件的 HTML 结构一致，
// 否则 CSS 类（.glass-btn / .glass-layer）无法生效，导致视觉差异。
// 三层 glass-layer span + SVG（style="position:relative"）= 玻璃质感按钮

const GLYPH_PREV  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative"><path d="M10 4L6 8L10 12" stroke="black" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GLYPH_NEXT  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative"><path d="M6 4L10 8L6 12" stroke="black" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GLYPH_CLOSE = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

const GLASS_LAYERS = '<span class="glass-layer lg-layer-one"></span><span class="glass-layer lg-layer-two"></span><span class="glass-layer-inner lg-layer-three"></span>';

function glassNavBtn(glyph, disabled, opts = {}) {
  const d = disabled ? ' disabled' : '';
  const da = opts.dataAction ? ` data-action="${opts.dataAction}"` : '';
  return `<button class="glass-btn aq-nav-btn"${d}${da} type="button" tabindex="-1">${GLASS_LAYERS}${glyph}</button>`;
}

function glassCloseBtn(opts = {}) {
  const da = opts.dataAction ? ` data-action="${opts.dataAction}"` : '';
  return `<button class="glass-btn aq-close-btn"${da} type="button" tabindex="-1">${GLASS_LAYERS}${GLYPH_CLOSE}</button>`;
}

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
// 左侧 Demo：注入完整 HTML 到 #askQuestion 容器，并恢复交互状态
function renderAskQuestion() {
  if (!askState) return;
  const { questions, answers, stepIndex } = askState;
  const q = questions[stepIndex];

  const container = document.getElementById('askQuestion');
  if (!container) return;

  // 生成完整 HTML 并注入
  container.innerHTML = renderAskQuestionHTML(questions, stepIndex, answers, { mode: 'live' });

  // 排序题：初始化 SortableJS；非排序题：销毁实例
  if (q.type === 'sort') {
    initDragSort();
  } else if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

function escapeAQHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── 选项行 HTML（字符串生成，左右两侧共用）──────
function createOptionRowHTML(index, text, displayNum, type, isSelected, isDragging = false, showHint = false) {
  const selClass = isSelected ? ' is-selected' : '';
  const sortClass = type === 'sort' ? ' is-sort' : '';
  const dragClass = isDragging ? ' is-dragging' : '';
  const hintClass = showHint && type === 'sort' ? ' aq-sort-hint' : '';

  const hintPopHtml = showHint && type === 'sort'
    ? '<span class="aq-sort-hint-pop">按住拖动排序</span>'
    : '';
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

  return `
    <div class="aq-option${selClass}${sortClass}${dragClass}${hintClass}" data-index="${index}">
      <div class="aq-option-left">
        <span class="aq-option-num">${displayNum}</span>
        <span class="aq-option-text">${escapeAQHtml(text)}</span>
      </div>
      ${rightHtml}
      ${hintPopHtml}
    </div>`;
}

// ── 统一渲染函数（左右两侧共用）───────────────
// mode: 'live' → 生成带 id 属性的交互 HTML（注入到 #askQuestion 容器）
// mode: 'static' → 生成纯静态快照 HTML（无 id，无 data-action，disabled 按钮）
function renderAskQuestionHTML(questions, stepIndex, answers, options = {}) {
  const { mode = 'live', hideHeader = false, hideInput = false, dragging = false, showHint = false } = options;
  const isStatic = mode === 'static';
  const q = questions[stepIndex];
  const a = answers[stepIndex];
  const total = questions.length;

  // ── badge ──
  let badgeLabel = '';
  if (q.type === 'single') badgeLabel = '单选';
  else if (q.type === 'multiple') badgeLabel = '多选';
  else if (q.type === 'sort') badgeLabel = '排序';

  // ── 选项 ──
  let optionsHtml = '';
  if (q.type === 'sort') {
    a.selected.forEach((optIdx, posIdx) => {
      const isDragging = dragging && posIdx === 0;  // 模拟拖拽中第一个选项
      const hasHint = showHint && posIdx === 1;  // 模拟新手指引
      optionsHtml += createOptionRowHTML(optIdx, q.options[optIdx], posIdx + 1, q.type, false, isDragging, hasHint);
    });
  } else {
    q.options.forEach((opt, i) => {
      const sel = q.type === 'single' ? a.selected === i : a.selected.includes(i);
      optionsHtml += createOptionRowHTML(i, opt, i + 1, q.type, sel);
    });
  }

  // ── 按钮状态 ──
  const buttonLabel = getButtonLabel(stepIndex, total, q, a);
  const buttonClass = buttonLabel === '跳过' ? 'is-skip' : 'is-action';
  const stepText = `${stepIndex + 1} / ${total}`;
  const prevDisabled = stepIndex <= 0;
  const nextDisabled = stepIndex >= total - 1;

  // ── ID 属性：live 模式需要，static 模式不需要 ──
  const id = (liveAttr) => isStatic ? '' : liveAttr;

  // ── header ──
  const headerHtml = hideHeader ? '' : `
    <div class="aq-header">
      <div class="aq-nav">
        ${glassNavBtn(GLYPH_PREV, prevDisabled, { dataAction: isStatic ? '' : 'aq-prev' })}
        <span class="aq-step-indicator"${id(' id="aqStep"')}>${stepText}</span>
        ${glassNavBtn(GLYPH_NEXT, nextDisabled, { dataAction: isStatic ? '' : 'aq-next' })}
      </div>
      ${glassCloseBtn({ dataAction: isStatic ? '' : 'aq-close' })}
    </div>`;

  // ── 问题区 ──
  const questionAreaHtml = `
    <div class="aq-question-area"${id(' id="aqQuestionArea"')}>
      <span class="aq-badge">${badgeLabel}</span>
      <span class="aq-question-text">${escapeAQHtml(q.question)}</span>
    </div>`;

  // ── 选项列表 ──
  const optionsContainerHtml = `
    <div class="aq-options"${id(' id="aqOptions"')}>${optionsHtml}</div>`;

  // ── 输入栏 ──
  const placeholderText = q.type === 'single'
    ? '以上都不是，我来告诉你'
    : '我来额外补充说明';

  const inputHtml = hideInput ? '' : `
    <div class="aq-input-bar">
      <input class="aq-input-field"${id(' id="aqInput"')} type="text" autocomplete="off" value="${escapeAttr(a.customInput)}" placeholder="${escapeAttr(placeholderText)}"${isStatic ? ' readonly tabindex="-1"' : ''}>
      <button class="aq-action-btn ${buttonClass}"${id(' id="aqAction"')} type="button"${isStatic ? ' tabindex="-1"' : ''}${isStatic ? '' : ' data-action="aq-action"'}>${buttonLabel}</button>
    </div>`;

  return `
    <div class="ask-question-card${isStatic ? ' aq-static' : ''}">
      ${headerHtml}
      ${questionAreaHtml}
      ${optionsContainerHtml}
      ${inputHtml}
    </div>`;
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

// ── 静态快照渲染（供右侧文档面板用）─────────────
// 统一走 renderAskQuestionHTML，保证 HTML 结构与左侧 Demo 完全一致
function renderStaticAskQuestion(questions, stepIndex, answers, options = {}) {
  return renderAskQuestionHTML(questions, stepIndex, answers, { mode: 'static', ...options });
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
    // 需要重渲染以取消选项选中态（会重置光标位置，但这是用户触发的即时反馈）
    renderAskQuestion();
  } else {
    // 轻量更新：仅按钮文案/样式可能变化
    updateActionButton();
  }
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
let sortHintActive = false;    // 提示循环是否运行中

function startSortHint() {
  clearSortHint();
  const container = document.getElementById('aqOptions');
  if (!container) return;
  sortHintActive = true;
  // 首次1.5s，后续2s
  const delay = sortHintFirstShow ? 1500 : 2000;
  sortHintTimer = setTimeout(() => {
    if (!sortHintActive) return;  // 循环已被终止，不再显示
    showSortHint();
  }, delay);
}

function showSortHint() {
  if (!sortHintActive) return;  // 循环已被终止
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
      if (!sortHintActive) return;  // 循环已被终止，不再继续
      sortHintTimer = setTimeout(() => {
        if (!sortHintActive) return;
        showSortHint();
      }, 2000);
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
  sortHintActive = false;  // 停止循环
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
      clearSortHint();               // 拖拽开始时立即清除提示，且不再重启（用户已学会）
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
function showAskQuestion(questions, silent) {
  return new Promise((resolve) => {
    askState = resetAskState(questions);
    askState.resolve = resolve;

    // 隐藏 composer，显示问答卡片
    const composer = document.querySelector('.composer');
    const askEl = document.getElementById('askQuestion');
    if (composer) composer.style.display = 'none';
    if (askEl) {
      askEl.classList.remove('aq-settled'); // 清除旧标记，让入场动画可播
      askEl.classList.add('is-active');
    }

    renderAskQuestion(); // 内部会处理 sortable 初始化

    // 首次渲染后标记 settled，后续重渲染不再播入场动画
    if (askEl) askEl.classList.add('aq-settled');

    // silent 模式：立即 resolve，不阻塞调用者（供 feature-jump 锚点跳转使用）
    if (silent) resolve();
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
  if (askEl) {
    askEl.classList.remove('is-active', 'aq-settled');
  }

  askState = null;
}

// 绑定事件（使用事件委托，绑定在容器上，不因 innerHTML 替换而丢失）
function bindAskQuestionEvents() {
  const container = document.getElementById('askQuestion');
  if (!container) return;

  // ── click 委托 ──
  container.addEventListener('click', (e) => {
    if (!askState) return;

    // 选项点击
    const row = e.target.closest('.aq-option');
    if (row) {
      const q = askState.questions[askState.stepIndex];
      if (q.type === 'sort') return;
      onOptionClick(parseInt(row.dataset.index));
      return;
    }

    // data-action 按钮
    const actionEl = e.target.closest('[data-action]');
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    if (action === 'aq-prev')       goToStep(askState.stepIndex - 1);
    else if (action === 'aq-next')  goToStep(askState.stepIndex + 1);
    else if (action === 'aq-close') onCloseAsk();
    else if (action === 'aq-action')onActionClick();
  });

  // ── input 委托 ──
  container.addEventListener('input', (e) => {
    if (!askState) return;
    if (e.target.matches('#aqInput, .aq-input-field')) {
      onInputChange(e.target.value);
    }
  });

  // ── 排序题拖拽提示：手指/鼠标触碰选项时立刻清除 ──
  container.addEventListener('touchstart', (e) => {
    if (!askState) return;
    const q = askState.questions[askState.stepIndex];
    if (q.type !== 'sort') return;
    if (e.target.closest('.aq-option')) clearSortHint();
  }, { passive: true });

  container.addEventListener('mousedown', (e) => {
    if (!askState) return;
    const q = askState.questions[askState.stepIndex];
    if (q.type !== 'sort') return;
    if (e.target.closest('.aq-option')) clearSortHint();
  });
}

/**
 * 外部翻题 API：供 feature-jump.js 锚点跳转后程序化导航到指定题目。
 * 封装 module-private 的 goToStep(index)。
 * @param {number} index 目标 question 索引（0-based）
 */
function navigateToQuestion(index) {
  goToStep(index);
}

export { showAskQuestion, hideAskQuestion, bindAskQuestionEvents, renderStaticAskQuestion, navigateToQuestion };