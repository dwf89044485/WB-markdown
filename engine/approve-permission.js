// ============================================================
// APPROVE PERMISSION — 批准权限卡片 · 渲染 · 交互 · 状态管理
// ============================================================

// ── 会话状态 ─────────────────────────────────
let apState = null;  // { data, resolve }

// ── HTML 生成 ─────────────────────────────────
function renderApCard(data, options = {}) {
  const { mode = 'live' } = options;
  const isStatic = mode === 'static';
  const selectedIdx = data.selectedIndex;

  const optionsHtml = data.options.map((opt, i) => {
    const sel = selectedIdx === i;
    const selClass = sel ? ' is-selected' : '';
    return `
      <div class="ap-option${selClass}" data-index="${i}">
        <span class="ap-option-num">${i + 1}</span>
        <span class="ap-option-text">${escapeApHtml(opt)}</span>
      </div>`;
  }).join('');

  return `
    <div class="ap-card${isStatic ? ' ap-static' : ''}">
      <div class="ap-head">
        <div class="ap-title">${escapeApHtml(data.title)}</div>
        <div class="ap-warning-line">${escapeApHtml(data.warning)}</div>
      </div>
      <div class="ap-desc-wrap">
        <div class="ap-desc-line">${escapeApHtml(data.description)}</div>
      </div>
      <div class="ap-options">${optionsHtml}</div>
    </div>`;
}

function escapeApHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── 渲染 ─────────────────────────────────
function renderApprovePermission() {
  if (!apState) return;
  const container = document.getElementById('approvePermission');
  if (!container) return;
  container.innerHTML = renderApCard(apState.data);
}

// ── 显示/隐藏 ─────────────────────────────────
function showApprovePermission(data) {
  return new Promise((resolve) => {
    apState = { data, resolve };

    const apEl = document.getElementById('approvePermission');
    if (apEl) {
      apEl.classList.remove('ap-settled');
      apEl.style.pointerEvents = ''; // 重置点击锁定（上次交互可能遗留）
    }

    renderApprovePermission();

    if (apEl) {
      apEl.classList.add('is-active');

      // 将上下按钮顶到卡片上方
      const apH = apEl.offsetHeight;
      const composerEl = document.querySelector('.composer');
      const composerH = composerEl ? composerEl.offsetHeight : 78;
      const offset = apH - composerH + 10;
      const scrollDown = document.getElementById('scrollDown');
      const scrollUp = document.getElementById('scrollUp');
      if (scrollDown) scrollDown.style.bottom = offset + 'px';
      if (scrollUp) scrollUp.style.bottom = (offset + 36 + 8) + 'px';

      // 两次 rAF 触发入场动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const card = apEl.querySelector('.ap-card');
          if (card) card.classList.add('ap-entering');

          setTimeout(() => {
            if (apEl) apEl.classList.add('ap-settled');
          }, 330);
        });
      });
    }
  });
}

function hideApprovePermission(immediate) {
  const apEl = document.getElementById('approvePermission');
  if (!apEl) {
    if (apState && apState.resolve) apState.resolve(apState.data.selectedIndex);
    apState = null;
    return;
  }

  const card = apEl.querySelector('.ap-card');
  if (!card || immediate) {
    // 立即隐藏：跳过出场动画
    if (card) card.classList.remove('ap-entering', 'ap-leaving');
    apEl.classList.remove('is-active', 'ap-settled');
    const scrollDown = document.getElementById('scrollDown');
    const scrollUp = document.getElementById('scrollUp');
    if (scrollDown) scrollDown.style.bottom = '';
    if (scrollUp) scrollUp.style.bottom = '';
    if (apState && apState.resolve) apState.resolve(apState.data.selectedIndex);
    apState = null;
    return;
  }

  // 播出场动画再隐藏
  card.classList.remove('ap-entering');
  card.classList.add('ap-leaving');
  const scrollDown = document.getElementById('scrollDown');
  const scrollUp = document.getElementById('scrollUp');
  if (scrollDown) scrollDown.style.bottom = '';
  if (scrollUp) scrollUp.style.bottom = '';

  setTimeout(() => {
    apEl.classList.remove('is-active', 'ap-settled');
    card.classList.remove('ap-leaving');
    if (apState && apState.resolve) apState.resolve(apState.data.selectedIndex);
    apState = null;
  }, 260);
}

// ── 事件绑定 ─────────────────────────────────
function bindApprovePermissionEvents() {
  const container = document.getElementById('approvePermission');
  if (!container) return;

  container.addEventListener('click', (e) => {
    if (!apState) return;

    const row = e.target.closest('.ap-option');
    if (!row) return;

    const index = parseInt(row.dataset.index);
    apState.data.selectedIndex = index;
    renderApprovePermission();

    // 锁定点击，防止重复操作
    container.style.pointerEvents = 'none';

    // 停留 300ms 让用户感知选中状态，再开始出场动画
    // 与 ask-question 单选自动前进的停留时间一致
    setTimeout(() => {
      if (!apState) return;
      hideApprovePermission();
    }, 300);
  });
}

// ── 静态快照渲染（供右侧文档面板用）─────────────
function renderStaticApprovePermission(data) {
  return renderApCard(data, { mode: 'static' });
}

/**
 * 外部导航 API：供 feature-jump.js 锚点跳转后程序化控制。
 * approve-permission 只有一步操作，定义此函数保持接口一致。
 */
function navigateToPermission() {
  // no-op: 审批卡只有一步，无需翻题
}

import { registerOverlayCleanup } from './overlay-registry.js';
// 注册清理函数，新增面板类型只需在本模块注册自己的 hideXxx
registerOverlayCleanup(hideApprovePermission);

export { showApprovePermission, hideApprovePermission, bindApprovePermissionEvents, renderStaticApprovePermission, navigateToPermission };
