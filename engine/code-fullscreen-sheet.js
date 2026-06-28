// engine/code-fullscreen-sheet.js
// 代码块全屏 Sheet — 非表格类卡片（JS / HTML / JSON / Mermaid 等）的全屏展示
// 触发：点 .tbl-btn.tbl-maximize 时，先判断卡片是否是表格：
//   - 表格 → 不接管，让 table-fullscreen.js 走横屏 overlay
//   - 其他 → 阻止默认全屏，弹本模块的 sheet
// Sheet 顶部圆角 30、底色 #fafafa、撑高到 navbar 下方
// 顶栏：左标题（HTML 类型替换为 segmented 控件）+ 右玻璃胶囊按钮组

const overlay = document.getElementById('codeSheet');
const leftSlot = document.getElementById('codeSheetLeft');
const actionsSlot = document.getElementById('codeSheetActions');
const bodySlot = document.getElementById('codeSheetBody');

if (!overlay || !leftSlot || !actionsSlot || !bodySlot) {
  console.warn('[code-fullscreen-sheet] DOM 缺失，跳过初始化');
}

/* ── 图标 ─────────────────────────────────────────────── */
const INLINE = (typeof window !== 'undefined' && window.WORKBUDDY_INLINE_ICONS) || {};
function inlineIcon(name) {
  const raw = INLINE[name];
  if (!raw) return '';
  return raw
    .replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"');
}
const ICON_COPY = () => inlineIcon('wb-copy.svg');
const ICON_SHARE = () => inlineIcon('wb-share.svg');
const ICON_IMAGE = () => inlineIcon('image.svg');
const ICON_CLOSE = () => inlineIcon('wb-close.svg');
const ICON_VIEW = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" d="M8 1.14551C9.6472 1.14551 11.1583 1.6536 12.5332 2.6709C13.9081 3.68831 14.9194 5.04667 15.5674 6.74512L15.998 8.19238L16 8.2041C15.5529 10.2747 14.5828 11.9687 13.0898 13.2861C11.5967 14.6036 9.89997 15.2627 8 15.2627C6.10009 15.2627 4.40335 14.6036 2.91016 13.2861C1.41714 11.9687 0.447029 10.2747 0 8.2041C0.447021 6.13325 1.41696 4.43859 2.91016 3.12109C4.40335 1.8036 6.10009 1.14551 8 1.14551ZM8 4.75684C7.04822 4.75684 6.23551 5.09359 5.5625 5.7666C4.88952 6.43961 4.55273 7.25234 4.55273 8.2041C4.55277 9.15581 4.88953 9.96863 5.5625 10.6416C6.23549 11.3145 7.04828 11.6504 8 11.6504C8.95172 11.6504 9.76452 11.3146 10.4375 10.6416C11.1105 9.96863 11.4462 9.15581 11.4463 8.2041C11.4463 7.25238 11.1104 6.43959 10.4375 5.7666C9.76451 5.09361 8.95174 4.75686 8 4.75684ZM8 5.99707C8.60931 5.99709 9.12974 6.21275 9.56055 6.64355C9.99129 7.07436 10.2061 7.59481 10.2061 8.2041C10.206 8.81331 9.99134 9.33379 9.56055 9.76465C9.12975 10.1954 8.60929 10.4101 8 10.4102C7.39078 10.4102 6.87033 10.1954 6.43945 9.76465C6.00866 9.33379 5.79301 8.81331 5.79297 8.2041C5.79297 7.59477 6.00865 7.07438 6.43945 6.64355C6.87035 6.21272 7.39072 5.99707 8 5.99707Z"/></svg>';
// 「代码」(wb-code.svg) — currentColor，大小 16
const ICON_CODE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 0.943117 0.941221)" d="M7.0573 0.0115C7.155 0.0115 7.2536 0.0112 7.353 0.0109C9.0709 0.0058 11.0128 0 12.5425 1.4994C13.4144 2.3541 13.8011 3.3454 13.9717 4.3588L12.7516 4.3588C12.6004 3.6065 12.2999 2.9419 11.7025 2.3564C10.5326 1.2097 9.0648 1.2105 7.2213 1.2115C7.1669 1.2115 7.1123 1.2115 7.0573 1.2115L7.0568 1.2115C7.0018 1.2115 6.9472 1.2115 6.8928 1.2115C5.0493 1.2105 3.5815 1.2097 2.4115 2.3564C1.2088 3.5354 1.2093 5.0348 1.21 6.9262C1.21 6.9705 1.21 7.0145 1.21 7.0588C1.21 7.1031 1.21 7.1471 1.21 7.191C1.2093 9.0828 1.2088 10.5822 2.4115 11.7612C3.5815 12.9079 5.0493 12.9071 6.8929 12.9061C6.9472 12.9061 7.0018 12.9061 7.0568 12.9061C7.1122 12.9061 7.1669 12.9061 7.2212 12.9061C8.6328 12.9069 9.8241 12.9075 10.8301 12.393L11.4041 13.4454C10.1125 14.1149 8.6672 14.1106 7.353 14.1067C7.2536 14.1064 7.155 14.1061 7.0573 14.1061C6.9591 14.1061 6.8605 14.1064 6.7611 14.1067C5.0432 14.1118 3.1013 14.1176 1.5716 12.6181C0 11.0777 0.0051 9.0933 0.0095 7.3355C0.0098 7.2426 0.01 7.1503 0.01 7.0588C0.01 6.9673 0.0098 6.875 0.0095 6.7821C0.0051 5.0242 0 3.0399 1.5716 1.4994C3.1013 0 5.0432 0.0058 6.7611 0.0109C6.8605 0.0112 6.9591 0.0115 7.0568 0.0115ZM8.4466 11.2384L10.4466 5.2384L9.3082 4.8589L7.3082 10.8589L8.4466 11.2384ZM5.9359 10.9549L3.9473 8.7934Q3.6568 8.4777 3.6568 8.0487Q3.6568 7.6196 3.9473 7.3039L5.9359 5.1424L6.819 5.9549L4.8927 8.0487L6.819 10.1424L5.9359 10.9549ZM11.819 10.9549L13.8076 8.7934Q14.0981 8.4777 14.0981 8.0487Q14.0981 7.6196 13.8076 7.3039L11.819 5.1424L10.9359 5.9549L12.8622 8.0487L10.9359 10.1424L11.819 10.9549Z" fill-rule="evenodd"/></svg>';
const ICON_RUN = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM7.38086 5.70898C6.70946 5.30615 6.37376 5.10444 6.12012 5.24805C5.86664 5.39174 5.86621 5.78353 5.86621 6.56641V9.43359C5.86621 10.2165 5.86664 10.6083 6.12012 10.752C6.37376 10.8956 6.70946 10.6939 7.38086 10.291L9.77051 8.85742C10.4087 8.47449 10.7285 8.2831 10.7285 8C10.7285 7.7169 10.4087 7.52551 9.77051 7.14258L7.38086 5.70898Z"/></svg>';

/* ── 推断卡片类型 ──────────────────────────────────────── */
// 卡片 outer DOM 上有 wb-card-{kind} 标记（executable / view / static / visual）
function getCardKind(card) {
  if (!card) return 'static';
  const cls = card.className || '';
  if (cls.includes('wb-card-executable')) return 'executable';
  if (cls.includes('wb-card-view')) return 'view';
  if (cls.includes('wb-card-visual')) return 'visual';
  return 'static';
}

function getCardTitle(card) {
  const t = card && card.querySelector('.tbl-toolbar-title');
  return t ? t.textContent.trim() : '代码';
}

function getCardCode(card) {
  // mermaid 卡片：源码已被替换成 SVG，从隐藏的 <script type="text/x-mermaid-source"> 取
  const mermaidSrc = card && card.querySelector('.wb-mermaid-svg script[type="text/x-mermaid-source"]');
  if (mermaidSrc) return mermaidSrc.textContent;
  const codeEl = card && card.querySelector('pre code');
  // 用 textContent 拿原始文本（高亮的 span 嵌套不会影响）
  return codeEl ? codeEl.textContent : '';
}

function getCardLangClass(card) {
  // mermaid 卡片：pre 已被替换，langClass 直接判 wb-card-visual + 标题（或留 dataset）
  if (card && card.querySelector('.wb-mermaid-svg')) return 'mermaid';
  const codeEl = card && card.querySelector('pre code');
  if (!codeEl) return '';
  const m = (codeEl.className || '').match(/lang-([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}

/* ── 渲染顶栏左侧（永远只显示标题）─────────────────── */
function renderLeft(card, kind, state) {
  leftSlot.innerHTML = '';
  const t = document.createElement('span');
  t.className = 'code-sheet-title';
  t.textContent = getCardTitle(card);
  leftSlot.appendChild(t);
}

/* ── 渲染顶栏右侧（玻璃胶囊按钮组）─────────────────────── */
function renderActions(card, kind, state) {
  const parts = [];
  if (kind === 'executable') {
    parts.push(`<button class="code-sheet-btn-primary" data-act="run" aria-label="运行">${ICON_RUN}<span>运行</span></button>`);
  } else if (kind === 'view') {
    // HTML：单按钮在「预览 / 代码」之间切换
    // 当前 preview → 按钮显示「代码」（点了切到源码）
    // 当前 code    → 按钮显示「预览」（点了切到 iframe）
    const showingPreview = state && state.htmlMode === 'preview';
    const label = showingPreview ? '代码' : '预览';
    const icon = showingPreview ? ICON_CODE : ICON_VIEW;
    parts.push(`<button class="code-sheet-btn-primary" data-act="view" aria-label="${label}">${icon}<span>${label}</span></button>`);
  }
  parts.push(`<button class="code-sheet-btn" data-act="copy" aria-label="复制">${ICON_COPY()}</button>`);
  if (kind === 'visual') {
    parts.push(`<button class="code-sheet-btn" data-act="save-image" aria-label="保存图片">${ICON_IMAGE()}</button>`);
  }
  parts.push(`<button class="code-sheet-btn" data-act="share" aria-label="分享">${ICON_SHARE()}</button>`);
  parts.push(`<span class="code-sheet-divider" aria-hidden="true"></span>`);
  parts.push(`<button class="code-sheet-btn" data-act="close" aria-label="关闭">${ICON_CLOSE()}</button>`);
  actionsSlot.innerHTML = parts.join('');
}

/* ── 渲染内容区 ────────────────────────────────────────── */
function renderBody(card, kind, state) {
  bodySlot.innerHTML = '';
  // HTML + 预览模式 → iframe srcdoc
  if (kind === 'view' && state.htmlMode === 'preview') {
    const iframe = document.createElement('iframe');
    iframe.srcdoc = state.code;
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    bodySlot.appendChild(iframe);
    return;
  }

  // 默认：代码视图
  const langClass = state.langClass ? ` class="lang-${state.langClass}"` : '';
  bodySlot.innerHTML = `<pre><code${langClass}>${escapeHtml(state.code)}</code></pre>`;
  // mermaid → 渲染成 SVG，否则走 highlight.js
  if (state.langClass === 'mermaid') {
    if (window.__wbRenderMermaid) window.__wbRenderMermaid(bodySlot);
  } else if (window.hljs) {
    bodySlot.querySelectorAll('pre code').forEach(el => {
      try { window.hljs.highlightElement(el); } catch (e) { /* ignore */ }
    });
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── Open / Close ──────────────────────────────────────── */
let currentState = null;

function openSheet(card, opts = {}) {
  if (!overlay) return;
  const kind = getCardKind(card);
  const code = getCardCode(card);
  const langClass = getCardLangClass(card);
  // HTML 类型：点「预览」按钮进入时默认 preview，点「全屏」按钮进入时默认 code
  const defaultHtmlMode = opts.htmlMode || 'code';
  currentState = {
    card,
    kind,
    code,
    langClass,
    htmlMode: defaultHtmlMode
  };
  renderLeft(card, kind, currentState);
  renderActions(card, kind, currentState);
  renderBody(card, kind, currentState);

  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeSheet() {
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  // 释放内容（避免 iframe 占用）
  setTimeout(() => {
    if (!overlay.classList.contains('is-open')) {
      bodySlot.innerHTML = '';
      currentState = null;
    }
  }, 320);
}

/* ── 事件接管 ─────────────────────────────────────────── */
// 全屏按钮：非表格 → 接管；表格 → 让 table-fullscreen.js 处理
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tbl-btn.tbl-maximize');
  if (!btn) return;
  const card = btn.closest('.tbl-outer');
  if (!card) return;
  const isTable = !!card.querySelector('.tbl thead');
  if (isTable) return; // 表格 → 横屏 overlay
  const isMermaid = card.classList.contains('wb-card-visual');
  if (isMermaid) return; // Mermaid → 横屏 overlay（由 table-fullscreen.js 接管）
  // 非表格 → 接管
  e.preventDefault();
  e.stopPropagation();
  openSheet(card);
}, true); // capture 阶段，早于 table-fullscreen.js 的 click handler

// HTML 卡片「预览」主按钮：弹 sheet 默认进 preview 模式
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.wb-card-btn-primary.tbl-view');
  if (!btn) return;
  const card = btn.closest('.tbl-outer');
  if (!card) return;
  e.preventDefault();
  e.stopPropagation();
  openSheet(card, { htmlMode: 'preview' });
}, true);

// 「查看全部」按钮：超长代码块折叠区底部按钮 — 拉起二级 sheet
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.wb-card-expand');
  if (!btn) return;
  const card = btn.closest('.tbl-outer');
  if (!card) return;
  e.preventDefault();
  e.stopPropagation();
  openSheet(card);
}, true);

// Sheet 内按钮
overlay && overlay.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-code-sheet-close]');
  if (closer) { closeSheet(); return; }
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'close') { closeSheet(); return; }
  if (act === 'copy' && currentState) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentState.code).catch(() => {});
    }
    return;
  }
  if (act === 'share' && currentState) {
    if (navigator.share) {
      navigator.share({ text: currentState.code }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(currentState.code).catch(() => {});
    }
    return;
  }
  if (act === 'view' && currentState && currentState.kind === 'view') {
    // HTML：切换预览/代码模式
    currentState.htmlMode = currentState.htmlMode === 'preview' ? 'code' : 'preview';
    renderActions(currentState.card, currentState.kind, currentState);
    renderBody(currentState.card, currentState.kind, currentState);
    return;
  }
  // run / save-image：占位（后续实现）
});

/* ─────────────────────────────────────────────────────────
 * 静态渲染导出 — 供 Feature Panel 快照复用
 * 原则：class 结构与 live 版本完全一致，按钮 disabled，
 * 外层不生成 data-action / id 属性，不绑定事件。
 * 复用上方已有的 renderLeft / renderActions / renderBody 逻辑，
 * 只是把结果拼成 HTML 字符串返回（而非写入 DOM slot）。
 * ───────────────────────────────────────────────────────── */
export function renderStaticCodeSheet({ lang, code, kind, htmlMode = 'code', panelOnly = false }) {
  const resolvedKind = kind || resolveKindByLang(lang);
  const langClass = lang || '';
  const state = { code, langClass, htmlMode, kind: resolvedKind };

  // ── 左侧标题 ──
  const title = resolveTitleByLang(lang);
  const leftHtml = `<div class="code-sheet-left"><span class="code-sheet-title">${escapeHtmlStatic(title)}</span></div>`;

  // ── 右侧按钮组（复用 renderActionsHtmlStatic）──
  const actionsHtml = renderActionsHtmlStatic(resolvedKind, state);

  // ── 内容区（复用 renderBodyHtmlStatic）──
  const bodyHtml = renderBodyHtmlStatic(resolvedKind, state);

  // ── panelOnly：只返回 panel（不含 overlay 壳和 backdrop），供 Feature Panel 快照复用 ──
  if (panelOnly) {
    return `<div class="code-sheet-panel fp-static">
      <header class="code-sheet-header">
        ${leftHtml}
        <div class="code-sheet-actions glass-capsule">${actionsHtml}</div>
      </header>
      <div class="code-sheet-body">${bodyHtml}</div>
    </div>`;
  }

  // ── 拼装与 index.html #codeSheet 完全一致的 DOM 结构 ──
  return `<div class="code-sheet-overlay is-open fp-static">
  <div class="code-sheet-backdrop" data-code-sheet-close></div>
  <div class="code-sheet-panel">
    <header class="code-sheet-header">
      ${leftHtml}
      <div class="code-sheet-actions glass-capsule">${actionsHtml}</div>
    </header>
    <div class="code-sheet-body">${bodyHtml}</div>
  </div>
</div>`;
}

// ── 静态渲染辅助：语言 → kind 推断（与 markdown.js resolveCardConfig 对齐）──
const LANG_KIND_MAP = {
  js: 'executable', javascript: 'executable', py: 'executable', python: 'executable',
  sh: 'executable', bash: 'executable', shell: 'executable',
  html: 'view', htm: 'view', xml: 'view', svg: 'view',
  json: 'static', css: 'static', yaml: 'static', yml: 'static', sql: 'static',
  mermaid: 'visual', table: 'visual',
};
function resolveKindByLang(lang) {
  const key = (lang || '').toLowerCase().trim();
  return LANG_KIND_MAP[key] || 'static';
}
function resolveTitleByLang(lang) {
  const key = (lang || '').toLowerCase().trim();
  const TITLES = {
    js: 'JavaScript', javascript: 'JavaScript', py: 'Python', python: 'Python',
    sh: 'Shell', bash: 'Shell', shell: 'Shell',
    html: 'HTML', htm: 'HTML', xml: 'XML', svg: 'SVG',
    json: 'JSON', css: 'CSS', yaml: 'YAML', yml: 'YAML', sql: 'SQL',
    mermaid: 'Mermaid', table: '表格',
  };
  if (TITLES[key]) return TITLES[key];
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : '代码';
}

// ── 静态渲染辅助：按钮组 HTML（复用上方 ICON_* 常量，与 live 版完全一致）──
function renderActionsHtmlStatic(kind, state) {
  const parts = [];
  if (kind === 'executable') {
    parts.push(`<button class="code-sheet-btn-primary" data-act="run" aria-label="运行" disabled>${ICON_RUN}<span>运行</span></button>`);
  } else if (kind === 'view') {
    const showingPreview = state && state.htmlMode === 'preview';
    const label = showingPreview ? '代码' : '预览';
    const icon = showingPreview ? ICON_CODE : ICON_VIEW;
    parts.push(`<button class="code-sheet-btn-primary" data-act="view" aria-label="${label}" disabled>${icon}<span>${label}</span></button>`);
  }
  parts.push(`<button class="code-sheet-btn" data-act="copy" aria-label="复制" disabled>${ICON_COPY()}</button>`);
  if (kind === 'visual') {
    parts.push(`<button class="code-sheet-btn" data-act="save-image" aria-label="保存图片" disabled>${ICON_IMAGE()}</button>`);
  }
  parts.push(`<button class="code-sheet-btn" data-act="share" aria-label="分享" disabled>${ICON_SHARE()}</button>`);
  parts.push(`<span class="code-sheet-divider" aria-hidden="true"></span>`);
  parts.push(`<button class="code-sheet-btn" data-act="close" aria-label="关闭" disabled>${ICON_CLOSE()}</button>`);
  return parts.join('');
}

// ── 静态渲染辅助：内容区 HTML（复用上方 escapeHtml 逻辑）──
function renderBodyHtmlStatic(kind, state) {
  // HTML + 预览模式 → iframe（静态预览用 srcdoc）
  if (kind === 'view' && state.htmlMode === 'preview') {
    return `<iframe srcdoc="${escapeHtmlStatic(state.code)}" sandbox="allow-scripts allow-same-origin"></iframe>`;
  }
  // 默认：代码视图
  const langClass = state.langClass ? ` class="lang-${escapeHtmlStatic(state.langClass)}"` : '';
  return `<pre><code${langClass}>${escapeHtmlStatic(state.code)}</code></pre>`;
}

function escapeHtmlStatic(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── 静态渲染：代码 Sheet 带遮罩外壳（供 Feature Panel 快照用）──
 * 与事件 Sheet 的 renderStaticSheetShell 类似，但用代码 Sheet 的 DOM 结构。
 * opts.width / opts.height / opts.borderRadius 控制快照容器尺寸。
 */
export function renderStaticCodeSheetShell(opts = {}) {
  const { lang = '', code = '', kind, htmlMode = 'code', width = '390px', height = '850px', borderRadius = '' } = opts;
  const inner = renderStaticCodeSheet({ lang, code, kind, htmlMode, panelOnly: true });
  const radiusStyle = borderRadius ? `border-radius:${borderRadius};` : '';
  return `<div class="fp-sheet-shell-frame" style="width:${width};height:${height};${radiusStyle}">
    <div class="code-sheet-overlay is-open fp-static">
      <div class="code-sheet-backdrop" data-code-sheet-close></div>
      ${inner}
    </div>
  </div>`;
}