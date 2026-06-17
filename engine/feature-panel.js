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
import { goToStep, resolveNodeStep, resumePlayback } from './player.js';
import { openSheet } from './sheet.js';
import { setStatusLineLabels, statusLineHTML, statusStackHTML } from './icons.js';
import { hideAskQuestion } from './ask-question.js';
import { hideApprovePermission } from './approve-permission.js';

// ════════════════════════════════════════════════════════════════
// 覆层面板清理（hideOverlays）
// 左侧 Demo 区内会弹出各种覆层面板（askUser 问答卡片、approvePermission
// 批准权限卡片、后加的其他面板等）。当用户从右侧交互说明面板触发任何
// 导航行为（点锚点按钮 / 操作按钮 / 切换 feature）时，必须清理所有覆
// 层面板，避免多个面板同时残留。
//
// 新增面板类型 → 在此函数中追加 hideXxx() 调用，保证多面板上下文也能
// 正确清理。
// ════════════════════════════════════════════════════════════════
function hideOverlays() {
  hideAskQuestion();
  hideApprovePermission();
}

const ROOT_SELECTOR = '.design-notes-inner';

let rootEl = null;
let navMenuEl = null;
let contentEl = null;
let currentFeature = null;
let loadToken = 0;

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
        <span class="fp-section-label">交互说明</span>
        <button class="fp-nav-trigger" type="button" id="fpNavTrigger">
          <span class="fp-trigger-label" id="fpNavTriggerLabel">设计思考（总览）</span>
        </button>
        <div class="fp-nav-menu" id="fpNavMenu" role="menu"></div>
      </nav>
      <div class="fp-content markdown-body" id="fpContent" data-theme="light"></div>
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

    // 点在侧边栏，隐藏左侧所有覆层面板
    hideOverlays();

    jumpToAnchor(anchor);
  });

  // 操作按钮事件代理（在 contentEl 上）
  contentEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('.fp-action-btn');
    if (!btn) return;

    const action = btn.dataset.action;

    // 操作按钮点击时，隐藏左侧所有覆层面板
    hideOverlays();
    if (action === 'running-state') {
      await goToStep(resolveNodeStep(0, 0));
      resumePlayback();
    } else if (action === 'completed-state' || action === 'disclosure-1') {
      await goToStep(Number.MAX_SAFE_INTEGER);
    } else if (action === 'disclosure-2') {
      await goToStep(resolveNodeStep(0, 3));
      // 让最后一条状态行处于"正在搜索网页"的扫光状态
      const cont = document.querySelector('#stepsList .flat-container');
      const last = cont && cont.querySelector('.step-detail-link:last-child');
      if (last) {
        setStatusLineLabels(last, ['正在搜索网页']);
        last.classList.add('is-running');
      }
    } else if (action === 'disclosure-3') {
      await goToStep(resolveNodeStep(0, 3));
      openSheet('F1.c,F1.d,F1.e,F1.f,F1.g,F1.h,F1.i', '搜索网页、更新待办');
    } else if (action === 'ask-user') {
      const aqFeature = getFeature('ask-question');
      const anchor = aqFeature && aqFeature.anchors && aqFeature.anchors['single-appear'];
      if (anchor) await jumpToAnchor(anchor);
    } else if (action === 'request-permission') {
      const apFeature = getFeature('approve-permission');
      const anchor = apFeature && apFeature.anchors && apFeature.anchors['show-card'];
      if (anchor) await jumpToAnchor(anchor);
    }
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

  // 渲染 Mermaid 流程图
  if (window.mermaid) {
    Promise.resolve().then(() => {
      mermaid.run({ nodes: contentEl.querySelectorAll('.mermaid') }).catch(console.warn);
    });
  }

  // 同步 trigger label
  const labelEl = rootEl.querySelector('#fpNavTriggerLabel');
  if (labelEl) labelEl.textContent = f.label;

  // 同步导航激活态
  navMenuEl.querySelectorAll('.fp-nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.fpId === f.id);
  });

  // 滚动到顶
  contentEl.scrollTop = 0;

  // 切换 feature 时清理所有覆层面板
  hideOverlays();

  // 切换 feature 时清理上一 feature 的循环动画
  stopTcnModeLoop();

  // 切换到特定 feature 时，左侧 Demo 自动跳转到对应状态
  loadToken++;
  const token = loadToken;

  if (f.id === 'principles' || f.id === 'info-arch') {
    goToStep(Number.MAX_SAFE_INTEGER);
  } else if (f.id === 'ask-question') {
    const anchor = f.anchors && f.anchors['single-appear'];
    if (anchor) {
      jumpToAnchor(anchor).then(() => {
        // 如果跳转过程中 feature 已被切换，清除残留的面板
        if (token !== loadToken) hideOverlays();
      });
    }
  } else if (f.id === 'tool-call-node') {
    // 跳到 n1 第一个 statusGroup 起点，让左侧 demo 展示一组工具调用节点
    const targetStep = resolveNodeStep(0, 1);
    goToStep(targetStep).catch(() => {});
    // 启动「设计样式」章节的 3 模式同步循环
    startTcnModeLoop();
  }
}

// ── Tool Call Node「设计样式」3 模式同步循环 ──────────
// 所有块同时 running（带扫光）→ 同时 done（stack 折叠）→ 循环
// 标签与 features/tool-call-node.js 的 M_RUN / M_DONE 保持一致
let tcnModeLoopTimer = null;
const TCN_RUN_LABELS  = ['正在搜索网页', '正在创建文件', '正在读取文件'];
const TCN_DONE_LABELS = ['搜索网页',     '创建文件',     '读取文件'];   // drop 正在，不加 已
const TCN_PHASE_MS = 2500;

function startTcnModeLoop() {
  stopTcnModeLoop();
  const blocks = contentEl.querySelectorAll('.fp-tcn-mode-demo');
  if (!blocks.length) return;

  let running = true; // 初始为 running（与 HTML 初始 is-running 类一致）

  function tick() {
    running = !running;
    blocks.forEach(block => {
      const line = block.querySelector('.fp-tcn-mode-line');
      if (!line) return;
      const mode = block.dataset.mode;
      if (running) {
        line.innerHTML = statusLineHTML(TCN_RUN_LABELS);
        line.classList.add('is-running');
      } else {
        if (mode === '堆叠') {
          line.innerHTML = statusStackHTML(TCN_DONE_LABELS) + '<span class="status-chevron">›</span>';
        } else {
          line.innerHTML = statusLineHTML(TCN_DONE_LABELS);
        }
        line.classList.remove('is-running');
      }
    });
  }

  tcnModeLoopTimer = setInterval(tick, TCN_PHASE_MS);
}

function stopTcnModeLoop() {
  if (tcnModeLoopTimer) {
    clearInterval(tcnModeLoopTimer);
    tcnModeLoopTimer = null;
  }
}
