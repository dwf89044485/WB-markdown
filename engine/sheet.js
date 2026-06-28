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
  const showChevron = !!event.detail;

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
  if (event.detail) row._sheetDetail = event.detail;
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
export function computeTodoSnapshot(frames, baseline) {
  const lastOverrideFrame = [...frames].reverse().find(f =>
    (f.todoOverrides !== undefined) || (f.todos && f.todos.length)
  );
  if (!lastOverrideFrame) return [];
  if (lastOverrideFrame.todoOverrides !== undefined) {
    const overrideMap = {};
    (lastOverrideFrame.todoOverrides || []).forEach(o => {
      if (o.index >= baseline.length) { console.warn('[sheet] todoOverride index out of bounds:', o.index, '>=', baseline.length); return; }
      overrideMap[o.index] = o.status;
    });
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
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="28" height="28"><path fill="#E57163" transform="matrix(1 -4.92785e-09 -4.92785e-09 1 2.91666 1.75)" d="M22.1667 11.2921C22.1667 9.8751 22.1667 9.1666 21.9049 8.5284C21.6431 7.8901 21.1456 7.3856 20.1506 6.3768L15.9177 2.0847C14.9035 1.0563 14.3964 0.5422 13.7483 0.2711C13.1002 0 12.378 0 10.9337 0L8.1667 0C4.3328 0 2.4039 -0.0119 1.196 1.196C-0.0119 2.4039 0 4.3328 0 8.1667L0 16.3333C0 20.1672 -0.0119 22.0961 1.196 23.304C2.4039 24.512 4.3328 24.5 8.1667 24.5L14 24.5C17.8339 24.5 19.7628 24.512 20.9707 23.304C22.1786 22.0961 22.1667 20.1672 22.1667 16.3333L22.1667 11.2921Z"/><g opacity="0.5"><path fill="#FFC2C2" transform="matrix(1 -4.92785e-09 -4.92785e-09 1 11.3169 1.75)" d="M13.7636 9.584C13.7579 9.2906 13.7414 9.0872 13.6949 8.8918C13.6314 8.6255 13.5269 8.3703 13.3848 8.1359C13.2244 7.8713 13.002 7.644 12.5516 7.1891L6.7007 1.2564C6.2435 0.7927 6.0148 0.5608 5.747 0.3951C5.5101 0.2484 5.2509 0.1399 4.9797 0.0741C4.6738 0 4.3482 0 3.6971 0L0 0L0 0.0117L2.6367 0.0117L2.6726 0.0117C3.8865 0.0117 4.5009 0.0117 4.8871 0.3979C5.2734 0.7839 5.2734 1.3985 5.2733 2.6125L5.2733 2.6483L5.2733 3.3075L5.2733 3.3795C5.2734 5.8074 5.2734 7.0362 6.0455 7.8086C6.818 8.5808 8.0468 8.5808 10.4746 8.5808L10.5467 8.5808L11.2058 8.5808L11.2417 8.5808C12.4556 8.5808 13.0703 8.5808 13.4563 8.967C13.6149 9.1254 13.7083 9.3225 13.7636 9.584Z"/></g><path fill="#FFF" transform="matrix(1 -4.92785e-09 -4.92785e-09 1 7.66537 11.6769)" d="M4.877 0.1534C5.6199 0.1431 5.9913 0.1376 6.2726 0.2793C6.5213 0.4045 6.7223 0.6072 6.8388 0.856C7.0057 1.212 6.9549 1.5541 6.8532 2.2387C6.5604 4.2088 5.8168 6.0054 4.5088 7.7032C4.0307 8.3235 3.4873 8.8771 2.8951 9.374C2.3715 9.8134 2.1098 10.0332 1.721 10.0786C1.4525 10.1101 1.1783 10.0486 0.9431 9.908C0.6779 7.7499 0.4851 9.4432 0.0993 8.8304L0 8.6727C1.0983 8.0286 1.9761 7.2536 2.6593 6.3669C3.9936 4.635 4.7443 2.5052 4.7224 0.6693C4.718 0.4978 4.715 0.3269 4.696 0.1563L4.877 0.1534Z"/><path fill="#FFF" transform="matrix(1 -4.92785e-09 -4.92785e-09 1 7.66537 11.6769)" d="M5.7251 0.0102C5.4942 -0.0223 5.223 0.0253 4.6806 0.1203C5.1728 2.7531 6.296 4.9166 8.3398 6.7332C9.3905 7.6669 10.6163 8.3347 11.9274 8.8246C12.1931 8.1474 12.3259 7.8091 12.2957 7.4966C12.2664 7.1934 12.134 6.9034 11.9275 6.6662C11.7704 6.4853 11.415 6.3067 10.775 5.8883C10.4352 5.6659 10.1188 5.4238 9.8244 5.1622C8.8275 4.2761 7.9231 3.1203 7.3715 1.8464C7.1425 1.3173 7.0576 1.0353 6.9639 0.8808C6.6838 0.4199 6.2371 0.0823 5.7251 0.0102Z"/><path fill="#FFF" transform="matrix(1 -4.92785e-09 -4.92785e-09 1 7.66537 11.6769)" d="M11.9243 8.6309C11.974 7.9121 11.999 7.5526 11.8805 7.2681C11.7757 7.0167 11.5943 6.804 11.363 6.6659C11.0553 6.4828 10.7082 6.484 10.0139 6.4869C9.1628 6.4902 8.3111 6.5429 7.4729 6.635C5.1246 6.8928 2.7783 7.4828 0.5374 8.4863L0.0458 8.7142L0.1852 8.9643C0.527 9.5774 0.6979 9.8838 0.9492 10.0589C1.1685 10.2121 1.4301 10.2971 1.6998 10.3065C1.9484 10.3148 2.2935 10.1864 2.9832 9.9398C4.5287 9.3882 6.1435 9.029 7.778 8.8497C8.6104 8.7583 9.7793 8.7364 10.5081 8.738C10.939 8.739 11.4826 8.7702 11.9121 8.8069L11.9243 8.6309Z"/></svg>
  </div>
  <div class="file-card-info">
    <div class="file-card-title">${title}</div>
    <div class="file-card-meta">${meta}</div>
  </div>
  <div class="file-card-arrow">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24"><path fill="#000" fill-opacity="0.7" transform="matrix(0.707107 -0.707107 0.707107 0.707107 3.69061 12.2512)" d="M6.5364 10.4479L10.1114 6.8728L10.1283 6.8559Q10.6557 6.3286 10.8229 6.1085Q11.1569 5.669 11.1569 5.2239Q11.1569 4.7789 10.8229 4.3394Q10.6557 4.1193 10.1283 3.5919L10.1114 3.575L6.5364 0L5.7135 0.8229L9.2885 4.3979L9.3055 4.4149Q9.428 4.5374 9.5287 4.642L0 4.642L0 5.8057L9.5289 5.8057Q9.4281 5.9104 9.3055 6.033L9.2885 6.0499L5.7135 9.625L6.5364 10.4479Z" fill-rule="evenodd"/></svg>
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
    const sheet = $('#sheet');
    if (options.variant === 'code') {
      sheet.classList.add('code-variant');
    } else {
      sheet.classList.remove('code-variant');
    }
    options.customRenderer(body);
    resetSheetHeight();
    const ov = $('#overlay');
    ov.className = 'sheet-overlay vis';
    ov.style.pointerEvents = 'auto';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (renderToken !== sheetRenderToken) return;
    ov.className = 'sheet-overlay vis show';
    return;
  }

  if (!frameRefs) {
    const ov = $('#overlay');
    ov.className = 'sheet-overlay vis';
    ov.style.pointerEvents = 'auto';
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
  body.classList.remove('detail-mode');
  const sheet = $('#sheet');
  if (sheet) sheet.classList.remove('detail-mode');
  if (sheet) sheet.classList.remove('code-variant');

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
  const ov = $('#overlay');
  if (!options.skipHeightReset) {
    resetSheetHeight();
    ov.style.pointerEvents = 'auto';
    ov.className = 'sheet-overlay vis';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (renderToken !== sheetRenderToken) return;
    ov.className = 'sheet-overlay vis show';
  }
  // Store current sheet state for back navigation
  ov.dataset.frames = frameRefs || '';
  ov.dataset.title = explicitTitle || '';

  // Running: replay animations; completed: render final static content immediately
  await streamSheetContent(frames, baseline, { animated: replay, renderToken });

  // 静态已完成内容：停到顶部，从最早的信息开始看起
  if (!replay) {
    const body = $('#sheetBody');
    if (body) body.scrollTop = 0;
  }
}

// ── Sheet navigation history ───────────────────────────
let sheetBackState = null; // { frameRefs, title, options }

export function setSheetBackState(frameRefs, title) {
  sheetBackState = { frameRefs, title, opts: {} };
  showBackButton();
}

function showBackButton() {
  const start = $('#sheetTopStart');
  if (!start || start.children.length) return;
  import('./ask-question.js').then(m => {
    const html = m.glassNavBtn(m.GLYPH_PREV, false);
    const w = document.createElement('div');
    w.innerHTML = html;
    const btn = w.firstElementChild;
    btn.setAttribute('aria-label', '返回');
    btn.addEventListener('click', goBackInSheet);
    start.appendChild(btn);
  });
}

function hideBackButton() {
  const start = $('#sheetTopStart');
  if (start) start.innerHTML = '';
}

export async function goBackInSheet(e) {
  if (e) e.stopPropagation();
  if (!sheetBackState) return;
  const { frameRefs, title, opts } = sheetBackState;
  sheetBackState = null;
  hideBackButton();
  const body = $('#sheetBody');
  const sheet = body ? body.closest('.bottom-sheet') : null;
  if (body) body.classList.remove('detail-mode', 'slide-in-left', 'slide-in-right');
  if (sheet) sheet.classList.remove('detail-mode');
  await openSheet(frameRefs, title, { ...opts, replay: false, skipHeightReset: true });
  if (body) {
    void body.offsetWidth;  // force reflow to restart animation
    body.classList.add('slide-in-left');
  }
}

// ── Render detail content (二级 sheet, 数据驱动) ──────────
// 统一 HTML 生成函数（左右两侧共用）
// mode: 'live' → 生成 DOM 并注入到 container
// mode: 'static' → 返回 HTML 字符串
function renderDetailHTML(detail, mode = 'static', container) {
  if (!detail || !detail.sections || !detail.sections.length) {
    if (mode === 'live' && container) {
      container.innerHTML = '';
      return;
    }
    return '';
  }

  const sectionsHtml = detail.sections.map(section => {
    const cardCls = 'sd-card' + (section.variant === 'code' ? ' sd-variant-code' : '');
    return `<div class="sd-section">
      <div class="sd-label">${escapeHtml(section.label || '')}</div>
      <div class="${cardCls}">${escapeHtml(section.content || '')}</div>
    </div>`;
  }).join('');

  const html = `<div class="sd-container slide-in-right">${sectionsHtml}</div>`;

  if (mode === 'live' && container) {
    container.innerHTML = '';
    container.classList.add('detail-mode');
    const sheet = container.closest('.bottom-sheet');
    if (sheet) sheet.classList.add('detail-mode');
    container.insertAdjacentHTML('beforeend', html);
    return;
  }

  return html;
}

export function renderDetailContent(detail, container) {
  renderDetailHTML(detail, 'live', container);
}

// ── 静态快照渲染（供右侧文档面板用）─────────────
// 一级 sheet：把 events 数组渲染为 s-row 列表（不走 streaming）
export function renderStaticSheet(events) {
  if (!events || !events.length) return '<div class="sheet-empty">当前状态暂无事件。</div>';
  return events.map(ev => renderEvent(ev).outerHTML).join('');
}

// 二级 sheet：把 detail.sections 渲染为 sd-container
export function renderStaticDetail(detail) {
  return renderDetailHTML(detail, 'static');
}

// ── 静态快照：sheet 外壳（overlay + bottom-sheet + sheet-top + sheet-body）──
// 供右侧 Feature Panel 展示 sheet 的构成、状态和动效。
// class 结构与 index.html 中的 live DOM 完全一致，仅通过 .fp-sheet-shell-frame
// 约束定位容器（live 版本依赖 phone-shell 绝对定位，快照需要独立容器）。
//
// opts.state:      'collapsed'(40%) | 'expanded'(80%)
// opts.body:       sheet-body 内部 HTML（可选，默认空）
// renderStaticSheetShell — 渲染静态 Sheet 外壳（用于 Feature Panel 快照）
// ⚠️ 快照尺寸由各 feature 通过 opts.width / opts.height 自行控制
// ⚠️ 禁止在 CSS 中用 !important 全局覆盖 .fp-sheet-shell-frame 的 width / height
//
// opts.state:      展开状态 'collapsed' | 'expanded'（默认 'collapsed'）
// opts.body:       sheet-body 内部 HTML 内容
// opts.showClose:  是否显示关闭按钮（默认 true）
// opts.showOverlay:是否显示遮罩背景（默认 true）
// opts.frameCls:   外层容器额外 class（用于动效场景注入 data-motion-loop）
// opts.width:      快照宽度（默认 320px）
// opts.height:     快照容器高度（默认 480px）
// opts.borderRadius: 快照容器圆角（默认 ''，即无圆角）
// opts.detailMode: 是否启用二级详情模式（默认 false），启用时 bottom-sheet 和 sheet-body 加 detail-mode class，sheet-top-start 显示返回按钮
// opts.autoHeight: 是否由内容撑开高度（默认 false），为 true 时 bottom-sheet 不设固定高度，由内容撑开
export function renderStaticSheetShell(opts = {}) {
  const { state = 'collapsed', body = '', showClose = true, showOverlay = true, frameCls = '', width = '320px', height = '480px', borderRadius = '', detailMode = false, variant = '', autoHeight = false } = opts;
  const expanded = state === 'expanded';
  const sheetCls = 'bottom-sheet' + (expanded ? ' expanded' : '') + (detailMode ? ' detail-mode' : '') + (variant === 'code' ? ' code-variant' : '') + (autoHeight ? ' auto-height' : '');
  const bodyCls = 'sheet-body' + (detailMode ? ' detail-mode' : '');
  const overlayStyle = showOverlay ? '' : 'background:transparent;backdrop-filter:none;';
  const radiusStyle = borderRadius ? `border-radius:${borderRadius};` : '';
  const frameHeight = autoHeight ? 'auto' : height;
  const sheetStyle = autoHeight ? 'transform:translateY(0);height:auto;min-height:0' : 'transform:translateY(0)';
  const overlayPosition = autoHeight ? 'position:relative;' : 'position:absolute;inset:0;';
  const frameOverflow = autoHeight ? 'overflow:visible;' : '';
  const closeSvg = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:relative"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
  const glassLayers = '<span class="glass-layer lg-layer-one"></span><span class="glass-layer lg-layer-two"></span><span class="glass-layer-inner lg-layer-three"></span>';
  const closeBtnHtml = showClose
    ? `<div class="sheet-top-end"><button class="glass-btn aq-close-btn" type="button" tabindex="-1">${glassLayers}${closeSvg}</button></div>`
    : '<div class="sheet-top-end"></div>';
  const backBtnHtml = detailMode
    ? `<div class="sheet-top-start"><button class="glass-btn" type="button" tabindex="-1"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L5 8L10 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`
    : '<div class="sheet-top-start"></div>';

  // code variant: 使用代码 Sheet 的头部结构
  if (variant === 'code') {
    return `<div class="fp-sheet-shell-frame ${frameCls}" style="width:${width};height:${frameHeight};${radiusStyle}${frameOverflow}">
    <div class="sheet-overlay vis show" style="${overlayPosition}${overlayStyle}">
      <div class="${sheetCls}" style="${sheetStyle}">
        <div class="sheet-body">${body}</div>
      </div>
    </div>
  </div>`;
  }

  return `<div class="fp-sheet-shell-frame ${frameCls}" style="width:${width};height:${frameHeight};${radiusStyle}${frameOverflow}">
    <div class="sheet-overlay vis show" style="${overlayPosition}${overlayStyle}">
      <div class="${sheetCls}" style="${sheetStyle}">
        <div class="sheet-top">
          ${backBtnHtml}
          <div class="sheet-handle"></div>
          ${closeBtnHtml}
        </div>
        <div class="${bodyCls}">${body}</div>
      </div>
    </div>
  </div>`;
}

function initSheetChevrons() {
  const body = $('#sheetBody');
  if (!body) return;
  body.addEventListener('click', (e) => {
    const row = e.target.closest('.s-row');
    if (!row) return;
    const detail = row._sheetDetail;
    if (!detail) return;
    e.stopPropagation();

    // Save current sheet state for back navigation
    const curOv = $('#overlay');
    sheetBackState = {
      frameRefs: curOv ? curOv.dataset.frames : null,
      title: curOv ? curOv.dataset.title : '',
      opts: {}
    };

    showBackButton();
    // 直接渲染 body，不走 openSheet（避免 resetSheetHeight 弹跳）
    const curBody = $('#sheetBody');
    if (curBody) {
      curBody.classList.remove('slide-in-left', 'slide-in-right');
      curBody.innerHTML = '';
      renderDetailContent(detail, curBody);
    }
  });
}

// ── Close sheet ───────────────────────────────────────────
export function closeSheet() {
  sheetRenderToken += 1;
  sheetBackState = null;
  hideBackButton();
  const sheet = $('#sheet');
  const body = $('#sheetBody');
  const ov = $('#overlay');
  if (body) body.classList.remove('detail-mode');
  if (sheet) sheet.classList.remove('detail-mode');
  if (sheet) sheet.classList.remove('code-variant');
  resetSheetHeight();
  ov.style.pointerEvents = 'none';
  ov.className = 'sheet-overlay vis';
  ov.addEventListener('transitionend', function h() {
    ov.className = 'sheet-overlay';
    ov.removeEventListener('transitionend', h);
  });
}

export function maybeClose(e) {
  // 点击遮罩背景关闭 sheet（overlay pointer-events:auto 时 overlay onclick 触发）
  const sheet = $('#sheet');
  if (!sheet) return;
  if (sheet.contains(e.target)) return;
  closeSheet();
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

// Initialize on first sheet render
(function () {
  const check = () => {
    if ($('#sheet')) { initSheetDrag(); initSheetChevrons(); return; }
    requestAnimationFrame(check);
  };
  check();
})();