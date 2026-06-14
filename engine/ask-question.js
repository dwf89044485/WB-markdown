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
// 成熟交互模式：
//   1. pointerdown → 将 dragEl 移到容器末尾 + absolute 脱流，用 top 定位起始位置
//   2. pointermove → 用 transform:translate(offsetX, offsetY) 跟随手指
//   3. 其他选项根据拖拽位置用 translateY(±height) 弹性让位
//   4. pointerup → 清除所有 transform → 一次性 DOM 重排 → 更新数据源
let dragBound = false;

function initDragSort() {
  if (dragBound) return;
  const container = document.getElementById('aqOptions');
  if (!container) return;
  dragBound = true;

  // 拖拽状态
  let dragEl = null;         // 被拖拽的行元素
  let dragOffsetY = 0;       // 指针在行内的 Y 偏移
  let dragHeight = 0;        // 行高（含 gap）
  let dragWidth = 0;         // 行宽
  let originalIndex = -1;    // 拖拽起始索引
  let pointerId = -1;
  let animFrame = null;

  // 拖拽前的兄弟快照（记录初始顺序和位置）
  let siblingSnap = [];      // [{el, isAbove, isToggled}]

  // 获取容器内所有选项行
  function getRows() {
    return [...container.querySelectorAll('.aq-option')];
  }

  // 构建兄弟快照：记录每个非拖拽项的 isAbove 状态
  function buildSiblingSnap(dragIdx) {
    siblingSnap = [];
    const rows = getRows();
    rows.forEach((row, i) => {
      if (row === dragEl) return;
      siblingSnap.push({
        el: row,
        isAbove: i < dragIdx,   // 初始时在拖拽项上方还是下方
        isToggled: false,       // 是否已让位
      });
    });
  }

  // 判断拖拽项中心 Y 是否越过某个兄弟项的中心 Y
  function isDragPastSibling(dragCenterY, sibRect) {
    const sibCenterY = sibRect.top + sibRect.height / 2;
    return dragCenterY > sibCenterY;
  }

  // 更新所有兄弟项的让位状态
  function updateSiblingShifts(dragCenterY) {
    siblingSnap.forEach(snap => {
      const sibRect = snap.el.getBoundingClientRect();
      const pastSib = isDragPastSibling(dragCenterY, sibRect);

      let shouldToggle = false;
      if (snap.isAbove) {
        // 上方项：拖拽项移到它下方时 → 往下让
        shouldToggle = pastSib;
      } else {
        // 下方项：拖拽项移到它上方时 → 往上让
        shouldToggle = !pastSib;
      }

      if (shouldToggle !== snap.isToggled) {
        snap.isToggled = shouldToggle;
        if (shouldToggle) {
          const direction = snap.isAbove ? 1 : -1;
          snap.el.style.transform = `translateY(${direction * dragHeight}px)`;
          snap.el.classList.add('is-shifting');
        } else {
          snap.el.style.transform = '';
          snap.el.classList.remove('is-shifting');
        }
      }
    });
  }

  // 根据 siblingSnap 计算最终目标索引
  function calcTargetIndex() {
    // 统计有多少上方项被 toggle（拖拽项下移了多少）+ 多少下方项被 toggle（上移了多少）
    let toggledAbove = siblingSnap.filter(s => s.isAbove && s.isToggled).length;
    let toggledBelow = siblingSnap.filter(s => !s.isAbove && s.isToggled).length;
    // 原始位置 - 上方让出位数 + 下方让出位数
    const totalOptions = getRows().filter(el => !el.classList.contains('aq-drag-placeholder')).length;
    let targetIdx = originalIndex - toggledAbove + toggledBelow;
    return Math.max(0, Math.min(targetIdx, totalOptions - 1));
  }

  // 提交排序结果
  function commitSort() {
    if (!askState) return;
    const a = askState.answers[askState.stepIndex];
    const rows = getRows().filter(el => !el.classList.contains('aq-drag-placeholder'));
    a.selected = rows.map(el => parseInt(el.dataset.index));
    rows.forEach((row, i) => {
      const num = row.querySelector('.aq-option-num');
      if (num) num.textContent = i + 1;
    });
  }

  // ── pointerdown：长按触发拖拽 ──
  container.addEventListener('pointerdown', (e) => {
    if (!askState) return;
    const q = askState.questions[askState.stepIndex];
    if (q.type !== 'sort') return;

    // 查找拖拽手柄
    let target = e.target;
    let handle = null;
    while (target && target !== container) {
      if (target.classList && target.classList.contains('aq-drag-handle')) {
        handle = target;
        break;
      }
      target = target.parentElement;
    }
    if (!handle) return;

    const row = handle.closest('.aq-option');
    if (!row) return;

    e.preventDefault();

    // 记录拖拽起始信息
    const rows = getRows();
    const dragIdx = rows.indexOf(row);
    const rowRect = row.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    dragEl = row;
    originalIndex = dragIdx;
    dragOffsetY = e.clientY - rowRect.top;
    dragHeight = rowRect.height + 10; // 行高 + gap（--aq-option-gap: 10px）
    dragWidth = rowRect.width;
    pointerId = e.pointerId;

    // 构建兄弟快照（在移到末尾之前）
    buildSiblingSnap(dragIdx);

    // 关键：将 dragEl 移到容器末尾，让它脱离正常文档流位置
    container.appendChild(dragEl);

    // 设置拖拽态：absolute 定位，用 top 跟随手指
    dragEl.classList.add('is-dragging');
    dragEl.style.position = 'absolute';
    dragEl.style.width = dragWidth + 'px';
    dragEl.style.left = '0px';
    dragEl.style.top = (rowRect.top - containerRect.top) + 'px';
    dragEl.style.zIndex = '100';
    dragEl.style.margin = '0';
    dragEl.style.transition = 'none';

    // 让容器高度不变（因为 dragEl 脱流了）
    // 插入一个占位 div 保持高度
    const placeholder = document.createElement('div');
    placeholder.className = 'aq-drag-placeholder';
    placeholder.style.height = (dragHeight - 10) + 'px'; // 减去 gap，因为 placeholder 不参与 gap
    placeholder.style.visibility = 'hidden';
    placeholder.style.flexShrink = '0';
    // 插入到 dragEl 原来的位置（现在 dragEl 在末尾，所以 placeholder 插在末尾-1 的位置不对，
    // 需要在 appendChild(dragEl) 之前记住位置——但 dragEl 已经移到末尾了，
    // 所以直接插在 dragEl 前面即可）
    container.insertBefore(placeholder, dragEl);

    // 使用 setPointerCapture 确保后续事件不丢失
    row.setPointerCapture(e.pointerId);

    // 绑定 pointermove / pointerup
    row.addEventListener('pointermove', onPointerMove);
    row.addEventListener('pointerup', onPointerUp);
    row.addEventListener('pointercancel', onPointerUp);
  });

  // ── pointermove：跟随手指 + 兄弟让位 ──
  function onPointerMove(e) {
    if (!dragEl) return;
    e.preventDefault();

    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = requestAnimationFrame(() => {
      if (!dragEl) return;
      const containerRect = container.getBoundingClientRect();

      // 被拖拽元素跟随手指：top = 指针Y - 容器top - 行内偏移
      const newTop = e.clientY - containerRect.top - dragOffsetY;
      dragEl.style.top = newTop + 'px';
      dragEl.style.transform = ''; // 清除 transform，纯用 top 跟随

      // 用 dragEl 中心 Y 来判断是否越过兄弟项
      const dragRect = dragEl.getBoundingClientRect();
      const dragCenterY = dragRect.top + dragRect.height / 2;

      updateSiblingShifts(dragCenterY);
    });
  }

  // ── pointerup / pointercancel：松手落位 ──
  function onPointerUp(e) {
    if (!dragEl || !askState) return;
    if (e.pointerId !== pointerId) return;

    // 移除临时监听器
    dragEl.removeEventListener('pointermove', onPointerMove);
    dragEl.removeEventListener('pointerup', onPointerUp);
    dragEl.removeEventListener('pointercancel', onPointerUp);

    if (animFrame) cancelAnimationFrame(animFrame);

    // 计算最终目标位置
    const targetIdx = calcTargetIndex();

    // 第一步：清除所有兄弟项的 transform，恢复文档流
    siblingSnap.forEach(snap => {
      snap.el.style.transform = '';
      snap.el.classList.remove('is-shifting');
    });

    // 第二步：移除占位 placeholder
    const placeholder = container.querySelector('.aq-drag-placeholder');
    if (placeholder) placeholder.remove();

    // 第三步：清除拖拽态，恢复正常定位
    dragEl.classList.remove('is-dragging');
    dragEl.style.position = '';
    dragEl.style.width = '';
    dragEl.style.left = '';
    dragEl.style.top = '';
    dragEl.style.transform = '';
    dragEl.style.zIndex = '';
    dragEl.style.margin = '';
    dragEl.style.transition = '';
    try { dragEl.releasePointerCapture(e.pointerId); } catch (_) {}

    // 第四步：一次性 DOM 重排 — 将 dragEl 插到目标位置
    // 注意：dragEl 现在在容器末尾，需要移到 targetIdx 位置
    const currentRows = getRows().filter(el => !el.classList.contains('aq-drag-placeholder'));
    const currentDragIdx = currentRows.indexOf(dragEl);

    if (currentDragIdx !== targetIdx) {
      dragEl.remove();
      const afterRemoval = getRows().filter(el => !el.classList.contains('aq-drag-placeholder'));
      if (targetIdx >= afterRemoval.length) {
        container.appendChild(dragEl);
      } else {
        container.insertBefore(dragEl, afterRemoval[targetIdx]);
      }
    }

    // 第五步：更新数据源和序号
    commitSort();

    // 重置状态
    dragEl = null;
    originalIndex = -1;
    pointerId = -1;
    siblingSnap = [];
  }
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