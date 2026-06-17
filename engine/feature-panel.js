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
import { goToStep, resolveNodeStep, resumePlayback, toggleExec } from './player.js';
import { openSheet } from './sheet.js';
import { setStatusLineLabels, statusLineHTML, statusStackHTML } from './icons.js';
import { hideAllOverlays } from './overlay-registry.js';
import { sleep } from './core.js';

// ════════════════════════════════════════════════════════════════
// 覆层面板清理（hideOverlays）
// 左侧 Demo 区内会弹出各种覆层面板（askUser 问答卡片、approvePermission
// 批准权限卡片等）。当用户从右侧交互说明面板触发任何导航行为
// （点锚点按钮 / 操作按钮 / 切换 feature）时，必须清理所有覆层面板。
//
// 使用统一注册表（overlay-registry.js）而非手动枚举，新增面板类型只需
// 在面板模块中 registerOverlayCleanup(hideXxx)，此处无需修改。
// ════════════════════════════════════════════════════════════════
function hideOverlays() {
  hideAllOverlays();
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
    } else if (action === 'infoarch-l0') {
      // L0: 对话流完成态
      await goToStep(Number.MAX_SAFE_INTEGER);
    } else if (action === 'infoarch-l1') {
      // L1: 完成态 + 展开执行过程 + 定位到"执行命令"状态行
      await goToStep(Number.MAX_SAFE_INTEGER);
      toggleExec();
      await sleep(100);
      const execLines = document.querySelectorAll('#stepsList .step-detail-link');
      for (const line of execLines) {
        const labels = line.dataset.labels;
        if (labels && labels.includes('执行命令')) {
          line.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    } else if (action === 'infoarch-l2') {
      // L2: 完成态 + 展开执行过程 + 拉起"执行命令"Sheet
      await goToStep(Number.MAX_SAFE_INTEGER);
      toggleExec();
      await sleep(100);
      openSheet('F3.4a,F3.4b,F3.4c,F3.4d', '执行命令');
    } else if (action === 'infoarch-l3') {
      // L3: 完成态 + 展开执行过程 + 拉起Sheet + 进入二级详情
      await goToStep(Number.MAX_SAFE_INTEGER);
      toggleExec();
      await sleep(100);
      await openSheet('F3.4a,F3.4b,F3.4c,F3.4d', '执行命令');
      await sleep(100);
      // 找到第一个带 detail 的事件行，点击进入二级 sheet
      const rows = document.querySelectorAll('#sheetBody .s-row');
      for (const row of rows) {
        if (row._sheetDetail) {
          row.click();
          break;
        }
      }
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

// ── Tool Call Node「设计样式」顺序播放 ──────────
// 模拟逐条执行过程：Phase 1→2→3→4→5→循环
// Phase 1: 第 1 条 running
// Phase 2: 第 1 条 done + 第 2 条 running
// Phase 3: 第 1-2 条 done + 第 3 条 running
// Phase 4: 全部 done
// Phase 5: stack 折叠为图标堆；flat/card 保持不变
// 标签与 features/tool-call-node.js 的 M_RUN / M_DONE 保持一致
let tcnModeLoopTimer = null;
const TCN_PHASES = [
  { labels: ['正在搜索网页'],            isRunning: true, ms: 1000 },
  { labels: ['搜索网页', '正在创建文件'],   isRunning: true, ms: 1000 },
  { labels: ['搜索网页', '创建文件', '正在读取文件'], isRunning: true, ms: 1000 },
  { labels: ['搜索网页', '创建文件', '读取文件'],       isRunning: false, ms: 3000 },
  // phase 4 是标准全部完成；之后追加一个折叠 phase（仅 stack）
];
const TCN_STACK_LABELS = ['搜索网页', '创建文件', '读取文件'];
const TCN_COMPLETED_MS = 3000; // 完成态停留时长（包括 stack 折叠）

function startTcnModeLoop() {
  stopTcnModeLoop();
  const blocks = contentEl.querySelectorAll('.fp-tcn-mode-demo');
  if (!blocks.length) return;

  let phaseIndex = 0;

  function applyPhase(phase) {
    blocks.forEach(block => {
      const line = block.querySelector('.fp-tcn-mode-line');
      if (!line) return;
      const isStack = line.classList.contains('tcn-stack-mode');

      if (phase === null) {
        // 折叠阶段：仅 stack 模式改变，flat/card 保持不变
        if (isStack) {
          line.innerHTML = statusStackHTML(TCN_STACK_LABELS) + '<span class="status-chevron">›</span>';
          line.classList.remove('is-running');
        }
        return;
      }

      if (phase.isRunning) {
        line.innerHTML = statusLineHTML(phase.labels);
        line.classList.add('is-running');
      } else {
        if (isStack) {
          line.innerHTML = statusStackHTML(TCN_STACK_LABELS) + '<span class="status-chevron">›</span>';
        } else {
          line.innerHTML = statusLineHTML(phase.labels);
        }
        line.classList.remove('is-running');
      }
    });
  }

  function scheduleNext() {
    if (phaseIndex < TCN_PHASES.length) {
      const phase = TCN_PHASES[phaseIndex];
      applyPhase(phase);
      phaseIndex++;
      tcnModeLoopTimer = setTimeout(() => {
        if (phaseIndex >= TCN_PHASES.length) {
          // 已完成态显示完后，追加 stack 折叠
          applyPhase(null);
          // 让折叠状态也停留相同时长再循环
          tcnModeLoopTimer = setTimeout(() => {
            phaseIndex = 0;
            scheduleNext();
          }, TCN_COMPLETED_MS);
        } else {
          scheduleNext();
        }
      }, phase.ms);
    }
  }

  scheduleNext();
}

function stopTcnModeLoop() {
  if (tcnModeLoopTimer) {
    clearTimeout(tcnModeLoopTimer);
    tcnModeLoopTimer = null;
  }
}
