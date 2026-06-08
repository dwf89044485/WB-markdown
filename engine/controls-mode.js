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
  const hashEl = document.getElementById('ctrlCommitHash');
  if (hashEl) {
    const metaHash = document.querySelector('meta[name="commit-hash"]')?.getAttribute('content');
    if (metaHash && metaHash !== '__COMMIT_HASH__') {
      hashEl.textContent = metaHash;
    } else {
      fetch('./COMMIT_HASH')
        .then(r => r.text())
        .then(h => { hashEl.textContent = h.trim(); })
        .catch(() => {});
    }
  }
})();
