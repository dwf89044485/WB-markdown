// engine/code-fullscreen-sheet.js
// 代码块全屏 Sheet — 非表格类卡片（JS / HTML / JSON / Mermaid 等）的全屏展示
// 使用 sheet.js 的 openSheet/closeSheet + .code-variant 统一渲染
// 触发：点 .tbl-btn.tbl-maximize 时，先判断卡片是否是表格：
//   - 表格 → 不接管，让 table-fullscreen.js 走横屏 overlay
//   - 其他 → 阻止默认全屏，弹本模块的 sheet

import { openSheet, closeSheet, renderStaticSheetShell } from './sheet.js';

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
const ICON_CODE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 0.943117 0.941221)" d="M7.0573 0.0115C7.155 0.0115 7.2536 0.0112 7.353 0.0109C9.0709 0.0058 11.0128 0 12.5425 1.4994C13.4144 2.3541 13.8011 3.3454 13.9717 4.3588L12.7516 4.3588C12.6004 3.6065 12.2999 2.9419 11.7025 2.3564C10.5326 1.2097 9.0648 1.2105 7.2213 1.2115C7.1669 1.2115 7.1123 1.2115 7.0573 1.2115L7.0568 1.2115C7.0018 1.2115 6.9472 1.2115 6.8928 1.2115C5.0493 1.2105 3.5815 1.2097 2.4115 2.3564C1.2088 3.5354 1.2093 5.0348 1.21 6.9262C1.21 6.9705 1.21 7.0145 1.21 7.0588C1.21 7.1031 1.21 7.1471 1.21 7.191C1.2093 9.0828 1.2088 10.5822 2.4115 11.7612C3.5815 12.9079 5.0493 12.9071 6.8929 12.9061C6.9472 12.9061 7.0018 12.9061 7.0568 12.9061C7.1122 12.9061 7.1669 12.9061 7.2212 12.9061C8.6328 12.9069 9.8241 12.9075 10.8301 12.393L11.4041 13.4454C10.1125 14.1149 8.6672 14.1106 7.353 14.1067C7.2536 14.1064 7.155 14.1061 7.0573 14.1061C6.9591 14.1061 6.8605 14.1064 6.7611 14.1067C5.0432 14.1118 3.1013 14.1176 1.5716 12.6181C0 11.0777 0.0051 9.0933 0.0095 7.3355C0.0098 7.2426 0.01 7.1503 0.01 7.0588C0.01 6.9673 0.0098 6.875 0.0095 6.7821C0.0051 5.0242 0 3.0399 1.5716 1.4994C3.1013 0 5.0432 0.0058 6.7611 0.0109C6.8605 0.0112 6.9591 0.0115 7.0568 0.0115ZM8.4466 11.2384L10.4466 5.2384L9.3082 4.8589L7.3082 10.8589L8.4466 11.2384ZM5.9359 10.9549L3.9473 8.7934Q3.6568 8.4777 3.6568 8.0487Q3.6568 7.6196 3.9473 7.3039L5.9359 5.1424L6.819 5.9549L4.8927 8.0487L6.819 10.1424L5.9359 10.9549ZM11.819 10.9549L13.8076 8.7934Q14.0981 8.4777 14.0981 8.0487Q14.0981 7.6196 13.8076 7.3039L11.819 5.1424L10.9359 5.9549L12.8622 8.0487L10.9359 10.1424L11.819 10.9549Z" fill-rule="evenodd"/></svg>';
const ICON_RUN = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM7.38086 5.70898C6.70946 5.30615 6.37376 5.10444 6.12012 5.24805C5.86664 5.39174 5.86621 5.78353 5.86621 6.56641V9.43359C5.86621 10.2165 5.86664 10.6083 6.12012 10.752C6.37376 10.8956 6.70946 10.6939 7.38086 10.291L9.77051 8.85742C10.4087 8.47449 10.7285 8.2831 10.7285 8C10.7285 7.7169 10.4087 7.52551 9.77051 7.14258L7.38086 5.70898Z"/></svg>';

/* ── 推断卡片类型 ──────────────────────────────────────── */
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
  const mermaidSrc = card && card.querySelector('.wb-mermaid-svg script[type="text/x-mermaid-source"]');
  if (mermaidSrc) return mermaidSrc.textContent;
  const codeEl = card && card.querySelector('pre code');
  return codeEl ? codeEl.textContent : '';
}

function getCardLangClass(card) {
  if (card && card.querySelector('.wb-mermaid-svg')) return 'mermaid';
  const codeEl = card && card.querySelector('pre code');
  if (!codeEl) return '';
  const m = (codeEl.className || '').match(/lang-([a-zA-Z0-9_-]+)/);
  return m ? m[1] : '';
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ── 状态管理 ──────────────────────────────────────────── */
let currentState = null;
let currentCard = null;

/* ── 通过 sheet.js 的 openSheet + customRenderer 打开代码 Sheet ── */
function openCodeSheet(card, opts = {}) {
  const kind = getCardKind(card);
  const code = getCardCode(card);
  const langClass = getCardLangClass(card);
  const defaultHtmlMode = opts.htmlMode || 'code';

  currentCard = card;
  currentState = { card, kind, code, langClass, htmlMode: defaultHtmlMode };

  openSheet(null, null, {
    variant: 'code',
    customRenderer: (body) => {
      // 构建代码 Sheet 的完整内容
      const title = getCardTitle(card);
      const leftHtml = `<div class="code-sheet-left"><span class="code-sheet-title">${escapeHtml(title)}</span></div>`;
      const actionsHtml = renderActionsHtml(kind, currentState);
      const bodyHtml = renderBodyHtml(kind, currentState);

      body.innerHTML = `
        <header class="code-sheet-header">
          ${leftHtml}
          <div class="code-sheet-actions glass-capsule">${actionsHtml}</div>
        </header>
        <div class="code-sheet-body">${bodyHtml}</div>
      `;

      // 绑定按钮事件
      const header = body.querySelector('.code-sheet-header');
      if (header) {
        header.addEventListener('click', (e) => {
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
            currentState.htmlMode = currentState.htmlMode === 'preview' ? 'code' : 'preview';
            // 重新渲染按钮和内容
            const newActionsHtml = renderActionsHtml(currentState.kind, currentState);
            const newBodyHtml = renderBodyHtml(currentState.kind, currentState);
            const actionsEl = body.querySelector('.code-sheet-actions');
            const bodyEl = body.querySelector('.code-sheet-body');
            if (actionsEl) actionsEl.innerHTML = newActionsHtml;
            if (bodyEl) bodyEl.innerHTML = newBodyHtml;
            return;
          }
        });
      }
    }
  });
}

/* ── 渲染辅助：按钮组 HTML ────────────────────────────── */
// mode: 'live' → 正常交互按钮；mode: 'static' → disabled 按钮（供右侧文档快照用）
function renderActionsHtml(kind, state, options = {}) {
  const { mode = 'live' } = options;
  const disabled = mode === 'static' ? ' disabled' : '';
  const parts = [];
  if (kind === 'executable') {
    parts.push(`<button class="code-sheet-btn-primary" data-act="run" aria-label="运行"${disabled}>${ICON_RUN}<span>运行</span></button>`);
  } else if (kind === 'view') {
    const showingPreview = state && state.htmlMode === 'preview';
    const label = showingPreview ? '代码' : '预览';
    const icon = showingPreview ? ICON_CODE : ICON_VIEW;
    parts.push(`<button class="code-sheet-btn-primary" data-act="view" aria-label="${label}"${disabled}>${icon}<span>${label}</span></button>`);
  }
  parts.push(`<button class="code-sheet-btn" data-act="copy" aria-label="复制"${disabled}>${ICON_COPY()}</button>`);
  if (kind === 'visual') {
    parts.push(`<button class="code-sheet-btn" data-act="save-image" aria-label="保存图片"${disabled}>${ICON_IMAGE()}</button>`);
  }
  parts.push(`<button class="code-sheet-btn" data-act="share" aria-label="分享"${disabled}>${ICON_SHARE()}</button>`);
  parts.push(`<span class="code-sheet-divider" aria-hidden="true"></span>`);
  parts.push(`<button class="code-sheet-btn" data-act="close" aria-label="关闭"${disabled}>${ICON_CLOSE()}</button>`);
  return parts.join('');
}

/* ── 渲染辅助：内容区 HTML ────────────────────────────── */
function renderBodyHtml(kind, state) {
  if (kind === 'view' && state.htmlMode === 'preview') {
    return `<iframe srcdoc="${escapeHtml(state.code)}" sandbox="allow-scripts allow-same-origin"></iframe>`;
  }
  const langClass = state.langClass ? ` class="lang-${escapeHtml(state.langClass)}"` : '';
  return `<pre><code${langClass}>${escapeHtml(state.code)}</code></pre>`;
}

/* ── 事件接管 ─────────────────────────────────────────── */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.tbl-btn.tbl-maximize');
  if (!btn) return;
  const card = btn.closest('.tbl-outer');
  if (!card) return;
  const isTable = !!card.querySelector('.tbl thead');
  if (isTable) return;
  const isMermaid = card.classList.contains('wb-card-visual');
  if (isMermaid) return;
  e.preventDefault();
  e.stopPropagation();
  openCodeSheet(card);
}, true);

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.wb-card-btn-primary.tbl-view');
  if (!btn) return;
  const card = btn.closest('.tbl-outer');
  if (!card) return;
  e.preventDefault();
  e.stopPropagation();
  openCodeSheet(card, { htmlMode: 'preview' });
}, true);

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.wb-card-expand');
  if (!btn) return;
  const card = btn.closest('.tbl-outer');
  if (!card) return;
  e.preventDefault();
  e.stopPropagation();
  openCodeSheet(card);
}, true);

/* ── 静态渲染导出 ──────────────────────────────────────── */
export function renderStaticCodeSheet({ lang, code, kind, htmlMode = 'code' }) {
  const resolvedKind = kind || resolveKindByLang(lang);
  const langClass = lang || '';
  const state = { code, langClass, htmlMode, kind: resolvedKind };

  const title = resolveTitleByLang(lang);
  const leftHtml = `<div class="code-sheet-left"><span class="code-sheet-title">${escapeHtml(title)}</span></div>`;
  const actionsHtml = renderActionsHtml(resolvedKind, state, { mode: 'static' });
  const bodyHtml = renderBodyHtml(resolvedKind, state);

  return `<header class="code-sheet-header">
    ${leftHtml}
    <div class="code-sheet-actions glass-capsule">${actionsHtml}</div>
  </header>
  <div class="code-sheet-body">${bodyHtml}</div>`;
}

// ── 静态渲染辅助 ────────────────────────────────────────
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

/* ── 静态渲染：代码 Sheet 带遮罩外壳（供 Feature Panel 快照用）──
 * 使用 sheet.js 的 renderStaticSheetShell + variant='code' 统一渲染
 */
export function renderStaticCodeSheetShell(opts = {}) {
  const { lang = '', code = '', kind, htmlMode = 'code', width = '390px', height = '850px', borderRadius = '', frameCls = '' } = opts;
  const inner = renderStaticCodeSheet({ lang, code, kind, htmlMode });
  return renderStaticSheetShell({
    variant: 'code',
    body: inner,
    width,
    height,
    borderRadius,
    showClose: false,
    showOverlay: true,
    frameCls
  });
}