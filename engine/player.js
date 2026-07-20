// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// PLAYER — Director timeline · playback lifecycle · public API
// ============================================================
// 拆分后 player.js 只保留：导演调度 / 步进控制 / 播放生命周期 / 公开 API
// DOM 渲染 → player-dom.js  ·  最终渲染 → player-final.js  ·  UI 控件 → player-ui.js
// 共享状态/工具 → player-state.js

import {
  activePlayId, incrementPlayId, setFastRender,
  sleep, sleepDelay, CANCELLED, scrollToBottom,
} from './core.js';
import { initScrollNav } from './scroll-nav.js';
import { bindAskQuestionEvents } from './ask-question.js';
import { bindApprovePermissionEvents } from './approve-permission.js';
import { openSheet, closeSheet, maybeClose, goBackInSheet } from './sheet.js';
import {
  scenario, state, panelRoots,
  toDoneLabel, setComposerGenerating,
} from './player-state.js';
import {
  showUserMessage, showAgentShell, showThinkingLoading,
  runStatusGroup, runFlatAction, runThinkingStatus,
  resetPlaybackDom, renderStaticPreChat,
  toggleStep, toggleExec, toggleSteps,
  setupNavMeta,
} from './player-dom.js';
import { renderFinal } from './player-final.js';
import {
  setupDemoControls, syncToolCallStyleUI, toggleToolCallStyle,
} from './player-ui.js';

// ── Re-exports（外部消费方依赖这些导出）───────────────────
export { toggleStep, toggleExec, toggleSteps } from './player-dom.js';
export { toggleToolCallStyle, syncToolCallStyleUI } from './player-ui.js';
export function normalizeActions(actions) {
  const result = [];
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    if (action.type !== 'status') { result.push(action); continue; }
    const group = [action];
    while (i + 1 < actions.length && actions[i + 1].type === 'status') group.push(actions[++i]);
    result.push(group.length === 1 ? action : { type: 'statusGroup', actions: group });
  }
  return result;
}

// ── Director timeline ─────────────────────────────────────
function directorActionLabel(action) {
  if (action.type === 'status') return toDoneLabel(action);
  if (action.type === 'statusGroup') return action.actions.map(toDoneLabel).join('、');
  if (action.type === 'markdown') return '输出 markdown';
  if (action.type === 'html') return '输出内容';
  if (action.type === 'askUser') return '向用户提问';
  if (action.type === 'approvePermission') return '请求权限';
  return '子节点';
}

function buildDirectorTimeline(onRegenerate) {
  const timeline = [];

  timeline.push({ label: '用户消息', run: showUserMessage });
  timeline.push({ label: 'WorkBuddy 出现', run: showAgentShell });
  timeline.push({ label: '思考过程', run: showThinkingLoading });

  // 平铺模式：跳过节点卡片，所有 action 直接渲染到一个平铺容器
  let containerReady = false;
  timeline.push({
    label: '创建平铺容器',
    run: async () => {
      const container = document.createElement('div');
      container.className = 'flat-container';
      document.getElementById('stepsList').appendChild(container);
      state.directorRuntime.flatContainer = container;
      containerReady = true;
      await sleepDelay('stepDelay', 470);
    }
  });
  scenario.nodes.forEach((node) => {
    const actions = normalizeActions(node.actions);
    actions.forEach((action) => {
      timeline.push({
        label: directorActionLabel(action),
        run: async () => {
          if (!containerReady) return;
          await runFlatAction(state.directorRuntime.flatContainer, action);
        }
      });
    });
  });

  timeline.push({ label: '任务耗时与最终汇报', run: () => renderFinal({ onRegenerate }) });
  return timeline;
}

// ── Director controls ─────────────────────────────────────
function updateDirectorControls() {
  const total = state.directorTimeline.length || 0;
  const atStart = state.currentDirectorIndex < 0;
  const atEnd = total > 0 && state.currentDirectorIndex >= total - 1;
  panelRoots().forEach(root => {
    const prev = root.querySelector('#ctrlPrevStep');
    const auto = root.querySelector('#ctrlAutoStep');
    const next = root.querySelector('#ctrlNextStep');
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
    if (auto) {
      auto.disabled = state.directorBusy && !state.autoPlaying;
      auto.classList.toggle('is-active', state.autoPlaying);
    }
  });
}

async function runDirectorStep(index) {
  const step = state.directorTimeline[index];
  if (!step) return false;
  await step.run();
  state.currentDirectorIndex = index;
  updateDirectorControls();
  return true;
}

async function runDirectorAutoLoop(token) {
  if (state.directorBusy) return;
  state.directorBusy = true;
  setComposerGenerating(true);
  updateDirectorControls();
  try {
    await sleepDelay('autoStartDelay', 420);
    while (!state.pauseRequested && state.autoPlaying && token === activePlayId && state.currentDirectorIndex < state.directorTimeline.length - 1) {
      await runDirectorStep(state.currentDirectorIndex + 1);
    }
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    if (token === activePlayId) {
      state.directorBusy = false;
      state.autoPlaying = false;
      state.pauseRequested = false;
      setComposerGenerating(false);
      updateDirectorControls();
    }
  }
}

function startDirectorAuto() {
  if (state.directorBusy || state.currentDirectorIndex >= state.directorTimeline.length - 1) return;
  state.autoPlaying = true;
  state.pauseRequested = false;
  updateDirectorControls();
  const token = activePlayId;
  runDirectorAutoLoop(token);
}

function stopDirectorAuto() {
  state.pauseRequested = true;
  state.autoPlaying = false;
  updateDirectorControls();
}

function stopPlayback() {
  if (!state.directorBusy && !state.autoPlaying) return;
  stopDirectorAuto();
  incrementPlayId();
  setFastRender(false);
  setComposerGenerating(false);
  updateDirectorControls();
}

function toggleDirectorAuto() {
  if (state.autoPlaying) stopDirectorAuto();
  else startDirectorAuto();
}

async function directorNextStep() {
  if (state.currentDirectorIndex >= state.directorTimeline.length - 1) return;

  if (state.directorBusy || state.autoPlaying) {
    const mySeq = ++state.directorSkipSeq;
    await jumpDirectorTo(state.currentDirectorIndex + 1, { force: true, keepUserShell: true });

    if (mySeq !== state.directorSkipSeq) return;

    if (state.currentDirectorIndex < state.directorTimeline.length - 1) {
      const token = activePlayId;
      state.directorBusy = true;
      updateDirectorControls();
      try {
        await runDirectorStep(state.currentDirectorIndex + 1);
      } catch (err) {
        if (err !== CANCELLED) throw err;
      } finally {
        if (token === activePlayId) {
          state.directorBusy = false;
          updateDirectorControls();
        }
      }
    }
    return;
  }

  const token = activePlayId;
  state.directorBusy = true;
  setComposerGenerating(true);
  updateDirectorControls();
  try {
    await runDirectorStep(state.currentDirectorIndex + 1);
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    if (token === activePlayId) {
      state.directorBusy = false;
      updateDirectorControls();
    }
  }
}

async function jumpDirectorTo(targetIndex, { force = false, keepUserShell = false } = {}) {
  if (!force && state.directorBusy) return;

  const wasBusy = state.directorBusy;
  stopDirectorAuto();
  incrementPlayId();

  if (wasBusy) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const token = activePlayId;
  state.directorBusy = true;
  setFastRender(true);
  updateDirectorControls();
  try {
    if (keepUserShell) {
      const overlay = document.getElementById('overlay');
      const stepsList = document.getElementById('stepsList');
      const main = document.getElementById('mainMd');
      const mainBiz = document.getElementById('mainBiz');
      const mainActions = document.getElementById('mainActions');
      const execArea = document.getElementById('execArea');
      if (overlay) overlay.className = 'sheet-overlay';
      if (stepsList) { stepsList.innerHTML = ''; stepsList.className = 'steps-list open'; }
      if (main) main.innerHTML = '';
      if (mainBiz) mainBiz.innerHTML = '';
      if (mainActions) mainActions.innerHTML = '';
      if (execArea) execArea.className = 'exec-area open is-hidden';
      state.execOpen = true;
      state.stepsOpen = true;
      scrollToBottom();
    } else {
      resetPlaybackDom();
      renderStaticPreChat();
    }
    state.directorRuntime = { rows: [] };
    state.directorTimeline = buildDirectorTimeline(restartPlayback);
    state.currentDirectorIndex = -1;
    setComposerGenerating(true);
    const capped = Math.min(targetIndex, state.directorTimeline.length - 1);
    for (let i = 0; i <= capped; i++) {
      await runDirectorStep(i);
    }
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    setFastRender(false);
    if (token === activePlayId) {
      state.directorBusy = false;
      updateDirectorControls();
    }
  }
}

function directorPrevStep() {
  if (state.currentDirectorIndex < 0) return;
  jumpDirectorTo(state.currentDirectorIndex - 1, { force: true });
}

// ── URL 参数 ────────────────────────────────────────────────
function applyUrlPlaybackOverrides() {
  const params = new URLSearchParams(location.search);
  scenario.playback = scenario.playback || {};

  const tpsRaw = params.get('tokensPerSecond');
  if (tpsRaw !== null && tpsRaw !== '') {
    const value = Number(tpsRaw);
    if (Number.isFinite(value)) scenario.playback.tokensPerSecond = value;
  }

  const legacySpeed = params.get('typeSpeed');
  if (tpsRaw === null && legacySpeed !== null && legacySpeed !== '') {
    const value = Number(legacySpeed);
    if (Number.isFinite(value) && value > 0) scenario.playback.tokensPerSecond = Math.round(1000 / value);
  }
}

// ── Playback lifecycle ────────────────────────────────────
function initializePlayback(skipScroll) {
  state.autoPlaying = false;
  state.pauseRequested = false;
  state.directorBusy = false;
  setFastRender(false);
  state.currentDirectorIndex = -1;
  state.directorRuntime = { rows: [] };
  setupNavMeta();
  resetPlaybackDom();
  renderStaticPreChat(skipScroll);
  scrollToBottom();
  state.directorTimeline = buildDirectorTimeline(restartPlayback);
  updateDirectorControls();
  initScrollNav();
  bindAskQuestionEvents();
  bindApprovePermissionEvents();
}

function restartPlayback() {
  incrementPlayId();
  initializePlayback(true);
  startDirectorAuto();
}

function startPlayback() {
  incrementPlayId();
  initializePlayback(false);
  startDirectorAuto();
}

// ── Public API ────────────────────────────────────────────
export function getCurrentStepIndex() {
  return state.currentDirectorIndex;
}

export function pauseDirector() {
  state.pauseRequested = true;
  state.autoPlaying = false;
}

export function resumePlayback() {
  if (state.currentDirectorIndex >= state.directorTimeline.length - 1) return;
  startDirectorAuto();
}

/**
 * 将 scenario node 索引转换为 director timeline 索引。
 */
export function resolveNodeStep(nodeIndex, actionOffset = 0) {
  if (typeof nodeIndex !== 'number' || nodeIndex < 0 || !scenario) return -1;
  let ti = 4; // 跳过固定入口
  for (let i = 0; i < nodeIndex && i < scenario.nodes.length; i++) {
    ti += normalizeActions(scenario.nodes[i].actions).length;
  }
  if (nodeIndex >= 0 && nodeIndex < scenario.nodes.length) {
    const actions = normalizeActions(scenario.nodes[nodeIndex].actions);
    const offset = Math.max(0, Math.min(actionOffset, actions.length - 1));
    ti += offset;
  }
  return Math.min(ti, state.directorTimeline.length - 1);
}

/**
 * 跳到指定 step（director timeline 索引）。
 */
export async function goToStep(targetStep) {
  if (typeof targetStep !== 'number' || targetStep < 0) return;

  state.pauseRequested = true;
  state.autoPlaying = false;
  await sleep(0);

  const safeTarget = Math.min(targetStep, state.directorTimeline.length - 1);
  await jumpDirectorTo(safeTarget, { force: true });
}

// ── Global window bindings（HTML inline onclick 需要）─────
window.openSheet = openSheet;
window.closeSheet = closeSheet;
window.goBackInSheet = goBackInSheet;
window.maybeClose = maybeClose;
window.toggleStep = toggleStep;
window.toggleExec = toggleExec;
window.toggleSteps = toggleSteps;

// ── Bootstrap ─────────────────────────────────────────────
applyUrlPlaybackOverrides();

// 用回调模式连接 UI 控件与导演函数，避免循环依赖
setupDemoControls({
  onPrev: directorPrevStep,
  onNext: directorNextStep,
  onAuto: toggleDirectorAuto,
  onReload: restartPlayback,
  onStop: stopPlayback,
  onToolStyle: toggleToolCallStyle,
  onUpdateControls: updateDirectorControls,
});

startPlayback();
