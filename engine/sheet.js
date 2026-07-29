// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// SHEET — Bottom sheet render · openSheet · closeSheet
// ============================================================

import { escapeHtml } from './markdown.js';
import { ICONS, renderToolIcon, inferToolIconKey, isWarningEvent, svgFromRegistry } from './icons.js';
import { sleep, sleepDelay, currentTokensPerSecond, fastRender } from './core.js';

const scenario = window.WORKBUDDY_SCENARIO;
const $ = (sel, root = document) => root.querySelector(sel);
let sheetRenderToken = 0;

// ── Sheet 高度常量 ────────────────────────────────────────
const SHEET_HEIGHT_COLLAPSED = 50;  // 折叠态高度（%）
const SHEET_HEIGHT_EXPANDED   = 90;  // 展开态高度（%）

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
  const iconFile = card.type === 'word' ? '_wb-file-html-solid.svg' : '_wb-file-pdf-solid.svg';
  return `<a class="file-card" href="#" onclick="return false;">
    <div class="file-card-icon">
      <img src="./icons/${iconFile}" alt="" class="file-card-icon-img">
    </div>
    <div class="file-card-info">
      <div class="file-card-title">${title}</div>
      <div class="file-card-meta">${meta}</div>
    </div>
    <div class="file-card-arrow">
      <img src="./icons/Frame 2147239077.svg" alt="" class="file-card-arrow-img">
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

  // 90% + 用户已翻上去 → 不打断
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
      sheet.classList.remove('products-variant');
    } else if (options.variant === 'products') {
      sheet.classList.add('products-variant');
      sheet.classList.remove('code-variant');
    } else {
      sheet.classList.remove('code-variant');
      sheet.classList.remove('products-variant');
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
  if (sheet) { sheet.classList.remove('code-variant'); sheet.classList.remove('products-variant'); }

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

  // Show sheet overlay (body starts empty, height at 50%)
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

// ── 静态快照：完整事件 Sheet 内容（供 Feature Panel 使用）──
// 与 ask-question 的 renderStaticAskQuestion 角色一致：
// 从 scenario 真实帧数据渲染事件行 + 待办列表，一函数搞定
export function renderStaticEventSheet(frameRefs) {
  const scenario = window.WORKBUDDY_SCENARIO;
  const frames = getFrames(frameRefs || '');
  if (!frames.length) return '';

  // 渲染事件行（去重，与 streamSheetContent 逻辑一致）
  const seenKeys = new Set();
  let html = '';
  for (const f of frames) {
    if (f.events) {
      for (const ev of f.events) {
        const key = `${ev.icon || ''}|${ev.text || ''}|${ev.dim || ''}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        html += renderEvent(ev).outerHTML;
      }
    }
  }

  // 待办快照
  const baseline = scenario.todosBaseline || [];
  const todoItems = computeTodoSnapshot(frames, baseline);
  html += todoItems.map(t => renderTodo(t).outerHTML).join('');

  return html;
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
  const sheetStyle = autoHeight ? 'transform:translateY(0);height:auto;min-height:0' : expanded ? `transform:translateY(0);height:${SHEET_HEIGHT_EXPANDED}%` : 'transform:translateY(0)';
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
  if (sheet) { sheet.classList.remove('code-variant'); sheet.classList.remove('products-variant'); }
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
// 物理模型（apple-design 技能：直接操控 + 动量投影 + 可中断弹簧 + 橡皮筋阻尼）
// 50%: 面板任意位置操控——上拖展开、下拖（带阻尼）关闭
// 90%: 内容在顶部时下拖折叠；不在顶部时正常滚动
let dragState = null;

const SHEET_DRAG_MIN = 20;    // 拖拽视觉下限（%），再低走橡皮筋阻尼
const SHEET_DRAG_MAX = 95;    // 拖拽视觉上限（%），再高走橡皮筋阻尼
const DRAG_INTENT_PX = 10;    // 拖拽意图阈值：位移超过才接管手势
const VELOCITY_WINDOW = 120;  // 松手速度采样窗口（ms）
const SPRING_K = 438.6;       // 弹簧刚度——Apple sheet 参数：阻尼比 0.8 / 响应 0.3s（质量 1）
const SPRING_C = 33.5;        // 弹簧阻尼
const DECEL_RATE = 0.998;     // 动量投影衰减率（Apple 滚动手感）

// 最小弹簧：始终从当前位置+当前速度出发，任意时刻可被手势打断接管
const spring = { raf: 0, pct: 0, v: 0, target: 0, last: 0 };

function stopSpring() {
  if (spring.raf) cancelAnimationFrame(spring.raf);
  spring.raf = 0;
}

function currentPct(containerH) {
  const sheet = $('#sheet');
  return (sheet.getBoundingClientRect().height / containerH) * 100;
}

function applyPct(pct) {
  const sheet = $('#sheet');
  sheet.style.height = pct + '%';
  sheet.classList.toggle('expanded', pct >= 70);
}

function springTo(target, initialV, containerH) {
  stopSpring();
  spring.pct = currentPct(containerH);
  spring.v = initialV || 0;
  spring.target = target;
  spring.last = performance.now();
  const step = (now) => {
    const dt = Math.min((now - spring.last) / 1000, 0.032);
    spring.last = now;
    const accel = -SPRING_K * (spring.pct - spring.target) - SPRING_C * spring.v;
    spring.v += accel * dt;
    spring.pct += spring.v * dt;
    applyPct(spring.pct);
    if (Math.abs(spring.pct - spring.target) < 0.05 && Math.abs(spring.v) < 3) {
      applyPct(spring.target);
      spring.raf = 0;
      return;
    }
    spring.raf = requestAnimationFrame(step);
  };
  spring.raf = requestAnimationFrame(step);
}

// 橡皮筋：越过边界后渐进阻尼（Apple 公式，c=0.55）
function rubberband(overshoot, dim) {
  const c = 0.55;
  return (overshoot * dim * c) / (dim + c * Math.abs(overshoot));
}

// 动量投影：预测松手后的停驻点（Apple《Designing Fluid Interfaces》）
function project(vPctPerSec) {
  return (vPctPerSec / 1000) * DECEL_RATE / (1 - DECEL_RATE);
}

function resetSheetHeight() {
  stopSpring();
  const sheet = $('#sheet');
  if (!sheet) return;
  sheet.classList.remove('expanded');
  sheet.style.height = '';
}

function initSheetDrag() {
  const sheet = $('#sheet');
  const body = $('#sheetBody');
  if (!sheet || !body) return;

  // 代码 / 产物 Sheet 是固定高度且有专属关闭按钮，不参与高度拖拽
  const variantLocked = () =>
    sheet.classList.contains('code-variant') || sheet.classList.contains('products-variant');

  const onStart = (e) => {
    if (variantLocked()) return;
    stopSpring();  // 弹簧进行中也可随时重新抓住（从当前位置接管）
    const touch = e.touches ? e.touches[0] : e;
    const isMouse = !e.touches;
    const isExpanded = sheet.classList.contains('expanded');

    if (isExpanded) {
      // 90%: 内容不在顶部 → 正常滚动，不接管
      if (body.scrollTop > 0) return;
      // 鼠标：阻止默认行为防文字框选；触屏不能拦，否则向上滚动失效
      if (isMouse) e.preventDefault();
    } else {
      // 50%: 整个面板即抓手
      e.preventDefault();
    }
    const containerH = sheet.parentElement.getBoundingClientRect().height;
    dragState = {
      mode: null,   // null=未判定方向 | 'resize'=拖拽接管
      startY: touch.clientY,
      startPct: currentPct(containerH),
      containerH,
      history: [{ y: touch.clientY, t: performance.now() }],
    };
  };

  const onMove = (e) => {
    if (!dragState) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const dy = dragState.startY - y;  // 正=向上拖

    if (dragState.mode === null) {
      if (Math.abs(dy) < DRAG_INTENT_PX) return;
      // 90%: 首次向上拖 → 让给内容滚动
      if (sheet.classList.contains('expanded') && dy > 0) { dragState = null; return; }
      dragState.mode = 'resize';
    }

    e.preventDefault();
    const h = dragState.history;
    h.push({ y, t: performance.now() });
    if (h.length > 8) h.shift();

    const rawPct = dragState.startPct + (dy / dragState.containerH) * 100;
    let pct = rawPct;
    if (rawPct > SHEET_DRAG_MAX) pct = SHEET_DRAG_MAX + rubberband(rawPct - SHEET_DRAG_MAX, 40);
    else if (rawPct < SHEET_DRAG_MIN) pct = SHEET_DRAG_MIN - rubberband(SHEET_DRAG_MIN - rawPct, 40);
    applyPct(pct);
  };

  const onEnd = () => {
    if (!dragState) return;
    const ds = dragState;
    dragState = null;
    if (ds.mode !== 'resize') return;

    // 松手速度：取最近 120ms 采样窗口（pct/s，正=向上）
    const h = ds.history;
    const last = h[h.length - 1];
    let ref = h[0];
    for (let i = h.length - 1; i >= 0; i--) {
      ref = h[i];
      if (last.t - h[i].t >= VELOCITY_WINDOW) break;
    }
    const dtMs = Math.max(last.t - ref.t, 1);
    const vPct = ((ref.y - last.y) / dtMs) * 1000 / ds.containerH * 100;

    // 吞掉拖拽后的那一次 click（避免误触发事件行点击/详情跳转）
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
    document.addEventListener('click', swallow, { capture: true, once: true });
    setTimeout(() => document.removeEventListener('click', swallow, { capture: true }), 350);

    // 动量投影 → 最近落点：关闭 / 50% / 90%，弹簧携速度交接
    const projected = currentPct(ds.containerH) + project(vPct);
    if (projected < 25) { closeSheet(); return; }
    springTo(projected >= 70 ? SHEET_HEIGHT_EXPANDED : SHEET_HEIGHT_COLLAPSED, vPct, ds.containerH);
  };

  sheet.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  sheet.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);
  document.addEventListener('touchcancel', onEnd);
}

// Initialize on first sheet render
(function () {
  const check = () => {
    if ($('#sheet')) { initSheetDrag(); initSheetChevrons(); return; }
    requestAnimationFrame(check);
  };
  check();
})();