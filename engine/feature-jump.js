// ============================================================
// FEATURE JUMP — 跳转锚点引擎
// ============================================================
// 锚点 = { stepIndex, until: () => bool, label }
//
// jumpToAnchor(anchor):
//   1. 调 player.goToStep(stepIndex) 把 demo 推到对应 step
//   2. 轮询 anchor.until() 等条件成立，超时 8s 兜底
//   3. 调 player.pauseDirector() 暂停
//   4. 期间不抛错；失败也静默兜底（spec 第七节 4）
// ============================================================

import { goToStep, pauseDirector } from './player.js';

const TIMEOUT_MS = 8000;
const POLL_MS = 50;

export async function jumpToAnchor(anchor) {
  if (!anchor || typeof anchor.stepIndex !== 'number') {
    console.warn('[feature-jump] invalid anchor', anchor);
    return;
  }

  try {
    await goToStep(anchor.stepIndex);
  } catch (err) {
    console.warn('[feature-jump] goToStep failed silently', err);
    // 静默继续——尝试用当前 DOM 状态去等条件
  }

  // 等条件成立或超时
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    try {
      if (typeof anchor.until !== 'function' || anchor.until()) break;
    } catch (err) {
      // until 抛错 = 条件不成立，继续轮询
    }
    await sleep(POLL_MS);
  }

  // 不论是否真的等到，都暂停（兜底）
  try {
    pauseDirector();
  } catch (err) {
    console.warn('[feature-jump] pause failed silently', err);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 处理 reload 后的待跳转 anchor（player.goToStep 反向跳走 reload 路径）
export function consumePendingJump() {
  const pending = sessionStorage.getItem('__pendingJumpStep');
  if (!pending) return null;
  sessionStorage.removeItem('__pendingJumpStep');
  return parseInt(pending, 10);
}
