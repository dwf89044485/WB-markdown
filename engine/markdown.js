/* === markdown.js 架构注释 ===
 * 通用工具卡片系统（.wb-card / .tbl-outer）：
 *   - 容器类型：表格、代码块（执行类/HTML/不可执行类）、Mermaid
 *   - 配置驱动：CARD_TYPES 表声明每种 lang → 标题、按钮组合、内容渲染器
 *   - 渲染入口：renderCardShell({type, title, body, hasPrimary})
 * 工具栏按钮（次按钮）：tbl-copy / tbl-save-image / tbl-share / tbl-maximize
 * 主按钮（黑底胶囊）：tbl-run（▶ 运行）、tbl-view（● 预览）
 * 全屏 JS 交互在 engine/table-fullscreen.js（仅表格），
 * 后续 run/view 行为占位待定（task #11）。
 */

// ============================================================
// MARKDOWN — escapeHtml · inlineMarkdown · markdownToHtml
// ============================================================

// ── 图标：从 icons-inline.js 注入的全局表读取，统一外观 ───────
function getIcon(name) {
  const reg = (typeof window !== 'undefined' && window.WORKBUDDY_INLINE_ICONS) || {};
  const raw = reg[name];
  if (!raw) return '';
  // 让图标颜色继承 currentColor，便于按钮主次态切换
  return raw
    .replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"')
    .replace(/fill="rgba\([^)]+\)"/gi, 'fill="currentColor"')
    .replace(/stroke="rgba\([^)]+\)"/gi, 'stroke="currentColor"')
    .replace(/fill="(white|black)"/gi, 'fill="currentColor"')
    .replace(/stroke="(white|black)"/gi, 'stroke="currentColor"');
}
const ICON_COPY     = () => getIcon('wb-copy.svg');
const ICON_SHARE    = () => getIcon('wb-share.svg');
const ICON_MAXIMIZE = () => getIcon('wb-maximize.svg');
const ICON_IMAGE    = () => getIcon('image.svg');
// 「预览」(wb-view 1.svg) — 黑色 fill，跟其他次按钮一致继承 currentColor
const ICON_VIEW = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" d="M8 1.14551C9.6472 1.14551 11.1583 1.6536 12.5332 2.6709C13.9081 3.68831 14.9194 5.04667 15.5674 6.74512L15.998 8.19238L16 8.2041C15.5529 10.2747 14.5828 11.9687 13.0898 13.2861C11.5967 14.6036 9.89997 15.2627 8 15.2627C6.10009 15.2627 4.40335 14.6036 2.91016 13.2861C1.41714 11.9687 0.447029 10.2747 0 8.2041C0.447021 6.13325 1.41696 4.43859 2.91016 3.12109C4.40335 1.8036 6.10009 1.14551 8 1.14551ZM8 4.75684C7.04822 4.75684 6.23551 5.09359 5.5625 5.7666C4.88952 6.43961 4.55273 7.25234 4.55273 8.2041C4.55277 9.15581 4.88953 9.96863 5.5625 10.6416C6.23549 11.3145 7.04828 11.6504 8 11.6504C8.95172 11.6504 9.76452 11.3146 10.4375 10.6416C11.1105 9.96863 11.4462 9.15581 11.4463 8.2041C11.4463 7.25238 11.1104 6.43959 10.4375 5.7666C9.76451 5.09361 8.95174 4.75686 8 4.75684ZM8 5.99707C8.60931 5.99709 9.12974 6.21275 9.56055 6.64355C9.99129 7.07436 10.2061 7.59481 10.2061 8.2041C10.206 8.81331 9.99134 9.33379 9.56055 9.76465C9.12975 10.1954 8.60929 10.4101 8 10.4102C7.39078 10.4102 6.87033 10.1954 6.43945 9.76465C6.00866 9.33379 5.79301 8.81331 5.79297 8.2041C5.79297 7.59477 6.00865 7.07438 6.43945 6.64355C6.87035 6.21272 7.39072 5.99707 8 5.99707Z"/></svg>';
// 「运行」(Subtract.svg) — 实心黑圆+白三角；用 currentColor + 内嵌白三角
const ICON_RUN = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM7.38086 5.70898C6.70946 5.30615 6.37376 5.10444 6.12012 5.24805C5.86664 5.39174 5.86621 5.78353 5.86621 6.56641V9.43359C5.86621 10.2165 5.86664 10.6083 6.12012 10.752C6.37376 10.8956 6.70946 10.6939 7.38086 10.291L9.77051 8.85742C10.4087 8.47449 10.7285 8.2831 10.7285 8C10.7285 7.7169 10.4087 7.52551 9.77051 7.14258L7.38086 5.70898Z"/></svg>';

// 「查看全部」按钮 — 超长代码块底部，点击拉起二级 sheet（code-fullscreen-sheet.js）
function renderExpandBtn({ disabled = false } = {}) {
  const disabledAttr = disabled ? ' disabled' : '';
  const label = '查看全部';
  return `<button class="wb-card-expand" type="button" aria-label="${label}"${disabledAttr}><span class="wb-card-expand-label">${label}</span></button>`;
}

// ── 卡片类型配置 ───────────────────────────────────────────
//   kind: 'executable' | 'view' | 'static' | 'visual'
//     executable → 主按钮 ▶ 运行（js/python/bash 等）
//     view       → 主按钮 ● 查看（html）
//     static     → 无主按钮（json/css/yaml 等不可执行）
//     visual     → 无主按钮，含「保存图片」（表格 / mermaid）
const LANG_CARD_CONFIG = {
  // executable
  js:         { title: 'JavaScript', kind: 'executable' },
  javascript: { title: 'JavaScript', kind: 'executable' },
  ts:         { title: 'TypeScript', kind: 'executable' },
  typescript: { title: 'TypeScript', kind: 'executable' },
  jsx:        { title: 'JSX',        kind: 'executable' },
  tsx:        { title: 'TSX',        kind: 'executable' },
  py:         { title: 'Python',     kind: 'executable' },
  python:     { title: 'Python',     kind: 'executable' },
  sh:         { title: 'Shell',      kind: 'executable' },
  bash:       { title: 'Shell',      kind: 'executable' },
  shell:      { title: 'Shell',      kind: 'executable' },
  zsh:        { title: 'Shell',      kind: 'executable' },
  // view
  html:       { title: 'HTML',       kind: 'view' },
  // visual（保存图片按钮）
  mermaid:    { title: 'Mermaid',    kind: 'visual' },
  // static（不可执行）— 列出常见的，未识别的也走这条
  json:       { title: 'JSON',       kind: 'static' },
  css:        { title: 'CSS',        kind: 'static' },
  scss:       { title: 'SCSS',       kind: 'static' },
  less:       { title: 'LESS',       kind: 'static' },
  yaml:       { title: 'YAML',       kind: 'static' },
  yml:        { title: 'YAML',       kind: 'static' },
  xml:        { title: 'XML',        kind: 'static' },
  toml:       { title: 'TOML',       kind: 'static' },
  md:         { title: 'Markdown',   kind: 'static' },
  markdown:   { title: 'Markdown',   kind: 'static' },
  sql:        { title: 'SQL',        kind: 'static' },
  diff:       { title: 'Diff',       kind: 'static' }
};

function resolveCardConfig(lang) {
  const key = (lang || '').toLowerCase().trim();
  if (LANG_CARD_CONFIG[key]) return LANG_CARD_CONFIG[key];
  // 未识别语言 → 用语言名做标题，类型走 static
  const title = key ? key.charAt(0).toUpperCase() + key.slice(1) : '代码';
  return { title, kind: 'static' };
}

// 按 kind 推导按钮组合（顺序：主按钮 → 次按钮组）
function buildCardActions(kind, { allowImageSave = false } = {}) {
  const secondary = [];
  secondary.push({ cls: 'tbl-btn tbl-copy',     label: '复制',     icon: ICON_COPY() });
  if (allowImageSave) {
    secondary.push({ cls: 'tbl-btn tbl-save-image', label: '保存图片', icon: ICON_IMAGE() });
  }
  secondary.push({ cls: 'tbl-btn tbl-share',    label: '分享',     icon: ICON_SHARE() });
  secondary.push({ cls: 'tbl-btn tbl-maximize', label: '全屏',     icon: ICON_MAXIMIZE() });

  let primary = null;
  if (kind === 'executable') {
    primary = { cls: 'wb-card-btn-primary tbl-run',  label: '运行', icon: ICON_RUN };
  } else if (kind === 'view') {
    primary = { cls: 'wb-card-btn-primary tbl-view', label: '预览', icon: ICON_VIEW };
  }
  return { primary, secondary };
}

function renderActionsHtml(actions, { disabled = false } = {}) {
  const disabledAttr = disabled ? ' disabled' : '';
  const parts = [];
  if (actions.primary) {
    const a = actions.primary;
    parts.push(`<button class="${a.cls}" aria-label="${a.label}"${disabledAttr}>${a.icon}<span>${a.label}</span></button>`);
  }
  for (const a of actions.secondary) {
    parts.push(`<button class="${a.cls}" aria-label="${a.label}"${disabledAttr}>${a.icon}</button>`);
  }
  return parts.join('');
}

// 通用卡片外壳：标题在左、按钮在右、下方放 body
function renderCardShell({ title, actions, body, extraOuterClass = '', disabled = false }) {
  const outerCls = `tbl-outer wb-card ${extraOuterClass}`.trim();
  const toolbar = `<div class="tbl-toolbar wb-card-toolbar"><span class="tbl-toolbar-title wb-card-title">${escapeHtml(title)}</span><div class="tbl-toolbar-actions wb-card-actions">${renderActionsHtml(actions, { disabled })}</div></div>`;
  return `<div class="${outerCls}">${toolbar}${body}</div>`;
}



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
      // 表格 → visual 卡片（含「保存图片」），无主按钮
      const tableBody = `<div class="tbl-wrap"><table class="tbl"><thead><tr>${header.map(h => `<th>${inlineMarkdown(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inlineMarkdown(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      const tableActions = buildCardActions('visual', { allowImageSave: true });
      out.push(renderCardShell({ title: '表格', actions: tableActions, body: tableBody, extraOuterClass: 'wb-card-table' }));
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
      const cfg = resolveCardConfig(lang);
      // mermaid 走 visual（含保存图片），其他按 kind 决定
      const allowImageSave = cfg.kind === 'visual';
      const actions = buildCardActions(cfg.kind, { allowImageSave });
      const codeBody = `<div class="wb-card-body is-collapsible is-collapsed"><pre><code${langAttr}>${codeHtml}</code></pre>${renderExpandBtn()}</div>`;
      out.push(renderCardShell({ title: cfg.title, actions, body: codeBody, extraOuterClass: `wb-card-code wb-card-${cfg.kind}` }));
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

// ── 静态渲染导出（供 Feature Panel 快照复用）──────────────
// mode:'static' — 快照展示用，按钮视觉与 live 版本一致（不 disabled），但快照容器通过 pointer-events:none 阻止实际交互
// collapsed: true → 折叠态（限高280px + 渐隐遮罩 + 展开按钮）
// collapsed: false → 展开态（完整代码 + 收起按钮）
// collapsed: null → 不折叠（无折叠按钮，用于短代码展示）
// ── 静态 Mermaid 可视化卡片（供 Feature Panel 快照复用）────────────
// 卡片外壳与其他类型一致（标题 Mermaid + 复制/保存图片/分享/全屏 按钮），
// 内容区直接放 .mermaid 容器，由 feature-panel.js 的 mermaid.run() 完成 SVG 渲染。
export function renderStaticMermaidCard(code) {
  const actions = buildCardActions('visual', { allowImageSave: true });
  // code 不经过 escapeHtml —— Mermaid 解析 textContent，不是 HTML
  const body = `<div class="wb-card-body"><div class="mermaid">${code}</div></div>`;
  return renderCardShell({
    title: 'Mermaid',
    actions,
    body,
    extraOuterClass: 'wb-card-code wb-card-visual',
    disabled: false,
  });
}

export function renderStaticCodeCard({ lang, code, kind, collapsed = true }) {
  const cfg = kind
    ? { ...resolveCardConfig(lang), kind }
    : resolveCardConfig(lang);
  const allowImageSave = cfg.kind === 'visual';
  const actions = buildCardActions(cfg.kind, { allowImageSave });
  const codeHtml = escapeHtml(code);
  const langAttr = lang ? ` class="lang-${escapeHtml(lang)}"` : '';
  let collapseCls, expandBtn;
  if (collapsed === null) {
    collapseCls = '';
    expandBtn = '';
  } else if (collapsed) {
    collapseCls = 'is-collapsible is-collapsed';
    expandBtn = renderExpandBtn({ disabled: true, expanded: false });
  } else {
    collapseCls = 'is-collapsible';
    expandBtn = renderExpandBtn({ disabled: true, expanded: true });
  }
  const codeBody = `<div class="wb-card-body ${collapseCls}"><pre><code${langAttr}>${codeHtml}</code></pre>${expandBtn}</div>`;
  return renderCardShell({
    title: cfg.title,
    actions,
    body: codeBody,
    extraOuterClass: `wb-card-code wb-card-${cfg.kind}`,
    disabled: false,
  });
}