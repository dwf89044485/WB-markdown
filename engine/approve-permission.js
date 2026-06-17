// ============================================================
// APPROVE PERMISSION — 批准权限卡片 · 渲染 · 交互 · 状态管理
// ============================================================

// 选中 radio 用的小勾 SVG
const RADIO_CHECK_SVG = '<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="4" cy="4" r="4" fill="white"/></svg>';

// 警告图标 SVG
const WARNING_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 1L14.9282 13.75H1.0718L8 1Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M8 5.5V9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11.5" r="0.8" fill="currentColor"/></svg>';

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
        <div class="ap-option-left">
          <span class="ap-option-num">${i + 1}</span>
          <span class="ap-option-text">${escapeApHtml(opt)}</span>
        </div>
        <div class="ap-option-right">
          <span class="ap-radio-circle"><span class="ap-radio-dot"></span></span>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="ap-card${isStatic ? ' ap-static' : ''}">
      <div class="ap-title">${escapeApHtml(data.title)}</div>
      <div class="ap-warning">
        <span class="ap-warning-icon">${WARNING_SVG}</span>
        <div class="ap-warning-content">
          <div class="ap-warning-label">${escapeApHtml(data.warning)}</div>
          <div class="ap-warning-text">${escapeApHtml(data.description)}</div>
        </div>
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

    // 隐藏 composer，显示权限卡片
    const composer = document.querySelector('.composer');
    const apEl = document.getElementById('approvePermission');
    if (composer) composer.style.display = 'none';
    if (apEl) {
      apEl.classList.remove('ap-settled');
      apEl.classList.add('is-active');
    }

    renderApprovePermission();

    if (apEl) apEl.classList.add('ap-settled');
  });
}

function hideApprovePermission() {
  const composer = document.querySelector('.composer');
  const apEl = document.getElementById('approvePermission');
  if (composer) composer.style.display = '';
  if (apEl) {
    apEl.classList.remove('is-active', 'ap-settled');
  }

  // 如果还有 pending 的 resolve，自动 resolve
  if (apState && apState.resolve) {
    apState.resolve(apState.data.selectedIndex);
  }
  apState = null;
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
    // 更新选中状态
    apState.data.selectedIndex = index;
    renderApprovePermission();

    // 任何选项点击后立即 resolve（用户的描述：不管点任何选项都进入下一个节点）
    const resolve = apState.resolve;
    const resultIdx = apState.data.selectedIndex;
    hideApprovePermission();
    if (resolve) resolve(resultIdx);
  });
}

// ── 静态快照渲染（供右侧文档面板用）─────────────
function renderStaticApprovePermission(data) {
  return renderApCard(data, { mode: 'static' });
}

export { showApprovePermission, hideApprovePermission, bindApprovePermissionEvents, renderStaticApprovePermission };
