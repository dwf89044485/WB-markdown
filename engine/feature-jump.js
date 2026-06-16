// ============================================================
// FEATURE JUMP — 跳转锚点引擎
// ============================================================
// 锚点 = { nodeIndex / stepIndex, until: () => bool, label }
//
// jumpToAnchor(anchor):
//   1. 解析目标 step：有 nodeIndex 则通过 resolveNodeStep 换算，否则直接用 stepIndex
//   2. 调 player.goToStep(targetStep) 用 fast-render 跳到目标 node 起始位置
//   3. 调 player.resumePlayback() 继续自动播放
//   4. 轮询 anchor.until() 等条件成立，超时 8s 兜底
//   5. 调 player.pauseDirector() 暂停
//   6. 期间不抛错；失败也静默兜底（spec 第七节 4）
// ============================================================

import { goToStep, pauseDirector, resolveNodeStep, resumePlayback } from './player.js';

const TIMEOUT_MS = 8000;
const POLL_MS = 50;

export async function jumpToAnchor(anchor) {
  // 支持 nodeIndex（scenario node 索引）和 stepIndex（director timeline 索引）
  let targetStep;
  if (typeof anchor.nodeIndex === 'number') {
    targetStep = resolveNodeStep(anchor.nodeIndex);
  } else if (typeof anchor.stepIndex === 'number') {
    targetStep = anchor.stepIndex;
  } else {
    console.warn('[feature-jump] invalid anchor — need stepIndex or nodeIndex', anchor);
    return;
  }

  try {
    await goToStep(targetStep);
  } catch (err) {
    console.warn('[feature-jump] goToStep failed silently', err);
    // 静默继续——尝试用当前 DOM 状态去等条件
  }

  // 跳转后恢复自动播放，让 director 继续走到目标条件
  resumePlayback();

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
