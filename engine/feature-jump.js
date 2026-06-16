// ============================================================
// FEATURE JUMP — 跳转锚点引擎
// ============================================================
// 锚点 = { nodeIndex / stepIndex, actionOffset, questionIndex, until: () => bool, label }
//
// jumpToAnchor(anchor):
//   1. 解析目标 step：有 nodeIndex 则通过 resolveNodeStep(nodeIndex, actionOffset) 换算
//   2. 调 player.goToStep(targetStep) 用 fast-render 跳到目标 action
//   3. 如锚点指定 questionIndex，调 navigateToQuestion(questionIndex) 翻到对应题目
//   4. 轮询 anchor.until() 等条件成立，超时 8s 兜底
//   5. 调 player.pauseDirector() 暂停
//   6. 期间不抛错；失败也静默兜底（spec 第七节 4）
// ============================================================

import { goToStep, pauseDirector, resolveNodeStep } from './player.js';
import { navigateToQuestion } from './ask-question.js';

const TIMEOUT_MS = 8000;
const POLL_MS = 50;

export async function jumpToAnchor(anchor) {
  // 支持 nodeIndex（scenario node 索引）和 stepIndex（director timeline 索引）
  let targetStep;
  if (typeof anchor.nodeIndex === 'number') {
    const offset = typeof anchor.actionOffset === 'number' ? anchor.actionOffset : 0;
    targetStep = resolveNodeStep(anchor.nodeIndex, offset);
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

  // 跳转后翻到指定题目（如果锚点指定了 questionIndex）
  if (typeof anchor.questionIndex === 'number') {
    navigateToQuestion(anchor.questionIndex);
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
