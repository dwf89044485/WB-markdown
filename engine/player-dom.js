// ============================================================
// PLAYER DOM — DOM rendering & orchestration
// ============================================================
// 状态行渲染 · 对话气泡 · 预聊 · 思考态 · 重置 · 折叠

import {
  activePlayId, fastRender,
  incrementPlayId, setFastRender,
  sleepDelay, playback, CANCELLED,
  scrollToBottom, scrollIfFull, scrollUserToTop, initScrollGuard
} from './core.js';
import { escapeHtml, markdownToHtml } from './markdown.js';
import { setStatusLineLabels, statusStackHTML } from './icons.js';
import { appendHTMLTypedTo, appendHTML, appendMarkdown } from './typewriter.js';
import { openSheet, renderFileCard } from './sheet.js';
import { initScrollNav, rebuildScrollNav } from './scroll-nav.js';
import { showAskQuestion, bindAskQuestionEvents } from './ask-question.js';
import { showApprovePermission, bindApprovePermissionEvents } from './approve-permission.js';
import { hideAllOverlays } from './overlay-registry.js';
import {
  scenario, $, state,
  truncate, toDoneLabel, toRunningLabel, joinLabels, splitStatusLabels,
  RESPONSE_SVGS, setComposerGenerating
} from './player-state.js';

// AI 头像 SVG（与 index.html 一致）
const AGENT_AVATAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle fill="#000" fill-opacity="0.7" cx="12" cy="12" r="12"/><clipPath id="clip_0"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#clip_0)"><path fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 -0.803674 14.0118)" d="M3.3094 0.8611C3.486 0.3278 3.6141 0.12 3.8253 0.0334C3.9535 -0.0185 4.2513 0.023 4.5733 0.1373C5.3802 0.4317 6.9108 1.4705 8.5072 2.8106L8.6734 2.9492L9.2863 2.8245C10.3044 2.6167 10.945 2.5405 12.067 2.5025C13.2375 2.4609 14.4633 2.5786 15.7584 2.8591L16.174 2.9492L16.6588 2.5544C18.4006 1.1312 19.8827 0.1962 20.6446 0.0404C20.9077 -0.0151 20.9216 -0.0151 21.0532 0.0507C21.2679 0.1546 21.3995 0.3624 21.5518 0.8403C21.9085 1.9553 22.144 3.9603 22.1024 5.5325L22.0851 6.1419L22.3379 6.5229C22.5803 6.8934 22.937 7.5721 23.0617 7.8976C23.1171 8.0465 23.1309 8.0569 23.266 8.0777C23.8754 8.1712 24.4399 8.8395 24.7204 9.8057C24.9732 10.6749 24.9801 11.9146 24.7411 12.808C24.6996 12.95 24.5853 13.2408 24.4849 13.4486C24.1282 14.1758 23.5811 14.6052 23.0028 14.6087C22.885 14.6087 22.8712 14.6191 22.7465 14.8407C22.1613 15.9003 21.2748 16.7834 20.1182 17.476C18.8162 18.2516 16.9912 18.778 14.8027 19.0031C13.6253 19.1277 11.0039 19.1381 9.8854 19.0273C7.2086 18.7572 5.2936 18.1408 3.9188 17.1054C3.0981 16.489 2.2982 15.5679 1.9381 14.8269C1.8446 14.6295 1.8238 14.6087 1.6853 14.574C0.9477 14.3905 0.3348 13.5387 0.082 12.3509C-0.0184 11.8765 -0.0288 10.848 0.0612 10.3528C0.2759 9.1962 0.8438 8.3686 1.5953 8.1123C1.7892 8.0465 1.7961 8.0431 1.9 7.8041C2.0697 7.4128 2.364 6.8588 2.5856 6.5194L2.7899 6.2008L2.8003 5.0477C2.8211 3.2539 2.9943 1.8376 3.3094 0.8611ZM4.012 9.5945C3.9259 10.0251 3.9259 10.5458 3.9259 11.5872C3.9259 12.6285 3.9259 13.1492 4.012 13.5799C4.3612 15.3257 5.7365 16.701 7.4823 17.0502C7.913 17.1363 8.4337 17.1363 9.475 17.1363L15.4571 17.1363C16.4985 17.1363 17.0192 17.1363 17.4498 17.0502C19.1956 16.701 20.5709 15.3257 20.9202 13.5799C21.0063 13.1492 21.0063 12.6285 21.0063 11.5872C21.0063 10.5458 21.0063 10.0251 20.9202 9.5945C20.5709 7.8487 19.1956 6.4734 17.4498 6.1242H7.4823C5.7365 6.4734 4.3612 7.8487 4.012 9.5945Z"/><rect fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 10.9199 18.1232)" width="2.0465" height="4.2504" rx="1.0233"/><rect fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 16.4414 14.9355)" width="2.0465" height="4.2504" rx="1.0233"/></g></svg>';

// ── Status line ───────────────────────────────────────────
function createStatusLineIn(container, text, frameIds, title) {
  const btn = document.createElement('button');
  btn.className = 'step-detail-link is-running status-line-enter';
  btn.dataset.frames = (frameIds || []).join(',');
  btn.dataset.sheetTitle = title || '';
  setStatusLineLabels(btn, splitStatusLabels(text));
  btn.onclick = () => openSheet(btn.dataset.frames, btn.dataset.sheetTitle, { replay: btn.classList.contains('is-running') });
  container.appendChild(btn);
  scrollIfFull();
  return btn;
}

// ── Status group runner ───────────────────────────────────
async function runStatusGroup(row, actions, container) {
  const firstFrames = actions[0].frames || [];
  const completedLabels = [];
  const completedFinalFrames = [];
  const initialTitle = actions.map(toDoneLabel).join('、');
  const line = createStatusLineIn(container, joinLabels([toRunningLabel(actions[0])]), firstFrames[0] ? [firstFrames[0]] : [], initialTitle);

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const frames = action.frames || [];
    const runningLabels = completedLabels.concat(toRunningLabel(action));

    setStatusLineLabels(line, runningLabels);
    line.dataset.sheetTitle = completedLabels.concat(toDoneLabel(action)).join('、');

    for (const frameId of frames) {
      line.dataset.frames = completedFinalFrames.concat(frameId).join(',');
      line.dataset.sheetTitle = completedLabels.concat(toDoneLabel(action)).join('、');
      await sleepDelay('frameDelay', 520);
    }

    completedLabels.push(toDoneLabel(action));
    if (frames.length) completedFinalFrames.push(...frames);
    setStatusLineLabels(line, completedLabels);
    line.dataset.frames = completedFinalFrames.join(',');
    line.dataset.sheetTitle = completedLabels.join('、');

    if (index < actions.length - 1) await sleepDelay('stepDelay', 470, 0.3);
  }

  line.classList.remove('is-running');
  if (state.toolCallStyle === 'stack') {
    collapseToStack(line, completedLabels);
  }
  await sleepDelay('stepDelay', 470, 0.55);
}

async function runStatus(row, action) {
  await runStatusGroup(row, [action]);
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
  if (action.type === 'askUser') {
    if (fastRender) {
      // 快进渲染时跳过 askUser 卡片，不阻塞也不残留
    } else {
      const result = await showAskQuestion(action.questions);
      console.log('[AskUser] answers:', result);
    }
  }
  if (action.type === 'approvePermission') {
    if (fastRender) {
      // 快进渲染时跳过
    } else {
      const result = await showApprovePermission(action.data);
      console.log('[ApprovePermission] selected:', result);
    }
  }
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
    await sleepDelay('frameDelay', 520);
  }
  setStatusLineLabels(line, [toDoneLabel(action)]);
  line.dataset.frames = frames.join(',');
  line.dataset.sheetTitle = toDoneLabel(action);
  line.classList.remove('is-running');
  stepsList.classList.remove('is-hidden');
  scrollIfFull();
  await sleepDelay('stepDelay', 470);
}

// ── Collapse helpers ──────────────────────────────────────
export function collapseToStack(line, labels) {
  if (!labels || !labels.length) return;
  line.innerHTML = statusStackHTML(labels) + '<span class="status-chevron">›</span>';
}

// ── Static pre-chat rounds ───────────────────────────────
function makeResponseActionsHtml() {
  const btns = [
    ['copy', '复制', RESPONSE_SVGS.copy],
    ['regenerate', '重新生成', RESPONSE_SVGS.refresh],
    ['share', '分享', RESPONSE_SVGS.share],
    ['more', '更多', RESPONSE_SVGS.more],
  ];
  return '<div class="response-actions" style="margin:0 0 8px 0">'
    + '<div class="response-action-left" style="position:relative">'
    + btns.map(([key, label, svg]) =>
      `<span class="response-action-btn response-action-${key}" style="cursor:default">${svg}<span>${label}</span></span>`
    ).join('')
    + '<span class="response-cost" aria-label="已消耗 120 积分"><span>已消耗</span>'
    + RESPONSE_SVGS.cost + '<strong>120</strong></span>'
    + '</div>'
    + '<div class="response-action-right"><span class="response-action-source" style="cursor:default"><span class="source-avatars"><span class="source-avatar"><img src="icons/source-weibo.svg" alt=""></span><span class="source-avatar"><img src="icons/source-amazon.svg" alt=""></span><span class="source-avatar"><img src="icons/source-dribbble.svg" alt=""></span></span><span class="source-label">10来源</span></span></div>'
    + '</div>';
}

export function renderStaticPreChat(skipScroll) {
  const preChat = scenario.preChat;
  if (!preChat || !preChat.length) return;

  const conv = document.getElementById('conv');
  const ref = document.getElementById('userMsgWrap');

  // 第一轮用户消息（来自 scenario.userMessage）
  const firstUserWrap = document.createElement('div');
  firstUserWrap.className = 'user-msg-wrap prechat-static';
  firstUserWrap.innerHTML = '<div class="user-bubble">' + escapeHtml(scenario.userMessage) + '</div>';
  conv.insertBefore(firstUserWrap, ref);

  for (let i = 0; i < preChat.length; i++) {
    const round = preChat[i];
    const isLast = i === preChat.length - 1;

    // AI 回复（含底部操作栏）
    const agentDiv = document.createElement('div');
    agentDiv.className = 'agent-msg prechat-static';
    agentDiv.innerHTML = '<div class="agent-header">'
      + '<div class="agent-avatar">' + AGENT_AVATAR_SVG + '</div>'
      + '<span class="agent-name">' + scenario.agent.name + '</span>'
      + '</div>'
      + '<div class="md md-node">' + markdownToHtml(round.agent) + '</div>'
      + makeResponseActionsHtml();
    conv.insertBefore(agentDiv, ref);

    // 最后一条用户消息由 showUserMessage() 动画展示，这里跳过
    if (isLast) continue;

    // 用户回复
    const userWrap = document.createElement('div');
    userWrap.className = 'user-msg-wrap prechat-static';
    userWrap.innerHTML = '<div class="user-bubble">' + escapeHtml(round.user) + '</div>';
    conv.insertBefore(userWrap, ref);
  }

  // 初始显示第四轮用户消息，滚动到 navbar 下方
  const lastChat = preChat[preChat.length - 1];
  if (lastChat) {
    $('#userBubble').textContent = lastChat.user;
    $('#userMsgWrap').classList.remove('is-hidden');
  }
  if (skipScroll) return;
  // scrollTop = ref 相对 conv 的位置 - navbar 高度 - 间距
  const navBar = conv.querySelector('.nav-bar');
  const navHeight = navBar ? navBar.offsetHeight : 0;
  const scrollTarget = (ref.offsetTop - conv.offsetTop) - navHeight - 12;
  if (scrollTarget > 0) conv.scrollTop = scrollTarget;
}

// ── User / agent appearance ───────────────────────────────
export async function showUserMessage() {
  // 使用 preChat 最后一条作为触发消息，无 preChat 时回退到 userMessage
  const chat = scenario.preChat;
  const trigger = (chat && chat.length) ? chat[chat.length - 1].user : scenario.userMessage;
  $('#userBubble').textContent = trigger;
  const wrap = $('#userMsgWrap');
  wrap.classList.remove('is-hidden');
  wrap.classList.add('message-enter');
  // 用户消息上屏后，滚动到视口顶端（navbar 下方），为 AI 回复腾空间
  scrollUserToTop();
  rebuildScrollNav();
  await sleepDelay('userMessageDelay', 720);
}

export async function showAgentShell() {
  $('#agentName').textContent = scenario.agent.name;
  const agent = $('#agentMsg');
  agent.classList.remove('is-hidden');
  agent.classList.add('agent-enter');
  scrollIfFull();
  rebuildScrollNav();
  await sleepDelay('agentDelay', 520);
}

export async function showThinkingLoading() {
  await runThinkingStatus();
}

// ── DOM reset ─────────────────────────────────────────────
export function resetPlaybackDom() {
  // 清理 preChat 静态元素
  document.querySelectorAll('.prechat-static').forEach(el => el.remove());

  const userWrap = $('#userMsgWrap');
  const userBubble = $('#userBubble');
  const agent = $('#agentMsg');
  const execArea = $('#execArea');
  const timingMount = $('#timingMount');
  const thinkingMount = $('#thinkingMount');
  const stepsList = $('#stepsList');
  const main = $('#mainMd');
  const mainBiz = $('#mainBiz');
  const mainActions = $('#mainActions');
  const overlay = $('#overlay');
  const tblOverlay = $('#tblOverlay');
  const phoneShell = $('.phone-shell');

  state.execOpen = true;
  state.stepsOpen = true;
  state.stepSeq = 0;
  if (overlay) overlay.className = 'sheet-overlay';
  if (tblOverlay) tblOverlay.classList.remove('is-active', 'tbl-mobile', 'tbl-mobile-portrait', 'tbl-mobile-landscape');
  if (phoneShell) phoneShell.classList.remove('tbl-landscape');
  if (userBubble) userBubble.textContent = '';
  if (userWrap) userWrap.className = 'user-msg-wrap is-hidden';
  if (agent) agent.className = 'agent-msg is-hidden';
  if (timingMount) timingMount.innerHTML = '';
  if (thinkingMount) thinkingMount.innerHTML = '';
  if (stepsList) { stepsList.innerHTML = ''; stepsList.className = 'steps-list open'; }
  if (main) main.innerHTML = '';
  if (mainBiz) mainBiz.innerHTML = '';
  if (mainActions) mainActions.innerHTML = '';
  if (execArea) { execArea.className = 'exec-area open is-hidden'; execArea.removeAttribute('style'); }
  setComposerGenerating(false);
  // 清理覆层面板（#askQuestion / #approvePermission 等）。
  // 所有跳转（goToStep / directorPrevStep / directorNextStep / restartPlayback）
  // 都经过 resetPlaybackDom，因此内置清理可覆盖所有路径。
  // 新增面板类型 → 在面板模块中 registerOverlayCleanup(hideXxx)，无需改此文件。
  hideAllOverlays();
  initScrollGuard();
  scrollToBottom();
}

// ── Composer generating (exported for player.js & player-final.js) ──
export { setComposerGenerating } from './player-state.js';

// ── Nav ───────────────────────────────────────────────────
function inferWorkspaceName() {
  try {
    const pathname = decodeURIComponent(window.location.pathname || '');
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) return segments[segments.length - 2];
  } catch (_) {}
  return '';
}

export function setupNavMeta() {
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

// ── Toggle handlers (called from HTML inline onclick) ─────
export function toggleStep(id) { document.getElementById(id).classList.toggle('open'); }

export function toggleExec() {
  const execArea = $('#execArea');
  const arrow = $('#timingArrow');
  if (!execArea) return;

  if (state.execOpen) {
    // ── 收起：动画 collapse → transitionend 后 display:none ──
    const contentHeight = execArea.scrollHeight;
    execArea.style.maxHeight = contentHeight + 'px';
    execArea.style.transition = 'max-height 0.3s ease-out';
    // 强制重排，锁定当前高度作为动画起点
    execArea.offsetHeight;
    execArea.style.maxHeight = '0px';

    const handler = () => {
      execArea.style.display = 'none';
      execArea.style.maxHeight = '';
      execArea.style.transition = '';
      execArea.removeEventListener('transitionend', handler);
    };
    execArea.addEventListener('transitionend', handler, { once: true });

    if (arrow) arrow.className = 'timing-arrow collapsed';
    state.execOpen = false;
  } else {
    // ── 展开：display:flex → 等浏览器稳定 → 动画到 full ──
    execArea.style.display = 'flex';
    execArea.style.maxHeight = '0px';
    execArea.style.transition = 'none';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        execArea.style.transition = 'max-height 1.2s ease-in-out';
        execArea.style.maxHeight = '2000px';
      });
    });

    if (arrow) arrow.className = 'timing-arrow';
    state.execOpen = true;
  }
}

export function toggleSteps() {
  state.stepsOpen = !state.stepsOpen;
  const stepsList = $('#stepsList');
  if (stepsList) stepsList.className = 'steps-list ' + (state.stepsOpen ? 'open' : 'closed');
}

// ── Re-export runtime functions used by player.js ─────────
export { runStatusGroup, runFlatAction, runThinkingStatus };
