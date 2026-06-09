// ── 子节点显示模式 + commit hash 模块 ───────────────────
// 依赖：displayMode（全局）、toggleDisplayMode（全局）

(function() {
  const groupBtn = document.getElementById('ctrlModeGrouped');
  const flatBtn = document.getElementById('ctrlModeFlat');

  if (groupBtn) {
    groupBtn.classList.toggle('is-active', window.displayMode === 'grouped');
    groupBtn.onclick = () => window.toggleDisplayMode('grouped');
  }
  if (flatBtn) {
    flatBtn.classList.toggle('is-active', window.displayMode === 'flat');
    flatBtn.onclick = () => window.toggleDisplayMode('flat');
  }

  // ── commit hash ──────────────────────────────────────
  // 数据来源统一由 commit-hash.js 提供（window.commitHashReady）
  const hashEl = document.getElementById('ctrlCommitHash');
  if (hashEl && window.commitHashReady) {
    window.commitHashReady.then((h) => { hashEl.textContent = h; });
  }
})();
