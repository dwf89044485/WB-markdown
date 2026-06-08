// ============================================================
// MARKDOWN — escapeHtml · inlineMarkdown · markdownToHtml
// ============================================================

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
      out.push(`<div class="tbl-wrap"><table class="tbl"><thead><tr>${header.map(h => `<th>${inlineMarkdown(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
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
