// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// ASK QUESTION — 问答卡片渲染 · 交互 · 状态管理
// ============================================================

const CHECK_BLACK_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHECK_WHITE_SVG = '<svg width="11.85" height="7.82" viewBox="0 0 12 8" fill="none"><path d="M1 3.5L4.5 7L11 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const DRAG_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 2.5C4.5 1.9477 4.9477 1.5 5.5 1.5C6.0523 1.5 6.5 1.9477 6.5 2.5C6.5 3.0523 6.0523 3.5 5.5 3.5C4.9477 3.5 4.5 3.0523 4.5 2.5ZM9.5 2.5C9.5 1.9477 9.9477 1.5 10.5 1.5C11.0523 1.5 11.5 1.9477 11.5 2.5C11.5 3.0523 11.0523 3.5 10.5 3.5C9.9477 3.5 9.5 3.0523 9.5 2.5ZM4.5 6.1667C4.5 5.6144 4.9477 5.1667 5.5 5.1667C6.0523 5.1667 6.5 5.6144 6.5 6.1667C6.5 6.719 6.0523 7.1667 5.5 7.1667C4.9477 7.1667 4.5 6.719 4.5 6.1667ZM9.5 6.1667C9.5 5.6144 9.9477 5.1667 10.5 5.1667C11.0523 5.1667 11.5 5.6144 11.5 6.1667C11.5 6.719 11.0523 7.1667 10.5 7.1667C9.9477 7.1667 9.5 6.719 9.5 6.1667ZM4.5 9.8333C4.5 9.281 4.9477 8.8333 5.5 8.8333C6.0523 8.8333 6.5 9.281 6.5 9.8333C6.5 10.3856 6.0523 10.8333 5.5 10.8333C4.9477 10.8333 4.5 10.3856 4.5 9.8333ZM9.5 9.8333C9.5 9.281 9.9477 8.8333 10.5 8.8333C11.0523 8.8333 11.5 9.281 11.5 9.8333C11.5 10.3856 11.0523 10.8333 10.5 10.8333C9.9477 10.8333 9.5 10.3856 9.5 9.8333ZM4.5 13.5C4.5 12.9477 4.9477 12.5 5.5 12.5C6.0523 12.5 6.5 12.9477 6.5 13.5C6.5 14.0523 6.0523 14.5 5.5 14.5C4.9477 14.5 4.5 14.0523 4.5 13.5ZM9.5 13.5C9.5 12.9477 9.9477 12.5 10.5 12.5C11.0523 12.5 11.5 12.9477 11.5 13.5C11.5 14.0523 11.0523 14.5 10.5 14.5C9.9477 14.5 9.5 14.0523 9.5 13.5Z" fill="currentColor"/></svg>';

// ── 输入栏图标（voice / next / sent）─────────────
const VOICE_SVG = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#F2F2F2"/><path fill-rule="evenodd" clip-rule="evenodd" d="M21.3 27.7843C22.7604 26.6137 23.9016 25.1909 24.7238 23.5158C25.5747 21.7824 26.0001 19.9437 26 17.9997C26.0001 16.0559 25.5748 14.2173 24.7241 12.4841C23.9021 10.8091 22.7611 9.38639 21.301 8.21581C21.0809 8.02872 20.8278 7.95508 20.5417 7.9949C20.2537 8.01825 20.0226 8.14517 19.8484 8.37566C19.6614 8.59575 19.5877 8.84887 19.6275 9.13502C19.6509 9.42296 19.7778 9.65401 20.0083 9.82815C21.2287 10.8066 22.1823 11.9954 22.8689 13.3945C23.5787 14.8406 23.9335 16.3757 23.9334 17.9997C23.9335 19.6238 23.5786 21.1589 22.8687 22.6051C22.1819 24.0045 21.2281 25.1933 20.0075 26.1717C19.777 26.3459 19.6501 26.5769 19.6267 26.8648C19.5868 27.151 19.6604 27.4041 19.8475 27.6242C20.0216 27.8548 20.2526 27.9817 20.5405 28.0051C20.8267 28.045 21.0798 27.9714 21.3 27.7843ZM18.4767 21.17C17.9703 22.1261 17.2746 22.9169 16.3894 23.5424C16.1584 23.7159 15.9013 23.774 15.6181 23.7169C15.3321 23.6762 15.1091 23.5355 14.9492 23.2948C14.7758 23.0638 14.7177 22.8067 14.7748 22.5235C14.8155 22.2375 14.9562 22.0145 15.1968 21.8547C15.8134 21.419 16.2979 20.8684 16.6504 20.2028C17.0138 19.5166 17.1955 18.782 17.1955 17.9992C17.1955 17.1995 17.0063 16.4509 16.6279 15.7535C16.2607 15.0768 15.7577 14.5222 15.1189 14.0897C14.8751 13.9347 14.73 13.7147 14.6836 13.4296C14.6208 13.1475 14.6738 12.8893 14.8426 12.6548C14.9976 12.411 15.2176 12.2659 15.5028 12.2195C15.7848 12.1567 16.043 12.2097 16.2775 12.3785C17.1946 12.9994 17.9169 13.7959 18.4443 14.768C18.9895 15.7727 19.2621 16.8497 19.2621 17.9992C19.2621 19.1243 19.0003 20.1813 18.4767 21.17ZM11.5499 19.5494C11.9779 19.5494 12.3432 19.3981 12.6459 19.0955C12.9485 18.7928 13.0999 18.4275 13.0999 17.9995C13.0999 17.5715 12.9485 17.2061 12.6459 16.9035C12.3432 16.6008 11.9779 16.4495 11.5499 16.4495C11.1219 16.4495 10.7566 16.6008 10.4539 16.9035C10.1513 17.2061 10 17.5715 10 17.9995C10 18.4275 10.1513 18.7928 10.4539 19.0955C10.7566 19.3981 11.1219 19.5494 11.5499 19.5494Z" fill="black"/></svg>';
const SENT_SVG = '<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M18 0C27.9411 0 36 8.05887 36 18C36 27.9411 27.9411 36 18 36C8.05887 36 0 27.9411 0 18C9.27729e-07 8.05888 8.05888 9.27792e-07 18 0ZM18.8209 9.04221C18.5025 8.33488 17.4976 8.3349 17.1791 9.04221L10.8756 23.0502C10.5359 23.806 11.3121 24.5806 12.0674 24.2393L17.6291 21.7256C17.8647 21.6192 18.1353 21.6192 18.3709 21.7256L23.9326 24.2393C24.6879 24.5806 25.4635 23.8061 25.1235 23.0502L18.8209 9.04221Z" fill="#3D3D3D"/></svg>';
const NEXT_SVG = '<svg width="37" height="36" viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36.6858" height="36" rx="18" fill="#3D3D3D"/><path fill-rule="evenodd" clip-rule="evenodd" d="M19.424 12.0757L23.5097 16.1615L23.5291 16.1808C23.9288 16.5805 24.1915 16.863 24.3171 17.0283C24.5627 17.3516 24.6855 17.6755 24.6855 17.9999C24.6855 18.3245 24.5627 18.6484 24.3171 18.9716C24.1915 19.137 23.9288 19.4195 23.5291 19.8191L23.5097 19.8384L19.424 23.9243L18.5755 23.0758L22.6612 18.9899L22.6806 18.9706C22.8182 18.8331 22.9381 18.7096 23.0403 18.6L11.9997 18.6001L11.9997 17.4L23.0403 17.3999C22.9381 17.2904 22.8182 17.1669 22.6806 17.0293L22.6709 17.0197L22.6612 17.01L18.5755 12.9243L19.424 12.0757Z" fill="white"/></svg>';

// ── Glass 按钮 HTML 生成器（与 index.html 中 Demo DOM 结构完全一致）─────────
// 核心原则：右侧文档面板的静态快照必须与左侧实际组件的 HTML 结构一致，
// 否则 CSS 类（.glass-btn / .glass-layer）无法生效，导致视觉差异。
// 三层 glass-layer span + SVG（style="position:relative"）= 玻璃质感按钮

const GLYPH_PREV  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative"><path d="M10 4L6 8L10 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GLYPH_NEXT  = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
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

// ── 切题动画防抖 ──────────────────────────────
let isTransitioning = false;

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

  // 恢复 textarea 高度与对齐状态（innerHTML 替换后丢失）
  autoGrowTextarea();
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
  const dragClass = isDragging ? ' aq-sort-chosen' : '';
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
  const manyClass = q.options.length >= 8 ? ' many-options' : '';
  const optionsContainerHtml = `
    <div class="aq-options${manyClass}"${id(' id="aqOptions"')}>${optionsHtml}</div>`;

  // ── 输入栏 ──
  const placeholderText = q.type === 'single'
    ? '以上都不是，我来告诉你'
    : '我来额外补充说明';

  // ── 按钮内容：图标 / 文字 ──
  const isIconBtn = buttonLabel !== '跳过';
  const btnContent = isIconBtn
    ? (buttonLabel === '提交' ? SENT_SVG : NEXT_SVG)
    : '跳过';
  const btnClass = isIconBtn ? 'is-icon' : 'is-skip';

  const inputHtml = hideInput ? '' : `
    <div class="aq-input-bar">
      <button class="aq-voice-btn" type="button"${isStatic ? ' tabindex="-1"' : ''}>
        ${VOICE_SVG}
      </button>
      <textarea class="aq-input-field"${id(' id="aqInput"')} rows="1" placeholder="${escapeAttr(placeholderText)}"${isStatic ? ' readonly tabindex="-1"' : ''}>${escapeAQHtml(a.customInput)}</textarea>
      <button class="aq-action-btn ${btnClass}"${id(' id="aqAction"')} type="button"${isStatic ? ' tabindex="-1"' : ''}${isStatic ? '' : ' data-action="aq-action"'}>${btnContent}</button>
    </div>`;

  return `
    <div class="ask-question-card${isStatic ? ' aq-static' : ''}">
      ${headerHtml}
      <div class="aq-body">
        ${questionAreaHtml}
        ${optionsContainerHtml}
        ${inputHtml}
      </div>
    </div>`;
}

function updateActionButton() {
  if (!askState) return;
  const { questions, answers, stepIndex } = askState;
  const btn = document.getElementById('aqAction');
  if (!btn) return;

  const label = getButtonLabel(stepIndex, questions.length, questions[stepIndex], answers[stepIndex]);
  if (label === '跳过') {
    btn.textContent = '跳过';
    btn.className = 'aq-action-btn is-skip';
  } else {
    btn.innerHTML = label === '提交' ? SENT_SVG : NEXT_SVG;
    btn.className = 'aq-action-btn is-icon';
  }
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
  autoGrowTextarea();
  if (q.type === 'single' && a.selected !== null) {
    a.selected = null;
    // 需要重渲染以取消选项选中态（会重置光标位置，但这是用户触发的即时反馈）
    renderAskQuestion();
  } else {
    // 轻量更新：仅按钮文案/样式可能变化
    updateActionButton();
  }
}

function autoGrowTextarea() {
  const el = document.getElementById('aqInput');
  if (!el || el.tagName !== 'TEXTAREA') return;
  el.style.height = 'auto';
  const sh = el.scrollHeight;
  el.style.height = Math.min(sh, 200) + 'px';

  // 根据行数切换对齐：单行居中 / 多行按钮底对齐
  const bar = el.closest('.aq-input-bar');
  if (bar) {
    const lineCount = Math.round(sh / 24); // 24 = --aq-line-height
    bar.classList.toggle('aq-bar-multiline', lineCount > 1);
  }
}

function goToStep(index) {
  if (!askState) return;
  if (index < 0 || index >= askState.questions.length) return;
  if (isTransitioning) return;
  if (index === askState.stepIndex) return;

  const direction = index > askState.stepIndex ? 'forward' : 'backward';
  clearSortHint();
  sortHintFirstShow = true;

  const container = document.getElementById('askQuestion');
  const card = container?.querySelector('.ask-question-card');
  const oldBody = card?.querySelector('.aq-body');

  if (!oldBody || !card) {
    askState.stepIndex = index;
    renderAskQuestion();
    return;
  }

  // Generate new body HTML (without changing stepIndex yet)
  const fullHTML = renderAskQuestionHTML(askState.questions, index, askState.answers, { mode: 'live' });
  const temp = document.createElement('div');
  temp.innerHTML = fullHTML;
  const newBodyHTML = temp.querySelector('.aq-body').innerHTML;

  // Update step indicator immediately
  const stepText = `${index + 1} / ${askState.questions.length}`;
  const stepEl = card.querySelector('.aq-step-indicator');
  if (stepEl) stepEl.textContent = stepText;

  isTransitioning = true;
  runSlideTransition(card, newBodyHTML, direction, () => {
    askState.stepIndex = index;
    renderAskQuestion();
    isTransitioning = false;
  });
}

/**
 * 切题滑切动画 —— 全项目唯一实现，左侧 demo 与右侧文档共用。
 *
 * 在给定 card 内，将当前 .aq-body 替换为 .aq-slide-track（旧/新两个 pane），
 * 用 transform 推动 track 完成 300ms ease-out 滑切，结束后调用 onDone()。
 * onDone 通常负责把卡片恢复为单 body 结构。
 *
 * @param {HTMLElement} card        .ask-question-card 容器
 * @param {string}      newBodyHTML 新题 .aq-body 的 innerHTML
 * @param {'forward'|'backward'} direction
 * @param {Function}    onDone      动画结束回调（~320ms 后触发）
 */
function runSlideTransition(card, newBodyHTML, direction, onDone) {
  const oldBody = card.querySelector('.aq-body');
  if (!oldBody) { onDone && onDone(); return; }

  const oldBodyHTML = oldBody.innerHTML;
  const GAP = 40; // pane 间视觉间距，与样式文档保持一致
  const track = document.createElement('div');
  track.className = 'aq-slide-track';

  const makePane = (html) => {
    const pane = document.createElement('div');
    pane.innerHTML = html;
    return pane;
  };

  if (direction === 'forward') {
    const oldPane = makePane(oldBodyHTML);
    const newPane = makePane(newBodyHTML);
    oldPane.style.left = '0';
    newPane.style.left = 'calc(100% + ' + GAP + 'px)';
    track.appendChild(oldPane);
    track.appendChild(newPane);
    track.style.height = oldBody.offsetHeight + 'px';
    oldBody.replaceWith(track);
    void track.offsetHeight; // force reflow
    track.style.transition = 'transform 0.3s ease-out';
    track.style.transform = 'translateX(calc(-100% - ' + GAP + 'px))';
  } else {
    const newPane = makePane(newBodyHTML);
    const oldPane = makePane(oldBodyHTML);
    newPane.style.left = 'calc(-100% - ' + GAP + 'px)';
    oldPane.style.left = '0';
    track.appendChild(newPane);
    track.appendChild(oldPane);
    track.style.height = oldBody.offsetHeight + 'px';
    oldBody.replaceWith(track);
    void track.offsetHeight;
    track.style.transition = 'transform 0.3s ease-out';
    track.style.transform = 'translateX(calc(100% + ' + GAP + 'px))';
  }

  setTimeout(() => { onDone && onDone(); }, 320);
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

    const askEl = document.getElementById('askQuestion');
    if (askEl) {
      askEl.classList.remove('aq-settled');
    }

    // 先把卡片内容 mount 到 DOM
    renderAskQuestion();

    if (askEl) {
      // 让容器变为可见
      askEl.classList.add('is-active');

      // 计算按钮偏移
      const askH = askEl.offsetHeight;
      const composerEl = document.querySelector('.composer');
      const composerH = composerEl ? composerEl.offsetHeight : 78;
      const offset = askH - composerH + 10;
      const scrollDown = document.getElementById('scrollDown');
      const scrollUp = document.getElementById('scrollUp');
      if (scrollDown) scrollDown.style.bottom = offset + 'px';
      if (scrollUp) scrollUp.style.bottom = (offset + 36 + 8) + 'px';

      // 两次 requestAnimationFrame 确保入场动画可播
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const card = askEl.querySelector('.ask-question-card');
          if (card) card.classList.add('aq-entering');

          setTimeout(() => {
            if (askEl) askEl.classList.add('aq-settled');
          }, 330);
        });
      });
    }

    if (silent) resolve();
  });
}

function hideAskQuestion(immediate) {
  // 销毁 SortableJS 实例
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
  clearSortHint();

  const askEl = document.getElementById('askQuestion');
  if (!askEl) { askState = null; return; }

  const card = askEl.querySelector('.ask-question-card');
  if (!card || immediate) {
    // 立即隐藏（无卡片或 immediate=true）：跳过出场动画
    if (card) card.classList.remove('aq-entering', 'aq-leaving');
    askEl.classList.remove('is-active', 'aq-settled');
    const scrollDown = document.getElementById('scrollDown');
    const scrollUp = document.getElementById('scrollUp');
    if (scrollDown) scrollDown.style.bottom = '';
    if (scrollUp) scrollUp.style.bottom = '';
    askState = null;
    return;
  }

  // 播出场动画再隐藏
  card.classList.remove('aq-entering');
  card.classList.add('aq-leaving');
  const scrollDown = document.getElementById('scrollDown');
  const scrollUp = document.getElementById('scrollUp');
  if (scrollDown) scrollDown.style.bottom = '';
  if (scrollUp) scrollUp.style.bottom = '';

  setTimeout(() => {
    askEl.classList.remove('is-active', 'aq-settled');
    card.classList.remove('aq-leaving');
    askState = null;
  }, 260);
}

// 绑定事件（使用事件委托，绑定在容器上，不因 innerHTML 替换而丢失）
let _eventsAlreadyBound = false;
function bindAskQuestionEvents() {
  if (_eventsAlreadyBound) return;
  _eventsAlreadyBound = true;
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

import { registerOverlayCleanup } from './overlay-registry.js';
// 注册清理函数，新增面板类型只需在本模块注册自己的 hideXxx
registerOverlayCleanup(hideAskQuestion);

export { showAskQuestion, hideAskQuestion, bindAskQuestionEvents, renderStaticAskQuestion, renderAskQuestionHTML, runSlideTransition, navigateToQuestion, glassCloseBtn, glassNavBtn, GLYPH_PREV };