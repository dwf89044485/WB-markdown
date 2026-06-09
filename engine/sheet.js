// ============================================================
// SHEET — Bottom sheet render · openSheet · closeSheet
// ============================================================

import { escapeHtml } from './markdown.js';
import { ICONS, renderToolIcon, inferToolIconKey, isWarningEvent, svgFromRegistry } from './icons.js';

const scenario = window.WORKBUDDY_SCENARIO;
const $ = (sel, root = document) => root.querySelector(sel);

export function renderEvent(event) {
  const isWarn = isWarningEvent(event);
  const toolKey = isWarn ? 'warning' : inferToolIconKey(event);
  const row = document.createElement('div');
  const showChevron = /执行命令/.test(event.text || '');

  row.className = `s-row tool-${toolKey}`;
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

export function renderTodo(todo) {
  const row = document.createElement('div');
  row.className = 's-sub';
  const statusIcon = todo.status === 'done' ? ICONS.todoOk : todo.status === 'active' ? ICONS.todoSpin : ICONS.todoEmpty;
  row.innerHTML = `<div class="s-sub-ico">${statusIcon}</div><span class="s-sub-txt ${todo.status === 'active' ? 'active' : ''}">${escapeHtml(todo.text)}</span>`;
  return row;
}

export function renderSearchItem(text) {
  const row = document.createElement('div');
  row.className = 's-sub';
  const icon = svgFromRegistry('wb-website.svg', 'tool-svg tool-svg-website');
  row.innerHTML = `<div class="s-sub-ico">${icon}</div><span class="s-sub-txt">${escapeHtml(text)}</span>`;
  return row;
}

function renderOutput(output) {
  switch (output.type) {
    case 'search':
      return renderSearchItem(output.text);
    default:
      return document.createElement('div');
  }
}

function computeTodoSnapshot(frames, baseline) {
  const lastOverrideFrame = [...frames].reverse().find(f =>
    (f.todoOverrides !== undefined) || (f.todos && f.todos.length)
  );
  if (!lastOverrideFrame) return [];
  if (lastOverrideFrame.todoOverrides !== undefined) {
    const overrideMap = {};
    (lastOverrideFrame.todoOverrides || []).forEach(o => { overrideMap[o.index] = o.status; });
    return baseline.map((text, i) => ({ text, status: overrideMap[i] || 'todo' }));
  }
  return lastOverrideFrame.todos;
}

export function renderFileCard(card) {
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

export function getFrames(refs) {
  if (!refs) return [];
  return refs.split(',').map(id => id.trim()).filter(Boolean).map(id => scenario.sheetFrames[id]).filter(Boolean);
}

export function renderSheet(frameRefs, explicitTitle) {
  const frames = getFrames(frameRefs);
  const fallback = { title: '过程', events: [], todos: [] };
  const frame = frames[0] || fallback;
  const baseline = scenario.todosBaseline || [];
  const todos = computeTodoSnapshot(frames, baseline);

  const body = $('#sheetBody');
  body.innerHTML = '';

  const hasContent = frames.some(f => (f.events && f.events.length)) || todos.length;
  if (!hasContent) {
    const empty = document.createElement('div');
    empty.className = 'sheet-empty';
    empty.textContent = '当前状态暂无新增事件。';
    body.appendChild(empty);
    return;
  }

  // 按帧顺序渲染：逐 event 渲染，然后渲染 event 的 outputs（如果有）
  // 兼容旧格式：如果帧有 searchItems 且 events 无 outputs，回退到帧级渲染
  for (const f of frames) {
    if (f.events) {
      for (const ev of f.events) {
        body.appendChild(renderEvent(ev));
        if (ev.outputs) {
          ev.outputs.forEach(out => body.appendChild(renderOutput(out)));
        }
      }
    }
    // 旧格式兼容：帧级别的 searchItems（仅当 events 中无 outputs 时）
    if (f.searchItems && !f.events?.some(ev => ev.outputs)) {
      f.searchItems.forEach(item => body.appendChild(renderSearchItem(item)));
    }
  }
  todos.forEach(t => body.appendChild(renderTodo(t)));
}

export function openSheet(frameRefs, explicitTitle) {
  if (frameRefs) renderSheet(frameRefs, explicitTitle);
  const ov = $('#overlay');
  ov.className = 'sheet-overlay vis';
  requestAnimationFrame(() => requestAnimationFrame(() => { ov.className = 'sheet-overlay vis show'; }));
}

export function closeSheet() {
  const ov = $('#overlay');
  ov.className = 'sheet-overlay vis';
  ov.addEventListener('transitionend', function h() {
    ov.className = 'sheet-overlay';
    ov.removeEventListener('transitionend', h);
  });
}

export function maybeClose(e) {
  if (e.target === $('#overlay')) closeSheet();
}
