const scenario = window.WORKBUDDY_SCENARIO;
const INLINE_ICONS = window.WORKBUDDY_INLINE_ICONS || {};
const ICON_ALIASES = window.WORKBUDDY_ICON_ALIASES || {};
const $ = (sel, root=document) => root.querySelector(sel);
let activePlayId = 0;
let fastRender = false;
let directorTimeline = [];
let directorRuntime = {};
let currentDirectorIndex = -1;
let autoPlaying = false;
let directorBusy = false;
let pauseRequested = false;
const CANCELLED = new Error('playback-cancelled');
const sleep = (ms) => {
  if (fastRender) return Promise.resolve();
  const token = activePlayId;
  return new Promise((resolve, reject) => {
    window.setTimeout(() => token === activePlayId ? resolve() : reject(CANCELLED), Math.max(0, ms));
  });
};

const ICONS = {
  ok: '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 3L9 1" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spin: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#e9e9eb" stroke-width="2"/><path d="M10 2a8 8 0 018 8" stroke="#5e5ce6" stroke-width="2" stroke-linecap="round"/></svg>',
  chevron: '<svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 1.5l5 4 5-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  todoOk: '<div class="sub-ok"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>',
  todoSpin: '<div class="sub-loading"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#e9e9eb" stroke-width="1.5"/><path d="M8 1.5A6.5 6.5 0 0114.5 8" stroke="#5e5ce6" stroke-width="1.5" stroke-linecap="round"/></svg></div>',
  todoEmpty: '<div class="sub-empty"></div>',
  warn: '<svg class="tool-svg tool-svg-warning" width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M9.047 3.14c.41-.72 1.495-.72 1.906 0l6.38 11.18c.406.711-.108 1.6-.953 1.6H3.62c-.845 0-1.359-.889-.953-1.6L9.047 3.14Z" stroke="#F2991C" stroke-width="1.7" fill="rgba(242,153,28,0.08)"/><path d="M10 7.2v4.2" stroke="#F2991C" stroke-width="1.7" stroke-linecap="round"/><circle cx="10" cy="13.9" r="1" fill="#F2991C"/></svg>'
};

let execOpen = true;
let stepsOpen = true;
let stepSeq = 0;

function applyUrlPlaybackOverrides(){
  const params = new URLSearchParams(location.search);
  scenario.playback = scenario.playback || {};
  const tpsRaw = params.get('tokensPerSecond');
  if (tpsRaw !== null && tpsRaw !== '') {
    const value = Number(tpsRaw);
    if (Number.isFinite(value)) scenario.playback.tokensPerSecond = value;
  }
  // 兼容旧版参数：typeSpeed 是 ms/字符，这里换算成 tokens/s。
  const legacySpeed = params.get('typeSpeed');
  if (tpsRaw === null && legacySpeed !== null && legacySpeed !== '') {
    const value = Number(legacySpeed);
    if (Number.isFinite(value) && value > 0) scenario.playback.tokensPerSecond = Math.round(1000 / value);
  }
}

function playback(key, fallback) {
  return (scenario.playback && Number.isFinite(scenario.playback[key])) ? scenario.playback[key] : fallback;
}

function currentTokensPerSecond(){
  return Math.min(1000, Math.max(20, Math.round(playback('tokensPerSecond', 200))));
}

function setupDemoControls(){
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
  replay.onclick = () => {
    syncPlayback();
    restartPlayback();
  };
  if (prev) prev.onclick = () => directorPrevStep();
  if (next) next.onclick = () => directorNextStep();
  if (auto) auto.onclick = () => toggleDirectorAuto();
  updateDirectorControls();
}

function scrollToBottom(){
  const c = $('#conv');
  c.scrollTop = c.scrollHeight;
}

function truncate(str, n=24){
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

function stripChevron(label){
  return String(label || '').replace(/\s*›\s*$/, '').trim();
}

function splitStatusLabels(text){
  const clean = stripChevron(text);
  return clean ? clean.split('、').map(s => s.trim()).filter(Boolean) : [];
}

function setStepIcon(row, done){
  const icon = $('.step-state-icon', row);
  icon.className = done ? 'step-state-icon ico-ok' : 'step-state-icon ico-spin';
  icon.innerHTML = done ? ICONS.ok : ICONS.spin;
}

function createStep(node){
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



function escapeHtml(value){
  return String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function inlineMarkdown(text){
  // 先透传已有的原始 <a> 标签，避免被 escapeHtml 转义
  const anchors = [];
  text = text.replace(/<a\b[^>]*>.*?<\/a>/gi, (match) => {
    anchors.push(match);
    return `\x00ANCHOR\x00`;
  });
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = escapeHtml(href);
    const cls = (/\.docx(?:$|[?#])/i.test(href) || /^查看/.test(label)) ? ' class="doc-link-card"' : '';
    return `<a${cls} href="${safeHref}" onclick="return false;">${escapeHtml(label)}</a>`;
  });
  // 还原原始 <a> 标签
  html = html.replace(/\x00ANCHOR\x00/g, () => anchors.shift());
  return html;
}

function markdownToHtml(markdown){
  const lines = String(markdown || '').replace(/\r\n/g,'\n').trim().split('\n');
  const out = [];
  let i = 0;
  const isTableSep = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const splitTable = (line) => line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(c => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();
    if (!trim) { i++; continue; }
    if (/^---+$/.test(trim)) { out.push('<hr>'); i++; continue; }
    if (trim.startsWith('## ')) { out.push(`<h2>${inlineMarkdown(trim.slice(3))}</h2>`); i++; continue; }
    if (trim.startsWith('### ')) { out.push(`<h3>${inlineMarkdown(trim.slice(4))}</h3>`); i++; continue; }
    if (trim.startsWith('>')) {
      const parts = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) parts.push(lines[i++].trim().replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inlineMarkdown(parts.join(' '))}</p></blockquote>`);
      continue;
    }
    if (/^-\s+/.test(trim)) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i].trim())) items.push(`<li>${inlineMarkdown(lines[i++].trim().replace(/^-\s+/,''))}</li>`);
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (trim.includes('|') && i + 1 < lines.length && isTableSep(lines[i+1])) {
      const header = splitTable(trim);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTable(lines[i++]));
      }
      out.push(`<div class="tbl-wrap"><table class="tbl"><thead><tr>${header.map(h=>`<th>${inlineMarkdown(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    const paras = [trim];
    i++;
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || t.startsWith('## ') || t.startsWith('### ') || t.startsWith('>') || /^-\s+/.test(t) || /^---+$/.test(t) || (t.includes('|') && i+1 < lines.length && isTableSep(lines[i+1]))) break;
      paras.push(t); i++;
    }
    out.push(`<p>${inlineMarkdown(paras.join(' '))}</p>`);
  }
  return out.join('\n');
}

function cloneEmptyNode(node){
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode('');
  if (node.nodeType !== Node.ELEMENT_NODE) return node.cloneNode(false);
  const clone = node.cloneNode(false);
  return clone;
}

function typeIntervalForChunk(chunkSize){
  return (1000 * chunkSize) / currentTokensPerSecond();
}

async function typeText(target, text){
  if (!text) return;
  if (fastRender) {
    target.textContent += text;
    scrollToBottom();
    return;
  }
  const chunkSize = Math.max(1, Math.floor(playback('chunkSize', 1)));
  const interval = typeIntervalForChunk(chunkSize);
  target.parentElement && target.parentElement.classList.add('typing-active');
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    target.textContent += chunk;
    scrollToBottom();
    await sleep(chunk.trim() ? interval : Math.max(1, interval * 0.35));
  }
  target.parentElement && target.parentElement.classList.remove('typing-active');
}

async function typeClone(source, target){
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = document.createTextNode('');
      target.appendChild(t);
      await typeText(t, child.textContent);
      continue;
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      const c = cloneEmptyNode(child);
      target.appendChild(c);
      scrollToBottom();
      await typeClone(child, c);
    }
  }
}

async function appendHTML(row, html){
  const container = $('.step-detail-inner', row);
  await appendHTMLTypedTo(container, html);
}

async function appendMarkdown(row, markdown){
  await appendHTML(row, markdownToHtml(markdown));
}

async function appendHTMLTypedTo(container, html){
  const temp = document.createElement('div');
  temp.innerHTML = html;
  for (const child of Array.from(temp.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = document.createTextNode('');
      container.appendChild(t);
      await typeText(t, child.textContent);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const c = cloneEmptyNode(child);
      c.classList.add('typing-block-enter');
      container.appendChild(c);
      scrollToBottom();
      await typeClone(child, c);
      c.classList.remove('typing-block-enter');
    }
  }
  await sleep(playback('stepDelay', 470));
}


function createStatusLineIn(container, text, frameIds, title){
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

function createStatusLine(row, text, frameIds, title){
  return createStatusLineIn($('.step-detail-inner', row), text, frameIds, title);
}

function normalizeActions(actions) {
  const result = [];
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    if (action.type !== 'status') {
      result.push(action);
      continue;
    }
    const group = [action];
    while (i + 1 < actions.length && actions[i + 1].type === 'status') {
      group.push(actions[++i]);
    }
    result.push(group.length === 1 ? action : { type: 'statusGroup', actions: group });
  }
  return result;
}

async function runStatusGroup(row, actions){
  const firstFrames = actions[0].frames || [];
  const completedLabels = [];
  const completedFinalFrames = [];
  const initialTitle = actions.map(toDoneLabel).join('、');
  const line = createStatusLine(row, joinLabels([toRunningLabel(actions[0])]), firstFrames[0] ? [firstFrames[0]] : [], initialTitle);

  for (let index = 0; index < actions.length; index++) {
    const action = actions[index];
    const frames = action.frames || [];
    const runningLabels = completedLabels.concat(toRunningLabel(action));

    setStatusLineLabels(line, runningLabels);
    line.dataset.sheetTitle = completedLabels.concat(toDoneLabel(action)).join('、');

    for (const frameId of frames) {
      line.dataset.frames = completedFinalFrames.concat(frameId).join(',');
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

async function runStatus(row, action){
  await runStatusGroup(row, [action]);
}

async function runNodeAction(row, action){
  if (!row) return;
  if (action.type === 'status') await runStatus(row, action);
  if (action.type === 'statusGroup') await runStatusGroup(row, action.actions);
  if (action.type === 'html') await appendHTML(row, action.html);
  if (action.type === 'markdown') await appendMarkdown(row, action.markdown);
}

function directorActionLabel(action){
  if (action.type === 'status') return toDoneLabel(action);
  if (action.type === 'statusGroup') return action.actions.map(toDoneLabel).join('、');
  if (action.type === 'markdown') return '输出 markdown';
  if (action.type === 'html') return '输出内容';
  return '子节点';
}

function buildDirectorTimeline(){
  const timeline = [];
  timeline.push({ label:'用户消息', run:showUserMessage });
  timeline.push({ label:'WorkBuddy 出现', run:showAgentShell });
  timeline.push({ label:'思考过程', run:showThinkingLoading });

  scenario.nodes.forEach((node, nodeIndex) => {
    timeline.push({
      label:`节点 ${nodeIndex + 1} 出现`,
      run: async () => {
        directorRuntime.rows[nodeIndex] = createStep(node);
        await sleep(playback('stepDelay', 470));
      }
    });
    const actions = normalizeActions(node.actions);
    actions.forEach((action, actionIndex) => {
      const isLastAction = actionIndex === actions.length - 1;
      timeline.push({
        label:`节点 ${nodeIndex + 1} · ${directorActionLabel(action)}`,
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

  timeline.push({ label:'任务耗时与最终汇报', run:renderFinal });
  return timeline;
}

function updateDirectorControls(){
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

async function runDirectorStep(index){
  const step = directorTimeline[index];
  if (!step) return false;
  await step.run();
  currentDirectorIndex = index;
  updateDirectorControls();
  return true;
}

async function runDirectorAutoLoop(token){
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

function startDirectorAuto(){
  if (directorBusy || currentDirectorIndex >= directorTimeline.length - 1) return;
  autoPlaying = true;
  pauseRequested = false;
  updateDirectorControls();
  const token = activePlayId;
  runDirectorAutoLoop(token);
}

function stopDirectorAuto(){
  pauseRequested = true;
  autoPlaying = false;
  updateDirectorControls();
}

function toggleDirectorAuto(){
  if (autoPlaying) stopDirectorAuto();
  else startDirectorAuto();
}

async function directorNextStep(){
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

async function jumpDirectorTo(targetIndex){
  if (directorBusy) return;
  stopDirectorAuto();
  activePlayId += 1;
  directorBusy = true;
  fastRender = true;
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
    fastRender = false;
    directorBusy = false;
    updateDirectorControls();
  }
}

function directorPrevStep(){
  if (directorBusy || autoPlaying || currentDirectorIndex < 0) return;
  jumpDirectorTo(currentDirectorIndex - 1);
}

async function runThinkingStatus(){
  const execArea = $('#execArea');
  const stepsList = $('#stepsList');
  const mount = $('#thinkingMount');
  execArea.classList.remove('is-hidden');
  stepsList.classList.add('is-hidden');
  mount.innerHTML = '';
  const action = scenario.thinking || { runningText:'正在思考', doneText:'思考过程', frames:[] };
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

async function playNode(node){
  const row = createStep(node);
  await sleep(playback('stepDelay', 470));
  for (const action of normalizeActions(node.actions)) {
    if (action.type === 'status') await runStatus(row, action);
    if (action.type === 'statusGroup') await runStatusGroup(row, action.actions);
    if (action.type === 'html') await appendHTML(row, action.html);
    if (action.type === 'markdown') await appendMarkdown(row, action.markdown);
  }
  setStepIcon(row, true);
  row.classList.remove('open');
  await sleep(playback('stepDelay', 470));
}

function renderTiming(){
  $('#timingMount').innerHTML = `
    <div class="timing-bar timing-enter" onclick="toggleExec()" role="button" tabindex="0" aria-label="折叠/展开执行过程">
      <span class="timing-text">${scenario.final.timing}</span>
      <img class="timing-arrow" id="timingArrow" src="./icons/right.svg" alt="">
    </div>`;
}

function renderFinalActions(){
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

function renderFileCard(card){
  const title = escapeHtml(card.title || '');
  const meta = escapeHtml(card.meta || '');
  return `<a class="file-card" href="#" onclick="return false;">
  <div class="file-card-icon">
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="22" height="24" rx="4" fill="#FF6B6B"/>
      <path d="M9 10h10M9 14h10M9 18h6" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  </div>
  <div class="file-card-info">
    <div class="file-card-title">${title}</div>
    <div class="file-card-meta">${meta}</div>
  </div>
  <div class="file-card-arrow">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</a>`;
}

async function renderFinal(){
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

async function showUserMessage(){
  $('#userBubble').textContent = scenario.userMessage;
  const wrap = $('#userMsgWrap');
  wrap.classList.remove('is-hidden');
  wrap.classList.add('message-enter');
  scrollToBottom();
  await sleep(playback('userMessageDelay', 720));
}

async function showAgentShell(){
  $('#agentName').textContent = scenario.agent.name;
  const agent = $('#agentMsg');
  agent.classList.remove('is-hidden');
  agent.classList.add('agent-enter');
  scrollToBottom();
  await sleep(playback('agentDelay', 520));
}

async function showThinkingLoading(){
  await runThinkingStatus();
}

function collapseProcessIntoTiming(){
  execOpen = false;
  const execArea = $('#execArea');
  execArea.className = 'exec-area closed';
  const btn = $('#timingBtn');
  if (btn) btn.className = 'timing-btn collapsed';
}

function resetPlaybackDom(){
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
  if (stepsList) {
    stepsList.innerHTML = '';
    stepsList.className = 'steps-list open';
  }
  if (main) main.innerHTML = '';
  if (execArea) execArea.className = 'exec-area open is-hidden';
  scrollToBottom();
}

function prepareInitialState(){
  resetPlaybackDom();
}

function initializePlayback(){
  autoPlaying = false;
  pauseRequested = false;
  directorBusy = false;
  fastRender = false;
  currentDirectorIndex = -1;
  directorRuntime = { rows: [] };
  resetPlaybackDom();
  directorTimeline = buildDirectorTimeline();
  updateDirectorControls();
}

function restartPlayback(){
  activePlayId += 1;
  initializePlayback();
  startDirectorAuto();
}

function startPlayback(){
  activePlayId += 1;
  initializePlayback();
  startDirectorAuto();
}

const TOOL_ICON_FILES = {
  think: 'ai-agent.svg',
  agent: 'ai-agent.svg',
  image: 'image.svg',
  tools: 'tools.svg',
  debug: 'wb-ai-debug.svg',
  edit: 'wb-edit.svg',
  plan: 'wb-growth-plan.svg',
  search: 'wb-search.svg',
  website: 'wb-website.svg',
  skill: 'wb-skills.svg',
  terminal: 'wb-terminal-ai.svg',
  view: 'wb-view.svg'
};

function inferToolIconKey(item = {}){
  const raw = `${item.icon || ''} ${item.text || ''} ${item.dim || ''} ${item.card?.title || ''}`;
  if (/🧠|思考|Sub Coding Agent|嵌套子对话|Subagent|agent/i.test(raw)) return 'agent';
  if (/🖼|图片|image/i.test(raw)) return 'image';
  if (/📖|技能|skill|docx/i.test(raw)) return 'skill';
  if (/⚠|失败|异常|debug|排查/i.test(raw)) return 'debug';
  if (/✏|编辑|创建文件|patch|改写|rewrite/i.test(raw)) return 'edit';
  if (/👀|读取|查看|view|read/i.test(raw)) return 'view';
  if (/🖥|执行命令|terminal|python|cd \/sessions/i.test(raw)) return 'terminal';
  if (/☐|☑|待办|计划|更新计划|todo/i.test(raw)) return 'plan';
  if (/网页|网站|联网|入境|交通卡|天气|汇率|路线/i.test(raw)) return 'website';
  if (/🔍|搜索|search/i.test(raw)) return 'search';
  return 'tools';
}

function isWarningEvent(item = {}){
  const raw = `${item.icon || ''} ${item.text || ''} ${item.dim || ''} ${item.card?.title || ''}`;
  return /⚠|失败|异常/i.test(raw);
}

function svgFromRegistry(file, className = 'tool-svg', title = ''){
  const resolved = ICON_ALIASES[file] || file;
  const raw = INLINE_ICONS[resolved];
  if (!raw) return '';
  const labelled = raw.replace(/<svg\b/, `<svg class="${className}" aria-hidden="true" focusable="false"`);
  return labelled;
}

function renderActionIcon(alias, className = 'action-svg'){
  return svgFromRegistry(alias, className) || '';
}

function renderToolIcon(item){
  if (isWarningEvent(item)) return ICONS.warn;
  const key = inferToolIconKey(item);
  const file = TOOL_ICON_FILES[key] || TOOL_ICON_FILES.tools;
  const alt = escapeHtml(key);
  const inline = svgFromRegistry(file, `tool-svg tool-svg-${key}`);
  return inline || `<img class="tool-svg tool-svg-${key}" src="./icons/${file}" alt="${alt}" loading="eager">`;
}

function renderStatusToolIcon(label){
  return renderToolIcon({ text: label });
}

function statusLineHTML(labels){
  const cleanLabels = (labels || []).map(stripChevron).filter(Boolean);
  const parts = cleanLabels.map((label, index) => {
    const sep = index > 0 ? '<span class="status-sep"> </span>' : '';
    return `${sep}<span class="status-fragment"><span class="status-icon">${renderStatusToolIcon(label)}</span><span class="status-label-text">${escapeHtml(label)}</span></span>`;
  }).join('');
  return `<span class="status-fragments">${parts}<span class="status-chevron">›</span></span>`;
}

function setStatusLineLabels(line, labels){
  line.innerHTML = statusLineHTML(labels);
}

function renderEvent(event){
  const key = isWarningEvent(event) ? 'warning' : inferToolIconKey(event);
  const row = document.createElement('div');
  const showChevron = /执行命令/.test(event.text || '');
  row.className = `s-row tool-${key}`;
  row.innerHTML = `
    <div class="s-ico"><div class="s-ico-img">${renderToolIcon(event)}</div></div>
    <div class="s-content">
      <div class="s-line">
        <span class="s-text">${escapeHtml(event.text || '')}</span>
        ${event.dim ? `<span class="s-text dim">${escapeHtml(event.dim)}</span>` : ''}
        ${showChevron ? '<span class="s-row-chevron">›</span>' : ''}
      </div>
      ${event.card ? `<div class="event-card"><div class="event-card-title">${escapeHtml(event.card.title || '')}</div><div class="event-card-body">${escapeHtml(event.card.body || '')}</div></div>` : ''}
    </div>`;
  return row;
}

function renderTodo(todo){
  const row = document.createElement('div');
  row.className = 's-sub';
  const statusIcon = todo.status === 'done' ? ICONS.todoOk : todo.status === 'active' ? ICONS.todoSpin : ICONS.todoEmpty;
  row.innerHTML = `<div class="s-sub-ico">${statusIcon}</div><span class="s-sub-txt ${todo.status === 'active' ? 'active' : ''}">${escapeHtml(todo.text)}</span>`;
  return row;
}

function getFrames(refs){
  if (!refs) return [];
  return refs.split(',').map(id => id.trim()).filter(Boolean).map(id => scenario.sheetFrames[id]).filter(Boolean);
}

function renderSheet(frameRefs, explicitTitle){
  const frames = getFrames(frameRefs);
  const fallback = {title:'过程',events:[],todos:[]};
  const frame = frames[0] || fallback;
  const title = explicitTitle || [...new Set(frames.map(f => f.title).filter(Boolean))].join('、') || frame.title || '过程';
  const events = frames.flatMap(f => f.events || []);
  const lastTodosFrame = [...frames].reverse().find(f => f.todos && f.todos.length);
  const todos = lastTodosFrame ? lastTodosFrame.todos : [];

  $('#sheetTitle').textContent = '过程';
  const sheet = $('#sheet');
  if (sheet) sheet.dataset.sheetContext = title;
  const body = $('#sheetBody');
  body.innerHTML = '';
  if (!events.length && !todos.length) {
    const empty = document.createElement('div');
    empty.className = 'sheet-empty';
    empty.textContent = '当前状态暂无新增事件。';
    body.appendChild(empty);
  }
  events.forEach(e => body.appendChild(renderEvent(e)));
  todos.forEach(t => body.appendChild(renderTodo(t)));
}

function openSheet(frameRefs, explicitTitle){
  if (frameRefs) renderSheet(frameRefs, explicitTitle);
  const ov = $('#overlay');
  ov.className = 'sheet-overlay vis';
  requestAnimationFrame(() => requestAnimationFrame(() => { ov.className = 'sheet-overlay vis show'; }));
}

function closeSheet(){
  const ov = $('#overlay');
  ov.className = 'sheet-overlay vis';
  ov.addEventListener('transitionend', function h(){
    ov.className = 'sheet-overlay';
    ov.removeEventListener('transitionend', h);
  });
}

function maybeClose(e){ if(e.target === $('#overlay')) closeSheet(); }
function toggleStep(id){ document.getElementById(id).classList.toggle('open'); }
function toggleExec(){
  execOpen = !execOpen;
  $('#execArea').className = 'exec-area ' + (execOpen ? 'open' : 'closed');
  const arrow = $('#timingArrow');
  if (arrow) {
    arrow.src = execOpen ? './icons/up.svg' : './icons/right.svg';
    arrow.className = 'timing-arrow' + (execOpen ? '' : ' collapsed');
  }
}
function toggleSteps(){
  stepsOpen = !stepsOpen;
  $('#stepsList').className = 'steps-list ' + (stepsOpen ? 'open' : 'closed');
}

window.openSheet = openSheet;
window.closeSheet = closeSheet;
window.maybeClose = maybeClose;
window.toggleStep = toggleStep;
window.toggleExec = toggleExec;
window.toggleSteps = toggleSteps;

window.addEventListener('load', () => { applyUrlPlaybackOverrides(); setupDemoControls(); startPlayback(); });
