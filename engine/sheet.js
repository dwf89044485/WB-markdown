// ============================================================
// SHEET — Bottom sheet render · openSheet · closeSheet
// ============================================================

import { escapeHtml } from './markdown.js';
import { ICONS, renderToolIcon, inferToolIconKey, isWarningEvent, svgFromRegistry } from './icons.js';
import { sleep, sleepDelay, currentTokensPerSecond, fastRender } from './core.js';

const scenario = window.WORKBUDDY_SCENARIO;
const $ = (sel, root = document) => root.querySelector(sel);
let sheetRenderToken = 0;

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
  const icon = svgFromRegistry('wb-website.svg', 'tool-svg tool-svg-website') || '<img class="tool-svg tool-svg-website" src="./icons/wb-website.svg" alt="website" loading="eager">';
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
function scrollSheetBody(body) {
  if (!body) body = $('#sheetBody');
  if (!body) return;
  const sheet = $('#sheet');
  if (!sheet) return;

  // 80% + 用户已翻上去 → 不打断
  if (sheet.classList.contains('expanded')) {
    const threshold = 20;
    if (body.scrollTop < body.scrollHeight - body.clientHeight - threshold) return;
  }
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
  const chunkSize = Math.max(1, Math.ceil(currentTokensPerSecond() / 250));
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    const interval = (1000 * chunkSize) / currentTokensPerSecond();
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
async function streamSheetContent(frames, baseline, opts = {}) {
  const { animated = true, renderToken } = opts;
  const body = $('#sheetBody');
  const renderedKeys = new Set();
  let todoElements = [];
  let firstTodo = null;

  const isStale = () => renderToken !== sheetRenderToken;
  const insert = (row) => {
    if (isStale()) return;
    if (firstTodo) body.insertBefore(row, firstTodo);
    else body.appendChild(row);
  };

  for (const f of frames) {
    if (isStale()) return;
    // ── Render new events（deduped by key）──
    if (f.events) {
      for (const ev of f.events) {
        if (isStale()) return;
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
          if (cardBody) {
            if (animated) await typeCardBody(cardBody, ev.card.body);
            else cardBody.textContent = ev.card.body;
          }
        } else {
          insert(renderEvent(ev));
          scrollSheetBody();

          if (ev.outputs) {
            for (const out of ev.outputs) {
              if (isStale()) return;
              insert(renderOutput(out));
              scrollSheetBody();
              if (animated) await sleepDelay('frameDelay', 520, 0.25);
            }
          }
        }
      }
    }

    if (isStale()) return;
    // Legacy compat: frame-level searchItems
    if (f.searchItems && !f.events?.some(ev => ev.outputs)) {
      f.searchItems.forEach(item => insert(renderSearchItem(item)));
      scrollSheetBody();
    }

    if (isStale()) return;
    // ── Todo phase: only render/update on 创建待办 or 更新待办 frames ──
    // Other phase frames (搜索网页, 生成图片, etc.) may carry todoOverrides but
    // should NOT show todo changes mid-phase — the user sees progress at the end.
    const isTodoPhase = f.title === '创建待办' || f.title === '更新待办';
    const hasFrameTodos = (f.todoOverrides !== undefined) || (f.todos && f.todos.length > 0);

    if (isTodoPhase && hasFrameTodos) {
      if (!todoElements.length) {
        // First todo phase: render skeleton and apply current overrides in one shot
        todoElements = renderTodoSkeleton(frames, baseline);
        if (todoElements.length) {
          firstTodo = todoElements[0].row;
          todoElements.forEach(t => body.appendChild(t.row));
          if (f.todoOverrides) applyTodoOverridesToDom(f.todoOverrides, todoElements);
          scrollSheetBody();
          if (animated) await sleepDelay('frameDelay', 520, 0.4);
        }
      } else {
        // Subsequent todo phases: update existing DOM with accumulated state
        if (f.todoOverrides) applyTodoOverridesToDom(f.todoOverrides, todoElements);
        if (animated) await sleepDelay('frameDelay', 520, 0.4);
      }
    }

    // ── Inter-frame delay ──
    if (animated) await sleepDelay('frameDelay', 520);
  }
}

// ── Open sheet with streaming ─────────────────────────────
export async function openSheet(frameRefs, explicitTitle, options = {}) {
  const renderToken = ++sheetRenderToken;
  const replay = options.replay !== false;

  // ── customRenderer mode: 直接渲染自定义内容，不走 frames ──
  if (options.customRenderer) {
    const body = $('#sheetBody');
    body.innerHTML = '';
    options.customRenderer(body);
    resetSheetHeight();
    const ov = $('#overlay');
    ov.className = 'sheet-overlay vis';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (renderToken !== sheetRenderToken) return;
    ov.className = 'sheet-overlay vis show';
    return;
  }

  if (!frameRefs) {
    const ov = $('#overlay');
    ov.className = 'sheet-overlay vis';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (renderToken !== sheetRenderToken) return;
      ov.className = 'sheet-overlay vis show';
    }));
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

  // Show sheet overlay (body starts empty, height at 40%)
  resetSheetHeight();
  const ov = $('#overlay');
  ov.className = 'sheet-overlay vis';
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (renderToken !== sheetRenderToken) return;
  ov.className = 'sheet-overlay vis show';

  // Running: replay animations; completed: render final static content immediately
  await streamSheetContent(frames, baseline, { animated: replay, renderToken });

  // 静态已完成内容：停到顶部，从最早的信息开始看起
  if (!replay) {
    const body = $('#sheetBody');
    if (body) body.scrollTop = 0;
  }
}

// ── Close sheet ───────────────────────────────────────────
export function closeSheet() {
  sheetRenderToken += 1;
  const ov = $('#overlay');
  resetSheetHeight();
  ov.className = 'sheet-overlay vis';
  ov.addEventListener('transitionend', function h() {
    ov.className = 'sheet-overlay';
    ov.removeEventListener('transitionend', h);
  });
}

export function maybeClose(e) {
  if (e.target === $('#overlay')) closeSheet();
}

// ── Drag interaction ──────────────────────────────────────
// 40%: 面板任意位置操控——上拖展开、下拖关闭
// 80%: 内容在顶部时下拖折叠；不在顶部时正常滚动
let dragState = null;

function resetSheetHeight() {
  const sheet = $('#sheet');
  if (!sheet) return;
  sheet.classList.remove('expanded');
  sheet.style.height = '';
}

function initSheetDrag() {
  const sheet = $('#sheet');
  const body = $('#sheetBody');
  if (!sheet || !body) return;

  const onStart = (e) => {
    // 不拦截 close button 的点击
    if (e.target.closest('.sheet-close-btn')) return;

    const touch = e.touches ? e.touches[0] : e;
    const rect = sheet.getBoundingClientRect();
    const isExpanded = sheet.classList.contains('expanded');

    if (!isExpanded) {
      // 40%: 整个面板都可拖
      e.preventDefault();
      dragState = { resize: true, startExpanded: false,
        startY: touch.clientY, startH: rect.height,
        containerH: sheet.parentElement.getBoundingClientRect().height };
      return;
    }

    // 80%: 内容在顶部时才可能折叠
    if (body.scrollTop > 0) return;
    dragState = { resize: false, startExpanded: true,
      startY: touch.clientY, startH: rect.height,
      containerH: sheet.parentElement.getBoundingClientRect().height };
  };

  const onMove = (e) => {
    if (!dragState) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = dragState.startY - y;
    const isExpanded = sheet.classList.contains('expanded');

    // 80%: 首次上拖则释放（走滚动）
    if (isExpanded && !dragState.resize) {
      if (dy >= 0) { dragState = null; return; }
      dragState.resize = true;
      e.preventDefault();
    }

    if (!dragState.resize) return;
    e.preventDefault();
    sheet.style.transition = 'none';
    const h = Math.max(0, dragState.startH + dy);
    const pct = Math.min(80, Math.max(10, (h / dragState.containerH) * 100));

    // 40% + 下拖超过阈值 → 关闭 sheet（基于拖拽起始状态，避免折叠过程中误关）
    if (!dragState.startExpanded && dy < -40) {
      dragState = null;
      closeSheet();
      return;
    }

    sheet.style.height = pct + '%';
    sheet.classList.toggle('expanded', pct >= 70);
  };

  const onEnd = () => {
    if (!dragState) return;
    const currentH = sheet.getBoundingClientRect().height;
    const pct = (currentH / dragState.containerH) * 100;
    const wasExpanded = dragState.startExpanded;
    dragState = null;
    sheet.style.transition = 'height 0.32s cubic-bezier(0.32,0.72,0,1), transform 0.36s cubic-bezier(0.32,0.72,0,1)';
    // 双向滞后：从40%拉起需过半（50%）才展开，从80%拉下到75%即折叠
    const threshold = wasExpanded ? 75 : 50;
    if (pct >= threshold) {
      sheet.style.height = '80%';
      sheet.classList.add('expanded');
    } else {
      sheet.style.height = '40%';
      sheet.classList.remove('expanded');
    }
    sheet.addEventListener('transitionend', function h() {
      sheet.style.transition = '';
      sheet.removeEventListener('transitionend', h);
    });
  };

  sheet.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  sheet.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
}

// Initialize drag on first sheet render
(function () {
  const check = () => {
    if ($('#sheet')) { initSheetDrag(); return; }
    requestAnimationFrame(check);
  };
  check();
})();