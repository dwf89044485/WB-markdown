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

/* ── 渲染顶栏左侧 ──────────────────────────────────────── */
function renderLeft(card, kind, state) {
  leftSlot.innerHTML = '';
  if (kind === 'view') {
    // HTML 类型：segmented 控件「预览 / 代码」
    const tabs = document.createElement('div');
    tabs.className = 'code-sheet-tabs';
    tabs.innerHTML = `
      <button class="code-sheet-tab ${state.htmlMode === 'preview' ? 'is-active' : ''}" data-mode="preview">预览</button>
      <button class="code-sheet-tab ${state.htmlMode === 'code' ? 'is-active' : ''}" data-mode="code">代码</button>
    `;
    tabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.code-sheet-tab');
      if (!btn) return;
      const mode = btn.dataset.mode;
      if (mode === state.htmlMode) return;
      state.htmlMode = mode;
      tabs.querySelectorAll('.code-sheet-tab').forEach(b => {
        b.classList.toggle('is-active', b.dataset.mode === mode);
      });
      renderBody(card, kind, state);
    });
    leftSlot.appendChild(tabs);
  } else {
    const t = document.createElement('span');
    t.className = 'code-sheet-title';
    t.textContent = getCardTitle(card);
    leftSlot.appendChild(t);
  }
}

/* ── 渲染顶栏右侧（玻璃胶囊按钮组）─────────────────────── */
function renderActions(card, kind) {
  // 主按钮 + 次按钮组 + 分割线 + 关闭
  const parts = [];
  if (kind === 'executable') {
    parts.push(`<button class="code-sheet-btn-primary" data-act="run" aria-label="运行">${ICON_RUN}<span>运行</span></button>`);
  } else if (kind === 'view') {
    parts.push(`<button class="code-sheet-btn-primary" data-act="view" aria-label="查看">${ICON_VIEW}<span>查看</span></button>`);
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

function openSheet(card) {
  if (!overlay) return;
  const kind = getCardKind(card);
  const code = getCardCode(card);
  const langClass = getCardLangClass(card);
  currentState = {
    card,
    kind,
    code,
    langClass,
    // HTML 默认显示"代码"（与 Figma 一致）
    htmlMode: 'code'
  };
  renderLeft(card, kind, currentState);
  renderActions(card, kind);
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
  // run / view / save-image：占位（后续实现 task #11 时再补）
});
