// ============================================================
// FEATURE PANEL — 主控
// ============================================================
// 启动时：
//   1. 从 features/index.js 拿注册的 feature list
//   2. 渲染下拉菜单
//   3. 读 URL，渲染对应 feature 内容
//   4. 监听路由变化（router.onChange）→ 重新渲染
//   5. 监听锚点按钮点击（事件代理）→ 调 jumpToAnchor
// ============================================================

import { featureList, getFeature } from '../features/index.js';
import { parseURL, pushRoute, onChange as onRouteChange } from './feature-router.js';
import { jumpToAnchor } from './feature-jump.js';

const ROOT_SELECTOR = '.design-notes-inner';

let rootEl = null;
let navMenuEl = null;
let contentEl = null;
let currentFeature = null;

export function initFeaturePanel() {
  rootEl = document.querySelector(ROOT_SELECTOR);
  if (!rootEl) {
    console.warn('[feature-panel] root not found');
    return;
  }

  // 屏宽 < 600 不初始化（spec 第三节 + 第五节 2）
  if (window.matchMedia('(max-width: 599px)').matches) {
    rootEl.innerHTML = '';
    return;
  }

  buildShell();
  bindEvents();

  // 初次渲染
  renderRoute(parseURL());
  onRouteChange(renderRoute);
}

function buildShell() {
  rootEl.innerHTML = `
    <div class="fp-root">
      <nav class="fp-nav">
        <button class="fp-nav-trigger" type="button" id="fpNavTrigger">
          <span id="fpNavTriggerLabel">设计思考（总览）</span>
        </button>
        <div class="fp-nav-menu" id="fpNavMenu" role="menu"></div>
      </nav>
      <div class="fp-content md" id="fpContent"></div>
    </div>
  `;
  navMenuEl = rootEl.querySelector('#fpNavMenu');
  contentEl = rootEl.querySelector('#fpContent');
  renderMenu();
}

function renderMenu() {
  const overview = featureList.filter((f) => f.type === 'overview');
  const features = featureList.filter((f) => f.type === 'feature');

  const itemHtml = (f) => `
    <button type="button" class="fp-nav-item" data-fp-id="${f.id}" role="menuitem">
      ${f.label}
    </button>
  `;

  const parts = [];
  overview.forEach((f) => parts.push(itemHtml(f)));
  if (overview.length && features.length) {
    parts.push('<div class="fp-nav-divider" role="separator"></div>');
  }
  features.forEach((f) => parts.push(itemHtml(f)));

  navMenuEl.innerHTML = parts.join('');
}

function bindEvents() {
  const trigger = rootEl.querySelector('#fpNavTrigger');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenuEl.classList.toggle('is-open');
    trigger.classList.toggle('is-open');
  });

  document.addEventListener('click', (e) => {
    if (!navMenuEl.contains(e.target) && !trigger.contains(e.target)) {
      navMenuEl.classList.remove('is-open');
      trigger.classList.remove('is-open');
    }
  });

  navMenuEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.fp-nav-item');
    if (!btn) return;
    const id = btn.dataset.fpId;
    if (!id) return;

    const f = getFeature(id);
    if (!f) return;

    navMenuEl.classList.remove('is-open');
    trigger.classList.remove('is-open');

    if (f.type === 'overview') {
      pushRoute('overview', null);
    } else {
      pushRoute('feature', f.id);
    }
  });

  // 锚点按钮事件代理（在 contentEl 上）
  contentEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.fp-anchor-btn');
    if (!btn) return;
    const anchorId = btn.dataset.anchor;
    if (!anchorId || !currentFeature) return;

    const anchor = currentFeature.anchors && currentFeature.anchors[anchorId];
    if (!anchor) {
      console.warn('[feature-panel] unknown anchor', anchorId);
      return;
    }

    jumpToAnchor(anchor);
  });

  // 屏宽变化：跨过 600 边界时重新初始化
  const mq = window.matchMedia('(max-width: 599px)');
  mq.addEventListener('change', () => {
    initFeaturePanel();
  });
}

function renderRoute(route) {
  let f;
  if (route.view === 'overview') {
    f = getFeature('overview') || featureList[0];
  } else {
    f = getFeature(route.id);
    // 边界：未知 id 回退 overview（spec 第五节 2）
    if (!f) {
      pushRoute('overview', null);
      return;
    }
  }

  currentFeature = f;
  contentEl.innerHTML = f.content;

  // 同步 trigger label
  const labelEl = rootEl.querySelector('#fpNavTriggerLabel');
  if (labelEl) labelEl.textContent = f.label;

  // 同步导航激活态
  navMenuEl.querySelectorAll('.fp-nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.fpId === f.id);
  });

  // 滚动到顶
  contentEl.scrollTop = 0;
}
