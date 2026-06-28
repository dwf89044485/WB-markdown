// ============================================================
// SHEET — 底部浮层交互逻辑设计文档
// ============================================================
// 第一优先级：sheet 本身的交互逻辑（40%/80%状态、出现/消失、拖拽、动效）
// 不涉及 sheet 内部具体内容渲染（事件行、待办、二级详情等）
// 快照：由 engine/sheet.js 的 renderStaticSheetShell() 实时渲染
//       改左边 sheet 样式 → 右边文档自动同步
// ============================================================

import { renderStaticSheetShell, renderStaticDetail, renderEvent, renderTodo, getFrames, computeTodoSnapshot } from '../engine/sheet.js';
import { renderStaticCodeSheetShell } from '../engine/code-fullscreen-sheet.js';

// ── 快照缓存 ──────────────────────────────────
const snapCache = {};
function snap(key, opts) {
  if (!snapCache[key]) snapCache[key] = renderStaticSheetShell(opts);
  return snapCache[key];
}

// ── 从真实 scenario 帧数据渲染事件 Sheet 内容（复用 demo 渲染链路）──
function renderEventSheetBody(frameRefs) {
  const scenario = window.WORKBUDDY_SCENARIO;
  const frames = getFrames(frameRefs);
  if (!frames.length) return '';

  // 渲染事件行（去重，与 demo 的 streamSheetContent 逻辑一致）
  const seenKeys = new Set();
  let html = '';
  for (const f of frames) {
    if (f.events) {
      for (const ev of f.events) {
        const key = `${ev.icon || ''}|${ev.text || ''}|${ev.dim || ''}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        html += renderEvent(ev).outerHTML;
      }
    }
  }

  // 待办快照：computeTodoSnapshot 与 demo 的 streamSheetContent 共用同一逻辑
  const baseline = scenario.todosBaseline || [];
  const todoItems = computeTodoSnapshot(frames, baseline);
  html += todoItems.map(t => renderTodo(t).outerHTML).join('');

  return html;
}

// ── Code sheet 样本 ──
const CODE_SAMPLE = `// 计算当日营养摄入汇总
function calcDailyNutrition(data) {
  const totals = data.meals.reduce((acc, meal) => {
    meal.items.forEach(item => {
      acc.calories += item.calories;
      acc.protein += item.protein;
    });
    return acc;
  }, { calories: 0, protein: 0 });
  return totals;
}`;

// ── 二级 sheet 样本 ──
const SHEET_DETAIL = {
  title: '执行命令',
  sections: [
    { label: '输入命令', variant: 'code', content: 'git diff --stat HEAD~3' },
    { label: '输出结果', variant: 'text', content: 'features/sheet.js | 2 +-\n1 file changed, 1 insertion(+), 1 deletion(-)' },
    { label: '退出码', variant: 'text', content: '0' },
  ],
};

function getSnapshots() {
  return {
    // §2 构成：事件 Sheet（创建代办示例）
    // 直接使用 scenario.sheetFrames 真实帧数据 + renderStaticSheetShell
    anatomyEvent: snap('anatomyEvent', {
      state: 'collapsed',
      body: renderEventSheetBody('F1.a,F1.b'),
      width: '393px',
      height: '852px',
      borderRadius: '0',
      frameCls: 'fp-show-overlay',
    }),
    // §2 构成：事件 Sheet 二级详情（作为附件对照展示）
    anatomyDetail: renderStaticDetail(SHEET_DETAIL),
    // §2 构成：代码 Sheet（带遮罩）
    anatomyCode: renderStaticCodeSheetShell({ lang: 'javascript', code: CODE_SAMPLE, width: '393px' }),
    // §3 状态对比
    stateCollapsed: snap('stateCollapsed', {
      state: 'collapsed',
      body: '<div class="sheet-empty" style="padding:30px 20px;text-align:center;color:#86868b;font-size:13px">40% · 内容超限被裁剪</div>',
      width: '340px',
      height: '850px',
      borderRadius: '0',
    }),
    stateExpanded: snap('stateExpanded', {
      state: 'expanded',
      body: '<div class="sheet-empty" style="padding:50px 20px;text-align:center;color:#86868b;font-size:13px">80% · 内容可滚动</div>',
      width: '340px',
      height: '850px',
      borderRadius: '0',
    }),
    // §5 动效：进入循环（从底部升起）
    motionRiseFall: snap('motionRiseFall', {
      state: 'collapsed',
      showClose: false,
      showOverlay: true,
      body: '<div class="sheet-empty" style="padding:30px 20px;text-align:center;color:#86868b;font-size:13px">底部浮层升起</div>',
      width: '340px',
      height: '850px',
      borderRadius: '0',
    }),
    // §5 动效：展开循环（40% → 80%）
    motionExpand: snap('motionExpand', {
      state: 'collapsed',
      showClose: false,
      showOverlay: false,
      body: '<div class="sheet-empty" style="padding:40px 20px;text-align:center;color:#86868b;font-size:13px">上拖展开</div>',
      width: '340px',
      height: '850px',
      borderRadius: '0',
    }),
    // §6 边界：空状态
    edgeEmpty: snap('edgeEmpty', {
      state: 'collapsed',
      body: '<div class="sheet-empty">当前状态暂无新增事件。</div>',
      width: '340px',
      height: '850px',
      borderRadius: '0',
    }),
  };
}

// ── 辅助：带标签的快照块 ──────────────────────────
function labeled(label, html, btnAnchor, desc) {
  const btn = btnAnchor
    ? `<button class="fp-anchor-btn" data-anchor="${btnAnchor}" style="margin-left:auto;font-size:12px;padding:5px 10px">查看示例</button>`
    : '';
  const descHtml = desc ? `<span style="color:#86868b;font-size:13px">${desc}</span>` : '';
  const rightPart = descHtml + btn;
  return `<div class="fp-snapshot-wrap"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span class="tag">${label}</span>${rightPart}</div><div class="fp-snapshot">${html}</div></div>`;
}

export default {
  id: 'sheet',
  type: 'feature',
  label: '底部浮层 Sheet',
  anchors: {},
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>底部浮层 Sheet</h1>
        <p class="fp-subtitle">底部浮层 · Agent 执行详情的承载容器</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>Sheet 是 Agent 执行任务过程中，<strong>从屏幕底部升起的浮层容器</strong>，用于承载执行详情、工具事件、待办列表、代码全屏查看等内容。它覆盖在对话流之上，通过半透明遮罩与底部操作栏形成空间隔离。</p>
        <h3>核心职责</h3>
        <ul>
          <li>承载 Agent 执行过程的详情，不占用对话流空间</li>
          <li>通过折叠/展开两种高度，适配"快速瞥一眼"与"深入查看"两种阅读姿态</li>
          <li>提供统一的进出动效，让浮层的到来与离开有可感知的节奏</li>
        </ul>
      </section>

      <section data-section="anatomy">
        <h2>2. 构成</h2>
        <p>项目中有两种 Sheet，分别承载不同类型的内容，在结构上有明显差异。<strong>事件 Sheet</strong>用于展示 Agent 执行过程中的事件行、待办列表等过程信息；<strong>代码 Sheet</strong>用于展示代码块全屏查看时的完整代码。两者共享"从底部升起"的动效语言，但 DOM 结构、高度策略、顶栏布局完全不同。</p>

        <h3>2.1 事件 Sheet</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">事件 Sheet · 创建代办</span>
            <div class="fp-snapshot">${s.anatomyEvent}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 遮罩区</h4>
            <blockquote><p>半透明遮罩 + 高斯模糊，覆盖整个手机壳。点击遮罩关闭；浮层内部不关闭。</p></blockquote>
            <h4>② 浮层顶部栏</h4>
            <blockquote><p>三段式布局：左侧 slot、中央拖拽条、右侧关闭按钮。一级 Sheet 左侧空置，二级 Sheet 左侧有返回按钮。</p></blockquote>
            <h4>③ 内容区</h4>
            <blockquote><p>一级 Sheet 承载事件行 + 待办列表。二级 Sheet 承载分组的详情卡片，支持文本和代码两种变体。</p></blockquote>
            <p style="margin-top:16px;font-size:13px;color:#86868b">← 左图含遮罩层。二级 Sheet 的详情卡片见下图对照：</p>
            <div class="fp-snapshot-detail-ref">
              <span class="tag" style="margin:8px 0">二级 Sheet · 详情卡片</span>
              <div class="fp-snapshot">${s.anatomyDetail}</div>
            </div>
          </div>
        </div>

        <h3>2.2 代码 Sheet</h3>
        <div class="fp-snapshot-side" style="margin-top:24px">
          <div class="fp-snapshot-wrap">
            <span class="tag">代码 Sheet</span>
            <div class="fp-snapshot">${s.anatomyCode}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 遮罩层（code-sheet-overlay）</h4>
            <blockquote>
              <p>半透明遮罩 + 高斯模糊，与事件 Sheet 共用同一套遮罩样式。点击遮罩关闭。</p>
            </blockquote>
            <h4>② 浮层主体（code-sheet-panel）</h4>
            <blockquote>
              <p>白底，顶部圆角，<strong>80% 高度</strong>（与事件 Sheet expanded 状态一致），从底部升起。</p>
            </blockquote>
            <h4>③ 顶部栏（code-sheet-header）</h4>
            <blockquote>
              <p>两端布局：左侧标题（code-sheet-title，如"JavaScript"），右侧玻璃胶囊按钮组（code-sheet-actions.glass-capsule）。<strong>无拖拽条</strong>——代码 Sheet 不支持拖拽折叠/展开。</p>
            </blockquote>
            <h4>④ 内容区（code-sheet-body）</h4>
            <blockquote>
              <p>白底 + 边框 + 圆角，撑满剩余空间。内部 pre 自带滚动，HTML 类型可用 iframe 预览。</p>
            </blockquote>
          </div>
        </div>

        <h3>2.3 结构差异对比</h3>
        <table>
          <thead>
            <tr><th>对比项</th><th>事件 Sheet</th><th>代码 Sheet</th></tr>
          </thead>
          <tbody>
            <tr><td>高度策略</td><td>百分比切换（折叠 40% / 展开 80%）</td><td>80% 固定高度（与事件 Sheet expanded 一致）</td></tr>
            <tr><td>顶栏结构</td><td>三段式：slot + 拖拽条 + 关闭按钮</td><td>两端式：标题 + 玻璃胶囊按钮组</td></tr>
            <tr><td>拖拽条</td><td>有</td><td>无</td></tr>
            <tr><td>拖拽折叠/展开</td><td>支持</td><td>不支持</td></tr>
            <tr><td>内容区容器</td><td>sheet-body（无独立边框）</td><td>code-sheet-body（白底 + 边框 + 圆角）</td></tr>
          </tbody>
        </table>
        <blockquote>
          <p>两种 Sheet 的结构差异源于<strong>使用场景不同</strong>：事件 Sheet 是"过程信息按需查看"，需要折叠/展开适配"瞥一眼"和"深入看"两种姿态；代码 Sheet 是"专注阅读完整代码"，一旦打开就是全屏沉浸，不需要中间态。</p>
        </blockquote>
      </section>

      <section data-section="interaction" id="sec-interaction">
        <h2>3. 交互与状态</h2>
        <blockquote>
          <p>本章描述的折叠/展开/拖拽交互<strong>仅适用于事件 Sheet</strong>。代码 Sheet 无拖拽条、无高度切换，打开即固定撑满，关闭靠关闭按钮或点击遮罩。</p>
        </blockquote>

        <h3>3.1 两种高度状态</h3>
        <div class="fp-snapshot-row">
          ${labeled('折叠态 40%', s.stateCollapsed)}
          ${labeled('展开态 80%', s.stateExpanded)}
        </div>
        <table>
          <thead>
            <tr><th>状态</th><th>高度</th><th>overflow-y</th><th>滚动权限</th></tr>
          </thead>
          <tbody>
            <tr><td>折叠态</td><td>40%</td><td>hidden</td><td>代码内可设 scrollTop 偏移，用户不可手动滚动</td></tr>
            <tr><td>展开态</td><td>80%</td><td>auto</td><td>用户可自由滚动</td></tr>
          </tbody>
        </table>
        <blockquote>
          <p><strong>打开时永远是 40%</strong>。无论后续流式加载多少内容，面板高度不自动变化。内容溢出由 overflow:hidden 裁剪，用户需主动展开才能看到全部。</p>
        </blockquote>

        <h3>3.2 拖拽状态机</h3>
        <p>拖拽是事件 Sheet 最核心的交互，用户通过拖拽在折叠/展开之间切换，或直接下拉关闭。代码 Sheet 无拖拽条，不参与此交互。拖拽逻辑采用<strong>双向滞后阈值</strong>，避免在临界点反复抖动。</p>
        <div class="fp-snapshot-row fp-snapshot-row--eq-height">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-diagram" style="border:1px solid #e9ecf1;border-radius:12px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:16px">
              <div class="fp-motion-state" data-state="collapsed">
                <span class="tag">折叠态 40%</span>
                <p class="fp-motion-hint">上拖展开 · 下拖关闭</p>
              </div>
              <div class="fp-motion-arrow">↕ 拖拽</div>
              <div class="fp-motion-state" data-state="expanded">
                <span class="tag">展开态 80%</span>
                <p class="fp-motion-hint">内容在顶时下拖折叠</p>
              </div>
            </div>
          </div>
          <div class="fp-snapshot-wrap">
            <h4>拖拽逻辑</h4>
            <blockquote>
              <p>拖拽实时跟手，松手后按<strong>双向滞后阈值</strong>决定落点：</p>
              <ul>
                <li>40% 态上拖，松手 ≥ 50% → 展开到 80%；下拖 > 40px → 关闭</li>
                <li>80% 态下拖（内容在顶），松手 < 75% → 折叠到 40%</li>
                <li>80% 态内容不在顶部时，拖拽不拦截，走原生滚动</li>
              </ul>
              <p>滞后带（50%~75%）防止临界区域反复弹跳。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="motion">
        <h2>4. 动效</h2>
        <p>两种 Sheet 共享"从底部升起"的动效语言，参数已统一。进出动效参数如下：</p>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage fp-sheet-motion-rise" data-motion-loop="sheet-rise-fall">
              ${s.motionRiseFall}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <table>
              <thead>
                <tr><th>元素</th><th>属性</th><th>时长</th><th>缓动</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>遮罩</td>
                  <td>opacity</td>
                  <td>0.28s</td>
                  <td>ease</td>
                </tr>
                <tr>
                  <td>浮层</td>
                  <td>transform: translateY</td>
                  <td>0.36s</td>
                  <td>cubic-bezier(0.32, 0.72, 0, 1)</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>遮罩先淡入（opacity 0→1），浮层紧随其后从底部 translateY(100%) 升起至 translateY(0)。关闭时顺序相反。遮罩比浮层快（0.28s vs 0.36s）——遮罩快速建立"空间隔离"，浮层随后"沉稳落座"。两者共用同一条 cubic-bezier(0.32,0.72,0,1) 缓动曲线，前段加速、后段减速，让浮层有"从下方推上来"的物理质感。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="related">
        <h2>5. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>事件 Sheet 打开时保持 40%，让用户决定是否展开。</li>
              <li>拖拽时实时跟随手指，松手后吸附。</li>
              <li>遮罩先建立隔离，浮层随后升起。</li>
              <li>折叠态裁剪溢出，传递"非核心信息"的信号。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要根据内容量自动展开事件 Sheet。</li>
              <li>不要在拖拽过程中使用 transition，会产生延迟跟手感。</li>
              <li>不要让遮罩和浮层使用相同时长，会失去层次感。</li>
              <li>不要在折叠态允许用户手动滚动，会破坏 40% 的空间约束。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};