// ── 步进器控制模块 ──────────────────────────────────────
// 上一步 / 自动播放 / 下一步 + 步进计数
// 依赖：player.js 中的 directorPrevStep / directorNextStep / toggleDirectorAuto（作为全局函数）

(function() {
  const prev = document.getElementById('ctrlPrevStep');
  const auto = document.getElementById('ctrlAutoStep');
  const next = document.getElementById('ctrlNextStep');
  if (!prev || !auto || !next) return;

  prev.onclick = () => window.directorPrevStep();
  next.onclick = () => window.directorNextStep();
  auto.onclick = () => window.toggleDirectorAuto();
})();
