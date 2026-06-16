// ============================================================
// MARKDOWN — escapeHtml · inlineMarkdown · markdownToHtml
// ============================================================

const SVG_COPY = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 1.58943 0.657074)" d="M3.7804 11.4101Q3.1921 11.4035 2.9264 11.3839Q2.2536 11.3344 1.8193 11.1371Q0.7581 10.6552 0.2762 9.5941Q0.079 9.1598 0.0294 8.487Q0 8.0876 0 6.9589L0 4.8155Q0 3.3828 0.0469 2.8798Q0.126 2.0311 0.4397 1.5078Q0.84 0.84 1.5078 0.4397Q2.0311 0.126 2.8798 0.0469Q3.3828 0 4.8155 0L6.0922 0Q6.7465 0 6.9587 0.0294Q7.9864 0.1715 8.7229 0.908Q9.4594 1.6445 9.6016 2.6722Q9.6309 2.8845 9.6309 3.5387L8.6137 3.5387C10.3989 3.5399 11.3221 3.5643 11.9644 4.0633C12.1299 4.1918 12.2788 4.3407 12.4073 4.5062C12.9319 5.1815 12.9319 6.1672 12.9319 8.1386L12.9319 9.2787C12.9319 11.2501 12.9319 12.2358 12.4073 12.9111C12.2788 13.0766 12.1299 13.2255 11.9644 13.354C11.2891 13.8786 10.3034 13.8786 8.332 13.8786C6.3605 13.8786 5.3748 13.8786 4.6995 13.354C4.534 13.2255 4.3852 13.0766 4.2566 12.9111C3.9691 12.5411 3.8392 12.0778 3.7804 11.4101ZM3.7346 10.205Q2.6043 10.1757 2.3155 10.0445Q1.6645 9.7489 1.3689 9.0979Q1.2 8.7261 1.2 6.9589L1.2 4.8155Q1.2 3.4386 1.2417 2.9911Q1.2955 2.4141 1.4689 2.1248Q1.7148 1.7148 2.1248 1.4689Q2.4141 1.2955 2.9911 1.2417Q3.4386 1.2 4.8155 1.2L6.0922 1.2Q6.6639 1.2 6.7943 1.218Q7.4229 1.305 7.8744 1.7565Q8.326 2.208 8.4129 2.8366Q8.4309 2.967 8.4309 3.5387L8.332 3.5387C6.3605 3.5387 5.3748 3.5387 4.6995 4.0633C4.534 4.1918 4.3852 4.3407 4.2566 4.5062C3.732 5.1815 3.732 6.1672 3.732 8.1386L3.732 9.2787C3.732 9.615 3.732 9.9226 3.7346 10.205ZM4.932 8.1386L4.932 9.2787Q4.932 10.9357 4.9899 11.4455Q5.0502 11.9767 5.2042 12.1749Q5.3054 12.3052 5.4357 12.4064Q5.6339 12.5604 6.1651 12.6207Q6.6749 12.6786 8.332 12.6786Q9.989 12.6786 10.4988 12.6207Q11.03 12.5604 11.2282 12.4064Q11.3585 12.3052 11.4597 12.1749Q11.6137 11.9767 11.674 11.4455Q11.7319 10.9357 11.7319 9.2787L11.7319 8.1386Q11.7319 6.4816 11.674 5.9718Q11.6137 5.4406 11.4597 5.2424Q11.3585 5.1121 11.2282 5.0109Q11.03 4.8569 10.4988 4.7966Q9.989 4.7387 8.332 4.7387C6.3605 4.7387 5.3748 4.7387 4.6995 5.2633C4.534 5.3918 4.3852 5.5407 4.2566 5.7062C3.732 6.3815 3.732 7.1672 3.732 8.7386L3.732 9.2787C3.732 10.8501 3.732 11.6358 4.2566 12.3111C4.3852 12.4766 4.534 12.6255 4.6995 12.754C5.3748 13.2786 6.3605 13.2786 8.332 13.2786C10.3034 13.2786 11.2891 13.2786 11.9644 12.754C12.1299 12.6255 12.2788 12.4766 12.4073 12.3111C12.9319 11.6358 12.9319 10.8501 12.9319 9.2787L12.9319 8.1386C12.9319 7.0908 12.9319 6.3951 12.7649 5.906Z" fill-rule="evenodd"/></svg>';
const SVG_SAVE_IMAGE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 3.07593 4.49969)" d="M8.9239 1C8.9237 0.4479 8.476 0 7.9239 0C7.3718 0.0001 6.924 0.4479 6.9238 1C6.9238 1.5522 7.3717 1.9999 7.9239 2C8.4761 2 8.9239 1.5523 8.9239 1ZM7.2657 3.0693C6.2871 2.1186 5.0193 1.4004 3.4238 1.4004C2.7127 1.4004 2.1142 1.5458 1.5508 1.8457C1.0018 2.1379 0.5126 2.5635 0 3.0762L0.8477 3.9238C1.3348 3.4367 1.725 3.112 2.1152 2.9043C2.491 2.7044 2.893 2.5996 3.4238 2.5996C4.6236 2.5996 5.6062 3.1316 6.4287 3.9307C7.2589 4.7373 7.8992 5.7935 8.3867 6.7685L9.461 6.2314C8.9485 5.2066 8.2364 4.0125 7.2657 3.0693Z" fill-rule="evenodd"/><path fill="currentColor" transform="matrix(1 0 0 1 0.975098 1.70117)" d="M0 5.9181L0 6.6922C-0.0001 9.4545 -0.0001 10.8527 0.8787 11.7316C1.7575 12.6104 3.1557 12.6103 5.9181 12.6102L6 12.6102L8.05 12.6102L8.1319 12.6102C10.8943 12.6103 12.2925 12.6104 13.1713 11.7316C14.0501 10.8527 14.0501 9.4545 14.05 6.6922L14.05 6.6102L14.05 6L14.05 5.9181C14.0501 3.1557 14.0501 1.7575 13.1713 0.8787C12.2925 -0.0001 10.8943 -0.0001 8.1319 0L5.9181 0C3.1557 -0.0001 1.7575 -0.0001 0.8787 0.8787C-0.0001 1.7575 -0.0001 3.1557 0 5.9181ZM1.2 6.6102L1.2 6L1.2 5.918Q1.1999 3.5782 1.2987 2.8543Q1.4092 2.0453 1.7272 1.7272Q2.0453 1.4092 2.8543 1.2987Q3.5782 1.1999 5.918 1.2L6 1.2L8.05 1.2L8.132 1.2Q10.4718 1.1999 11.1957 1.2987Q12.0048 1.4092 12.3228 1.7272Q12.6409 2.0453 12.7513 2.8543Q12.8501 3.5782 12.85 5.918L12.85 6L12.85 6.6102L12.85 6.6922Q12.8501 9.032 12.7513 9.7559Q12.6409 10.565 12.3228 10.883Q12.0047 11.2011 11.1957 11.3115Q10.4718 11.4103 8.132 11.4102L8.05 11.4102L6 11.4102L5.918 11.4102Q3.5782 11.4103 2.8543 11.3115Q2.0453 11.2011 1.7272 10.883Q1.4092 10.565 1.2987 9.7559Q1.1999 9.032 1.2 6.6922L1.2 6.6102Z" fill-rule="evenodd"/></svg>';
const SVG_DOWNLOAD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(0 -1 1 0 1.54639 14.2466)" d="M3.292 13.1187Q4.013 13.2 6.1 13.2L6.1 12Q4.0804 12 3.4264 11.9263Q2.5612 11.8288 2.1391 11.5043Q1.8884 11.3116 1.6957 11.0609Q1.3713 10.6388 1.2737 9.7736Q1.2 9.1196 1.2 7.1L1.2 6.1Q1.2 4.0804 1.2737 3.4264Q1.3713 2.5612 1.6957 2.1391Q1.8884 1.8884 2.1391 1.6957Q2.5612 1.3713 3.4264 1.2737Q4.0804 1.2 6.1 1.2L6.1 0Q4.013 0 3.292 0.0813Q2.0948 0.2162 1.4078 0.7442Q1.0326 1.0326 0.7442 1.4078Q0.2162 2.0948 0.0813 3.292Q0 4.013 0 6.1L0 7.1Q0 9.187 0.0813 9.908Q0.2162 11.1052 0.7442 11.7922Q1.0326 12.1674 1.4078 12.4558Q2.0948 12.9838 3.292 13.1187ZM6.5486 7.2001L9.0244 9.6758L8.1758 10.5244L5.3829 7.7315L5.3733 7.7218Q5.0591 7.4077 4.9525 7.2674Q4.7072 6.9445 4.7072 6.6001Q4.7072 6.2557 4.9525 5.9328Q5.0591 5.7925 5.3733 5.4784L5.3829 5.4687L8.1758 2.6758L9.0244 3.5244L6.5486 6.0001L13.1001 6.0001L13.1001 7.2001L6.5486 7.2001Z" fill-rule="evenodd"/></svg>';
const SVG_MAXIMIZE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 8.16998 2.33)" d="M4.9 5.5L4.9 2.9794L4.9 2.959Q4.9 1.8829 4.8582 1.4904L1.2543 5.0943L0.4058 4.2458L4.0098 0.6418Q3.6174 0.6 2.541 0.6L2.5 0.6L0 0.6L0 -0.6L2.5 -0.6L2.541 -0.6Q3.7923 -0.6 4.235 -0.5396Q5.0399 -0.4297 5.4847 0.015Q5.9297 0.4598 6.0396 1.2649Q6.1 1.7076 6.1 2.959L6.1 2.9795L6.1 5.5L4.9 5.5Z" fill-rule="evenodd"/><path fill="currentColor" transform="matrix(1 0 0 1 2.33002 8.17)" d="M0.6 0L0.6 2.5L0.6 2.541Q0.6 3.6171 0.6418 4.0096L4.2457 0.4057L5.0942 1.2542L1.4902 4.8582Q1.8826 4.9 2.959 4.9L3 4.9L5.5 4.9L5.5 6.1L3 6.1L2.959 6.1Q1.7077 6.1 1.265 6.0396Q0.4601 5.9297 0.0153 5.485Q-0.4297 5.0402 -0.5396 4.2351Q-0.6 3.7924 -0.6 2.541L-0.6 2.5L-0.6 0L0.6 0Z" fill-rule="evenodd"/></svg>';
const SVG_SHARE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" style="display:block"><path fill="currentColor" transform="matrix(1 0 0 1 0.953007 0.0757451)" d="M10.4712 0L13.9731 3.5018Q13.9858 3.5146 14.0104 3.539Q14.2943 3.8215 14.3453 4.0488Q14.4686 4.5989 13.9925 4.9007Q13.7956 5.0254 13.3951 5.0244Q13.3605 5.0243 13.3424 5.0243L12.547 5.0243Q10.5223 5.0243 10.0175 5.1452Q8.8155 5.4332 7.9357 6.313Q7.0559 7.1928 6.7679 8.3948Q6.647 8.8996 6.647 10.9243L5.447 10.9243Q5.447 8.7579 5.6009 8.1152Q5.9678 6.5838 7.0872 5.4644Q8.2065 4.3451 9.7379 3.9782Q10.3806 3.8243 12.547 3.8242L12.5985 3.8242L9.6227 0.8485L10.4712 0ZM7.3399 0.8768C7.572 0.8761 7.8082 0.8754 8.0469 0.8785L8.0469 2.0815C7.7767 2.0772 7.4976 2.0774 7.2093 2.0775L7.2093 2.0775C7.1551 2.0775 7.1007 2.0776 7.0459 2.0776C6.9911 2.0776 6.9366 2.0775 6.8825 2.0775C5.0392 2.0765 3.5712 2.0757 2.4014 3.2221C1.1981 4.4018 1.1986 5.9034 1.1992 7.7966C1.1992 7.8393 1.1992 7.8822 1.1992 7.9252C1.1992 7.9684 1.1992 8.0113 1.1992 8.054C1.1986 9.9469 1.1981 11.4478 2.4014 12.6274C3.4551 13.6601 4.7509 13.7617 6.3447 13.771L7.748 13.771C9.3421 13.7617 10.6376 13.6598 11.6914 12.6274C12.8947 11.4479 12.8942 9.9473 12.8936 8.0546C12.8936 8.0117 12.8936 7.9685 12.8936 7.9252C12.8936 7.8818 12.8936 7.8385 12.8936 7.7954L12.8936 7.7954C12.8937 7.4953 12.8938 7.205 12.8891 6.9243L14.0912 6.9243C14.0945 7.1687 14.0939 7.4106 14.0933 7.6483L14.0933 7.6484C14.093 7.7413 14.0928 7.8337 14.0928 7.9253C14.0928 8.0167 14.093 8.1088 14.0932 8.2016C14.0977 9.9594 14.1027 11.9435 12.5313 13.4839C11.0008 14.9835 9.0579 14.9778 7.3395 14.9727C7.2408 14.9725 7.1429 14.9722 7.0459 14.9722C6.9488 14.9722 6.8508 14.9725 6.7521 14.9727C5.0339 14.9778 3.0915 14.9835 1.5615 13.4839C0.1139 12.0648 0.0048 10.2689 0 8.6206L0 7.229C0.0048 5.5807 0.1141 3.7847 1.5615 2.3657C3.0916 0.866 5.0342 0.8717 6.7524 0.8768C6.851 0.8771 6.9489 0.8774 7.0459 0.8774C7.1431 0.8774 7.2411 0.8771 7.3399 0.8768Z" fill-rule="evenodd"/></svg>';

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
  const headingMatch = (trim) => { const m = trim.match(/^(#{1,6})\s+(.+)$/); return m ? [m[1].length, m[2]] : null; };
  const isBlockStart = (t) => {
    if (!t) return true;
    const hm = headingMatch(t);
    if (hm) return true;
    if (t.startsWith('>')) return true;
    if (/^-\s+/.test(t)) return true;
    if (/^\d+\.\s+/.test(t)) return true;
    if (/^---+$/.test(t)) return true;
    if (t.startsWith('```')) return true;
    if (t.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) return true;
    return false;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trim = line.trim();
    if (!trim) { i++; continue; }

    // 分割线 ---
    if (/^---+$/.test(trim)) { out.push('<hr>'); i++; continue; }

    // 标题 H1-H6: # ~ ######
    const hm = headingMatch(trim);
    if (hm) {
      const level = hm[0];
      const text = hm[1];
      out.push(`<h${level}>${inlineMarkdown(text)}</h${level}>`);
      i++;
      continue;
    }

    // 引用 >
    if (trim.startsWith('>')) {
      const parts = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) parts.push(lines[i++].trim().replace(/^>\s?/, ''));
      out.push(`<blockquote><p>${inlineMarkdown(parts.join(' '))}</p></blockquote>`);
      continue;
    }

    // 无序列表 -
    if (/^-\s+/.test(trim)) {
      const items = [];
      while (i < lines.length && /^-\s+/.test(lines[i].trim())) items.push(`<li>${inlineMarkdown(lines[i++].trim().replace(/^-\s+/, ''))}</li>`);
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // 有序列表 1. 2. 3.
    if (/^\d+\.\s+/.test(trim)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) items.push(`<li>${inlineMarkdown(lines[i++].trim().replace(/^\d+\.\s+/, ''))}</li>`);
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // 表格
    if (trim.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitTable(trim);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTable(lines[i++]));
      }
      const toolbar = `<div class="tbl-toolbar"><span class="tbl-toolbar-title">表格</span><div class="tbl-toolbar-actions"><button class="tbl-btn tbl-copy" aria-label="复制">${SVG_COPY}</button><button class="tbl-btn tbl-save-image" aria-label="保存图片">${SVG_SAVE_IMAGE}</button><button class="tbl-btn tbl-share" aria-label="分享">${SVG_SHARE}</button><button class="tbl-btn tbl-maximize" aria-label="全屏">${SVG_MAXIMIZE}</button></div></div>`;
      out.push(`<div class="tbl-outer">${toolbar}<div class="tbl-wrap"><table class="tbl"><thead><tr>${header.map(h => `<th>${inlineMarkdown(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`);
      continue;
    }

    // 围栏代码块 ```lang
    if (trim.startsWith('```')) {
      const lang = trim.slice(3).trim();
      i++;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      // 跳过结束的 ```
      if (i < lines.length) i++;
      const codeHtml = escapeHtml(codeLines.join('\n'));
      const langAttr = lang ? ` class="lang-${escapeHtml(lang)}"` : '';
      const langLabel = lang ? escapeHtml(lang) : '';
      const toolbar = `<div class="code-toolbar"><span class="code-lang">${langLabel}</span><div class="code-actions"><button class="code-btn code-copy" aria-label="复制">${SVG_COPY}</button></div></div>`;
      out.push(`<div class="code-outer">${toolbar}<pre><code${langAttr}>${codeHtml}</code></pre></div>`);
      continue;
    }

    // 段落（默认）
    const paras = [trim];
    i++;
    while (i < lines.length) {
      const t = lines[i].trim();
      if (isBlockStart(t)) break;
      paras.push(lines[i]);
      i++;
    }
    out.push(`<p>${inlineMarkdown(paras.join(' '))}</p>`);
  }
  return out.join('\n');
}
