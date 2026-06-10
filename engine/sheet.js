// ============================================================
// SHEET — Bottom sheet render · openSheet · closeSheet
// ============================================================

import { escapeHtml } from './markdown.js';
import { ICONS, renderToolIcon, inferToolIconKey, isWarningEvent, svgFromRegistry } from './icons.js';
import { sleep, playbackDelay, playback, currentTokensPerSecond, fastRender } from './core.js';

const scenario = window.WORKBUDDY_SCENARIO;
const $ = (sel, root = document) => root.querySelector(sel);

// ── Event row ─────────────────────────────────────────────
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

// ── Todo row ──────────────────────────────────────────────
export function renderTodo(todo) {
  const row = document.createElement('div');
  row.className = 's-sub';
  const statusIcon = todo.status === 'done' ? ICONS.todoOk : todo.status === 'active' ? ICONS.todoSpin : ICONS.todoEmpty;
  row.innerHTML = `<div class="s-sub-ico">${statusIcon}</div><span class="s-sub-txt ${todo.status === 'active' ? 'active' : ''}">${escapeHtml(todo.text)}</span>`;
  return row;
}

// ── Search result / output row ────────────────────────────
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

// ── Todo snapshot（保留，供 getFullTodoList 复用）─────────
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

// ── File card ─────────────────────────────────────────────
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

// ── Frame resolution ──────────────────────────────────────
export function getFrames(refs) {
  if (!refs) return [];
  return refs.split(',').map(id => id.trim()).filter(Boolean).map(id => scenario.sheetFrames[id]).filter(Boolean);
}

// ── Sheet body auto-scroll ────────────────────────────────
function scrollSheetBody() {
  const body = $('#sheetBody');
  if (!body) return;
  if (body.scrollTop + body.clientHeight < body.scrollHeight - 32) return;
  body.scrollTop = body.scrollHeight;
}

// ── Get full todo list for skeleton rendering ─────────────
function getFullTodoList(frames, baseline) {
  const snapshot = computeTodoSnapshot(frames, baseline);
  return snapshot.map(t => ({ text: t.text, status: 'todo' }));
}

// ── Render todo skeleton（all items at once, all 'todo'）──
function renderTodoSkeleton(frames, baseline) {
  const items = getFullTodoList(frames, baseline);
  if (!items.length) return [];
  return items.map((item, index) => {
    const row = renderTodo({ text: item.text, status: 'todo' });
    return { index, row, text: item.text };
  });
}

// ── Apply todo overrides to existing DOM elements ─────────
function applyTodoOverridesToDom(overrides, todoElements) {
  if (!overrides || !overrides.length) return;
  for (const o of overrides) {
    const el = todoElements[o.index];
    if (!el || !el.row) continue;
    const statusIcon = o.status === 'done' ? ICONS.todoOk : o.status === 'active' ? ICONS.todoSpin : ICONS.todoEmpty;
    const icoEl = el.row.querySelector('.s-sub-ico');
    const txtEl = el.row.querySelector('.s-sub-txt');
    if (icoEl) icoEl.innerHTML = statusIcon;
    if (txtEl) txtEl.className = 's-sub-txt' + (o.status === 'active' ? ' active' : '');
  }
}

// ── Typewriter for thinking card body ─────────────────────
async function typeCardBody(target, text) {
  if (!text) return;
  if (fastRender) {
    target.textContent = text;
    return;
  }
  const chunkSize = Math.max(1, Math.floor(playback('chunkSize', 1)));
  const interval = (1000 * chunkSize) / currentTokensPerSecond();
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    target.textContent += chunk;
    scrollSheetBody();
    await sleep(chunk.trim() ? interval : Math.max(1, interval * 0.35));
  }
}

// ── Streaming sheet content renderer ──────────────────────
//
// 流式顺序：事件行从顶向下逐帧出现 → 首个带待办数据的帧出现时，
// 待办骨架出现在底部 → 后续帧更新待办状态 → 事件行始终插在待办上方
//
async function streamSheetContent(frames, baseline) {
  const body = $('#sheetBody');
  const frameDelay = playbackDelay('frameDelay', 520);
  const renderedKeys = new Set();
  let todoElements = [];
  let firstTodo = null;

  const insert = (row) => {
    if (firstTodo) body.insertBefore(row, firstTodo);
    else body.appendChild(row);
  };

  for (const f of frames) {
    // ── Render new events（deduped by key）──
    if (f.events) {
      for (const ev of f.events) {
        const key = `${ev.icon || ''}|${ev.text || ''}|${ev.dim || ''}`;
        if (renderedKeys.has(key)) continue;
        renderedKeys.add(key);

        const isThinking = ev.icon === '🧠' || ev.text === '思考过程';
        if (isThinking && ev.card && ev.card.body) {
          const evShell = { ...ev };
          evShell.card = { ...ev.card, body: '' };
          const row = renderEvent(evShell);
          insert(row);
          scrollSheetBody();
          const cardBody = row.querySelector('.event-card-body');
          if (cardBody) await typeCardBody(cardBody, ev.card.body);
        } else {
          insert(renderEvent(ev));
          scrollSheetBody();

          if (ev.outputs) {
            for (const out of ev.outputs) {
              insert(renderOutput(out));
              scrollSheetBody();
              await sleep(Math.round(frameDelay * 0.25));
            }
          }
        }
      }
    }

    // Legacy compat: frame-level searchItems
    if (f.searchItems && !f.events?.some(ev => ev.outputs)) {
      f.searchItems.forEach(item => insert(renderSearchItem(item)));
      scrollSheetBody();
    }

    // ── First frame with todo data: render skeleton at bottom ──
    const hasFrameTodos = (f.todoOverrides !== undefined) || (f.todos && f.todos.length > 0);
    if (!todoElements.length && hasFrameTodos) {
      todoElements = renderTodoSkeleton(frames, baseline);
      if (todoElements.length) {
        firstTodo = todoElements[0].row;
        todoElements.forEach(t => body.appendChild(t.row));
        scrollSheetBody();
        await sleep(Math.round(frameDelay * 0.4));
      }
    }

    // ── Apply todo overrides（DOM-level mutation）──
    if (f.todoOverrides && todoElements.length) {
      applyTodoOverridesToDom(f.todoOverrides, todoElements);
      await sleep(Math.round(frameDelay * 0.4));
    }

    // ── Inter-frame delay ──
    await sleep(frameDelay);
  }
}

// ── Open sheet with streaming ─────────────────────────────
export async function openSheet(frameRefs, explicitTitle) {
  if (!frameRefs) {
    const ov = $('#overlay');
    ov.className = 'sheet-overlay vis';
    requestAnimationFrame(() => requestAnimationFrame(() => { ov.className = 'sheet-overlay vis show'; }));
    return;
  }

  const frames = getFrames(frameRefs);
  const baseline = scenario.todosBaseline || [];
  const body = $('#sheetBody');
  body.innerHTML = '';

  const hasEvents = frames.some(f => f.events && f.events.length);
  const hasTodos = frames.some(f =>
    (f.todoOverrides !== undefined) || (f.todos && f.todos.length)
  );

  if (!hasEvents && !hasTodos) {
    const empty = document.createElement('div');
    empty.className = 'sheet-empty';
    empty.textContent = '当前状态暂无新增事件。';
    body.appendChild(empty);
    return;
  }

  // Show sheet overlay (body starts empty)
  const ov = $('#overlay');
  ov.className = 'sheet-overlay vis';
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  ov.className = 'sheet-overlay vis show';

  // Stream all content: events first, todos appear at bottom when their data arrives
  await streamSheetContent(frames, baseline);
}

// ── Close sheet ───────────────────────────────────────────
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
