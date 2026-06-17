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
      <div class="ap-title">${escapeApHtml(data.title)}</div>
      <div class="ap-warning-wrap">
        <div class="ap-warning-line">${escapeApHtml(data.warning)}</div>
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

    // 任何选项点击后立即 resolve
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

/**
 * 外部导航 API：供 feature-jump.js 锚点跳转后程序化控制。
 * approve-permission 只有一步操作，定义此函数保持接口一致。
 */
function navigateToPermission() {
  // no-op: 审批卡只有一步，无需翻题
}

export { showApprovePermission, hideApprovePermission, bindApprovePermissionEvents, renderStaticApprovePermission, navigateToPermission };
