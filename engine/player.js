// ============================================================
// PLAYER — Director timeline · playback controls · DOM orchestration
// ============================================================

import {
  activePlayId, fastRender,
  incrementPlayId, setFastRender,
  sleep, playback, currentTokensPerSecond, CANCELLED,
  scrollToBottom
} from './core.js';
import { escapeHtml, markdownToHtml } from './markdown.js';
import { ICONS, setStatusLineLabels, statusLineHTML, renderActionIcon } from './icons.js';
import { appendHTMLTypedTo, appendHTML, appendMarkdown } from './typewriter.js';
import { renderSheet, openSheet, closeSheet, maybeClose, renderFileCard } from './sheet.js';

const scenario = window.WORKBUDDY_SCENARIO;
const $ = (sel, root = document) => root.querySelector(sel);

// ── State ──────────────────────────────────────────────────
let displayMode = 'flat'; // 'grouped' | 'flat'
let execOpen = true;
let stepsOpen = true;
let stepSeq = 0;
let directorTimeline = [];
let directorRuntime = {};
let currentDirectorIndex = -1;
let autoPlaying = false;
let directorBusy = false;
let pauseRequested = false;

// ── Helpers ───────────────────────────────────────────────

function truncate(str, n = 24) {
  return str.length > n ? str.slice(0, n) + '...' : str;
}

function toDoneLabel(action) {
  return (action.doneText || '').replace(/\s*›\s*$/, '');
}

function toRunningLabel(action) {
  return (action.runningText || '').replace(/\s*›\s*$/, '');
}

function joinLabels(labels) {
  return labels.filter(Boolean).join('、') + ' ›';
}

function stripChevron(label) {
  return String(label || '').replace(/\s*›\s*$/, '').trim();
}

function splitStatusLabels(text) {
  const clean = stripChevron(text);
  return clean ? clean.split('、').map(s => s.trim()).filter(Boolean) : [];
}

function setStepIcon(row, done) {
  const icon = $('.step-state-icon', row);
  icon.className = done ? 'step-state-icon ico-ok' : 'step-state-icon ico-spin';
  icon.innerHTML = done ? ICONS.ok : ICONS.spin;
}

// ── Step row ──────────────────────────────────────────────
function createStep(node) {
  const id = `dyn-step-${++stepSeq}`;
  const row = document.createElement('div');
  row.className = 'step-row open node-enter';
  row.id = id;
  row.innerHTML = `
    <div class="step-hd" onclick="toggleStep('${id}')">
      <div class="step-state-icon ico-spin">${ICONS.spin}</div>
      <span class="step-label">${truncate(node.title)}</span>
      <div class="step-chevron">${ICONS.chevron}</div>
    </div>
    <div class="step-detail"><div class="step-detail-inner md md-node"></div></div>
  `;
  $('#stepsList').appendChild(row);
  scrollToBottom();
  return row;
}

// ── Status line ───────────────────────────────────────────
function createStatusLineIn(container, text, frameIds, title) {
  const btn = document.createElement('button');
  btn.className = 'step-detail-link is-running status-line-enter';
  btn.dataset.frames = (frameIds || []).join(',');
  btn.dataset.sheetTitle = title || '';
  setStatusLineLabels(btn, splitStatusLabels(text));
  btn.onclick = () => openSheet(btn.dataset.frames, btn.dataset.sheetTitle);
  container.appendChild(btn);
  scrollToBottom();
  return btn;
}

function createStatusLine(row, text, frameIds, title) {
  return createStatusLineIn($('.step-detail-inner', row), text, frameIds, title);
}

// ── Action normalization ──────────────────────────────────
function normalizeActions(actions) {
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

// ── Status group runner ───────────────────────────────────
async function runStatusGroup(row, actions, container) {
  const detailIn = container || ($('.step-detail-inner', row));
  const firstFrames = actions[0].frames || [];
  const completedLabels = [];
  const completedFinalFrames = [];
  const initialTitle = actions.map(toDoneLabel).join('、');
  const line = createStatusLineIn(detailIn, joinLabels([toRunningLabel(actions[0])]), firstFrames[0] ? [firstFrames[0]] : [], initialTitle);

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const frames = action.frames || [];
    const runningLabels = completedLabels.concat(toRunningLabel(action));

    setStatusLineLabels(line, runningLabels);
    line.dataset.sheetTitle = completedLabels.concat(toDoneLabel(action)).join('、');

    for (const frameId of frames) {
      line.dataset.frames = completedFinalFrames.concat(frameId).join(',');
      line.dataset.sheetTitle = completedLabels.concat(toDoneLabel(action)).join('、');
      await sleep(playback('frameDelay', 520));
    }

    completedLabels.push(toDoneLabel(action));
    if (frames.length) completedFinalFrames.push(frames[frames.length - 1]);
    setStatusLineLabels(line, completedLabels);
    line.dataset.frames = completedFinalFrames.join(',');
    line.dataset.sheetTitle = completedLabels.join('、');

    if (index < actions.length - 1) await sleep(Math.floor(playback('stepDelay', 470) * 0.3));
  }

  line.classList.remove('is-running');
  await sleep(Math.floor(playback('stepDelay', 470) * 0.55));
}

async function runStatus(row, action) {
  await runStatusGroup(row, [action]);
}

// ── Node action runner ────────────────────────────────────
async function runNodeAction(row, action) {
  if (!row) return;
  if (action.type === 'status') await runStatus(row, action);
  if (action.type === 'statusGroup') await runStatusGroup(row, action.actions);
  if (action.type === 'html') await appendHTML(row, action.html);
  if (action.type === 'markdown') await appendMarkdown(row, action.markdown);
}

// ── Flat mode action runner ───────────────────────────────
async function runFlatAction(container, action) {
  if (!container) return;
  if (action.type === 'status') await runStatusGroup(null, [action], container);
  if (action.type === 'statusGroup') await runStatusGroup(null, action.actions, container);
  if (action.type === 'html') await appendHTML(null, action.html, container);
  if (action.type === 'markdown') {
    const wrapper = document.createElement('div');
    wrapper.className = 'md md-node';
    container.appendChild(wrapper);
    await appendHTMLTypedTo(wrapper, markdownToHtml(action.markdown));
  }
}

// ── Display mode toggle (tab) ─────────────────────────────
function syncDisplayModeUI() {
  const phoneShell = document.querySelector('.phone-shell');
  if (phoneShell) {
    phoneShell.classList.toggle('mode-flat', displayMode === 'flat');
    phoneShell.classList.toggle('mode-grouped', displayMode === 'grouped');
  }
  const groupBtn = document.getElementById('ctrlModeGrouped');
  const flatBtn = document.getElementById('ctrlModeFlat');
  if (groupBtn) {
    groupBtn.classList.toggle('is-active', displayMode === 'grouped');
    groupBtn.setAttribute('aria-selected', displayMode === 'grouped' ? 'true' : 'false');
  }
  if (flatBtn) {
    flatBtn.classList.toggle('is-active', displayMode === 'flat');
    flatBtn.setAttribute('aria-selected', displayMode === 'flat' ? 'true' : 'false');
  }
}

function toggleDisplayMode(mode) {
  displayMode = mode;
  syncDisplayModeUI();
  restartPlayback();
}

// ── Thinking ──────────────────────────────────────────────
async function runThinkingStatus() {
  const execArea = $('#execArea');
  const stepsList = $('#stepsList');
  const mount = $('#thinkingMount');
  execArea.classList.remove('is-hidden');
  stepsList.classList.add('is-hidden');
  mount.innerHTML = '';
  const action = scenario.thinking || { runningText: '正在思考', doneText: '思考过程', frames: [] };
  const frames = action.frames || [];
  const line = createStatusLineIn(mount, joinLabels([toRunningLabel(action)]), frames[0] ? [frames[0]] : [], toDoneLabel(action));
  for (const frameId of frames) {
    line.dataset.frames = frameId;
    await sleep(playback('frameDelay', 520));
  }
  setStatusLineLabels(line, [toDoneLabel(action)]);
  line.dataset.frames = frames.length ? frames[frames.length - 1] : '';
  line.dataset.sheetTitle = toDoneLabel(action);
  line.classList.remove('is-running');
  stepsList.classList.remove('is-hidden');
  scrollToBottom();
  await sleep(playback('stepDelay', 470));
}

// ── Final render ──────────────────────────────────────────
function renderTiming() {
  $('#timingMount').innerHTML = `
    <div class="timing-bar timing-enter" onclick="toggleExec()" role="button" tabindex="0" aria-label="折叠/展开执行过程">
      <span class="timing-text">${scenario.final.timing}</span>
      <img class="timing-arrow" id="timingArrow" src="./icons/right.svg" alt="">
    </div>`;
}

function renderFinalActions() {
  const main = $('#mainMd');
  if (!main || main.querySelector('.response-actions')) return;
  const wrap = document.createElement('div');
  wrap.className = 'response-actions message-enter';
  const actions = [
    ['copy', '复制', 'action-copy'],
    ['like', '点赞', 'action-like'],
    ['dislike', '点踩', 'action-dislike'],
    ['play', '播放', 'action-play'],
    ['more', '更多', 'action-more']
  ];
  wrap.innerHTML = `
    <div class="response-action-left">
      ${actions.map(([key, label, icon]) => `<button class="response-action-btn response-action-${key}" type="button" aria-label="${label}">${renderActionIcon(icon)}<span>${label}</span></button>`).join('')}
    </div>
    <div class="response-cost" aria-label="已消耗 120 积分"><span>已消耗</span>${renderActionIcon('cost-points', 'cost-svg')}<strong>120</strong></div>`;
  main.appendChild(wrap);
}

async function renderFinal() {
  renderTiming();
  collapseProcessIntoTiming();
  await sleep(playback('stepDelay', 470));
  const main = $('#mainMd');
  await appendHTMLTypedTo(main, scenario.final.markdown ? markdownToHtml(scenario.final.markdown) : scenario.final.html);
  if (scenario.final && scenario.final.fileCard) {
    await appendHTMLTypedTo(main, renderFileCard(scenario.final.fileCard));
  }
  renderFinalActions();
  scrollToBottom();
}

// ── User / agent appearance ───────────────────────────────
async function showUserMessage() {
  $('#userBubble').textContent = scenario.userMessage;
  const wrap = $('#userMsgWrap');
  wrap.classList.remove('is-hidden');
  wrap.classList.add('message-enter');
  scrollToBottom();
  await sleep(playback('userMessageDelay', 720));
}

async function showAgentShell() {
  $('#agentName').textContent = scenario.agent.name;
  const agent = $('#agentMsg');
  agent.classList.remove('is-hidden');
  agent.classList.add('agent-enter');
  scrollToBottom();
  await sleep(playback('agentDelay', 520));
}

async function showThinkingLoading() {
  await runThinkingStatus();
}

// ── Collapse ──────────────────────────────────────────────
function collapseProcessIntoTiming() {
  execOpen = false;
  const execArea = $('#execArea');
  execArea.className = 'exec-area closed';
}

// ── DOM reset ─────────────────────────────────────────────
function resetPlaybackDom() {
  const userWrap = $('#userMsgWrap');
  const userBubble = $('#userBubble');
  const agent = $('#agentMsg');
  const execArea = $('#execArea');
  const timingMount = $('#timingMount');
  const thinkingMount = $('#thinkingMount');
  const stepsList = $('#stepsList');
  const main = $('#mainMd');
  const overlay = $('#overlay');

  execOpen = true;
  stepsOpen = true;
  stepSeq = 0;
  if (overlay) overlay.className = 'sheet-overlay';
  if (userBubble) userBubble.textContent = '';
  if (userWrap) userWrap.className = 'user-msg-wrap is-hidden';
  if (agent) agent.className = 'agent-msg is-hidden';
  if (timingMount) timingMount.innerHTML = '';
  if (thinkingMount) thinkingMount.innerHTML = '';
  if (stepsList) { stepsList.innerHTML = ''; stepsList.className = 'steps-list open'; }
  if (main) main.innerHTML = '';
  if (execArea) execArea.className = 'exec-area open is-hidden';
  scrollToBottom();
}

// ── Nav ───────────────────────────────────────────────────
function inferWorkspaceName() {
  try {
    const pathname = decodeURIComponent(window.location.pathname || '');
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) return segments[segments.length - 2];
  } catch (_) {}
  return '';
}

function setupNavMeta() {
  const nav = scenario.nav || {};
  const title = (nav.title || '').trim() || '项目需求讨论';
  const workspace = (nav.workspace || '').trim() || inferWorkspaceName() || '工作空间';
  const deviceName = (nav.deviceName || '').trim() || '设备名称';
  const subtitle = `${workspace} · ${deviceName}`;
  const titleEl = document.getElementById('navTitle');
  const subtitleEl = document.getElementById('navSubtitle');
  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) subtitleEl.textContent = subtitle;
}

// ── Director timeline ─────────────────────────────────────
function directorActionLabel(action) {
  if (action.type === 'status') return toDoneLabel(action);
  if (action.type === 'statusGroup') return action.actions.map(toDoneLabel).join('、');
  if (action.type === 'markdown') return '输出 markdown';
  if (action.type === 'html') return '输出内容';
  return '子节点';
}

function buildDirectorTimeline() {
  const timeline = [];
  timeline.push({ label: '用户消息', run: showUserMessage });
  timeline.push({ label: 'WorkBuddy 出现', run: showAgentShell });
  timeline.push({ label: '思考过程', run: showThinkingLoading });

  if (displayMode === 'flat') {
    // 平铺模式：跳过节点卡片，所有 action 直接渲染到一个平铺容器
    let containerReady = false;
    timeline.push({
      label: '创建平铺容器',
      run: async () => {
        const container = document.createElement('div');
        container.className = 'flat-container';
        $('#stepsList').appendChild(container);
        directorRuntime.flatContainer = container;
        containerReady = true;
        await sleep(playback('stepDelay', 470));
      }
    });
    scenario.nodes.forEach((node) => {
      const actions = normalizeActions(node.actions);
      actions.forEach((action) => {
        timeline.push({
          label: directorActionLabel(action),
          run: async () => {
            if (!containerReady) return;
            await runFlatAction(directorRuntime.flatContainer, action);
          }
        });
      });
    });
  } else {
    // 分组模式（默认）
    scenario.nodes.forEach((node, nodeIndex) => {
      timeline.push({
        label: `节点 ${nodeIndex + 1} 出现`,
        run: async () => {
          directorRuntime.rows[nodeIndex] = createStep(node);
          await sleep(playback('stepDelay', 470));
        }
      });
      const actions = normalizeActions(node.actions);
      actions.forEach((action, actionIndex) => {
        const isLastAction = actionIndex === actions.length - 1;
        timeline.push({
          label: `节点 ${nodeIndex + 1} · ${directorActionLabel(action)}`,
          run: async () => {
            const row = directorRuntime.rows[nodeIndex];
            await runNodeAction(row, action);
            if (isLastAction) {
              setStepIcon(row, true);
              row.classList.remove('open');
              await sleep(playback('stepDelay', 470));
            }
          }
        });
      });
    });
  }

  timeline.push({ label: '任务耗时与最终汇报', run: renderFinal });
  return timeline;
}

// ── Director controls ─────────────────────────────────────
function updateDirectorControls() {
  const prev = document.getElementById('ctrlPrevStep');
  const auto = document.getElementById('ctrlAutoStep');
  const next = document.getElementById('ctrlNextStep');
  const info = document.getElementById('ctrlStepInfo');
  const total = directorTimeline.length || 0;
  const atStart = currentDirectorIndex < 0;
  const atEnd = total > 0 && currentDirectorIndex >= total - 1;
  const locked = directorBusy || autoPlaying;
  if (prev) prev.disabled = locked || atStart;
  if (next) next.disabled = locked || atEnd;
  if (auto) {
    auto.disabled = directorBusy && !autoPlaying;
    auto.textContent = autoPlaying ? '停止' : '自动播放';
    auto.classList.toggle('is-playing', autoPlaying);
  }
  if (info) {
    const current = Math.max(0, currentDirectorIndex + 1);
    info.textContent = total ? `${current}/${total}` : '0/0';
  }
}

async function runDirectorStep(index) {
  const step = directorTimeline[index];
  if (!step) return false;
  await step.run();
  currentDirectorIndex = index;
  updateDirectorControls();
  return true;
}

async function runDirectorAutoLoop(token) {
  if (directorBusy) return;
  directorBusy = true;
  updateDirectorControls();
  try {
    await sleep(playback('autoStartDelay', 420));
    while (!pauseRequested && autoPlaying && token === activePlayId && currentDirectorIndex < directorTimeline.length - 1) {
      await runDirectorStep(currentDirectorIndex + 1);
    }
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    if (token === activePlayId) {
      directorBusy = false;
      autoPlaying = false;
      pauseRequested = false;
      updateDirectorControls();
    }
  }
}

function startDirectorAuto() {
  if (directorBusy || currentDirectorIndex >= directorTimeline.length - 1) return;
  autoPlaying = true;
  pauseRequested = false;
  updateDirectorControls();
  const token = activePlayId;
  runDirectorAutoLoop(token);
}

function stopDirectorAuto() {
  pauseRequested = true;
  autoPlaying = false;
  updateDirectorControls();
}

function toggleDirectorAuto() {
  if (autoPlaying) stopDirectorAuto();
  else startDirectorAuto();
}

async function directorNextStep() {
  if (directorBusy || autoPlaying || currentDirectorIndex >= directorTimeline.length - 1) return;
  directorBusy = true;
  updateDirectorControls();
  try {
    await runDirectorStep(currentDirectorIndex + 1);
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    directorBusy = false;
    updateDirectorControls();
  }
}

async function jumpDirectorTo(targetIndex) {
  if (directorBusy) return;
  stopDirectorAuto();
  incrementPlayId();
  directorBusy = true;
  setFastRender(true);
  updateDirectorControls();
  try {
    resetPlaybackDom();
    directorRuntime = { rows: [] };
    directorTimeline = buildDirectorTimeline();
    currentDirectorIndex = -1;
    const capped = Math.min(targetIndex, directorTimeline.length - 1);
    for (let i = 0; i <= capped; i++) {
      await runDirectorStep(i);
    }
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    setFastRender(false);
    directorBusy = false;
    updateDirectorControls();
  }
}

function directorPrevStep() {
  if (directorBusy || autoPlaying || currentDirectorIndex < 0) return;
  jumpDirectorTo(currentDirectorIndex - 1);
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

  // mode 参数：flat（平铺模式） / grouped（分组模式，默认）
  const modeParam = params.get('mode');
  if (modeParam === 'flat') displayMode = 'flat';

  // standalone 参数由 index.html 在首屏前处理，这里不再重复切 class

  const legacySpeed = params.get('typeSpeed');
  if (tpsRaw === null && legacySpeed !== null && legacySpeed !== '') {
    const value = Number(legacySpeed);
    if (Number.isFinite(value) && value > 0) scenario.playback.tokensPerSecond = Math.round(1000 / value);
  }
}

function setupDemoControls() {
  const tps = document.getElementById('ctrlTokensPerSecond');
  const replay = document.getElementById('ctrlReplay');
  const prev = document.getElementById('ctrlPrevStep');
  const auto = document.getElementById('ctrlAutoStep');
  const next = document.getElementById('ctrlNextStep');
  if (!tps || !replay) return;

  tps.value = currentTokensPerSecond();
  const syncPlayback = () => {
    const value = Math.min(1000, Math.max(20, Math.round(Number(tps.value) || 200)));
    scenario.playback.tokensPerSecond = value;
    tps.value = value;
  };
  tps.addEventListener('change', syncPlayback);
  tps.addEventListener('input', () => {
    const value = Number(tps.value);
    if (Number.isFinite(value)) scenario.playback.tokensPerSecond = Math.min(1000, Math.max(20, value));
  });
  replay.onclick = () => { syncPlayback(); restartPlayback(); };
  if (prev) prev.onclick = () => directorPrevStep();
  if (next) next.onclick = () => directorNextStep();
  if (auto) auto.onclick = () => toggleDirectorAuto();

  const groupBtn = document.getElementById('ctrlModeGrouped');
  const flatBtn = document.getElementById('ctrlModeFlat');
  if (groupBtn) {
    groupBtn.onclick = () => toggleDisplayMode('grouped');
  }
  if (flatBtn) {
    flatBtn.onclick = () => toggleDisplayMode('flat');
  }

  syncDisplayModeUI();
  updateDirectorControls();

  // ── 显示 commit hash ──────────────────────────────────
  // 数据来源统一由 commit-hash.js 提供（window.commitHashReady）
  const hashEl = document.getElementById('ctrlCommitHash');
  if (hashEl && window.commitHashReady) {
    window.commitHashReady.then((h) => { hashEl.textContent = h; });
  }
}

// ── Playback lifecycle ────────────────────────────────────
function initializePlayback() {
  autoPlaying = false;
  pauseRequested = false;
  directorBusy = false;
  setFastRender(false);
  currentDirectorIndex = -1;
  directorRuntime = { rows: [] };
  syncDisplayModeUI();
  setupNavMeta();
  resetPlaybackDom();
  directorTimeline = buildDirectorTimeline();
  updateDirectorControls();
}

function restartPlayback() {
  incrementPlayId();
  initializePlayback();
  startDirectorAuto();
}

function startPlayback() {
  incrementPlayId();
  initializePlayback();
  startDirectorAuto();
}

// ── Toggle handlers (called from HTML inline onclick) ─────
export function toggleStep(id) { document.getElementById(id).classList.toggle('open'); }
export function toggleExec() {
  execOpen = !execOpen;
  $('#execArea').className = 'exec-area ' + (execOpen ? 'open' : 'closed');
  const arrow = $('#timingArrow');
  if (arrow) {
    arrow.src = execOpen ? './icons/up.svg' : './icons/right.svg';
    arrow.className = 'timing-arrow' + (execOpen ? '' : ' collapsed');
  }
}
export function toggleSteps() {
  stepsOpen = !stepsOpen;
  $('#stepsList').className = 'steps-list ' + (stepsOpen ? 'open' : 'closed');
}

// ── Global window bindings (HTML inline onclick needs these) ──
window.openSheet = openSheet;
window.closeSheet = closeSheet;
window.maybeClose = maybeClose;
window.toggleStep = toggleStep;
window.toggleExec = toggleExec;
window.toggleSteps = toggleSteps;

// ── Bootstrap (type="module" is auto-deferred, DOM is ready) ──
applyUrlPlaybackOverrides();
setupDemoControls();
startPlayback();
