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

// 用户主动往上翻的标记（通过 scroll 事件追踪）
let _sbUserAway = false;
let _sgInited = false;

export function initScrollGuard() {
  if (_sgInited) return;
  const c = document.querySelector('#conv');
  if (!c) return;
  c.addEventListener('scroll', () => {
    _sbUserAway = c.scrollTop + c.clientHeight < c.scrollHeight - 80;
  }, { passive: true });
  _sgInited = true;
}

export function scrollToBottom() {
  const c = document.querySelector('#conv');
  if (!c) return;
  // 用户主动往上翻过才拦截，否则一直跟随底部
  if (_sbUserAway) return;
  c.scrollTop = c.scrollHeight;
}

/**
 * 内容填满一屏时才滚动到底部，否则保持当前视口位置。
 * 用于 showAgentShell / status line / step 完成等场景：
 * 用户消息滚到顶端后，AI 内容逐步填充下方空间，
 * 在填满屏幕之前不动视口，填满后自动跟随底部。
 */
export function scrollIfFull() {
  const c = document.querySelector('#conv');
  if (!c) return;
  if (_sbUserAway) return;
  // 视口底部是否已被内容填满（距内容底部 < 60px 视为已填满）
  if (c.scrollTop + c.clientHeight >= c.scrollHeight - 60) {
    c.scrollTop = c.scrollHeight;
  }
}

/**
 * 将用户消息气泡滚动到视口顶端（navbar 下方）。
 * 用于第四轮用户消息上屏后，为下方 AI 回复腾出完整空间。
 */
export function scrollUserToTop() {
  const c = document.querySelector('#conv');
  if (!c) return;
  const wrap = document.getElementById('userMsgWrap');
  if (!wrap) return;
  const navBar = c.querySelector('.nav-bar');
  const navHeight = navBar ? navBar.offsetHeight : 0;
  const scrollTarget = (wrap.offsetTop - c.offsetTop) - navHeight - 12;
  c.scrollTop = Math.max(0, scrollTarget);
}
