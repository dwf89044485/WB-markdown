// ============================================================
// ICONS — SVG registry · tool icon inference · status line render
// No imports — reads window.WORKBUDDY_INLINE_ICONS and window.WORKBUDDY_ICON_ALIASES
// ============================================================

export const ICONS = {
  ok: '<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 3L9 1" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  spin: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#e9e9eb" stroke-width="2"/><path d="M10 2a8 8 0 018 8" stroke="#5e5ce6" stroke-width="2" stroke-linecap="round"/></svg>',
  chevron: '<svg width="12" height="7" viewBox="0 0 12 7" fill="none"><path d="M1 1.5l5 4 5-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  todoOk: '<div class="sub-ok"><svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 5-5" stroke="white" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>',
  todoSpin: '<div class="sub-loading"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#e9e9eb" stroke-width="1.5"/><path d="M8 1.5A6.5 6.5 0 0114.5 8" stroke="#5e5ce6" stroke-width="1.5" stroke-linecap="round"/></svg></div>',
  todoEmpty: '<div class="sub-empty"></div>',
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
  if (/网页|网站|联网|入境|交通卡|天气|汇率|路线/i.test(raw)) return 'website';
  if (/🔍|搜索|search/i.test(raw)) return 'search';
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
  const labelled = raw.replace(/<svg\b/, `<svg class="${className}" aria-hidden="true" focusable="false"`);
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
  return `<span class="status-fragments">${parts}<span class="status-chevron">›</span></span>`;
}

export function setStatusLineLabels(line, labels) {
  line.innerHTML = statusLineHTML(labels);
}
