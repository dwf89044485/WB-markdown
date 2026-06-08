// ── 输出速度 + 刷新重放模块 ─────────────────────────────
// 依赖：scenario（全局）、restartPlayback（全局）、currentTokensPerSecond（全局）

(function() {
  const tps = document.getElementById('ctrlTokensPerSecond');
  const replay = document.getElementById('ctrlReplay');
  if (!tps || !replay) return;

  // 从 scenario 同步初始值
  tps.value = window.currentTokensPerSecond();

  const syncPlayback = () => {
    const value = Math.min(1000, Math.max(20, Math.round(Number(tps.value) || 200)));
    window.scenario.playback.tokensPerSecond = value;
    tps.value = value;
  };

  tps.addEventListener('change', syncPlayback);
  tps.addEventListener('input', () => {
    const value = Number(tps.value);
    if (Number.isFinite(value)) window.scenario.playback.tokensPerSecond = Math.min(1000, Math.max(20, value));
  });

  replay.onclick = () => { syncPlayback(); window.restartPlayback(); };
})();
