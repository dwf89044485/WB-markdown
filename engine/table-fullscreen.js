// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// engine/table-fullscreen.js
// 表格全屏查看 — 从 index.html 内联脚本抽离
// 依赖：index.html 中的 #tblOverlay / #tblFsContent / #tblFsBack / .phone-shell
//        icons-inline.js 中的 window.WORKBUDDY_INLINE_ICONS

import { escapeHtmlFs, resolveFullscreenIcons } from './table-fullscreen-view.js';

let applyMermaidThemeToSvg;
let getMermaidSource;
let getMermaidTheme;
let renderMermaidSvg;
let enterStageTransient;
let exitStageTransient;

const shell = document.querySelector('.phone-shell');
const overlay = document.getElementById('tblOverlay');
const content = document.getElementById('tblFsContent');
const fsBack = document.getElementById('tblFsBack');
const hasRuntimeDom = Boolean(shell && overlay && content && fsBack);
const STAGE_TRANSIENT_OWNER = 'table-fullscreen';
const CLOSE_FALLBACK_MS = 400;
let mermaidFullscreenRequest = 0;
let currentMermaidSrc = null;
let closeAnimationHandler = null;
let closeFallbackTimer = 0;
let closeRequestId = 0;

/* ── 初始化按钮图标 ──────────────────────────────────── */
function initBtns() {
  const fullscreenIcons = resolveFullscreenIcons(window.WORKBUDDY_INLINE_ICONS || {});
  overlay.querySelectorAll('.tbl-fs-btn[data-action]').forEach((button) => {
    const action = button.getAttribute('data-action');
    if (action === 'copy') button.innerHTML = fullscreenIcons.copy;
    if (action === 'save-image') button.innerHTML = fullscreenIcons.image;
    if (action === 'share') button.innerHTML = fullscreenIcons.share;
  });
}

/* ── 方向判断 ────────────────────────────────────────── */
function isMobileFsMode() {
  return !document.documentElement.classList.contains('force-desktop') &&
    window.matchMedia('(max-width: 900px)').matches;
}

function isLandscapeViewport() {
  const vv = window.visualViewport;
  const width = vv ? vv.width : window.innerWidth;
  const height = vv ? vv.height : window.innerHeight;
  return width > height;
}

function restoreOverlayToShell() {
  if (overlay.parentElement !== shell) shell.append(overlay);
}

function syncFullscreenOrientation() {
  if (!overlay.classList.contains('is-active') || overlay.classList.contains('is-closing')) return;

  if (!isMobileFsMode()) {
    overlay.classList.remove('tbl-mobile', 'tbl-mobile-portrait', 'tbl-mobile-landscape');
    restoreOverlayToShell();
    enterStageTransient(STAGE_TRANSIENT_OWNER, 'landscape');
    return;
  }

  if (overlay.parentElement !== document.body) document.body.append(overlay);
  overlay.classList.add('tbl-mobile');
  if (isLandscapeViewport()) {
    overlay.classList.add('tbl-mobile-landscape');
    overlay.classList.remove('tbl-mobile-portrait');
  } else {
    overlay.classList.add('tbl-mobile-portrait');
    overlay.classList.remove('tbl-mobile-landscape');
  }
  exitStageTransient(STAGE_TRANSIENT_OWNER);
}

function clearCloseHooks() {
  if (closeAnimationHandler) {
    overlay.removeEventListener('animationend', closeAnimationHandler);
    overlay.removeEventListener('animationcancel', closeAnimationHandler);
    closeAnimationHandler = null;
  }
  if (closeFallbackTimer) {
    clearTimeout(closeFallbackTimer);
    closeFallbackTimer = 0;
  }
}

function cancelCloseAnimation() {
  closeRequestId++;
  clearCloseHooks();
  overlay.classList.remove('is-closing');
  return closeRequestId;
}

async function renderFullscreenMermaid(src, request, theme = getMermaidTheme()) {
  let svg;
  let rendered = false;
  try {
    svg = await renderMermaidSvg(src, { theme });
    rendered = true;
  } catch (error) {
    console.warn('[mermaid] 渲染失败:', error);
    svg = '<div style="padding:24px;color:var(--color-accent-red)">Mermaid 渲染失败：' + escapeHtmlFs(error.message || error) + '</div>';
  }

  if (request !== mermaidFullscreenRequest || !overlay.classList.contains('is-active')) return;
  const mount = document.createElement('div');
  mount.className = 'tbl-mermaid-fs';
  mount.innerHTML = svg;
  mount.dataset.mermaidSource = src;
  if (rendered) {
    mount.dataset.mermaidRendered = '1';
    mount.dataset.mermaidTheme = theme;
  }
  content.replaceChildren(mount);
}

/* ── 全屏入口 ────────────────────────────────────────── */
async function handleFullscreenOpen(e) {
  const btn = e.target.closest('.tbl-btn.tbl-maximize');
  if (!btn) return;
  const outer = btn.closest('.tbl-outer');
  if (!outer) return;

  const table = outer.querySelector('table');
  const isMermaid = outer.classList.contains('wb-card-visual');

  if (table) {
    // 表格 → 直接复用 outerHTML
    cancelCloseAnimation();
    mermaidFullscreenRequest++;
    currentMermaidSrc = null;
    content.innerHTML = '<div class="tbl-outer"><div class="tbl-wrap">' + table.outerHTML + '</div></div>';
  } else if (isMermaid) {
    // Mermaid → 通过共享入口渲染 SVG，共用初始化与 theme + source 缓存
    const src = getMermaidSource(outer).trim();
    if (!src) {
      console.warn('[mermaid-fs] 取不到 Mermaid 源码');
      return;
    }
    cancelCloseAnimation();
    const request = ++mermaidFullscreenRequest;
    currentMermaidSrc = src;
    content.innerHTML = '<div class="tbl-mermaid-fs"><div class="tbl-mermaid-loading">渲染中…</div></div>';
    overlay.classList.add('is-active');
    syncFullscreenOrientation();

    await renderFullscreenMermaid(src, request);
    return;
  } else {
    return;
  }

  overlay.classList.add('is-active');
  syncFullscreenOrientation();
}

function handleThemeChange(event) {
  if (!overlay.classList.contains('is-active') || !currentMermaidSrc) return;
  const request = ++mermaidFullscreenRequest;
  const theme = event.detail?.theme || getMermaidTheme();

  // 主题快照采集前保留当前 SVG 并同步套色，不能先替换成“渲染中…”。
  applyMermaidThemeToSvg(content.querySelector('svg'), theme);
  renderFullscreenMermaid(currentMermaidSrc, request, theme).catch((error) => {
    console.warn('[mermaid-fs] theme redraw failed', error);
  });
}

/* ── 返回 ─────────────────────────────────────────────── */
function finalizeClose(requestId) {
  if (requestId !== closeRequestId) return;

  closeRequestId++;
  clearCloseHooks();
  overlay.classList.remove(
    'is-active',
    'is-closing',
    'tbl-mobile',
    'tbl-mobile-portrait',
    'tbl-mobile-landscape',
  );
  content.replaceChildren();
  currentMermaidSrc = null;
  restoreOverlayToShell();
  exitStageTransient(STAGE_TRANSIENT_OWNER);
}

function closeFullscreen({ immediate = false } = {}) {
  if (immediate) {
    mermaidFullscreenRequest++;
    const requestId = cancelCloseAnimation();
    finalizeClose(requestId);
    return;
  }
  if (!overlay.classList.contains('is-active') || overlay.classList.contains('is-closing')) return;

  mermaidFullscreenRequest++;
  const requestId = ++closeRequestId;
  closeAnimationHandler = (event) => {
    if (event.target !== overlay || event.animationName !== 'tbl-fs-out') return;
    finalizeClose(requestId);
  };
  overlay.addEventListener('animationend', closeAnimationHandler);
  overlay.addEventListener('animationcancel', closeAnimationHandler);
  closeFallbackTimer = window.setTimeout(() => finalizeClose(requestId), CLOSE_FALLBACK_MS);
  overlay.classList.add('is-closing');
}

function handlePlaybackReset() {
  closeFullscreen({ immediate: true });
}

/* ── 表格转文本 ──────────────────────────────────────── */
function tableToText(tbl) {
  let txt = '';
  tbl.querySelectorAll('tr').forEach(function(row) {
    const cells = row.querySelectorAll('th, td');
    txt += Array.from(cells).map(function(c) { return c.innerText.trim(); }).join('\t') + '\n';
  });
  return txt.trim();
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function() {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

/* ── 当前全屏内容文本（表格 → 制表符；Mermaid → 原始源码）─── */
function getCurrentText() {
  const tbl = content.querySelector('table');
  if (tbl) return tableToText(tbl);
  if (currentMermaidSrc) return currentMermaidSrc;
  return '';
}

/* ── 全屏内复制 ──────────────────────────────────────── */
function handleCopy(e) {
  const btn = e.target.closest('.tbl-fs-btn[data-action="copy"]');
  if (!btn) return;
  const text = getCurrentText();
  if (!text) return;
  copyText(text);
  /* 反馈 */
  const orig = btn.innerHTML;
  btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 3 3.99854)" d="M5.1314 6.7172L11.4243 0.4243L10.5757 -0.4243L4.2828 5.8686L4.2732 5.8783Q4.0908 6.0607 4 6.1423Q3.9092 6.0607 3.7268 5.8783L3.7172 5.8686L0.4243 2.5757L-0.4243 3.4243L2.8686 6.7172L2.8783 6.7268Q3.1924 7.041 3.3327 7.1476Q3.6556 7.3929 4 7.3929Q4.3444 7.3929 4.6673 7.1476Q4.8076 7.041 5.1217 6.7268L5.1314 6.7172Z" fill-rule="evenodd"/></svg>';
  btn.style.color = 'var(--color-accent-green)';
  btn.classList.add('is-checked');
  setTimeout(function() {
    btn.innerHTML = orig;
    btn.style.color = '';
    btn.classList.remove('is-checked');
  }, 1000);
}

/* ── 全屏内保存图片 ──────────────────────────────────── */
function handleSaveImage(e) {
  const btn = e.target.closest('.tbl-fs-btn[data-action="save-image"]');
  if (!btn) return;
  // TODO: 实现保存为图片功能（html2canvas）
  console.log('保存图片：待实现');
}

/* ── 全屏内分享 ──────────────────────────────────────── */
function handleShare(e) {
  const btn = e.target.closest('.tbl-fs-btn[data-action="share"]');
  if (!btn) return;
  const text = getCurrentText();
  if (!text) return;
  if (navigator.share) {
    navigator.share({ text: text }).catch(function() {});
  } else {
    copyText(text);
  }
}

function initTableFullscreen() {
  initBtns();
  document.addEventListener('click', handleFullscreenOpen);
  document.addEventListener('click', handleCopy);
  document.addEventListener('click', handleSaveImage);
  document.addEventListener('click', handleShare);
  document.addEventListener('wb:playback-reset', handlePlaybackReset);
  window.addEventListener('resize', syncFullscreenOrientation);
  window.addEventListener('orientationchange', syncFullscreenOrientation);
  window.addEventListener('wb:themechange', handleThemeChange);
  window.visualViewport?.addEventListener('resize', syncFullscreenOrientation);
  fsBack.addEventListener('click', closeFullscreen);
}

if (hasRuntimeDom) {
  const [mermaidModule, stageController] = await Promise.all([
    import('./mermaid-render.js'),
    import('./stage-controller.js'),
  ]);
  ({ applyMermaidThemeToSvg, getMermaidSource, getMermaidTheme, renderMermaidSvg } = mermaidModule);
  ({ enterStageTransient, exitStageTransient } = stageController);
  initTableFullscreen();
} else {
  console.warn('[table-fullscreen] 缺少必要 DOM 元素，跳过初始化');
}
