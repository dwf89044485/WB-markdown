// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// engine/table-fullscreen.js
// 表格全屏查看 — 从 index.html 内联脚本抽离
// 依赖：index.html 中的 #tblOverlay / #tblFsContent / #tblFsBack / .phone-shell
//        icons-inline.js 中的 window.WORKBUDDY_INLINE_ICONS

import { applyMermaidThemeToSvg, getMermaidSource, getMermaidTheme, renderMermaidSvg } from './mermaid-render.js';

const COPY_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 1.58943 0.657074)" d="M3.7804 11.4101Q3.1921 11.4035 2.9264 11.3839Q2.2536 11.3344 1.8193 11.1371Q0.7581 10.6552 0.2762 9.5941Q0.079 9.1598 0.0294 8.487Q0 8.0876 0 6.9589L0 4.8155Q0 3.3828 0.0469 2.8798Q0.126 2.0311 0.4397 1.5078Q0.84 0.84 1.5078 0.4397Q2.0311 0.126 2.8798 0.0469Q3.3828 0 4.8155 0L6.0922 0Q6.7465 0 6.9587 0.0294Q7.9864 0.1715 8.7229 0.908Q9.4594 1.6445 9.6016 2.6722Q9.6309 2.8845 9.6309 3.5387L8.6137 3.5387C10.3989 3.5399 11.3221 3.5643 11.9644 4.0633C12.1299 4.1918 12.2788 4.3407 12.4073 4.5062C12.9319 5.1815 12.9319 6.1672 12.9319 8.1386L12.9319 9.2787C12.9319 11.2501 12.9319 12.2358 12.4073 12.9111C12.2788 13.0766 12.1299 13.2255 11.9644 13.354C11.2891 13.8786 10.3034 13.8786 8.332 13.8786C6.3605 13.8786 5.3748 13.8786 4.6995 13.354C4.534 13.2255 4.3852 13.0766 4.2566 12.9111C3.9691 12.5411 3.8392 12.0778 3.7804 11.4101ZM3.7346 10.205Q2.6043 10.1757 2.3155 10.0445Q1.6645 9.7489 1.3689 9.0979Q1.2 8.7261 1.2 6.9589L1.2 4.8155Q1.2 3.4386 1.2417 2.9911Q1.2955 2.4141 1.4689 2.1248Q1.7148 1.7148 2.1248 1.4689Q2.4141 1.2955 2.9911 1.2417Q3.4386 1.2 4.8155 1.2L6.0922 1.2Q6.6639 1.2 6.7943 1.218Q7.4229 1.305 7.8744 1.7565Q8.326 2.208 8.4129 2.8366Q8.4309 2.967 8.4309 3.5387L8.332 3.5387C6.3605 3.5387 5.3748 3.5387 4.6995 4.0633C4.534 4.1918 4.3852 4.3407 4.2566 4.5062C3.732 5.1815 3.732 6.1672 3.732 8.1386L3.732 9.2787C3.732 9.615 3.732 9.9226 3.7346 10.205ZM4.932 8.1386L4.932 9.2787Q4.932 10.9357 4.9899 11.4455Q5.0502 11.9767 5.2042 12.1749Q5.3054 12.3052 5.4357 12.4064Q5.6339 12.5604 6.1651 12.6207Q6.6749 12.6786 8.332 12.6786Q9.989 12.6786 10.4988 12.6207Q11.03 12.5604 11.2282 12.4064Q11.3585 12.3052 11.4597 12.1749Q11.6137 11.9767 11.674 11.4455Q11.7319 10.9357 11.7319 9.2787L11.7319 8.1386Q11.7319 6.4816 11.674 5.9718Q11.6137 5.4406 11.4597 5.2424Q11.3585 5.1121 11.2282 5.0109Q11.03 4.8569 10.4988 4.7966Q9.989 4.7387 6.1651 4.7966Q5.6339 4.8569 5.4357 5.0109Q5.3054 5.1121 5.2042 5.2424Q5.0502 5.4406 4.9899 5.9718Q4.932 6.4816 4.932 8.1386Z" fill-rule="evenodd"/></svg>';

const shell = document.querySelector('.phone-shell');
const overlay = document.getElementById('tblOverlay');
const content = document.getElementById('tblFsContent');
const fsBack = document.getElementById('tblFsBack');
let mermaidFullscreenRequest = 0;

if (!shell || !overlay || !content) {
  console.warn('[table-fullscreen] 缺少必要 DOM 元素，退出初始化');
}

/* ── 内联图标 ────────────────────────────────────────── */
const INLINE = window.WORKBUDDY_INLINE_ICONS || {};
function fsIcon(file) {
  const raw = INLINE[file];
  if (!raw) return '';
  return raw
    .replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"')
    .replace(/fill="rgba\([^)]+\)"/gi, 'fill="currentColor"')
    .replace(/stroke="rgba\([^)]+\)"/gi, 'stroke="currentColor"')
    .replace(/fill="(white|black)"/gi, 'fill="currentColor"')
    .replace(/stroke="(white|black)"/gi, 'stroke="currentColor"');
}

const FS_COPY = fsIcon('wb-copy.svg');
const FS_IMAGE = fsIcon('image.svg');
const FS_SHARE = fsIcon('wb-share.svg');

/* ── 初始化按钮图标 ──────────────────────────────────── */
(function initBtns() {
  const actionBtns = document.querySelectorAll('.tbl-fs-btn[data-action]');
  actionBtns.forEach(function(b) {
    const a = b.getAttribute('data-action');
    if (a === 'copy') b.innerHTML = FS_COPY || COPY_SVG;
    if (a === 'save-image') b.innerHTML = FS_IMAGE;
    if (a === 'share') b.innerHTML = FS_SHARE;
  });
})();

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

function syncFullscreenOrientation() {
  if (!overlay.classList.contains('is-active')) return;
  if (!isMobileFsMode()) {
    overlay.classList.remove('tbl-mobile', 'tbl-mobile-portrait', 'tbl-mobile-landscape');
    shell.classList.add('tbl-landscape');
    if (window.buildGrid) window.buildGrid();
    if (window.fitShellScale) window.fitShellScale();
    return;
  }
  shell.classList.remove('tbl-landscape');
  overlay.classList.add('tbl-mobile');
  if (isLandscapeViewport()) {
    overlay.classList.add('tbl-mobile-landscape');
    overlay.classList.remove('tbl-mobile-portrait');
  } else {
    overlay.classList.add('tbl-mobile-portrait');
    overlay.classList.remove('tbl-mobile-landscape');
  }
  if (window.buildGrid) window.buildGrid();
  if (window.fitShellScale) window.fitShellScale();
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
document.addEventListener('click', async function(e) {
  const btn = e.target.closest('.tbl-btn.tbl-maximize');
  if (!btn) return;
  const outer = btn.closest('.tbl-outer');
  if (!outer) return;

  const table = outer.querySelector('table');
  const isMermaid = outer.classList.contains('wb-card-visual');

  if (table) {
    // 表格 → 直接复用 outerHTML
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
});

window.addEventListener('resize', syncFullscreenOrientation);
window.addEventListener('orientationchange', syncFullscreenOrientation);
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncFullscreenOrientation);
}
window.addEventListener('wb:themechange', (event) => {
  if (!overlay.classList.contains('is-active') || !currentMermaidSrc) return;
  const request = ++mermaidFullscreenRequest;
  const theme = event.detail?.theme || getMermaidTheme();

  // 主题快照采集前保留当前 SVG 并同步套色，不能先替换成“渲染中…”。
  applyMermaidThemeToSvg(content.querySelector('svg'), theme);
  renderFullscreenMermaid(currentMermaidSrc, request, theme).catch((error) => {
    console.warn('[mermaid-fs] theme redraw failed', error);
  });
});

/* ── 返回 ─────────────────────────────────────────────── */
function closeFullscreen() {
  // 如果已在关闭中，不重复触发
  if (overlay.classList.contains('is-closing')) return;
  mermaidFullscreenRequest++;
  overlay.classList.add('is-closing');
  overlay.addEventListener('animationend', function onCloseEnd(e) {
    if (e.animationName !== 'tbl-fs-out') return;
    overlay.removeEventListener('animationend', onCloseEnd);
    overlay.classList.remove('is-active', 'is-closing', 'tbl-mobile', 'tbl-mobile-portrait', 'tbl-mobile-landscape');
    shell.classList.remove('tbl-landscape');
    content.innerHTML = '';
    currentMermaidSrc = null;
    if (window.buildGrid) window.buildGrid();
    if (window.fitShellScale) window.fitShellScale();
  });
}
fsBack.addEventListener('click', closeFullscreen);

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
let currentMermaidSrc = null;
function getCurrentText() {
  const tbl = content.querySelector('table');
  if (tbl) return tableToText(tbl);
  if (currentMermaidSrc) return currentMermaidSrc;
  return '';
}

/* ── 全屏内复制 ──────────────────────────────────────── */
document.addEventListener('click', function(e) {
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
});

/* ── 全屏内保存图片 ──────────────────────────────────── */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.tbl-fs-btn[data-action="save-image"]');
  if (!btn) return;
  // TODO: 实现保存为图片功能（html2canvas）
  console.log('保存图片：待实现');
});

/* ── 全屏内分享 ──────────────────────────────────────── */
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.tbl-fs-btn[data-action="share"]');
  if (!btn) return;
  const text = getCurrentText();
  if (!text) return;
  if (navigator.share) {
    navigator.share({ text: text }).catch(function() {});
  } else {
    copyText(text);
  }
});

/* ─────────────────────────────────────────────────────────
 * 静态渲染导出 — 供 Feature Panel 快照复用
 * 原则：class 结构与 index.html #tblOverlay 完全一致，
 * 按钮 disabled，不生成 id，不绑定事件。
 * 复用上方 FS_COPY / FS_IMAGE / FS_SHARE 图标常量。
 * ───────────────────────────────────────────────────────── */
export function renderStaticTableFullscreen({ title, bodyHtml, type = 'table', contentOnly = false }) {
  const resolvedTitle = title || (type === 'mermaid' ? 'Mermaid' : '表格');
  const inner = `<div class="tbl-fs-nav">
    <button class="tbl-fs-back" aria-label="返回" disabled>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="tbl-fs-title">${escapeHtmlFs(resolvedTitle)}</div>
    <div class="tbl-fs-actions">
      <button class="tbl-fs-btn" data-action="copy" aria-label="复制" disabled>${FS_COPY || COPY_SVG}</button>
      <button class="tbl-fs-btn" data-action="save-image" aria-label="保存图片" disabled>${FS_IMAGE}</button>
      <button class="tbl-fs-btn" data-action="share" aria-label="分享" disabled>${FS_SHARE}</button>
    </div>
  </div>
  <div class="tbl-fs-content md">${bodyHtml}</div>`;

  if (contentOnly) {
    return `<div class="tbl-fs-inner fp-static">${inner}</div>`;
  }

  return `<div class="tbl-fullscreen-overlay is-active fp-static">${inner}</div>`;
}

function escapeHtmlFs(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}