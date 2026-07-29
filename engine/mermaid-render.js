// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// engine/mermaid-render.js
// Mermaid 唯一初始化与渲染协调入口：统一左侧代码块、右侧源节点和全屏 SVG

const DEFAULT_THEME = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
const SOURCE_KEEPER_SELECTOR = 'script[type="text/x-mermaid-source"]';
const RENDER_TARGET_SELECTOR = 'pre code.lang-mermaid, .mermaid, .wb-mermaid-svg[data-mermaid-rendered="1"]';

// 主题切换时，已渲染的 SVG 颜色是“烤进内联样式”的，无法靠 CSS 变量即时换色。
// 这里用主题名映射到 Token，让旧图在异步重绘回来前先按新主题色即时覆盖，避免闪白。
const THEME_TO_VARS = Object.freeze({
  dark: {
    background: getVar('--mermaid-background', '#202226'),
    primaryColor: getVar('--mermaid-primary-color', '#29344b'),
    primaryTextColor: getVar('--mermaid-primary-text-color', '#e6e3dd'),
    primaryBorderColor: getVar('--mermaid-primary-border-color', '#7893d4'),
    lineColor: getVar('--mermaid-line-color', '#969aa3'),
    secondaryColor: getVar('--mermaid-secondary-color', '#243b34'),
    tertiaryColor: getVar('--mermaid-tertiary-color', '#403326'),
    clusterBkg: getVar('--mermaid-cluster-bg', '#24262b'),
    clusterBorder: getVar('--mermaid-cluster-border', '#555961'),
    edgeLabelBackground: getVar('--mermaid-edge-label-bg', '#202226'),
    noteBkgColor: getVar('--mermaid-note-bg', '#403923'),
    noteBorderColor: getVar('--mermaid-note-border', '#8d7a3d'),
    noteTextColor: getVar('--mermaid-note-text', '#e6e3dd')
  },
  light: {
    background: getVar('--mermaid-background', '#fff'),
    primaryColor: getVar('--mermaid-primary-color', '#eef3ff'),
    primaryTextColor: getVar('--mermaid-primary-text-color', '#1c1c1e'),
    primaryBorderColor: getVar('--mermaid-primary-border-color', '#6b7fff'),
    lineColor: getVar('--mermaid-line-color', '#6e6e73'),
    secondaryColor: getVar('--mermaid-secondary-color', '#eef8f2'),
    tertiaryColor: getVar('--mermaid-tertiary-color', '#fff5e8'),
    clusterBkg: getVar('--mermaid-cluster-bg', '#f7f7f8'),
    clusterBorder: getVar('--mermaid-cluster-border', '#d1d1d6'),
    edgeLabelBackground: getVar('--mermaid-edge-label-bg', '#fff'),
    noteBkgColor: getVar('--mermaid-note-bg', '#fff8d8'),
    noteBorderColor: getVar('--mermaid-note-border', '#d6b85c'),
    noteTextColor: getVar('--mermaid-note-text', '#3d3d3d')
  }
});

function getVar(token, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    return v || fallback;
  } catch (e) {
    return fallback;
  }
}
const BASE_CONFIG = Object.freeze({
  startOnLoad: false,
  securityLevel: 'loose',
  fontFamily: 'Inter, "PingFang SC", -apple-system, sans-serif'
});
const THEME_VARIABLE_TOKENS = Object.freeze({
  background: '--mermaid-background',
  primaryColor: '--mermaid-primary-color',
  primaryTextColor: '--mermaid-primary-text-color',
  primaryBorderColor: '--mermaid-primary-border-color',
  secondaryColor: '--mermaid-secondary-color',
  tertiaryColor: '--mermaid-tertiary-color',
  lineColor: '--mermaid-line-color',
  clusterBkg: '--mermaid-cluster-bg',
  clusterBorder: '--mermaid-cluster-border',
  edgeLabelBackground: '--mermaid-edge-label-bg',
  noteBkgColor: '--mermaid-note-bg',
  noteBorderColor: '--mermaid-note-border',
  noteTextColor: '--mermaid-note-text'
});

let activeTheme = DEFAULT_THEME;
let initializedTheme = null;
let renderSeq = 0;
let requestSeq = 0;
let svgInstanceSeq = 0;
let renderQueue = Promise.resolve();

const MAX_CACHE_ENTRIES = 40;
const svgCache = new Map();
const elementRequests = new WeakMap();

function normalizeTheme(theme) {
  return theme === 'dark' ? 'dark' : 'light';
}

function readThemeVariables(theme) {
  const styles = getComputedStyle(document.documentElement);
  const variables = {
    darkMode: theme === 'dark',
    fontFamily: BASE_CONFIG.fontFamily
  };
  for (const [name, token] of Object.entries(THEME_VARIABLE_TOKENS)) {
    const value = styles.getPropertyValue(token).trim();
    if (value) variables[name] = value;
  }
  variables.mainBkg = variables.primaryColor;
  variables.nodeTextColor = variables.primaryTextColor;
  variables.textColor = variables.primaryTextColor;
  variables.titleColor = variables.primaryTextColor;
  return variables;
}

function cacheKey(theme, source) {
  return `${theme}\u0000${source}`;
}

function enqueue(task) {
  const next = renderQueue.catch(() => {}).then(task);
  renderQueue = next.catch(() => {});
  return next;
}

function ensureInitialized(theme, themeVariables) {
  if (!window.mermaid) {
    throw new Error('Mermaid 未加载');
  }
  if (initializedTheme === theme) return;

  window.mermaid.initialize({
    ...BASE_CONFIG,
    theme: 'base',
    themeVariables
  });
  initializedTheme = theme;
}

function directSourceKeeper(element) {
  if (!element || !element.children) return null;
  return Array.from(element.children).find((child) => child.matches?.(SOURCE_KEEPER_SELECTOR)) || null;
}

function storeSource(element, source) {
  element.dataset.mermaidSource = source;
  let keeper = directSourceKeeper(element);
  if (!keeper) {
    keeper = document.createElement('script');
    keeper.type = 'text/x-mermaid-source';
    element.appendChild(keeper);
  }
  keeper.textContent = source;
}

export function getMermaidSource(root) {
  if (!root) return '';

  const directKeeper = root.matches?.(SOURCE_KEEPER_SELECTOR) ? root : directSourceKeeper(root);
  if (directKeeper) return directKeeper.textContent || '';
  if (root.dataset?.mermaidSource != null) return root.dataset.mermaidSource;

  const keeper = root.querySelector?.(SOURCE_KEEPER_SELECTOR);
  if (keeper) return keeper.textContent || '';

  const target = root.matches?.(RENDER_TARGET_SELECTOR)
    ? root
    : root.querySelector?.(RENDER_TARGET_SELECTOR);
  if (!target) return '';
  if (target.dataset?.mermaidSource != null) return target.dataset.mermaidSource;
  return target.textContent || '';
}

export function getMermaidTheme() {
  return activeTheme;
}

export function setMermaidTheme(theme) {
  activeTheme = normalizeTheme(theme);
  return activeTheme;
}

export function initializeMermaid(theme = activeTheme) {
  const resolvedTheme = normalizeTheme(theme);
  const themeVariables = readThemeVariables(resolvedTheme);
  return enqueue(() => ensureInitialized(resolvedTheme, themeVariables));
}

function cacheSvg(key, svg) {
  if (svgCache.has(key)) svgCache.delete(key);
  svgCache.set(key, svg);
  if (svgCache.size > MAX_CACHE_ENTRIES) {
    svgCache.delete(svgCache.keys().next().value);
  }
}

function replaceFragmentReference(value, oldId, nextId) {
  const escapedId = oldId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value.replace(new RegExp(`#${escapedId}(?![\\w:.-])`, 'g'), `#${nextId}`);
}

function instantiateSvg(svg) {
  if (!svg) return '';

  const template = document.createElement('template');
  template.innerHTML = svg.trim();
  const root = template.content.firstElementChild;
  if (!root) return svg;

  const suffix = `-wb-instance-${++svgInstanceSeq}`;
  const idMap = new Map();
  const nodes = [root, ...root.querySelectorAll('*')];

  nodes.forEach((node) => {
    if (!node.id) return;
    const nextId = `${node.id}${suffix}`;
    idMap.set(node.id, nextId);
    node.id = nextId;
  });

  nodes.forEach((node) => {
    for (const attr of Array.from(node.attributes || [])) {
      let value = attr.value;
      if (attr.name === 'aria-labelledby' || attr.name === 'aria-describedby') {
        value = value.split(/\s+/).map((token) => idMap.get(token) || token).join(' ');
      } else {
        for (const [oldId, nextId] of idMap) {
          value = replaceFragmentReference(value, oldId, nextId);
          if (value === oldId) value = nextId;
        }
      }
      if (value !== attr.value) node.setAttribute(attr.name, value);
    }
  });

  root.querySelectorAll('style').forEach((style) => {
    let css = style.textContent || '';
    for (const [oldId, nextId] of idMap) css = replaceFragmentReference(css, oldId, nextId);
    style.textContent = css;
  });

  return root.outerHTML;
}

export function renderMermaidSvg(source, { theme = activeTheme } = {}) {
  const src = String(source || '');
  if (!src.trim()) return Promise.resolve('');

  const resolvedTheme = normalizeTheme(theme);
  const key = cacheKey(resolvedTheme, src);
  if (svgCache.has(key)) return Promise.resolve(instantiateSvg(svgCache.get(key)));
  // 在入队前快照 CSS 变量，避免快速切换时队列读取到后一个主题的 DOM 值。
  const themeVariables = readThemeVariables(resolvedTheme);

  return enqueue(async () => {
    if (svgCache.has(key)) return instantiateSvg(svgCache.get(key));

    ensureInitialized(resolvedTheme, themeVariables);
    const id = `wb-mermaid-${Date.now()}-${++renderSeq}`;
    const result = await window.mermaid.render(id, src);
    const svg = (result && result.svg) || '';
    cacheSvg(key, svg);
    return instantiateSvg(svg);
  });
}

function collectTargets(root) {
  const targets = [];
  if (root.matches?.(RENDER_TARGET_SELECTOR)) targets.push(root);
  if (root.querySelectorAll) targets.push(...root.querySelectorAll(RENDER_TARGET_SELECTOR));

  return targets.filter((target, index) => {
    if (targets.indexOf(target) !== index) return false;
    if (target.closest?.('.typing-block-enter')) return false;
    const renderedAncestor = target.parentElement?.closest('[data-mermaid-rendered="1"]');
    return !renderedAncestor;
  });
}

function applyMermaidThemeVars(target, theme) {
  const svg = target.matches('pre code.lang-mermaid')
    ? target.closest('pre')?.nextElementSibling?.querySelector?.('svg')
    : target.querySelector?.('svg');
  if (!svg) return;
  const vars = THEME_TO_VARS[theme] || THEME_TO_VARS.light;
  svg.style.setProperty('background-color', vars.background);
  svg.style.color = vars.primaryTextColor;
  svg.querySelectorAll('[fill]:not([fill="none"]):not([fill^="url"])').forEach((el) => {
    const f = el.getAttribute('fill');
    if (f === 'currentColor') el.style.fill = vars.primaryTextColor;
  });
  svg.querySelectorAll('.node rect, .node circle, .node ellipse, .node polygon, .node path').forEach((el) => {
    if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') el.style.fill = vars.primaryColor;
    if (el.hasAttribute('stroke')) el.style.stroke = vars.primaryBorderColor;
  });
  svg.querySelectorAll('.edgePath path, .edge path, .flowchart-link').forEach((el) => {
    if (el.hasAttribute('stroke')) el.style.stroke = vars.lineColor;
  });
  svg.querySelectorAll('.cluster rect').forEach((el) => {
    if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') el.style.fill = vars.clusterBkg;
    if (el.hasAttribute('stroke')) el.style.stroke = vars.clusterBorder;
  });
  svg.querySelectorAll('.edgeLabel, .edgeLabel p, .label').forEach((el) => {
    el.style.color = vars.primaryTextColor;
    el.style.background = vars.edgeLabelBackground;
  });
  svg.querySelectorAll('.note, .noteText').forEach((el) => {
    if (el.hasAttribute('fill') && el.getAttribute('fill') !== 'none') el.style.fill = vars.noteBkgColor;
    if (el.hasAttribute('stroke')) el.style.stroke = vars.noteBorderColor;
    el.style.color = vars.noteTextColor;
  });
}

async function renderTarget(target, theme, force) {
  // 主题切换瞬间：先按新主题色即时覆盖旧 SVG，避免异步重绘前的闪白（中间区域拖尾感）。
  if (force) applyMermaidThemeVars(target, theme);

  const source = getMermaidSource(target);
  if (!source.trim()) return;
  if (!force && target.dataset.mermaidRendered === '1' && target.dataset.mermaidTheme === theme) return;

  const key = cacheKey(theme, source);
  const pending = elementRequests.get(target);
  if (!force && pending?.key === key) return pending.promise;

  const request = ++requestSeq;
  const record = { request, key, promise: null };
  const promise = (async () => {
    if (target.matches('pre code.lang-mermaid')) target.dataset.highlighted = 'skip';

    try {
      const svg = await renderMermaidSvg(source, { theme });
      const latest = elementRequests.get(target);
      if (latest?.request !== request || latest.key !== key) return;
      if (getMermaidSource(target) !== source) return;

      if (target.matches('pre code.lang-mermaid')) {
        const pre = target.closest('pre');
        if (!pre || !pre.contains(target)) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'wb-mermaid-svg';
        wrapper.innerHTML = svg;
        wrapper.dataset.mermaidRendered = '1';
        wrapper.dataset.mermaidTheme = theme;
        storeSource(wrapper, source);
        pre.replaceWith(wrapper);

        const body = wrapper.closest('.wb-card-body');
        if (body) {
          body.classList.remove('is-collapsible', 'is-collapsed');
          const expandBtn = body.querySelector('.wb-card-expand');
          if (expandBtn) expandBtn.style.display = 'none';
        }
        return;
      }

      target.innerHTML = svg;
      target.dataset.mermaidRendered = '1';
      target.dataset.mermaidTheme = theme;
      storeSource(target, source);
    } catch (error) {
      console.warn('[mermaid-render] render failed', error);
    } finally {
      if (elementRequests.get(target)?.request === request) {
        elementRequests.delete(target);
      }
    }
  })();

  record.promise = promise;
  elementRequests.set(target, record);
  return promise;
}

export function renderMermaidUnder(root = document, { theme = activeTheme, force = false } = {}) {
  if (!root) return Promise.resolve([]);
  const resolvedTheme = normalizeTheme(theme);
  return Promise.all(collectTargets(root).map((target) => renderTarget(target, resolvedTheme, force)));
}

function init() {
  setMermaidTheme(document.documentElement.dataset.theme);
  initializeMermaid().catch((error) => {
    console.warn('[mermaid-render] init failed', error);
  });
  renderMermaidUnder(document);
}

function handleThemeChange(event) {
  const theme = setMermaidTheme(event.detail?.theme || document.documentElement.dataset.theme);
  renderMermaidUnder(document, { theme, force: true }).catch((error) => {
    console.warn('[mermaid-render] theme redraw failed', error);
  });
}

window.addEventListener('wb:themechange', handleThemeChange);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 流式内容由 typewriter 在本批 DOM 完成后显式触发，避免半截源码被提前替换。
// 兼容已有 showcase 调用方；新模块应优先使用上面的 ES module API。
window.__wbRenderMermaid = (root) => renderMermaidUnder(root || document);
