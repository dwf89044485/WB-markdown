// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// Table/Mermaid fullscreen 的无副作用视图与图标解析。

export const COPY_SVG_FALLBACK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 1.58943 0.657074)" d="M3.7804 11.4101Q3.1921 11.4035 2.9264 11.3839Q2.2536 11.3344 1.8193 11.1371Q0.7581 10.6552 0.2762 9.5941Q0.079 9.1598 0.0294 8.487Q0 8.0876 0 6.9589L0 4.8155Q0 3.3828 0.0469 2.8798Q0.126 2.0311 0.4397 1.5078Q0.84 0.84 1.5078 0.4397Q2.0311 0.126 2.8798 0.0469Q3.3828 0 4.8155 0L6.0922 0Q6.7465 0 6.9587 0.0294Q7.9864 0.1715 8.7229 0.908Q9.4594 1.6445 9.6016 2.6722Q9.6309 2.8845 9.6309 3.5387L8.6137 3.5387C10.3989 3.5399 11.3221 3.5643 11.9644 4.0633C12.1299 4.1918 12.2788 4.3407 12.4073 4.5062C12.9319 5.1815 12.9319 6.1672 12.9319 8.1386L12.9319 9.2787C12.9319 11.2501 12.9319 12.2358 12.4073 12.9111C12.2788 13.0766 12.1299 13.2255 11.9644 13.354C11.2891 13.8786 10.3034 13.8786 8.332 13.8786C6.3605 13.8786 5.3748 13.8786 4.6995 13.354C4.534 13.2255 4.3852 13.0766 4.2566 12.9111C3.9691 12.5411 3.8392 12.0778 3.7804 11.4101ZM3.7346 10.205Q2.6043 10.1757 2.3155 10.0445Q1.6645 9.7489 1.3689 9.0979Q1.2 8.7261 1.2 6.9589L1.2 4.8155Q1.2 3.4386 1.2417 2.9911Q1.2955 2.4141 1.4689 2.1248Q1.7148 1.7148 2.1248 1.4689Q2.4141 1.2955 2.9911 1.2417Q3.4386 1.2 4.8155 1.2L6.0922 1.2Q6.6639 1.2 6.7943 1.218Q7.4229 1.305 7.8744 1.7565Q8.326 2.208 8.4129 2.8366Q8.4309 2.967 8.4309 3.5387L8.332 3.5387C6.3605 3.5387 5.3748 3.5387 4.6995 4.0633C4.534 4.1918 4.3852 4.3407 4.2566 4.5062C3.732 5.1815 3.732 6.1672 3.732 8.1386L3.732 9.2787C3.732 9.615 3.732 9.9226 3.7346 10.205ZM4.932 8.1386L4.932 9.2787Q4.932 10.9357 4.9899 11.4455Q5.0502 11.9767 5.2042 12.1749Q5.3054 12.3052 5.4357 12.4064Q5.6339 12.5604 6.1651 12.6207Q6.6749 12.6786 8.332 12.6786Q9.989 12.6786 10.4988 12.6207Q11.03 12.5604 11.2282 12.4064Q11.3585 12.3052 11.4597 12.1749Q11.6137 11.9767 11.674 11.4455Q11.7319 10.9357 11.7319 9.2787L11.7319 8.1386Q11.7319 6.4816 11.674 5.9718Q11.6137 5.4406 11.4597 5.2424Q11.3585 5.1121 11.2282 5.0109Q11.03 4.8569 10.4988 4.7966Q9.989 4.7387 6.1651 4.7966Q5.6339 4.8569 5.4357 5.0109Q5.3054 5.1121 5.2042 5.2424Q5.0502 5.4406 4.9899 5.9718Q4.932 6.4816 4.932 8.1386Z" fill-rule="evenodd"/></svg>';

export function normalizeFullscreenIcon(raw) {
  if (!raw) return '';
  return raw
    .replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"')
    .replace(/fill="rgba\([^)]+\)"/gi, 'fill="currentColor"')
    .replace(/stroke="rgba\([^)]+\)"/gi, 'stroke="currentColor"')
    .replace(/fill="(white|black)"/gi, 'fill="currentColor"')
    .replace(/stroke="(white|black)"/gi, 'stroke="currentColor"');
}

export function resolveFullscreenIcons(inlineIcons = {}) {
  return {
    copy: normalizeFullscreenIcon(inlineIcons['wb-copy.svg']) || COPY_SVG_FALLBACK,
    image: normalizeFullscreenIcon(inlineIcons['image.svg']),
    share: normalizeFullscreenIcon(inlineIcons['wb-share.svg']),
  };
}

export function escapeHtmlFs(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderStaticTableFullscreen({
  title,
  bodyHtml,
  type = 'table',
  contentOnly = false,
  inlineIcons = globalThis.WORKBUDDY_INLINE_ICONS || {},
}) {
  const resolvedTitle = title || (type === 'mermaid' ? 'Mermaid' : '表格');
  const icons = resolveFullscreenIcons(inlineIcons);
  const inner = `<div class="tbl-fs-nav">
    <button class="tbl-fs-back" aria-label="返回" disabled>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="tbl-fs-title">${escapeHtmlFs(resolvedTitle)}</div>
    <div class="tbl-fs-actions">
      <button class="tbl-fs-btn" data-action="copy" aria-label="复制" disabled>${icons.copy}</button>
      <button class="tbl-fs-btn" data-action="save-image" aria-label="保存图片" disabled>${icons.image}</button>
      <button class="tbl-fs-btn" data-action="share" aria-label="分享" disabled>${icons.share}</button>
    </div>
  </div>
  <div class="tbl-fs-content md">${bodyHtml}</div>`;

  if (contentOnly) {
    return `<div class="tbl-fs-inner fp-static">${inner}</div>`;
  }

  return `<div class="tbl-fullscreen-overlay is-active fp-static">${inner}</div>`;
}
