// ============================================================
// ICONS — SVG registry · tool icon inference · status line render
// No imports — reads window.WORKBUDDY_INLINE_ICONS and window.WORKBUDDY_ICON_ALIASES
// ============================================================

export const ICONS = {
  ok: '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 3L9 1" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spin: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#e9e9eb" stroke-width="2"/><path d="M10 2a8 8 0 018 8" stroke="#5e5ce6" stroke-width="2" stroke-linecap="round"/></svg>',
  chevron: '<svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 1.5l5 4 5-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  todoOk: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="#000" fill-opacity="0.3" transform="matrix(1 0 0 1 2.67627 3.97617)" d="M11.3137 0.9428L4.2426 8.0139L0 3.7712L0.9428 2.8284L4.2426 6.1283L10.3709 0L11.3137 0.9428Z"/></svg>',
  todoSpin: '<svg class="spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="#00C29A" transform="matrix(1 0 0 1 2.07097 1.5)" d="M6.529 0L6.529 4L5.329 4L5.329 0L6.529 0ZM8.394 5.7697L11.8581 3.7697L11.258 2.7305L7.7939 4.7305L8.394 5.7697ZM3.4641 5.7698L0 3.7698L0.6 2.7305L4.0641 4.7305L3.4641 5.7698ZM7.7939 8.2697L11.258 10.2697L11.8581 9.2305L8.394 7.2305L7.7939 8.2697ZM4.0641 8.2697L0.6 10.2697L0 9.2305L3.4641 7.2305L4.0641 8.2697ZM6.529 9L6.529 13L5.329 13L5.329 9L6.529 9Z" fill-rule="evenodd"/></svg>',
  todoEmpty: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill="#000" fill-opacity="0.7" transform="matrix(1 0 0 1 2 2)" d="M12 6Q12 3.5147 10.2426 1.7574Q8.4853 0 6 0Q3.5147 0 1.7574 1.7574Q0 3.5147 0 6Q0 8.4853 1.7574 10.2426Q3.5147 12 6 12Q8.4853 12 10.2426 10.2426Q12 8.4853 12 6ZM2.6978 2.6978Q4.0656 1.33 6 1.33Q7.9344 1.33 9.3022 2.6978Q10.67 4.0656 10.67 6Q10.67 7.9344 9.3022 9.3022Q7.9344 10.67 6 10.67Q4.0656 10.67 2.6978 9.3022Q1.33 7.9344 1.33 6Q1.33 4.0656 2.6978 2.6978Z" fill-rule="evenodd"/></svg>',
  warn: '<svg class="tool-svg tool-svg-warning" width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M9.047 3.14c.41-.72 1.495-.72 1.906 0l6.38 11.18c.406.711-.108 1.6-.953 1.6H3.62c-.845 0-1.359-.889-.953-1.6L9.047 3.14Z" stroke="#F2991C" stroke-width="1.7" fill="rgba(242,153,28,0.08)"/><path d="M10 7.2v4.2" stroke="#F2991C" stroke-width="1.7" stroke-linecap="round"/><circle cx="10" cy="13.9" r="1" fill="#F2991C"/></svg>'
};

export const TOOL_ICON_FILES = {
  think: 'ai-agent.svg',
  agent: 'ai-agent.svg',
  image: 'image.svg',
  tools: 'tools.svg',
  debug: 'wb-ai-debug.svg',
  edit: 'wb-edit.svg',
  plan: 'wb-growth-plan.svg',
  search: 'wb-search.svg',
  website: 'wb-website.svg',
  skill: 'wb-skills.svg',
  terminal: 'wb-terminal-ai.svg',
  view: 'wb-view.svg'
};

export function inferToolIconKey(item = {}) {
  const raw = `${item.icon || ''} ${item.text || ''} ${item.dim || ''} ${item.card?.title || ''}`;
  if (/🧠|思考|Sub Coding Agent|嵌套子对话|Subagent|agent/i.test(raw)) return 'agent';
  if (/🖼|图片|image/i.test(raw)) return 'image';
  if (/📖|技能|skill|docx/i.test(raw)) return 'skill';
  if (/⚠|失败|异常|debug|排查/i.test(raw)) return 'debug';
  if (/✏|编辑|创建文件|patch|改写|rewrite/i.test(raw)) return 'edit';
  if (/👀|读取|查看|view|read/i.test(raw)) return 'view';
  if (/🖥|执行命令|terminal|python|cd \/sessions/i.test(raw)) return 'terminal';
  if (/☐|☑|待办|计划|更新计划|todo/i.test(raw)) return 'plan';
  if (/🔍|搜索|search/i.test(raw)) return 'search';
  if (/网页|网站|联网|入境|交通卡|天气|汇率|路线/i.test(raw)) return 'website';
  return 'tools';
}

export function isWarningEvent(item = {}) {
  const raw = `${item.icon || ''} ${item.text || ''} ${item.dim || ''} ${item.card?.title || ''}`;
  return /⚠|失败|异常/i.test(raw);
}

export function svgFromRegistry(file, className = 'tool-svg', title = '') {
  const INLINE_ICONS = window.WORKBUDDY_INLINE_ICONS || {};
  const ICON_ALIASES = window.WORKBUDDY_ICON_ALIASES || {};
  const resolved = ICON_ALIASES[file] || file;
  const raw = INLINE_ICONS[resolved];
  if (!raw) return '';
  // 把 SVG 内部的固定颜色改成 currentColor，让 CSS 能控制图标颜色
  // 保留 fill="none" / stroke="none" / currentColor 本身
  const modified = raw
    .replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"')
    .replace(/fill="rgba\([^)]+\)"/gi, 'fill="currentColor"')
    .replace(/stroke="rgba\([^)]+\)"/gi, 'stroke="currentColor"');
  const labelled = modified.replace(/<svg\b/, `<svg class="${className}" aria-hidden="true" focusable="false"`);
  return labelled;
}

export function renderActionIcon(alias, className = 'action-svg') {
  return svgFromRegistry(alias, className) || '';
}

export function renderToolIcon(item) {
  if (isWarningEvent(item)) return ICONS.warn;
  const key = inferToolIconKey(item);
  const file = TOOL_ICON_FILES[key] || TOOL_ICON_FILES.tools;
  const alt = String(key);
  const inline = svgFromRegistry(file, `tool-svg tool-svg-${key}`);
  return inline || `<img class="tool-svg tool-svg-${key}" src="./icons/${file}" alt="${alt}" loading="eager">`;
}

export function renderStatusToolIcon(label) {
  return renderToolIcon({ text: label });
}

export function statusLineHTML(labels) {
  const cleanLabels = (labels || []).map(l => String(l || '').replace(/\s*›\s*$/, '').trim()).filter(Boolean);
  const parts = cleanLabels.map((label, index) => {
    const sep = index > 0 ? '<span class="status-sep"> </span>' : '';
    return `${sep}<span class="status-fragment"><span class="status-icon">${renderStatusToolIcon(label)}</span><span class="status-label-text">${label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></span>`;
  }).join('');
  return `<span class="status-fragments">${parts}</span><span class="status-chevron">›</span>`;
}

export function statusStackHTML(labels) {
  const icons = labels.map(l => `
    <span class="stack-icon-wrap">
      <span class="status-icon">${renderStatusToolIcon(l)}</span>
    </span>
  `).join('');
  return `<span class="status-stack">
    <span class="status-stack-icons">${icons}</span>
    <span class="status-stack-count">已执行 ${labels.length} 项任务</span>
  </span>`;
}

export function setStatusLineLabels(line, labels) {
  line.innerHTML = statusLineHTML(labels);
  line.dataset.labels = JSON.stringify((labels || []).map(l => String(l || '').trim()));
}
