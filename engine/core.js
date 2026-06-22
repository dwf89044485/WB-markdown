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
let _sbTurnPinned = false;
let _sbRafId = 0;
let _sbAnimSeq = 0;

function cancelScrollAnimation() {
  _sbAnimSeq += 1;
  if (!_sbRafId) return;
  cancelAnimationFrame(_sbRafId);
  _sbRafId = 0;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateScrollTop(container, targetTop, duration) {
  cancelScrollAnimation();
  const seq = _sbAnimSeq;
  const startTop = container.scrollTop;
  const delta = targetTop - startTop;
  if (Math.abs(delta) < 1 || duration <= 0 || fastRender) {
    container.scrollTop = targetTop;
    return Promise.resolve();
  }

  const startAt = performance.now();
  return new Promise((resolve) => {
    const tick = (now) => {
      // 被其他滚动操作中断时直接结束，避免阻塞上层 await
      if (seq !== _sbAnimSeq) {
        resolve();
        return;
      }
      const p = Math.min(1, (now - startAt) / duration);
      container.scrollTop = startTop + delta * easeOutCubic(p);
      if (p >= 1) {
        _sbRafId = 0;
        resolve();
        return;
      }
      _sbRafId = requestAnimationFrame(tick);
    };
    _sbRafId = requestAnimationFrame(tick);
  });
}

export function initScrollGuard() {
  if (_sgInited) return;
  const c = document.querySelector('#conv');
  if (!c) return;
  c.addEventListener('scroll', () => {
    const nearBottom = c.scrollTop + c.clientHeight >= c.scrollHeight - 80;
    _sbUserAway = !nearBottom;
    // 用户主动回到底部后，允许恢复自动跟随
    if (_sbTurnPinned && nearBottom) _sbTurnPinned = false;
  }, { passive: true });
  _sgInited = true;
}

export async function pinMessageToViewportTop(messageEl, { gap = 12, duration = 360 } = {}) {
  const c = document.querySelector('#conv');
  if (!c || !messageEl) return;

  const navBar = c.querySelector('.nav-bar');
  const navHeight = navBar ? navBar.offsetHeight : 0;
  const convRect = c.getBoundingClientRect();
  const msgRect = messageEl.getBoundingClientRect();
  const offsetInViewport = msgRect.top - convRect.top;
  const target = Math.max(0, c.scrollTop + offsetInViewport - navHeight - gap);

  _sbTurnPinned = true;
  _sbUserAway = true;
  await animateScrollTop(c, target, duration);
}

export function resetScrollBehaviorState() {
  cancelScrollAnimation();
  _sbUserAway = false;
  _sbTurnPinned = false;
}

export function scrollToBottom() {
  const c = document.querySelector('#conv');
  if (!c) return;
  // 用户主动往上翻过或当前回合已锁定消息贴顶时，不跟随到底部
  if (_sbUserAway || _sbTurnPinned) return;
  cancelScrollAnimation();
  c.scrollTop = c.scrollHeight;
}
