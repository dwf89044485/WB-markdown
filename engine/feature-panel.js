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
import { state } from './player-state.js';
import { showClickIndicator } from './click-indicator.js';
import { openSheet, getFrames, renderStaticDetail, renderStaticSheet, setSheetBackState, renderDetailContent } from './sheet.js';
import { setStatusLineLabels, statusLineHTML, statusStackHTML } from './icons.js';
import { hideAllOverlays } from './overlay-registry.js';
import { renderShowcase } from './showcase-codeblock.js';
import { sleep } from './core.js';
import { runSlideTransition, renderAskQuestionHTML } from './ask-question.js';
import { SAMPLE_Q, defaultSampleAnswers } from '../features/ask-question.js';

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
  hideAllOverlays(true);
}

const ROOT_SELECTOR = '.design-notes-inner';

let rootEl = null;
let tabBarEl = null;
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
        <div class="fp-tab-bar" id="fpTabBar"></div>
      </nav>
      <div class="fp-content" id="fpContent">
        <div class="fp-scroll markdown-body" data-theme="light"></div>
      </div>
    </div>
  `;
  contentEl = rootEl.querySelector('#fpContent');
  tabBarEl = rootEl.querySelector('#fpTabBar');
  renderTabs();
}

function renderTabs() {
  const tabBar = rootEl.querySelector('#fpTabBar');
  const parts = featureList.map((f) => `
    <button type="button" class="fp-tab${f.type === 'overview' ? ' fp-tab-overview' : ''}" data-fp-id="${f.id}">
      ${f.label}
    </button>
  `);
  tabBar.innerHTML = parts.join('');
}

function bindEvents() {
  tabBarEl.addEventListener('click', (e) => {
    const tab = e.target.closest('.fp-tab');
    if (!tab) return;
    const id = tab.dataset.fpId;
    if (!id) return;

    const f = getFeature(id);
    if (!f) return;

    if (f.type === 'overview') {
      pushRoute('overview', null);
    } else {
      pushRoute('feature', f.id);
    }
  });

  // 锚点按钮事件代理（在 contentEl 上）
  contentEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.dc-btn[data-anchor]');
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
    const btn = e.target.closest('.dc-btn[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    // 操作按钮点击时，隐藏左侧所有覆层面板
    hideOverlays();
    if (action === 'running-state') {
      await goToStep(resolveNodeStep(0, 0));
      resumePlayback();
    } else if (action === 'completed-state') {
      await goToStep(Number.MAX_SAFE_INTEGER);
    } else if (action === 'disclosure-1') {
      // 第一层披露 → L1 结果层: 完成态 + 强制滚动到底
      await goToStep(Number.MAX_SAFE_INTEGER);
      const conv1 = document.querySelector('#conv');
      if (conv1) conv1.scrollTop = conv1.scrollHeight;
    } else if (action === 'disclosure-2') {
      // 第二层披露 → L2 执行过程层: 完成态 → 用户消息置顶 → 点击指示动画 → 展开执行过程
      await goToStep(Number.MAX_SAFE_INTEGER);
      const conv2 = document.querySelector('#conv');
      const userMsg2 = document.querySelector('#userMsgWrap');
      if (conv2 && userMsg2) {
        const navBar = conv2.querySelector('.nav-bar');
        const navHeight = navBar ? navBar.offsetHeight : 0;
        const scrollTarget = (userMsg2.offsetTop - conv2.offsetTop) - navHeight - 12;
        if (scrollTarget > 0) conv2.scrollTop = scrollTarget;
      }
      await sleep(200);
      // 点击指示点：从右屏幕外贴边飞入，落点在 target 中心左 60px
      await showClickIndicator(
        document.querySelector('#timingMount .timing-bar'),
        { from: 'right', endOffsetX: -80 }
      );
      toggleExec();
    } else if (action === 'disclosure-3') {
      // 第三层披露 → L3 浮层详情层:
      // 完成态 → 瞬间展开执行过程 + "执行命令"滚动到视口中央 → 指示点 → 拉起 Sheet
      await goToStep(Number.MAX_SAFE_INTEGER);

      // 瞬间展开执行过程（跳过 toggleExec 动画）
      const execArea = document.querySelector('#execArea');
      const timingArrow = document.querySelector('#timingArrow');
      if (execArea) {
        execArea.style.display = 'flex';
        execArea.style.maxHeight = '';
        execArea.style.transition = 'none';
      }
      if (timingArrow) timingArrow.className = 'timing-arrow';
      state.execOpen = true;

      // 瞬间将"执行命令"滚动到视口中央
      const conv3 = document.querySelector('#conv');
      const execBtn = Array.from(document.querySelectorAll('#stepsList .step-detail-link'))
        .find(btn => btn.textContent.includes('执行命令'));
      if (conv3 && execBtn) {
        const targetRect = execBtn.getBoundingClientRect();
        const convRect = conv3.getBoundingClientRect();
        conv3.scrollTop += (
          targetRect.top + targetRect.height / 2 -
          convRect.top - convRect.height / 2
        );
      }

      await showClickIndicator(execBtn, { from: 'right', endOffsetX: -100, endOffsetY: -20 });
      openSheet('F3.4a,F3.4b,F3.4c,F3.4d', '执行命令', { replay: false });
    } else if (action === 'disclosure-4') {
      // 第四层披露 → L4 原始细节层:
      // 完成态 → 瞬间展开 + 滚动"执行命令"到视口中央 → 一级 Sheet 常显 → 指示点引导 → 二级 Sheet
      await goToStep(Number.MAX_SAFE_INTEGER);

      // 瞬间展开执行过程
      const execArea4 = document.querySelector('#execArea');
      const timingArrow4 = document.querySelector('#timingArrow');
      if (execArea4) {
        execArea4.style.display = 'flex';
        execArea4.style.maxHeight = '';
        execArea4.style.transition = 'none';
      }
      if (timingArrow4) timingArrow4.className = 'timing-arrow';
      state.execOpen = true;

      // 瞬间将"执行命令"滚动到视口中央
      const conv4 = document.querySelector('#conv');
      const execBtn4 = Array.from(document.querySelectorAll('#stepsList .step-detail-link'))
        .find(btn => btn.textContent.includes('执行命令'));
      if (conv4 && execBtn4) {
        const targetRect = execBtn4.getBoundingClientRect();
        const convRect = conv4.getBoundingClientRect();
        conv4.scrollTop += (
          targetRect.top + targetRect.height / 2 -
          convRect.top - convRect.height / 2
        );
      }

      // 直接渲染一级 Sheet（无打开动画，初始即显示）
      const frames4 = getFrames('F3.4a,F3.4b,F3.4c,F3.4d');
      const allEvents = frames4.flatMap(f => f.events || []);
      const body4 = document.querySelector('#sheetBody');
      if (body4) {
        body4.innerHTML = renderStaticSheet(allEvents);
        body4.classList.remove('detail-mode');
        body4.scrollTop = 0;
      }
      const sheet4 = document.querySelector('#sheet');
      if (sheet4) {
        sheet4.classList.remove('expanded', 'detail-mode');
        sheet4.style.height = '';
      }
      const ov4 = document.querySelector('#overlay');
      if (ov4) {
        ov4.style.pointerEvents = 'auto';
        ov4.className = 'sheet-overlay vis show';
      }

      await sleep(50);

      // 指示点引导点击第一个 chevron
      const chevron = document.querySelector('#sheetBody .s-row-chevron');
      if (chevron) {
        await showClickIndicator(chevron, { from: 'right', endOffsetX: -40, container: document.querySelector('#overlay') });
      }

      // 获取 detail 数据，展示二级 Sheet
      let detail = null;
      for (const f of frames4) {
        if (f.events) {
          for (const ev of f.events) {
            if (ev.detail) { detail = ev.detail; break; }
          }
        }
        if (detail) break;
      }
      if (detail) {
        setSheetBackState('F3.4a,F3.4b,F3.4c,F3.4d', '执行命令');
        const body = document.querySelector('#sheetBody');
        if (body) {
          renderDetailContent(detail, body);
        }
      }
    } else if (action === 'ask-user') {
      const aqFeature = getFeature('ask-question');
      const anchor = aqFeature && aqFeature.anchors && aqFeature.anchors['single-appear'];
      if (anchor) await jumpToAnchor(anchor);
    } else if (action === 'request-permission') {
      const apFeature = getFeature('approve-permission');
      const anchor = apFeature && apFeature.anchors && apFeature.anchors['show-card'];
      if (anchor) await jumpToAnchor(anchor);
    } else if (action === 'infoarch-l1') {
      // L1 结果层: 完成态 + 强制滚动到底
      await goToStep(Number.MAX_SAFE_INTEGER);
      const conv1 = document.querySelector('#conv');
      if (conv1) conv1.scrollTop = conv1.scrollHeight;
    } else if (action === 'infoarch-l2') {
      // L2 执行过程层: 完成态 → 用户消息置顶 → 点击指示动画 → 展开执行过程
      await goToStep(Number.MAX_SAFE_INTEGER);
      const conv2 = document.querySelector('#conv');
      const userMsg2 = document.querySelector('#userMsgWrap');
      if (conv2 && userMsg2) {
        const navBar = conv2.querySelector('.nav-bar');
        const navHeight = navBar ? navBar.offsetHeight : 0;
        const scrollTarget = (userMsg2.offsetTop - conv2.offsetTop) - navHeight - 12;
        if (scrollTarget > 0) conv2.scrollTop = scrollTarget;
      }
      await sleep(200);
      await showClickIndicator(
        document.querySelector('#timingMount .timing-bar'),
        { from: 'right', endOffsetX: -80 }
      );
      toggleExec();
    } else if (action === 'infoarch-l3') {
      // L3 浮层详情层:
      // 完成态 → 瞬间展开执行过程 + "执行命令"滚动到视口中央 → 指示点 → 拉起 Sheet
      await goToStep(Number.MAX_SAFE_INTEGER);
      const execArea3 = document.querySelector('#execArea');
      const timingArrow3 = document.querySelector('#timingArrow');
      if (execArea3) {
        execArea3.style.display = 'flex';
        execArea3.style.maxHeight = '';
        execArea3.style.transition = 'none';
      }
      if (timingArrow3) timingArrow3.className = 'timing-arrow';
      state.execOpen = true;
      const conv3 = document.querySelector('#conv');
      const execBtn3 = Array.from(document.querySelectorAll('#stepsList .step-detail-link'))
        .find(btn => btn.textContent.includes('执行命令'));
      if (conv3 && execBtn3) {
        const targetRect = execBtn3.getBoundingClientRect();
        const convRect = conv3.getBoundingClientRect();
        conv3.scrollTop += (
          targetRect.top + targetRect.height / 2 -
          convRect.top - convRect.height / 2
        );
      }
      await showClickIndicator(execBtn3, { from: 'right', endOffsetX: -100, endOffsetY: -20 });
      openSheet('F3.4a,F3.4b,F3.4c,F3.4d', '执行命令', { replay: false });
    } else if (action === 'infoarch-l4') {
      // L4 原始细节层:
      // 完成态 → 瞬间展开 + 滚动"执行命令"到视口中央 → 一级 Sheet 常显 → 指示点引导 → 二级 Sheet
      await goToStep(Number.MAX_SAFE_INTEGER);
      const execArea4 = document.querySelector('#execArea');
      const timingArrow4 = document.querySelector('#timingArrow');
      if (execArea4) {
        execArea4.style.display = 'flex';
        execArea4.style.maxHeight = '';
        execArea4.style.transition = 'none';
      }
      if (timingArrow4) timingArrow4.className = 'timing-arrow';
      state.execOpen = true;
      const conv4 = document.querySelector('#conv');
      const execBtn4 = Array.from(document.querySelectorAll('#stepsList .step-detail-link'))
        .find(btn => btn.textContent.includes('执行命令'));
      if (conv4 && execBtn4) {
        const targetRect = execBtn4.getBoundingClientRect();
        const convRect = conv4.getBoundingClientRect();
        conv4.scrollTop += (
          targetRect.top + targetRect.height / 2 -
          convRect.top - convRect.height / 2
        );
      }
      const frames4 = getFrames('F3.4a,F3.4b,F3.4c,F3.4d');
      const allEvents = frames4.flatMap(f => f.events || []);
      const body4 = document.querySelector('#sheetBody');
      if (body4) {
        body4.innerHTML = renderStaticSheet(allEvents);
        body4.classList.remove('detail-mode');
        body4.scrollTop = 0;
      }
      const sheet4 = document.querySelector('#sheet');
      if (sheet4) {
        sheet4.classList.remove('expanded', 'detail-mode');
        sheet4.style.height = '';
      }
      const ov4 = document.querySelector('#overlay');
      if (ov4) {
        ov4.style.pointerEvents = 'auto';
        ov4.className = 'sheet-overlay vis show';
      }
      await sleep(50);
      const chevron = document.querySelector('#sheetBody .s-row-chevron');
      if (chevron) {
        await showClickIndicator(chevron, { from: 'right', endOffsetX: -40, container: document.querySelector('#overlay') });
      }
      let detail = null;
      for (const f of frames4) {
        if (f.events) {
          for (const ev of f.events) {
            if (ev.detail) { detail = ev.detail; break; }
          }
        }
        if (detail) break;
      }
      if (detail) {
        setSheetBackState('F3.4a,F3.4b,F3.4c,F3.4d', '执行命令');
        const body = document.querySelector('#sheetBody');
        if (body) {
          renderDetailContent(detail, body);
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
  const scrollEl = contentEl.querySelector('.fp-scroll');
  scrollEl.innerHTML = f.content;

  // 给 .fp-snapshot 加 md class，复用 markdown.css 中 .md .wb-card 全套样式
  scrollEl.querySelectorAll('.fp-snapshot').forEach((el) => el.classList.add('md'));

  // 将内容移入内层容器，max-width 约束加在内层上，不受滚动条影响
  let inner = scrollEl.querySelector('.fp-scroll-inner');
  if (!inner) {
    inner = document.createElement('div');
    inner.className = 'fp-scroll-inner';
    while (scrollEl.firstChild) {
      inner.appendChild(scrollEl.firstChild);
    }
    scrollEl.appendChild(inner);
  }

  // 自适应约束：同步测量 .fp-snapshot-row 卡片的自然平铺宽度
  constrainContentWidth(scrollEl, inner);

  // 渲染 Mermaid 流程图
  if (window.mermaid) {
    Promise.resolve().then(() => {
      mermaid.run({ nodes: scrollEl.querySelectorAll('.mermaid') }).catch(console.warn);
    });
  }

  // 代码块语法高亮（与 Demo 区一致：跳过 mermaid，其余调 hljs.highlightElement）
  if (window.hljs) {
    scrollEl.querySelectorAll('pre code').forEach((el) => {
      if (el.classList.contains('lang-mermaid') || el.dataset.highlighted) return;
      try { window.hljs.highlightElement(el); } catch (e) { /* ignore */ }
    });
  }

  // 同步导航激活态
  tabBarEl.querySelectorAll('.fp-tab').forEach((t) => {
    t.classList.toggle('is-active', t.dataset.fpId === f.id);
  });

  // 滚动到顶
  if (scrollEl) scrollEl.scrollTop = 0;

  // 切换 feature 时清理所有覆层面板
  hideOverlays();

  // 切换 feature 时清理上一 feature 的循环动画
  stopTcnModeLoop();
  stopAqSlideCycleLoop();

  // 清理代码块 showcase 残留（切到非 code-block feature 时执行）
  const showcaseMount = document.getElementById('showcaseMount');
  if (showcaseMount) {
    showcaseMount.remove();
    // 恢复 #userMsgWrap / #agentMsg 的初始隐藏态，由后续 goToStep 重新控制显隐
    ['userMsgWrap', 'agentMsg'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.add('is-hidden');
    });
  }

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
    // 启动 §5 切题滑切循环（升降循环由 CSS 自驱）
    startAqSlideCycleLoop();
  } else if (f.id === 'approve-permission') {
    const anchor = f.anchors && f.anchors['show-card'];
    if (anchor) {
      anchor.isApprovePermission = true;
      jumpToAnchor(anchor).then(() => {
        if (token !== loadToken) hideOverlays();
      });
    }
  } else if (f.id === 'tool-call-node') {
    // 跳到 n1 第一个 statusGroup 起点，让左侧 demo 展示一组工具调用节点
    const targetStep = resolveNodeStep(0, 1);
    goToStep(targetStep).catch(() => {});
    // 启动「设计样式」章节的 3 模式同步循环
    startTcnModeLoop();
  } else if (f.id === 'code-block') {
    // 左侧 Demo 渲染代码块 showcase，并高亮「代码块样式」场景按钮
    renderShowcase();
    document.querySelectorAll('.dc-scene-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.scene === 'codeblock-showcase');
    });
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

// ── AskQuestion §5.2 切题滑切循环演示 ──────────
// 不重写动画 —— 调用 engine/ask-question.js 的 runSlideTransition()，
// 与左侧 Demo 真实切题共用同一份滑切实现。
// 循环：q1 停 1s → 滑到 q2 → … → q4 停 1s → 倒滑回 q1 → 继续。
let aqSlideCycleTimer = null;
const AQ_SLIDE_HOLD_MS = 1000;
const AQ_SLIDE_ANIM_MS = 320;

function startAqSlideCycleLoop() {
  stopAqSlideCycleLoop();
  if (!contentEl) return;
  const stages = contentEl.querySelectorAll('[data-motion-loop="slide-cycle"]');
  if (!stages.length) return;

  // 每个 stage 维护自己的 stepIndex
  const states = Array.from(stages).map(stage => ({
    stage,
    stepIndex: 0,
    answers: defaultSampleAnswers(),
  }));

  function tick() {
    states.forEach(st => {
      const card = st.stage.querySelector('.ask-question-card');
      if (!card) return;

      // 计算下一题 + 方向：4→1 走 backward 一气滑回，避免视觉跳跃
      const total = SAMPLE_Q.length;
      const wasLast = st.stepIndex === total - 1;
      const nextIdx = wasLast ? 0 : st.stepIndex + 1;
      const direction = wasLast ? 'backward' : 'forward';

      // 生成新题 body HTML（与 goToStep 同源）
      const fullHTML = renderAskQuestionHTML(SAMPLE_Q, nextIdx, st.answers, { mode: 'static' });
      const tmp = document.createElement('div');
      tmp.innerHTML = fullHTML;
      const newBody = tmp.querySelector('.aq-body');
      if (!newBody) return;
      const newBodyHTML = newBody.innerHTML;

      // 同步顶栏 step 数字
      const stepEl = card.querySelector('.aq-step-indicator');
      if (stepEl) stepEl.textContent = `${nextIdx + 1} / ${total}`;

      // 调用真组件的滑切函数 —— 全项目唯一动画实现
      runSlideTransition(card, newBodyHTML, direction, () => {
        // 动画结束后，把 track 还原为单 body 结构，让下一轮可继续
        const track = card.querySelector('.aq-slide-track');
        if (track) {
          const body = document.createElement('div');
          body.className = 'aq-body';
          body.innerHTML = newBodyHTML;
          track.replaceWith(body);
        }
      });

      st.stepIndex = nextIdx;
    });

    aqSlideCycleTimer = setTimeout(tick, AQ_SLIDE_HOLD_MS + AQ_SLIDE_ANIM_MS);
  }

  // 首次：稳定后等 1 秒再开始切
  aqSlideCycleTimer = setTimeout(tick, AQ_SLIDE_HOLD_MS);
}

function stopAqSlideCycleLoop() {
  if (aqSlideCycleTimer) {
    clearTimeout(aqSlideCycleTimer);
    aqSlideCycleTimer = null;
  }
}

/* ── 内容宽度自适应约束 ──────────────────────────────────────
 * 渲染完成后同步测量 .fp-snapshot-row 中卡片的自然平铺宽度
 * （所有卡片自身宽度 + gap 之和），以及 .fp-snapshot-side
 * 左右并排布局的宽度，以此约束内层容器 max-width。
 * 约束加在 .fp-scroll-inner（内层）而非 .fp-scroll（外层），
 * 避免滚动条吃掉可用宽度导致非预期折行。
 * 大屏时不拉宽，小屏时自动折行，首次绘制即生效，无闪动。
 */
function constrainContentWidth(scrollEl, inner) {
  // 强制重排
  scrollEl.offsetHeight;

  let maxNatural = 0;
  const rows = inner.querySelectorAll('.fp-snapshot-row');
  rows.forEach((row) => {
    const fd = window.getComputedStyle(row).flexDirection;
    if (fd !== 'row') return;

    const wraps = row.querySelectorAll(':scope > .fp-snapshot-wrap');
    if (wraps.length < 2) return;

    // 只测量第一行可见的卡片（offsetTop 相同的为同一行）
    const firstTop = wraps[0].offsetTop;
    let sum = 0;
    let visibleCount = 0;
    wraps.forEach((w) => {
      if (w.offsetTop === firstTop) {
        sum += w.getBoundingClientRect().width;
        visibleCount++;
      }
    });

    const gap = parseInt(window.getComputedStyle(row).columnGap) || 30;
    const natural = sum + gap * (visibleCount - 1);
    if (natural > maxNatural) maxNatural = Math.ceil(natural) + 2;
  });

  const targetWidth = Math.max(maxNatural, 840);
  inner.style.setProperty('--fp-max-content-width', targetWidth + 'px');
}