// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
/* === controls-stepper.js 架构注释 ===
 * IIFE，步进控制绑定。
 * #ctrlPrevStep → directorPrevStep（player.js 导出）
 * #ctrlAutoStep → toggleDirectorAuto（player.js 导出）
 * #ctrlNextStep → directorNextStep（player.js 导出）
 */

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
