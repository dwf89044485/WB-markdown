// ============================================================
// SHEET — Bottom sheet render · openSheet · closeSheet
// ============================================================

import { escapeHtml } from './markdown.js';
import { ICONS, renderToolIcon, renderActionIcon } from './icons.js';

const scenario = window.WORKBUDDY_SCENARIO;
const $ = (sel, root = document) => root.querySelector(sel);

export function renderEvent(event) {
  const key = (event.icon || event.text || '').includes('⚠') || /失败|异常/i.test(event.text || '') ? 'warning' : null;
  const row = document.createElement('div');
  const showChevron = /执行命令/.test(event.text || '');

  // Re-import to avoid circular — use inline version
  const isWarn = /⚠|失败|异常/i.test(`${event.icon || ''} ${event.text || ''} ${event.dim || ''} ${event.card?.title || ''}`);
  const iconHTML = isWarn
    ? ICONS.warn
    : (() => {
        // inline inferToolIconKey logic
        const raw = `${event.icon || ''} ${event.text || ''} ${event.dim || ''} ${event.card?.title || ''}`;
        let k = 'tools';
        if (/🧠|思考|Sub Coding Agent|嵌套子对话|Subagent|agent/i.test(raw)) k = 'agent';
        else if (/🖼|图片|image/i.test(raw)) k = 'image';
        else if (/📖|技能|skill|docx/i.test(raw)) k = 'skill';
        else if (/⚠|失败|异常|debug|排查/i.test(raw)) k = 'debug';
        else if (/✏|编辑|创建文件|patch|改写|rewrite/i.test(raw)) k = 'edit';
        else if (/👀|读取|查看|view|read/i.test(raw)) k = 'view';
        else if (/🖥|执行命令|terminal|python|cd \/sessions/i.test(raw)) k = 'terminal';
        else if (/☐|☑|待办|计划|更新计划|todo/i.test(raw)) k = 'plan';
        else if (/网页|网站|联网|入境|交通卡|天气|汇率|路线/i.test(raw)) k = 'website';
        else if (/🔍|搜索|search/i.test(raw)) k = 'search';
        return renderToolIcon(event);
      })();

  const toolKey = (() => {
    const raw = `${event.icon || ''} ${event.text || ''} ${event.dim || ''} ${event.card?.title || ''}`;
    if (/⚠|失败|异常/i.test(raw)) return 'warning';
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
  })();

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
  const title = explicitTitle || [...new Set(frames.map(f => f.title).filter(Boolean))].join('、') || frame.title || '过程';
  const events = frames.flatMap(f => f.events || []);

  // 支持新格式（todoOverrides + baseline）和旧格式（todos 完整数组）兼容
  const baseline = scenario.todosBaseline || [];
  const lastTodosFrame = [...frames].reverse().find(f =>
    (f.todoOverrides !== undefined) || (f.todos && f.todos.length)
  );
  let todos = [];
  if (lastTodosFrame) {
    if (lastTodosFrame.todoOverrides !== undefined) {
      const overrideMap = {};
      (lastTodosFrame.todoOverrides || []).forEach(o => { overrideMap[o.index] = o.status; });
      todos = baseline.map((text, i) => ({ text, status: overrideMap[i] || 'todo' }));
    } else {
      todos = lastTodosFrame.todos;
    }
  }

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
