/* === feature-jump.js 架构注释 ===
 * jumpToAnchor(anchor) 完整流程：
 * 解析 nodeIndex → resolveNodeStep → goToStep（jumpDirectorTo fast-render）
 * → resumePlayback → 轮询 until 条件（超时兜底 8s）→ pauseDirector
 */

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
//
// 注意：askUser action 的 showAskQuestion() 返回的 Promise 只等用户操作后 resolve，
//       导致 jumpDirectorTo 卡住永不返回。解决方案：检测锚点是否含有 questionIndex
//       （只有 askUser 锚点有此字段），如有则跳过目标 step 的 goToStep，
//       改跳到前一步，再手动调 showAskQuestion(silent) 让卡片渲染且不阻塞。

import { goToStep, pauseDirector, resolveNodeStep, normalizeActions } from './player.js';
import { showAskQuestion, navigateToQuestion } from './ask-question.js';
import { showApprovePermission } from './approve-permission.js';
import { hideAllOverlays } from './overlay-registry.js';

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

  // 只有 askUser 锚点含有 questionIndex。检测到后，skip 目标 step 的 goToStep
  // （因为 showAskQuestion 返回的 Promise 只在用户操作后 resolve，会卡住
  // jumpDirectorTo），改跳到前一步，再手动调 showAskQuestion(silent)。
  const isAskUser = typeof anchor.questionIndex === 'number';
  const isApprovePermission = anchor.isApprovePermission === true;
  const needsManualRender = isAskUser || isApprovePermission;

  if (needsManualRender) {
    let actionData = null;
    const scenario = window.WORKBUDDY_SCENARIO;

    if (isAskUser) {
      // 用 player.js 的 normalizeActions 构建所有节点归一化后的扁平 action 列表，
      // 消除此处与 player.js 的重复实现（DRY）
      const allActions = [];
      for (const node of (scenario.nodes || [])) {
        allActions.push(...normalizeActions(node.actions || []));
      }
      // targetStep 内含 4 个固定入口偏移，减 4 得到扁平列表索引
      const act = allActions[targetStep - 4];
      if (act && act.type === 'askUser') actionData = act.questions;
    } else if (isApprovePermission) {
      const allActions = [];
      for (const node of (scenario.nodes || [])) {
        allActions.push(...normalizeActions(node.actions || []));
      }
      const act = allActions[targetStep - 4];
      if (act && act.type === 'approvePermission') actionData = act.data;
    }

    // 跳到目标的前一步，让前面所有步骤渲染出来
    const prevStep = Math.max(0, targetStep - 1);
    try {
      await goToStep(prevStep);
    } catch (err) {
      console.warn('[feature-jump] goToStep(to prev) failed silently', err);
    }

    // 手动显示卡片，silent/sync 确保不阻塞
    // 显示前统一清理所有覆层面板，避免同类型或异类面板同时残留
    if (isAskUser && actionData) {
      hideAllOverlays();
      showAskQuestion(actionData, true);
    } else if (isApprovePermission && actionData) {
      hideAllOverlays();
      showApprovePermission(actionData);
    }
  } else {
    // 非手动渲染的锚点：goToStep→jumpDirectorTo 的 resetPlaybackDom 已内置
    // hideAllOverlays()，此处无需额外清理（但保留备调用以对非 reset 路径安全）
    try {
      await goToStep(targetStep);
    } catch (err) {
      console.warn('[feature-jump] goToStep failed silently', err);
    }
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
