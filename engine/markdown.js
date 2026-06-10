// ============================================================
// MARKDOWN — escapeHtml · inlineMarkdown · markdownToHtml
// ============================================================

const SVG_COPY = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 1.58943 0.657074)" d="M3.7804 11.4101Q3.1921 11.4035 2.9264 11.3839Q2.2536 11.3344 1.8193 11.1371Q0.7581 10.6552 0.2762 9.5941Q0.079 9.1598 0.0294 8.487Q0 8.0876 0 6.9589L0 4.8155Q0 3.3828 0.0469 2.8798Q0.126 2.0311 0.4397 1.5078Q0.84 0.84 1.5078 0.4397Q2.0311 0.126 2.8798 0.0469Q3.3828 0 4.8155 0L6.0922 0Q6.7465 0 6.9587 0.0294Q7.9864 0.1715 8.7229 0.908Q9.4594 1.6445 9.6016 2.6722Q9.6309 2.8845 9.6309 3.5387L8.6137 3.5387C10.3989 3.5399 11.3221 3.5643 11.9644 4.0633C12.1299 4.1918 12.2788 4.3407 12.4073 4.5062C12.9319 5.1815 12.9319 6.1672 12.9319 8.1386L12.9319 9.2787C12.9319 11.2501 12.9319 12.2358 12.4073 12.9111C12.2788 13.0766 12.1299 13.2255 11.9644 13.354C11.2891 13.8786 10.3034 13.8786 8.332 13.8786C6.3605 13.8786 5.3748 13.8786 4.6995 13.354C4.534 13.2255 4.3852 13.0766 4.2566 12.9111C3.9691 12.5411 3.8392 12.0778 3.7804 11.4101ZM3.7346 10.205Q2.6043 10.1757 2.3155 10.0445Q1.6645 9.7489 1.3689 9.0979Q1.2 8.7261 1.2 6.9589L1.2 4.8155Q1.2 3.4386 1.2417 2.9911Q1.2955 2.4141 1.4689 2.1248Q1.7148 1.7148 2.1248 1.4689Q2.4141 1.2955 2.9911 1.2417Q3.4386 1.2 4.8155 1.2L6.0922 1.2Q6.6639 1.2 6.7943 1.218Q7.4229 1.305 7.8744 1.7565Q8.326 2.208 8.4129 2.8366Q8.4309 2.967 8.4309 3.5387L8.332 3.5387C6.3605 3.5387 5.3748 3.5387 4.6995 4.0633C4.534 4.1918 4.3852 4.3407 4.2566 4.5062C3.732 5.1815 3.732 6.1672 3.732 8.1386L3.732 9.2787C3.732 9.615 3.732 9.9226 3.7346 10.205ZM4.932 8.1386L4.932 9.2787Q4.932 10.9357 4.9899 11.4455Q5.0502 11.9767 5.2042 12.1749Q5.3054 12.3052 5.4357 12.4064Q5.6339 12.5604 6.1651 12.6207Q6.6749 12.6786 8.332 12.6786Q9.989 12.6786 10.4988 12.6207Q11.03 12.5604 11.2282 12.4064Q11.3585 12.3052 11.4597 12.1749Q11.6137 11.9767 11.674 11.4455Q11.7319 10.9357 11.7319 9.2787L11.7319 8.1386Q11.7319 6.4816 11.674 5.9718Q11.6137 5.4406 11.4597 5.2424Q11.3585 5.1121 11.2282 5.0109Q11.03 4.8569 10.4988 4.7966Q9.989 4.7387 6.1651 4.7966Q5.6339 4.8569 5.4357 5.0109Q5.3054 5.1121 5.2042 5.2424Q5.0502 5.4406 4.9899 5.9718Q4.932 6.4816 4.932 8.1386Z" fill-rule="evenodd"/></svg>';
const SVG_DOWNLOAD = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(0 -1 1 0 1.54639 14.2466)" d="M3.292 13.1187Q4.013 13.2 6.1 13.2L6.1 12Q4.0804 12 3.4264 11.9263Q2.5612 11.8288 2.1391 11.5043Q1.8884 11.3116 1.6957 11.0609Q1.3713 10.6388 1.2737 9.7736Q1.2 9.1196 1.2 7.1L1.2 6.1Q1.2 4.0804 1.2737 3.4264Q1.3713 2.5612 1.6957 2.1391Q1.8884 1.8884 2.1391 1.6957Q2.5612 1.3713 3.4264 1.2737Q4.0804 1.2 6.1 1.2L6.1 0Q4.013 0 3.292 0.0813Q2.0948 0.2162 1.4078 0.7442Q1.0326 1.0326 0.7442 1.4078Q0.2162 2.0948 0.0813 3.292Q0 4.013 0 6.1L0 7.1Q0 9.187 0.0813 9.908Q0.2162 11.1052 0.7442 11.7922Q1.0326 12.1674 1.4078 12.4558Q2.0948 12.9838 3.292 13.1187ZM6.5486 7.2001L9.0244 9.6758L8.1758 10.5244L5.3829 7.7315L5.3733 7.7218Q5.0591 7.4077 4.9525 7.2674Q4.7072 6.9445 4.7072 6.6001Q4.7072 6.2557 4.9525 5.9328Q5.0591 5.7925 5.3733 5.4784L5.3829 5.4687L8.1758 2.6758L9.0244 3.5244L6.5486 6.0001L13.1001 6.0001L13.1001 7.2001L6.5486 7.2001Z" fill-rule="evenodd"/></svg>';
const SVG_MAXIMIZE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 8.16998 2.33)" d="M4.9 5.5L4.9 2.9794L4.9 2.959Q4.9 1.8829 4.8582 1.4904L1.2543 5.0943L0.4058 4.2458L4.0098 0.6418Q3.6174 0.6 2.541 0.6L2.5 0.6L0 0.6L0 -0.6L2.5 -0.6L2.541 -0.6Q3.7923 -0.6 4.235 -0.5396Q5.0399 -0.4297 5.4847 0.015Q5.9297 0.4598 6.0396 1.2649Q6.1 1.7076 6.1 2.959L6.1 2.9795L6.1 5.5L4.9 5.5Z" fill-rule="evenodd"/><path fill="currentColor" transform="matrix(1 0 0 1 2.33002 8.17)" d="M0.6 0L0.6 2.5L0.6 2.541Q0.6 3.6171 0.6418 4.0096L4.2457 0.4057L5.0942 1.2542L1.4902 4.8582Q1.8826 4.9 2.959 4.9L3 4.9L5.5 4.9L5.5 6.1L3 6.1L2.959 6.1Q1.7077 6.1 1.265 6.0396Q0.4601 5.9297 0.0153 5.485Q-0.4297 5.0402 -0.5396 4.2351Q-0.6 3.7924 -0.6 2.541L-0.6 2.5L-0.6 0L0.6 0Z" fill-rule="evenodd"/></svg>';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function inlineMarkdown(text) {
  // 先透传已有的原始 <a> 标签，避免被 escapeHtml 转义
  const anchors = [];
  text = text.replace(/<a\b[^>]*>.*?<\/a>/gi, (match) => {
    anchors.push(match);
    return `\x00ANCHOR\x00`;
  });
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = escapeHtml(href);
    const cls = (/\.docx(?:$|[?#])/i.test(href) || /^查看/.test(label)) ? ' class="doc-link-card"' : '';
    return `<a${cls} href="${safeHref}" onclick="return false;">${escapeHtml(label)}</a>`;
  });
  // 还原原始 <a> 标签
  html = html.replace(/\x00ANCHOR\x00/g, () => anchors.shift());
  return html;
}

export function markdownToHtml(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').trim().split('\n');
  const out = [];
  let i = 0;
  const isTableSep = (line) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const splitTable = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();
    if (!trim) { i++; continue; }
    if (/^---+$/.test(trim)) { out.push('<hr>'); i++; continue; }
    if (trim.startsWith('## ')) { out.push(`<h2>${inlineMarkdown(trim.slice(3))}</h2>`); i++; continue; }
    if (trim.startsWith('### ')) { out.push(`<h3>${inlineMarkdown(trim.slice(4))}</h3>`); i++; continue; }
    if (trim.startsWith('>')) {
      const parts = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) parts.push(lines[i++].trim().replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inlineMarkdown(parts.join(' '))}</p></blockquote>`);
      continue;
    }
    if (/^-\s+/.test(trim)) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i].trim())) items.push(`<li>${inlineMarkdown(lines[i++].trim().replace(/^-\s+/, ''))}</li>`);
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    if (trim.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitTable(trim);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTable(lines[i++]));
      }
      const toolbar = `<div class="tbl-toolbar"><span class="tbl-toolbar-title">表格</span><div class="tbl-toolbar-actions"><button class="tbl-btn tbl-copy" aria-label="复制">${SVG_COPY}</button><button class="tbl-btn tbl-download" aria-label="下载" disabled>${SVG_DOWNLOAD}</button><button class="tbl-btn tbl-maximize" aria-label="全屏" disabled>${SVG_MAXIMIZE}</button></div></div>`;
      out.push(`<div class="tbl-outer">${toolbar}<div class="tbl-wrap"><table class="tbl"><thead><tr>${header.map(h => `<th>${inlineMarkdown(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`);
      continue;
    }
    const paras = [trim];
    i++;
    while (i < lines.length) {
      const t = lines[i].trim();
      if (!t || t.startsWith('## ') || t.startsWith('### ') || t.startsWith('>') || /^-\s+/.test(t) || /^---+$/.test(t) || (t.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))) break;
      paras.push(t); i++;
    }
    out.push(`<p>${inlineMarkdown(paras.join(' '))}</p>`);
  }
  return out.join('\n');
}
