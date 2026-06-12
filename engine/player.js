// ============================================================
// PLAYER — Director timeline · playback controls · DOM orchestration
// ============================================================

import {
  activePlayId, fastRender,
  incrementPlayId, setFastRender,
  sleep, sleepDelay, playback, currentTokensPerSecond, CANCELLED,
  scrollToBottom
} from './core.js';
import { escapeHtml, markdownToHtml } from './markdown.js';
import { ICONS, setStatusLineLabels, statusLineHTML, renderActionIcon, statusStackHTML } from './icons.js';
import { renderSearchItem } from './sheet.js';
import { appendHTMLTypedTo, appendHTML, appendMarkdown } from './typewriter.js';
import { openSheet, closeSheet, maybeClose, renderFileCard } from './sheet.js';
import { initScrollNav, rebuildScrollNav } from './scroll-nav.js';

const scenario = window.WORKBUDDY_SCENARIO;
const designNotes = window.WORKBUDDY_DESIGN_NOTES || {};
const $ = (sel, root = document) => root.querySelector(sel);

// AI 头像 SVG（与 index.html 一致）
const AGENT_AVATAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle fill="#000" fill-opacity="0.7" cx="12" cy="12" r="12"/><clipPath id="clip_0"><circle cx="12" cy="12" r="12"/></clipPath><g clip-path="url(#clip_0)"><path fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 -0.803674 14.0118)" d="M3.3094 0.8611C3.486 0.3278 3.6141 0.12 3.8253 0.0334C3.9535 -0.0185 4.2513 0.023 4.5733 0.1373C5.3802 0.4317 6.9108 1.4705 8.5072 2.8106L8.6734 2.9492L9.2863 2.8245C10.3044 2.6167 10.945 2.5405 12.067 2.5025C13.2375 2.4609 14.4633 2.5786 15.7584 2.8591L16.174 2.9492L16.6588 2.5544C18.4006 1.1312 19.8827 0.1962 20.6446 0.0404C20.9077 -0.0151 20.9216 -0.0151 21.0532 0.0507C21.2679 0.1546 21.3995 0.3624 21.5518 0.8403C21.9085 1.9553 22.144 3.9603 22.1024 5.5325L22.0851 6.1419L22.3379 6.5229C22.5803 6.8934 22.937 7.5721 23.0617 7.8976C23.1171 8.0465 23.1309 8.0569 23.266 8.0777C23.8754 8.1712 24.4399 8.8395 24.7204 9.8057C24.9732 10.6749 24.9801 11.9146 24.7411 12.808C24.6996 12.95 24.5853 13.2408 24.4849 13.4486C24.1282 14.1758 23.5811 14.6052 23.0028 14.6087C22.885 14.6087 22.8712 14.6191 22.7465 14.8407C22.1613 15.9003 21.2748 16.7834 20.1182 17.476C18.8162 18.2516 16.9912 18.778 14.8027 19.0031C13.6253 19.1277 11.0039 19.1381 9.8854 19.0273C7.2086 18.7572 5.2936 18.1408 3.9188 17.1054C3.0981 16.489 2.2982 15.5679 1.9381 14.8269C1.8446 14.6295 1.8238 14.6087 1.6853 14.574C0.9477 14.3905 0.3348 13.5387 0.082 12.3509C-0.0184 11.8765 -0.0288 10.848 0.0612 10.3528C0.2759 9.1962 0.8438 8.3686 1.5953 8.1123C1.7892 8.0465 1.7961 8.0431 1.9 7.8041C2.0697 7.4128 2.364 6.8588 2.5856 6.5194L2.7899 6.2008L2.8003 5.0477C2.8211 3.2539 2.9943 1.8376 3.3094 0.8611ZM4.012 9.5945C3.9259 10.0251 3.9259 10.5458 3.9259 11.5872C3.9259 12.6285 3.9259 13.1492 4.012 13.5799C4.3612 15.3257 5.7365 16.701 7.4823 17.0502C7.913 17.1363 8.4337 17.1363 9.475 17.1363L15.4571 17.1363C16.4985 17.1363 17.0192 17.1363 17.4498 17.0502C19.1956 16.701 20.5709 15.3257 20.9202 13.5799C21.0063 13.1492 21.0063 12.6285 21.0063 11.5872C21.0063 10.5458 21.0063 10.0251 20.9202 9.5945C20.5709 7.8487 19.1956 6.4734 17.4498 6.1242H7.4823C5.7365 6.4734 4.3612 7.8487 4.012 9.5945Z"/><rect fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 10.9199 18.1232)" width="2.0465" height="4.2504" rx="1.0233"/><rect fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 16.4414 14.9355)" width="2.0465" height="4.2504" rx="1.0233"/></g></svg>';

function resolveDesignNotes(stepIndex) {
  const intro = designNotes.intro || null;
  const byStep = designNotes.byStep || {};

  const normalized = Number.isInteger(stepIndex) ? stepIndex : -1;
  if (normalized >= 0 && Object.prototype.hasOwnProperty.call(byStep, normalized)) {
    return byStep[normalized];
  }

  if (normalized >= 0) {
    const nearest = Object.keys(byStep)
      .map((key) => Number(key))
      .filter((key) => Number.isFinite(key) && key <= normalized)
      .sort((a, b) => b - a)[0];
    if (nearest !== undefined) return byStep[nearest];
  }

  return intro;
}

function renderDesignNotesError(err) {
  const container = document.querySelector('.design-notes-inner');
  if (!container) return;
  const message = escapeHtml(String(err?.message || err || '未知错误'));
  container.innerHTML = `<div class="design-notes-error">右侧说明渲染失败：${message}</div>`;
}

function renderDesignNotes(stepIndex) {
  const container = document.querySelector('.design-notes-inner');
  if (!container) return;

  try {
    const note = resolveDesignNotes(stepIndex);
    if (!note) {
      container.innerHTML = '<span class="design-notes-placeholder">交互设计说明</span>';
      return;
    }

    const title = escapeHtml(note.title || '交互设计说明');
    const body = note.body ? `<p class="design-notes-body">${escapeHtml(note.body)}</p>` : '';
    const items = Array.isArray(note.items) && note.items.length
      ? `<ul class="design-notes-list">${note.items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('')}</ul>`
      : '';

    container.innerHTML = `
      <article class="design-note-card">
        <h3 class="design-notes-title">${title}</h3>
        ${body}
        ${items}
      </article>
    `;
  } catch (err) {
    renderDesignNotesError(err);
    throw err;
  }
}

function panelRoots() {
  const roots = [document];
  const phonePanel = document.getElementById('phoneControls');
  if (phonePanel && phonePanel.classList.contains('is-open')) {
    roots.push(phonePanel);
  }
  return roots;
}

// ── State ──────────────────────────────────────────────────
const displayMode = 'flat';
let toolCallStyle = 'flat'; // 'card' | 'flat' | 'stack'
let execOpen = true;
let stepsOpen = true;
let stepSeq = 0;
let directorTimeline = [];
let directorRuntime = {};
let currentDirectorIndex = -1;
let autoPlaying = false;
let directorBusy = false;
let pauseRequested = false;
let directorSkipSeq = 0;

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

// ── Status line ───────────────────────────────────────────
function createStatusLineIn(container, text, frameIds, title) {
  const btn = document.createElement('button');
  btn.className = 'step-detail-link is-running status-line-enter';
  btn.dataset.frames = (frameIds || []).join(',');
  btn.dataset.sheetTitle = title || '';
  setStatusLineLabels(btn, splitStatusLabels(text));
  btn.onclick = () => openSheet(btn.dataset.frames, btn.dataset.sheetTitle, { replay: btn.classList.contains('is-running') });
  container.appendChild(btn);
  scrollToBottom();
  return btn;
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
  if (toolCallStyle === 'stack') {
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
  scrollToBottom();
  await sleepDelay('stepDelay', 470);
}

// ── Final render ──────────────────────────────────────────
function renderTiming() {
  $('#timingMount').innerHTML = `
    <div class="timing-bar timing-enter" onclick="toggleExec()" role="button" tabindex="0" aria-label="折叠/展开执行过程">
      <span class="timing-text">${scenario.final.timing}</span>
      <img class="timing-arrow" id="timingArrow" src="./icons/right.svg" alt="">
    </div>`;
}

// ── Inline SVG for response action buttons (bypasses registry for reliability) ──
const RESPONSE_SVGS = (() => {
  const s = (svg, cls) => svg.replace('<svg', `<svg class="${cls}" aria-hidden="true" focusable="false"`);
  return {
    copy: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><path fill="#000" transform="matrix(1 0 0 1 1.58943 0.657074)" d="M3.7804 11.4101Q3.1921 11.4035 2.9264 11.3839Q2.2536 11.3344 1.8193 11.1371Q0.7581 10.6552 0.2762 9.5941Q0.079 9.1598 0.0294 8.487Q0 8.0876 0 6.9589L0 4.8155Q0 3.3828 0.0469 2.8798Q0.126 2.0311 0.4397 1.5078Q0.84 0.84 1.5078 0.4397Q2.0311 0.126 2.8798 0.0469Q3.3828 0 4.8155 0L6.0922 0Q6.7465 0 6.9587 0.0294Q7.9864 0.1715 8.7229 0.908Q9.4594 1.6445 9.6016 2.6722Q9.6309 2.8845 9.6309 3.5387L8.6137 3.5387C10.3989 3.5399 11.3221 3.5643 11.9644 4.0633C12.1299 4.1918 12.2788 4.3407 12.4073 4.5062C12.9319 5.1815 12.9319 6.1672 12.9319 8.1386L12.9319 9.2787C12.9319 11.2501 12.9319 12.2358 12.4073 12.9111C12.2788 13.0766 12.1299 13.2255 11.9644 13.354C11.2891 13.8786 10.3034 13.8786 8.332 13.8786C6.3605 13.8786 5.3748 13.8786 4.6995 13.354C4.534 13.2255 4.3852 13.0766 4.2566 12.9111C3.9691 12.5411 3.8392 12.0778 3.7804 11.4101ZM3.7346 10.205Q2.6043 10.1757 2.3155 10.0445Q1.6645 9.7489 1.3689 9.0979Q1.2 8.7261 1.2 6.9589L1.2 4.8155Q1.2 3.4386 1.2417 2.9911Q1.2955 2.4141 1.4689 2.1248Q1.7148 1.7148 2.1248 1.4689Q2.4141 1.2955 2.9911 1.2417Q3.4386 1.2 4.8155 1.2L6.0922 1.2Q6.6639 1.2 6.7943 1.218Q7.4229 1.305 7.8744 1.7565Q8.326 2.208 8.4129 2.8366Q8.4309 2.967 8.4309 3.5387L8.332 3.5387C6.3605 3.5387 5.3748 3.5387 4.6995 4.0633C4.534 4.1918 4.3852 4.3407 4.2566 4.5062C3.732 5.1815 3.732 6.1672 3.732 8.1386L3.732 9.2787C3.732 9.615 3.732 9.9226 3.7346 10.205ZM4.932 8.1386L4.932 9.2787Q4.932 10.9357 4.9899 11.4455Q5.0502 11.9767 5.2042 12.1749Q5.3054 12.3052 5.4357 12.4064Q5.6339 12.5604 6.1651 12.6207Q6.6749 12.6786 8.332 12.6786Q9.989 12.6786 10.4988 12.6207Q11.03 12.5604 11.2282 12.4064Q11.3585 12.3052 11.4597 12.1749Q11.6137 11.9767 11.674 11.4455Q11.7319 10.9357 11.7319 9.2787L11.7319 8.1386Q11.7319 6.4816 11.674 5.9718Q11.6137 5.4406 11.4597 5.2424Q11.3585 5.1121 11.2282 5.0109Q11.03 4.8569 10.4988 4.7966Q9.989 4.7387 8.332 4.7387Q6.6749 4.7387 6.1651 4.7966Q5.6339 4.8569 5.4357 5.0109Q5.3054 5.1121 5.2042 5.2424Q5.0502 5.4406 4.9899 5.9718Q4.932 6.4816 4.932 8.1386Z" fill-rule="evenodd"/></svg>`, 'action-svg'),
    refresh: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><path fill="#000" transform="matrix(1 0 0 1 0.899994 0.899994)" d="M14.2 7.1Q14.2 10.0409 12.1205 12.1205Q10.0409 14.2 7.1 14.2Q4.1591 14.2 2.0796 12.1205Q0 10.0409 0 7.1Q0 4.1591 2.0796 2.0796Q4.1591 0 7.1 0Q9.3561 0 11.1927 1.2977Q12.215 2.0199 12.9034 2.996L12.9034 0.6971L14.1034 0.6971L14.1034 3.5507Q14.1034 3.9951 14.0796 4.1696Q14.0248 4.5714 13.7812 4.8149Q13.5377 5.0584 13.1359 5.1133Q12.9614 5.1371 12.517 5.1371L9.6634 5.1371L9.6634 3.9371L12.0878 3.9371Q11.4776 2.9682 10.5003 2.2777Q8.9749 1.2 7.1 1.2Q4.6561 1.2 2.9281 2.9281Q1.2 4.6561 1.2 7.1Q1.2 9.5439 2.9281 11.2719Q4.6561 13 7.1 13Q9.5439 13 11.2719 11.2719Q13 9.5439 13 7.1L14.2 7.1Z" fill-rule="evenodd"/></svg>`, 'action-svg'),
    like: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><path fill="#000" transform="matrix(1 0 0 1 1.00006 0.715578)" d="M9.9326 0.6877C9.0155 0 7.71 0.2138 7.0605 1.1584L4.1807 5.3488L2.0166 5.3488C0.9029 5.3488 0 6.2517 0 7.3654L0 11.6154C0 12.7292 0.9029 13.632 2.0166 13.632L9.7227 13.632C11.7051 13.6318 13.4097 12.2265 13.7881 10.2805L14.1553 8.3918C14.4823 6.7097 13.1941 5.1467 11.4805 5.1467L10.5293 5.1467L10.9717 4.26C11.5586 3.0825 11.2204 1.6539 10.168 0.8645L9.9326 0.6877ZM8.0498 1.8381C8.3129 1.4558 8.8416 1.3692 9.2129 1.6477L9.4482 1.8244C10.0371 2.2663 10.226 3.0659 9.8975 3.7248L9.0234 5.4787C8.9308 5.6646 8.9406 5.885 9.0498 6.0617C9.1592 6.2384 9.3527 6.3469 9.5605 6.3468L11.4805 6.3468C12.4394 6.3469 13.1604 7.221 12.9775 8.1623L12.6104 10.052C12.3416 11.4341 11.1307 12.4316 9.7227 12.4318L4.8691 12.4318C4.8689 12.4305 4.8686 12.4292 4.8683 12.4279L3.6368 12.432L3.6367 12.4318L2.0166 12.4318C1.5656 12.4318 1.2002 12.0664 1.2002 11.6154L1.2002 7.3654C1.2002 6.9144 1.5656 6.549 2.0166 6.549L3.7051 6.549C3.4893 7.5447 3.375 8.5785 3.375 9.6389C3.375 10.2341 3.4109 10.8209 3.4805 11.3973L4.6907 11.3973C4.6146 10.8219 4.5752 10.235 4.5752 9.6389C4.5752 8.4735 4.7248 7.3431 5.0059 6.2658L8.0498 1.8381Z" fill-rule="evenodd"/></svg>`, 'action-svg'),
    dislike: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><path fill="#000" transform="matrix(-1 0 0 -1 15.2412 15.2473)" d="M9.9326 0.6877C9.0155 0 7.71 0.2138 7.0605 1.1584L4.1807 5.3488L2.0166 5.3488C0.9029 5.3488 0 6.2517 0 7.3654L0 11.6154C0 12.7292 0.9029 13.632 2.0166 13.632L9.7227 13.632C11.7051 13.6318 13.4097 12.2265 13.7881 10.2805L14.1553 8.3918C14.4823 6.7097 13.1941 5.1467 11.4805 5.1467L10.5293 5.1467L10.9717 4.26C11.5586 3.0825 11.2204 1.6539 10.168 0.8645L9.9326 0.6877ZM8.0498 1.8381C8.3129 1.4558 8.8416 1.3692 9.2129 1.6477L9.4482 1.8244C10.0371 2.2663 10.226 3.0659 9.8975 3.7248L9.0234 5.4787C8.9308 5.6646 8.9406 5.885 9.0498 6.0617C9.1592 6.2384 9.3527 6.3469 9.5605 6.3468L11.4805 6.3468C12.4394 6.3469 13.1604 7.221 12.9775 8.1623L12.6104 10.052C12.3416 11.4341 11.1307 12.4316 9.7227 12.4318L4.8691 12.4318C4.8689 12.4305 4.8686 12.4292 4.8683 12.4279L3.6368 12.432L3.6367 12.4318L2.0166 12.4318C1.5656 12.4318 1.2002 12.0664 1.2002 11.6154L1.2002 7.3654C1.2002 6.9144 1.5656 6.549 2.0166 6.549L3.7051 6.549C3.4893 7.5447 3.375 8.5785 3.375 9.6389C3.375 10.2341 3.4109 10.8209 3.4805 11.3973L4.6907 11.3973C4.6146 10.8219 4.5752 10.235 4.5752 9.6389C4.5752 8.4735 4.7248 7.3431 5.0059 6.2658L8.0498 1.8381Z" fill-rule="evenodd"/></svg>`, 'action-svg'),
    share: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><path fill="#000" transform="matrix(1 0 0 1 0.953007 0.0757451)" d="M10.4712 0L13.9731 3.5018Q13.9858 3.5146 14.0104 3.539Q14.2943 3.8215 14.3453 4.0488Q14.4686 4.5989 13.9925 4.9007Q13.7956 5.0254 13.3951 5.0244Q13.3605 5.0243 13.3424 5.0243L12.547 5.0243Q10.5223 5.0243 10.0175 5.1452Q8.8155 5.4332 7.9357 6.313Q7.0559 7.1928 6.7679 8.3948Q6.647 8.8996 6.647 10.9243L5.447 10.9243Q5.447 8.7579 5.6009 8.1152Q5.9678 6.5838 7.0872 5.4644Q8.2065 4.3451 9.7379 3.9782Q10.3806 3.8243 12.547 3.8242L12.5985 3.8242L9.6227 0.8485L10.4712 0ZM7.3399 0.8768C7.572 0.8761 7.8082 0.8754 8.0469 0.8785L8.0469 2.0815C7.7767 2.0772 7.4976 2.0774 7.2093 2.0775L7.2093 2.0775C7.1551 2.0775 7.1007 2.0776 7.0459 2.0776C6.9911 2.0776 6.9366 2.0775 6.8825 2.0775C5.0392 2.0765 3.5712 2.0757 2.4014 3.2221C1.1981 4.4018 1.1986 5.9034 1.1992 7.7966C1.1992 7.8393 1.1992 7.8822 1.1992 7.9252C1.1992 7.9684 1.1992 8.0113 1.1992 8.054C1.1986 9.9469 1.1981 11.4478 2.4014 12.6274C3.4551 13.6601 4.7509 13.7617 6.3447 13.771L7.748 13.771C9.3421 13.7617 10.6376 13.6598 11.6914 12.6274C12.8947 11.4479 12.8942 9.9473 12.8936 8.0546C12.8936 8.0117 12.8936 7.9685 12.8936 7.9252C12.8936 7.8818 12.8936 7.8385 12.8936 7.7954L12.8936 7.7954C12.8937 7.4953 12.8938 7.205 12.8891 6.9243L14.0912 6.9243C14.0945 7.1687 14.0939 7.4106 14.0933 7.6483L14.0933 7.6484C14.093 7.7413 14.0928 7.8337 14.0928 7.9253C14.0928 8.0167 14.093 8.1088 14.0932 8.2016C14.0977 9.9594 14.1027 11.9435 12.5313 13.4839C11.0008 14.9835 9.0579 14.9778 7.3395 14.9727C7.2408 14.9725 7.1429 14.9722 7.0459 14.9722C6.9488 14.9722 6.8508 14.9725 6.7521 14.9727C5.0339 14.9778 3.0915 14.9835 1.5615 13.4839C0.1139 12.0648 0.0048 10.2689 0 8.6206L0 7.229C0.0048 5.5807 0.1141 3.7847 1.5615 2.3657C3.0916 0.866 5.0342 0.8717 6.7524 0.8768C6.851 0.8771 6.9489 0.8774 7.0459 0.8774C7.1431 0.8774 7.2411 0.8771 7.3399 0.8768Z" fill-rule="evenodd"/></svg>`, 'action-svg'),
    cost: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="14" height="14" viewBox="0 0 14 14"><clipPath id="clip_0"><rect width="14" height="14"/></clipPath><g clip-path="url(#clip_0)"><path fill="#000" fill-opacity="0.3" transform="matrix(0.707107 0.707107 -0.707107 0.707107 7.00086 -0.116119)" d="M9.6937 2.526Q9.6943 2.5243 9.695 2.5226L9.7239 2.4477L9.768 2.3355Q9.8079 2.2341 9.8184 2.2042Q10.1363 1.2942 9.4523 0.6102Q8.7683 -0.0738 7.8583 0.2441Q7.8284 0.2546 7.7266 0.2946L7.6113 0.34L7.5364 0.3688Q5.0315 1.3172 2.5232 0.3676L2.4479 0.3386L2.3354 0.2943Q2.2344 0.2546 2.2046 0.2442Q1.2944 -0.0739 0.6104 0.6103Q-0.0737 1.2944 0.2445 2.2046Q0.2549 2.2344 0.2948 2.3357L0.3399 2.4505L0.3687 2.5249Q1.3179 5.0309 0.3675 7.5403L0.3387 7.615L0.2947 7.7269Q0.2549 7.828 0.2444 7.8578Q-0.0737 8.768 0.6104 9.4521Q1.2945 10.1362 2.2047 9.8181Q2.2345 9.8076 2.3362 9.7676L2.4509 9.7225L2.5254 9.6937Q5.0315 8.7445 7.541 9.6951L7.6155 9.7239L7.7272 9.7678Q7.8281 9.8076 7.8578 9.818Q8.768 10.1362 9.4522 9.4521Q10.1364 8.768 9.8183 7.8578Q9.8079 7.8281 9.7677 7.7261L9.7224 7.6108L9.6936 7.536Q8.7459 5.0327 9.6937 2.526ZM8.6381 2.0289L8.6079 2.1071L8.6066 2.1105Q7.5009 5.0309 8.6078 7.9548L8.6393 8.0365L8.6849 8.1525Q8.7168 8.2334 8.7197 8.2418Q8.7966 8.4619 8.6294 8.6292Q8.4621 8.7964 8.242 8.7195Q8.2336 8.7165 8.153 8.6848L8.0345 8.6382L7.9532 8.6068Q5.0315 7.5001 2.1064 8.608L2.0251 8.6394L1.9096 8.6848Q1.8291 8.7165 1.8207 8.7195Q1.6006 8.7964 1.4333 8.6292Q1.2661 8.4619 1.343 8.2418Q1.3459 8.2334 1.3777 8.1527L1.4244 8.034L1.4558 7.9525Q2.5623 5.0309 1.4544 2.106L1.423 2.0246L1.3776 1.9091Q1.346 1.8289 1.343 1.8205Q1.2661 1.6004 1.4333 1.4331Q1.6005 1.2658 1.8207 1.3428Q1.8291 1.3457 1.9097 1.3774L2.0291 1.4244L2.1112 1.456Q5.0315 2.5615 7.9553 1.4546L8.037 1.4231L8.1531 1.3774Q8.2337 1.3457 8.2421 1.3427Q8.4622 1.2659 8.6294 1.4331Q8.7966 1.6003 8.7197 1.8204Q8.7168 1.8288 8.6849 1.9098L8.6381 2.0289Z" fill-rule="evenodd"/></g></svg>`, 'cost-svg'),
    more: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><path fill="#000" transform="matrix(1 0 0 1 2 7)" d="M0 1C0 0.4477 0.4477 0 1 0C1.5523 0 2 0.4477 2 1C2 1.5523 1.5523 2 1 2C0.4477 2 0 1.5523 0 1ZM5 1C5 0.4477 5.4477 0 6 0C6.5523 0 7 0.4477 7 1C7 1.5523 6.5523 2 6 2C5.4477 2 5 1.5523 5 1ZM10 1C10 0.4477 10.4477 0 11 0C11.5523 0 12 0.4477 12 1C12 1.5523 11.5523 2 11 2C10.4477 2 10 1.5523 10 1Z"/></svg>`, 'action-svg'),
    ask: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><rect fill="#000" transform="matrix(1 0 0 1 12.6587 7.54688)" y="-0.6" width="2.7893" height="1.2"/><path fill="#000" transform="matrix(1 0 0 1 0.499878 0.913147)" d="M2.5436 4.1529Q2.7704 3.4988 3.0939 2.9191L1.3605 1.6922L2.0538 0.7127L3.7651 1.924Q4.3912 1.1522 5.1824 0.6689Q6.2776 0 7.5001 0Q8.4336 0 9.4374 0.4965Q10.3535 0.9496 11.1248 1.7094Q11.3075 1.8895 11.543 1.9112Q11.7488 1.9302 11.8901 1.8047L13.0742 0.7537L13.8708 1.6512L12.6867 2.7021Q12.1564 3.1729 11.4328 3.1061Q10.7706 3.045 10.2826 2.5643Q8.8978 1.2 7.5001 1.2Q5.6619 1.2 4.3968 3.0875Q4.0651 3.5824 3.8265 4.1548L11.2693 4.1661Q11.811 4.1669 12.2328 4.4922Q12.68 4.8371 12.7829 5.3839Q12.9401 6.2189 12.9401 7.0869Q12.9401 8.8297 12.3369 10.3436L13.9437 11.994L13.0839 12.8311L11.7737 11.4854Q11.1526 12.5171 10.2647 13.1978Q8.9917 14.1737 7.5001 14.1737Q6.023 14.1737 4.7587 13.2155Q3.8699 12.5419 3.2449 11.5156L1.6414 13.0776L0.8041 12.2181L2.6814 10.3893Q2.0859 8.9215 2.0611 7.2337L0 7.2337L0 6.0337L2.1188 6.0337Q2.2026 5.2944 2.406 4.5877L2.5311 4.1529L2.5436 4.1529ZM3.448 5.3543Q3.26 6.1929 3.26 7.0869Q3.26 8.8214 3.9406 10.2752Q4.5316 11.5377 5.4835 12.2591Q6.1583 12.7705 6.9001 12.9159L6.9001 7.1972L8.1001 7.1972L8.1001 12.916Q8.8521 12.7686 9.5347 12.2454Q10.4944 11.5096 11.0825 10.2257Q11.7401 8.7898 11.7401 7.0869Q11.7401 6.3308 11.6037 5.6059Q11.5586 5.3665 11.2675 5.3661L3.448 5.3543Z" fill-rule="evenodd"/></svg>`, 'action-svg'),
    done: s(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16" viewBox="0 0 16 16"><path fill="#000" transform="matrix(1 0 0 1 3 3.99854)" d="M5.1314 6.7172L11.4243 0.4243L10.5757 -0.4243L4.2828 5.8686L4.2732 5.8783Q4.0908 6.0607 4 6.1423Q3.9092 6.0607 3.7268 5.8783L3.7172 5.8686L0.4243 2.5757L-0.4243 3.4243L2.8686 6.7172L2.8783 6.7268Q3.1924 7.041 3.3327 7.1476Q3.6556 7.3929 4 7.3929Q4.3444 7.3929 4.6673 7.1476Q4.8076 7.041 5.1217 6.7268L5.1314 6.7172Z" fill-rule="evenodd"/></svg>`, 'action-svg'),
  };
})();

function renderFinalActions() {
  const actionsMount = $('#mainActions');
  if (!actionsMount || actionsMount.querySelector('.response-actions')) return;
  const wrap = document.createElement('div');
  wrap.className = 'response-actions message-enter';
  const buttons = [
    ['copy', '复制', RESPONSE_SVGS.copy],
    ['regenerate', '重新生成', RESPONSE_SVGS.refresh],
    ['share', '分享', RESPONSE_SVGS.share],
    ['more', '更多', RESPONSE_SVGS.more]
  ];
  wrap.innerHTML = `
    <div class="response-action-left" style="position:relative">
      ${buttons.map(([key, label, svg]) => `<button class="response-action-btn response-action-${key}" type="button" aria-label="${label}">${svg}<span>${label}</span></button>`).join('')}
      <div class="response-cost" aria-label="已消耗 120 积分"><span>已消耗</span>${RESPONSE_SVGS.cost}<strong>120</strong></div>
    </div>`;
  actionsMount.appendChild(wrap);

  // More popover
  const moreBtn = wrap.querySelector('.response-action-more');
  const popover = document.createElement('div');
  popover.className = 'response-more-popover';
  popover.innerHTML = `
    <button class="more-menu-item" type="button" aria-label="很有帮助">${RESPONSE_SVGS.like}<span>很有帮助</span></button>
    <button class="more-menu-item" type="button" aria-label="没有帮助">${RESPONSE_SVGS.dislike}<span>没有帮助</span></button>
    <button class="more-menu-item" type="button" aria-label="复制请求ID">${RESPONSE_SVGS.copy}<span>复制请求ID</span></button>
    <button class="more-menu-item" type="button" aria-label="提交反馈">${RESPONSE_SVGS.ask}<span>提交反馈</span></button>`;
  const leftGroup = wrap.querySelector('.response-action-left');
  leftGroup.appendChild(popover);

  moreBtn.onclick = (e) => {
    e.stopPropagation();
    popover.classList.toggle('is-open');
  };

  document.addEventListener('click', function closePopover(e) {
    if (!popover.contains(e.target) && e.target !== moreBtn && !moreBtn.contains(e.target)) {
      popover.classList.remove('is-open');
    }
  });

  // 复制按钮
  const copyBtn = wrap.querySelector('.response-action-copy');
  if (copyBtn) {
    let copyTimer = null;
    copyBtn.onclick = async () => {
      const text = scenario.final && scenario.final.markdown
        ? scenario.final.markdown
        : (scenario.final && scenario.final.html ? scenario.final.html : actionsMount.textContent || '');
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        // fallback: legacy clipboard
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      if (copyTimer) clearTimeout(copyTimer);
      copyBtn.classList.add('is-copied');
      copyBtn.innerHTML = RESPONSE_SVGS.done + '<span>已复制</span>';
      copyTimer = setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        copyBtn.innerHTML = RESPONSE_SVGS.copy + '<span>复制</span>';
        copyTimer = null;
      }, 3000);
    };
  }

  // 分享按钮
  const shareBtn = wrap.querySelector('.response-action-share');
  if (shareBtn) {
    shareBtn.onclick = async () => {
      const text = scenario.final && scenario.final.markdown
        ? scenario.final.markdown
        : (scenario.final && scenario.final.html ? scenario.final.html : actionsMount.textContent || '');
      const title = 'WorkBuddy';
      try {
        if (navigator.share) {
          await navigator.share({ title, text });
        } else {
          // fallback: 复制内容到剪贴板
          await navigator.clipboard.writeText(text);
          shareBtn.classList.add('is-copied');
          shareBtn.innerHTML = RESPONSE_SVGS.done + '<span>已复制</span>';
          setTimeout(() => {
            shareBtn.classList.remove('is-copied');
            shareBtn.innerHTML = RESPONSE_SVGS.share + '<span>分享</span>';
          }, 3000);
        }
      } catch (e) {
        // 用户取消分享或出错，不做处理
        if (e.name !== 'AbortError') {
          console.warn('分享失败:', e);
        }
      }
    };
  }

  // 重新生成按钮
  const regenerateBtn = wrap.querySelector('.response-action-regenerate');
  if (regenerateBtn) regenerateBtn.onclick = restartPlayback;

  // 来源按钮（已移到 Markdown 上方渲染）
  // const sourceBtn = wrap.querySelector('.response-action-source');
  // if (sourceBtn) sourceBtn.onclick = openSourceSheet;
}

// ── 来源按钮（渲染到 #mainBiz：source 按钮 + divider）──
function renderSourceButtonHtml() {
  return `<div class="source-inline"><button class="response-action-btn response-action-source" type="button" aria-label="来源"><span>28 来源</span><img class="action-img" src="./icons/wb-source.png" alt=""></button></div><hr class="source-divider">`;
}

function bindSourceButton() {
  const sourceBtn = document.querySelector('.source-inline .response-action-source');
  if (sourceBtn) sourceBtn.onclick = openSourceSheet;
}

// ── 来源 Sheet ────────────────────────────────────────────
function openSourceSheet() {
  const items = [];
  for (const key in scenario.sheetFrames) {
    const f = scenario.sheetFrames[key];
    if (f.events) {
      for (const ev of f.events) {
        if (ev.outputs) {
          for (const out of ev.outputs) {
            if (out.type === 'search') items.push(out.text);
          }
        }
      }
    }
    if (f.searchItems) {
      f.searchItems.forEach(t => items.push(t));
    }
  }
  if (!items.length) return;
  const unique = [...new Set(items)];

  openSheet(null, null, {
    customRenderer(body) {
      const title = document.createElement('div');
      title.className = 'sheet-source-title';
      title.textContent = `搜索来源（${unique.length} 项）`;
      body.appendChild(title);
      unique.forEach(text => body.appendChild(renderSearchItem(text)));
    }
  });
}

async function renderFinal() {
  renderTiming();
  collapseProcessIntoTiming();
  await sleepDelay('stepDelay', 470);
  const main = $('#mainMd');
  const mainBiz = $('#mainBiz');
  await appendHTMLTypedTo(main, scenario.final.markdown ? markdownToHtml(scenario.final.markdown) : scenario.final.html);
  if (scenario.final && scenario.final.fileCard) {
    // 先写入来源按钮与分隔线，再写入 fileCard（都在 #mainBiz）
    const sourceHtml = renderSourceButtonHtml();
    if (sourceHtml) {
      await appendHTMLTypedTo(mainBiz, sourceHtml);
    }
    await appendHTMLTypedTo(mainBiz, renderFileCard(scenario.final.fileCard));
  }
  renderFinalActions();
  bindSourceButton();
  scrollToBottom();
  setComposerGenerating(false);
}

// ── Static pre-chat rounds ───────────────────────────────
function renderStaticPreChat() {
  const preChat = scenario.preChat;
  if (!preChat || !preChat.length) return;
  // 已渲染过则跳过（重启播放时复用）
  if (document.querySelector('.prechat-static')) return;

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

    // AI 回复
    const agentDiv = document.createElement('div');
    agentDiv.className = 'agent-msg prechat-static';
    agentDiv.innerHTML = '<div class="agent-header">'
      + '<div class="agent-avatar">' + AGENT_AVATAR_SVG + '</div>'
      + '<span class="agent-name">' + scenario.agent.name + '</span>'
      + '</div>'
      + '<div class="md md-node">' + markdownToHtml(round.agent) + '</div>';
    conv.insertBefore(agentDiv, ref);

    // 最后一条用户消息由 showUserMessage() 渲染，这里跳过避免重复
    if (isLast) continue;

    // 用户回复
    const userWrap = document.createElement('div');
    userWrap.className = 'user-msg-wrap prechat-static';
    userWrap.innerHTML = '<div class="user-bubble">' + escapeHtml(round.user) + '</div>';
    conv.insertBefore(userWrap, ref);
  }
}

// ── User / agent appearance ───────────────────────────────
async function showUserMessage() {
  // 使用 preChat 最后一条作为触发消息，无 preChat 时回退到 userMessage
  const chat = scenario.preChat;
  const trigger = (chat && chat.length) ? chat[chat.length - 1].user : scenario.userMessage;
  $('#userBubble').textContent = trigger;
  const wrap = $('#userMsgWrap');
  wrap.classList.remove('is-hidden');
  wrap.classList.add('message-enter');
  scrollToBottom();
  rebuildScrollNav();
  await sleepDelay('userMessageDelay', 720);
}

async function showAgentShell() {
  $('#agentName').textContent = scenario.agent.name;
  const agent = $('#agentMsg');
  agent.classList.remove('is-hidden');
  agent.classList.add('agent-enter');
  scrollToBottom();
  rebuildScrollNav();
  await sleepDelay('agentDelay', 520);
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
  const mainBiz = $('#mainBiz');
  const mainActions = $('#mainActions');
  const overlay = $('#overlay');
  const tblOverlay = $('#tblOverlay');
  const phoneShell = $('.phone-shell');

  execOpen = true;
  stepsOpen = true;
  stepSeq = 0;
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
  if (execArea) execArea.className = 'exec-area open is-hidden';
  setComposerGenerating(false);
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
          await runFlatAction(directorRuntime.flatContainer, action);
        }
      });
    });
  });

  timeline.push({ label: '任务耗时与最终汇报', run: renderFinal });
  return timeline;
}

// ── Director controls ─────────────────────────────────────
function updateDirectorControls() {
  const total = directorTimeline.length || 0;
  const atStart = currentDirectorIndex < 0;
  const atEnd = total > 0 && currentDirectorIndex >= total - 1;
  panelRoots().forEach(root => {
    const prev = root.querySelector('#ctrlPrevStep');
    const auto = root.querySelector('#ctrlAutoStep');
    const next = root.querySelector('#ctrlNextStep');
    if (prev) prev.disabled = atStart;
    if (next) next.disabled = atEnd;
    if (auto) {
      auto.disabled = directorBusy && !autoPlaying;
      auto.textContent = '自动播放';
      auto.classList.toggle('is-active', autoPlaying);
    }
  });
}

async function runDirectorStep(index) {
  const step = directorTimeline[index];
  if (!step) return false;
  await step.run();
  currentDirectorIndex = index;
  renderDesignNotes(currentDirectorIndex);
  updateDirectorControls();
  return true;
}

async function runDirectorAutoLoop(token) {
  if (directorBusy) return;
  directorBusy = true;
  setComposerGenerating(true);
  updateDirectorControls();
  try {
    await sleepDelay('autoStartDelay', 420);
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
      setComposerGenerating(false);
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

function setComposerGenerating(generating) {
  const shell = document.querySelector('.composer-shell');
  if (!shell) return;
  shell.classList.toggle('is-generating', generating);
}

function stopDirectorAuto() {
  pauseRequested = true;
  autoPlaying = false;
  updateDirectorControls();
}

function stopPlayback() {
  if (!directorBusy && !autoPlaying) return;
  stopDirectorAuto();
  incrementPlayId();
  setFastRender(false);
  // 保留已生成的内容，只停止播放引擎
  setComposerGenerating(false);
  updateDirectorControls();
}

function toggleDirectorAuto() {
  if (autoPlaying) stopDirectorAuto();
  else startDirectorAuto();
}

async function directorNextStep() {
  if (currentDirectorIndex >= directorTimeline.length - 1) return;

  // 正在播放中 → 跳过当前步，再正常运行下一步
  if (directorBusy || autoPlaying) {
    const mySeq = ++directorSkipSeq;
    await jumpDirectorTo(currentDirectorIndex + 1, { force: true, keepUserShell: true });

    // 如果已有更新的 skip 触发，此调用作废（避免重复跑下一步）
    if (mySeq !== directorSkipSeq) return;

    // 继续播放下一步（正常速度）
    if (currentDirectorIndex < directorTimeline.length - 1) {
      const token = activePlayId;
      directorBusy = true;
      updateDirectorControls();
      try {
        await runDirectorStep(currentDirectorIndex + 1);
      } catch (err) {
        if (err !== CANCELLED) throw err;
      } finally {
        if (token === activePlayId) {
          directorBusy = false;
          updateDirectorControls();
        }
      }
    }
    return;
  }

  // 正常情况：单步播放
  const token = activePlayId;
  directorBusy = true;
  setComposerGenerating(true);
  updateDirectorControls();
  try {
    await runDirectorStep(currentDirectorIndex + 1);
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    if (token === activePlayId) {
      directorBusy = false;
      updateDirectorControls();
    }
  }
}

async function jumpDirectorTo(targetIndex, { force = false, keepUserShell = false } = {}) {
  if (!force && directorBusy) return;

  const wasBusy = directorBusy;
  stopDirectorAuto();
  incrementPlayId();

  if (wasBusy) {
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  const token = activePlayId;
  directorBusy = true;
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
      execOpen = true;
      stepsOpen = true;
      scrollToBottom();
    } else {
      resetPlaybackDom();
    }
    directorRuntime = { rows: [] };
    directorTimeline = buildDirectorTimeline();
    currentDirectorIndex = -1;
    setComposerGenerating(true);
    const capped = Math.min(targetIndex, directorTimeline.length - 1);
    for (let i = 0; i <= capped; i++) {
      await runDirectorStep(i);
    }
    renderDesignNotes(currentDirectorIndex);
  } catch (err) {
    if (err !== CANCELLED) throw err;
  } finally {
    setFastRender(false);
    if (token === activePlayId) {
      directorBusy = false;
      updateDirectorControls();
    }
  }
}

function directorPrevStep() {
  if (currentDirectorIndex < 0) return;
  jumpDirectorTo(currentDirectorIndex - 1, { force: true });
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

  // standalone 参数由 index.html 在首屏前处理，这里不再重复切 class

  const legacySpeed = params.get('typeSpeed');
  if (tpsRaw === null && legacySpeed !== null && legacySpeed !== '') {
    const value = Number(legacySpeed);
    if (Number.isFinite(value) && value > 0) scenario.playback.tokensPerSecond = Math.round(1000 / value);
  }
}

// ── Tool call style (card / flat) ──────────────────────────
function syncToolCallStyleUI() {
  const shell = document.querySelector('.phone-shell');
  if (!shell) return;
  shell.classList.toggle('tool-call-card', toolCallStyle === 'card');
  shell.classList.toggle('tool-call-flat', toolCallStyle === 'flat');
  shell.classList.toggle('tool-call-stack', toolCallStyle === 'stack');
  panelRoots().forEach(root => {
    const btnCard = root.querySelector('#ctrlToolCard');
    const btnFlat = root.querySelector('#ctrlToolFlat');
    const btnStack = root.querySelector('#ctrlToolStack');
    if (btnCard) btnCard.className = 'dc-seg-btn' + (toolCallStyle === 'card' ? ' is-active' : '');
    if (btnFlat) btnFlat.className = 'dc-seg-btn' + (toolCallStyle === 'flat' ? ' is-active' : '');
    if (btnStack) btnStack.className = 'dc-seg-btn' + (toolCallStyle === 'stack' ? ' is-active' : '');
  });
}

function collapseToStack(line, labels) {
  if (!labels || !labels.length) return;
  line.innerHTML = statusStackHTML(labels) + '<span class="status-chevron">›</span>';
}

export function toggleToolCallStyle(mode) {
  toolCallStyle = mode;
  syncToolCallStyleUI();

  // 重渲染所有已有 status line
  document.querySelectorAll('.step-detail-link[data-labels]').forEach(link => {
    let labels;
    try { labels = JSON.parse(link.dataset.labels || '[]'); } catch (_) { labels = []; }
    const isRunning = link.classList.contains('is-running');

    if (!isRunning && toolCallStyle === 'stack') {
      collapseToStack(link, labels);
    } else {
      setStatusLineLabels(link, labels);
      if (isRunning) link.classList.add('is-running');
    }
  });
}

function bindPanelControls(root) {
  const $r = (sel) => root.querySelector(sel);
  const speedSlider = $r('#ctrlSpeedSlider');
  const speedTrack = speedSlider ? speedSlider.closest('.dc-speed-track') : null;
  const prev = $r('#ctrlPrevStep');
  const auto = $r('#ctrlAutoStep');
  const next = $r('#ctrlNextStep');
  if (!speedSlider) return;

  const syncSpeed = () => {
    const value = Math.round(Number(speedSlider.value));
    const min = Number(speedSlider.min) || 0;
    const max = Number(speedSlider.max) || 100;
    const clamped = Math.min(max, Math.max(min, value));
    const percent = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
    const trackWidth = speedTrack && speedTrack.offsetWidth > 0 ? speedTrack.offsetWidth : 200;
    const minPercent = Math.min(100, (23 / trackWidth) * 100);
    const visualPercent = Math.max(minPercent, percent);
    const progress = `${visualPercent}%`;
    let mappedValue;
    if (percent <= 60) {
      mappedValue = Math.round(5 + (percent / 60) * 195);
    } else {
      mappedValue = Math.round(200 + ((percent - 60) / 40) * 1300);
    }
    scenario.playback.tokensPerSecond = mappedValue;
    speedSlider.style.setProperty('--speed-progress', progress);
    if (speedTrack) speedTrack.style.setProperty('--speed-progress', progress);
    // 更新桌面只读显示
    const ro = document.getElementById('dcSpeedRoValue');
    if (ro) ro.textContent = mappedValue;
  };
  speedSlider.addEventListener('input', syncSpeed);

  if (prev) prev.onclick = () => directorPrevStep();
  if (next) next.onclick = () => directorNextStep();
  if (auto) auto.onclick = () => toggleDirectorAuto();

  const toolCard = $r('#ctrlToolCard');
  const toolFlat = $r('#ctrlToolFlat');
  const toolStack = $r('#ctrlToolStack');
  if (toolCard) toolCard.onclick = () => toggleToolCallStyle('card');
  if (toolFlat) toolFlat.onclick = () => toggleToolCallStyle('flat');
  if (toolStack) toolStack.onclick = () => toggleToolCallStyle('stack');
}

function setupDemoControls() {
  bindPanelControls(document);

  // 初始滑杆位置设为 60%
  const initSlider = document.querySelector('#ctrlSpeedSlider');
  if (initSlider) {
    const imin = Number(initSlider.min) || 20;
    const imax = Number(initSlider.max) || 1000;
    initSlider.value = Math.round(imin + (imax - imin) * 0.6);
    initSlider.dispatchEvent(new Event('input', { bubbles: true }));
  }
  syncToolCallStyleUI();
  updateDirectorControls();

  // Tweak reload button
  const tweakReload = document.getElementById('ctrlTweakReload');
  if (tweakReload) tweakReload.onclick = () => restartPlayback();

  // Tweak hash — 从 commitHashReady 读取
  if (window.commitHashReady) {
    window.commitHashReady.then((hash) => {
      const el = document.getElementById('dcTweakHash');
      if (el) el.textContent = hash;
    });
  }

  // 停止生成按钮
  const stopBtn = document.getElementById('composerStopBtn');
  if (stopBtn) stopBtn.addEventListener('click', stopPlayback);

  // Phone drawer wiring
  const navCenter = document.querySelector('.nav-center');
  if (navCenter) {
    navCenter.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePhoneControls();
    });
  }

  // Swipe up to close (via document to avoid pointer-events: none issues)
  let swipeY = 0, startY = 0, swiping = false;
  document.addEventListener('touchstart', (e) => {
    const panel = document.getElementById('phoneControls');
    const pcPanel = panel?.querySelector('.pc-panel');
    if (!pcPanel || !panel.classList.contains('is-open')) return;
    if (!pcPanel.contains(e.target)) return;
    if (['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
    startY = e.touches[0].clientY;
    swiping = true;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const panel = document.getElementById('phoneControls');
    const pcPanel = panel?.querySelector('.pc-panel');
    if (!pcPanel) return;
    const delta = e.touches[0].clientY - startY;
    if (delta < 0) {
      e.preventDefault();
      swipeY = delta;
      pcPanel.style.transition = 'none';
      pcPanel.style.transform = `translateY(${delta}px)`;
    }
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    const panel = document.getElementById('phoneControls');
    const pcPanel = panel?.querySelector('.pc-panel');
    if (!pcPanel) return;
    pcPanel.style.transition = '';
    if (swipeY < -60) {
      closePhoneControls();
    } else {
      pcPanel.style.transform = '';
    }
  });
}

// ── Phone drawer ──────────────────────────────────────────
function openPhoneControls() {
  const phonePanel = document.getElementById('phoneControls');
  const pcBody = document.getElementById('pcBody');
  const source = document.querySelector('.demo-controls');
  if (!phonePanel || !pcBody || !source) return;

  // Reset any inline transform left from previous swipe
  const pcPanel = phonePanel.querySelector('.pc-panel');
  if (pcPanel) {
    pcPanel.style.transform = '';
    pcPanel.style.transition = '';
  }

  pcBody.innerHTML = '';
  const dcMain = source.querySelector('.dc-main');
  if (dcMain) pcBody.appendChild(dcMain.cloneNode(true));

  // Sync speed slider value to phone clone before bindPanelControls,
  // so syncSpeed() reads the correct value on first call
  const srcSpeed = source.querySelector('#ctrlSpeedSlider');
  const phoneSpeed = phonePanel.querySelector('#ctrlSpeedSlider');
  if (srcSpeed && phoneSpeed) {
    phoneSpeed.value = srcSpeed.value;
  }
  bindPanelControls(phonePanel);

  // Also sync progress visual
  if (srcSpeed && phoneSpeed) {
    const progress = srcSpeed.style.getPropertyValue('--speed-progress');
    if (progress) {
      phoneSpeed.style.setProperty('--speed-progress', progress);
      const phoneTrack = phoneSpeed.closest('.dc-speed-track');
      if (phoneTrack) phoneTrack.style.setProperty('--speed-progress', progress);
    }
  }

  syncToolCallStyleUI();
  updateDirectorControls();
  phonePanel.classList.add('is-open');

  // Click handle to close
  const handle = phonePanel.querySelector('.pc-handle');
  if (handle) {
    handle.onclick = (e) => {
      e.stopPropagation();
      closePhoneControls();
    };
  }
}

function closePhoneControls() {
  const phonePanel = document.getElementById('phoneControls');
  if (!phonePanel) return;
  // Reset inline transform left from swipe drag
  const pcPanel = phonePanel.querySelector('.pc-panel');
  if (pcPanel) {
    pcPanel.style.transform = '';
    pcPanel.style.transition = '';
  }
  phonePanel.classList.remove('is-open');
  setTimeout(() => {
    const pcBody = document.getElementById('pcBody');
    if (pcBody) pcBody.innerHTML = '';
  }, 350);
}

function togglePhoneControls() {
  const phonePanel = document.getElementById('phoneControls');
  if (!phonePanel) return;
  phonePanel.classList.contains('is-open') ? closePhoneControls() : openPhoneControls();
}

// ── Playback lifecycle ────────────────────────────────────
function initializePlayback() {
  autoPlaying = false;
  pauseRequested = false;
  directorBusy = false;
  setFastRender(false);
  currentDirectorIndex = -1;
  directorRuntime = { rows: [] };
  setupNavMeta();
  renderStaticPreChat();
  resetPlaybackDom();
  renderDesignNotes(currentDirectorIndex);
  directorTimeline = buildDirectorTimeline();
  updateDirectorControls();
  initScrollNav();
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
