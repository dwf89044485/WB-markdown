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

const USER_TOP_OFFSET = 12;
const USER_TOP_SPACER_ID = 'userTopSpacer';

function userTopTarget(c, wrap) {
  const navBar = c.querySelector('.nav-bar');
  const navHeight = navBar ? navBar.offsetHeight : 0;
  return Math.max(0, (wrap.offsetTop - c.offsetTop) - navHeight - USER_TOP_OFFSET);
}

function getUserTopSpacer() {
  return document.getElementById(USER_TOP_SPACER_ID);
}

function getEffectiveScrollHeight(c) {
  const spacer = getUserTopSpacer();
  const spacerHeight = spacer ? spacer.offsetHeight : 0;
  return Math.max(0, c.scrollHeight - spacerHeight);
}

function scrollTopForEffectiveBottom(c, effectiveHeight) {
  return Math.max(0, effectiveHeight - c.clientHeight);
}

function ensureUserTopSpacer(c, target) {
  const maxScrollTop = Math.max(0, c.scrollHeight - c.clientHeight);
  const deficit = target - maxScrollTop;
  let spacer = getUserTopSpacer();
  if (deficit <= 0) {
    if (spacer) spacer.remove();
    return;
  }
  if (!spacer) {
    spacer = document.createElement('div');
    spacer.id = USER_TOP_SPACER_ID;
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.pointerEvents = 'none';
    c.appendChild(spacer);
  }
  spacer.style.height = `${Math.ceil(deficit)}px`;
}

function reconcileUserTopSpacer(c, wrap) {
  const spacer = getUserTopSpacer();
  if (!spacer || !wrap) return false;
  const target = userTopTarget(c, wrap);
  const spacerHeight = spacer.offsetHeight;
  const noSpacerHeight = Math.max(0, c.scrollHeight - spacerHeight);
  const needed = target - (noSpacerHeight - c.clientHeight);
  if (needed <= 0) {
    spacer.remove();
    return false;
  }
  spacer.style.height = `${Math.ceil(needed)}px`;
  return true;
}

export function clearUserTopSpacer() {
  const spacer = getUserTopSpacer();
  if (spacer) spacer.remove();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

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
  const effectiveHeight = getEffectiveScrollHeight(c);
  const bottom = scrollTopForEffectiveBottom(c, effectiveHeight);
  if (bottom > c.scrollTop) c.scrollTop = bottom;
}

/**
 * 用户消息钉在视口顶端（navbar 下方），AI 内容填到接近底部时跟随滚动。
 *
 * 逻辑：
 * - 如果当前视口底部距内容底部 < 60px（内容已经接近填满屏幕），跟随底部
 * - 否则保持原状（用户消息维持在顶端，AI 内容在下方自然填充）
 */
export function scrollIfFull() {
  const c = document.querySelector('#conv');
  if (!c) return;
  if (_sbUserAway) return;

  const wrap = document.getElementById('userMsgWrap');
  const spacerActive = reconcileUserTopSpacer(c, wrap);
  if (spacerActive) return;

  const effectiveHeight = getEffectiveScrollHeight(c);
  const nearBottom = c.scrollTop + c.clientHeight >= effectiveHeight - 60;
  if (!nearBottom) return;

  const bottom = scrollTopForEffectiveBottom(c, effectiveHeight);
  if (bottom > c.scrollTop) c.scrollTop = bottom;
}

/**
 * 将用户消息气泡滚动到视口顶端（navbar 下方），带上移动效。
 */
export async function scrollUserToTop(duration = 320) {
  const c = document.querySelector('#conv');
  if (!c) return;
  const wrap = document.getElementById('userMsgWrap');
  if (!wrap) return;

  const target = userTopTarget(c, wrap);
  ensureUserTopSpacer(c, target);
  const start = c.scrollTop;
  const delta = target - start;

  if (fastRender || duration <= 0 || Math.abs(delta) < 1) {
    c.scrollTop = target;
    _sbUserAway = false;
    return;
  }

  const startedAt = performance.now();
  await new Promise(resolve => {
    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      c.scrollTop = start + delta * easeOutCubic(t);
      if (t >= 1) { resolve(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // 这是系统滚动，不是用户手动离开底部
  _sbUserAway = false;
}
