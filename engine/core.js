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

export function sleepDelay(key, fallback, scale = 1) {
  if (fastRender) return Promise.resolve();
  const token = activePlayId;
  const base = playback(key, fallback);
  const adjustedBase = Math.round(base * scale);
  const start = performance.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      if (token !== activePlayId) { reject(CANCELLED); return; }
      const elapsed = performance.now() - start;
      const tps = currentTokensPerSecond();
      const target = Math.max(0, Math.round(adjustedBase * (200 / tps)));
      if (elapsed >= target) { resolve(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export function playback(key, fallback) {
  return (scenario.playback && Number.isFinite(scenario.playback[key])) ? scenario.playback[key] : fallback;
}

export function currentTokensPerSecond() {
  return Math.min(1500, Math.max(5, Math.round(playback('tokensPerSecond', 200))));
}

export function scrollToBottom() {
  const c = document.querySelector('#conv');
  if (!c) return;
  // 用户主动往上翻了（距底部超过 80px），不强制滚动
  if (c.scrollTop + c.clientHeight < c.scrollHeight - 80) return;
  c.scrollTop = c.scrollHeight;
}

export function scrollToUserBelowNav() {
  const conv = document.querySelector('#conv');
  const userWrap = document.querySelector('#userMsgWrap');
  const navBar = conv ? conv.querySelector('.nav-bar') : null;
  if (!conv || !userWrap) return;
  // 使用 getBoundingClientRect 相对视口精确计算
  const convRect = conv.getBoundingClientRect();
  const userRect = userWrap.getBoundingClientRect();
  const navHeight = navBar ? navBar.offsetHeight : 0;
  // 目标：userWrap 顶部应该在 navbar 底部下方 12px
  // 当前 userWrap 顶部相对 conv 可视区域的位置 = userRect.top - convRect.top
  // 期望位置 = navHeight + 12
  const currentOffset = userRect.top - convRect.top;
  const desiredOffset = navHeight + 12;
  const delta = currentOffset - desiredOffset;
  conv.scrollTop += delta;
}

// 智能滚动：有 preChat 时用户消息保持在 navbar 下方，否则滚动到底部
export function smartScroll() {
  if (scenario.preChat && scenario.preChat.length) {
    scrollToUserBelowNav();
  } else {
    scrollToBottom();
  }
}
