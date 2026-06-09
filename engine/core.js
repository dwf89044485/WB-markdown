// ============================================================
// CORE — Playback state · sleep · playback params
// ============================================================

const scenario = window.WORKBUDDY_SCENARIO;

export let activePlayId = 0;
export let fastRender = false;

export function incrementPlayId() {
  activePlayId += 1;
  return activePlayId;
}

export function setFastRender(v) {
  fastRender = v;
}

export const CANCELLED = new Error('playback-cancelled');

export function sleep(ms) {
  if (fastRender) return Promise.resolve();
  const token = activePlayId;
  return new Promise((resolve, reject) => {
    window.setTimeout(() => token === activePlayId ? resolve() : reject(CANCELLED), Math.max(0, ms));
  });
}

export function playback(key, fallback) {
  return (scenario.playback && Number.isFinite(scenario.playback[key])) ? scenario.playback[key] : fallback;
}

export function currentTokensPerSecond() {
  return Math.min(1000, Math.max(20, Math.round(playback('tokensPerSecond', 200))));
}

export function playbackDelay(key, fallback) {
  const base = playback(key, fallback);
  if (key !== 'frameDelay' && key !== 'stepDelay') return base;
  const tps = currentTokensPerSecond();
  return Math.max(0, Math.round(base * (200 / tps)));
}

export function scrollToBottom() {
  const c = document.querySelector('#conv');
  if (!c) return;
  // 用户主动往上翻了（距底部超过 80px），不强制滚动
  if (c.scrollTop + c.clientHeight < c.scrollHeight - 80) return;
  c.scrollTop = c.scrollHeight;
}
