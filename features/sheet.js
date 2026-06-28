// ============================================================
// SHEET — 底部浮层交互逻辑设计文档
// ============================================================
// 第一优先级：sheet 本身的交互逻辑（40%/80%状态、出现/消失、拖拽、动效）
// 不涉及 sheet 内部具体内容渲染（事件行、待办、二级详情等）
// 快照：由 engine/sheet.js 的 renderStaticSheetShell() 实时渲染
//       改左边 sheet 样式 → 右边文档自动同步
// ============================================================

import { renderStaticSheetShell } from '../engine/sheet.js';
import { renderStaticCodeSheetShell } from '../engine/code-fullscreen-sheet.js';

// ── 快照缓存 ──────────────────────────────────
const snapCache = {};
function snap(key, opts) {
  if (!snapCache[key]) snapCache[key] = renderStaticSheetShell(opts);
  return snapCache[key];
}

// ── 创建代办 sheet 样本内容 ──
const TODO_BODY = [
  '<div class="s-row tool-todo"><div class="s-ico"><div class="s-ico-img"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="#E8F5E9"/><rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="#4CAF50"/><path d="M4.5 8L7 10.5L11.5 5.5" stroke="#4CAF50" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div><div class="s-content"><div class="s-line"><span class="s-text">创建待办清单</span><span class="s-text dim">已完成</span></div></div></div>',
  '<div class="s-sub"><div class="s-sub-ico"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#E8F5E9" stroke="#4CAF50" stroke-width=".src"/><path d="M4 7L6.5 9.5L10.5 4.5" stroke="#4CAF50" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="s-sub-txt">制定本周工作计划</span></div>',
  '<div class="s-sub"><div class="s-sub-ico"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#E8F5E9" stroke="#4CAF50" stroke-width=".src"/><path d="M4 7L6.5 9.5L10.5 4.5" stroke="#4CAF50" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span class="s-sub-txt">整理项目文档</span></div>',
  '<div class="s-sub"><div class="s-sub-ico"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#FFF9C4" stroke="#F9A825" stroke-width=".src"/><circle cx="7" cy="7" r="2" fill="#F9A825"/></svg></div><span class="s-sub-txt active">准备演示材料</span></div>',
  '<div class="s-sub"><div class="s-sub-ico"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="none" stroke="#BDBDBD" stroke-width=".src"/></svg></div><span class="s-sub-txt">安排团队周会</span></div>',
  '<div class="s-sub"><div class="s-sub-ico"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="none" stroke="#BDBDBD" stroke-width=".src"/></svg></div><span class="s-sub-txt">回复客户邮件</span></div>',
  '<div class="s-sub"><div class="s-sub-ico"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="none" stroke="#BDBDBD" stroke-width=".src"/></svg></div><span class="s-sub-txt">更新项目进度看板</span></div>',
].join('');

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

function getSnapshots() {
  return {
    // §2 构成：事件 Sheet（创建代办示例）
    anatomyEvent: snap('anatomyEvent', {
      state: 'collapsed',
      body: TODO_BODY,
      width: '390px',
      height: '850px',
      borderRadius: '0',
    }),
    // §2 构成：代码 Sheet（带遮罩）
    anatomyCode: renderStaticCodeSheetShell({ lang: 'javascript', code: CODE_SAMPLE, width: '390px', height: '850px' }),
    // §3 状态对比
    stateCollapsed: snap('stateCollapsed', {
      state: 'collapsed',
      body: '<div class="sheet-empty" style="padding:30px 20px;text-align:center;color:#86868b;font-size:13px">40% · 内容超限被裁剪</div>',
      width: '390px',
      height: '850px',
      borderRadius: '0',
    }),
    stateExpanded: snap('stateExpanded', {
      state: 'expanded',
      body: '<div class="sheet-empty" style="padding:50px 20px;text-align:center;color:#86868b;font-size:13px">80% · 内容可滚动</div>',
      width: '390px',
      height: '850px',
      borderRadius: '0',
    }),
    // §5 动效：进入循环（从底部升起）
    motionRiseFall: snap('motionRiseFall', {
      state: 'collapsed',
      showClose: false,
      showOverlay: true,
      body: '<div class="sheet-empty" style="padding:30px 20px;text-align:center;color:#86868b;font-size:13px">底部浮层升起</div>',
      width: '390px',
      height: '850px',
      borderRadius: '0',
    }),
    // §5 动效：展开循环（40% → 80%）
    motionExpand: snap('motionExpand', {
      state: 'collapsed',
      showClose: false,
      showOverlay: false,
      body: '<div class="sheet-empty" style="padding:40px 20px;text-align:center;color:#86868b;font-size:13px">上拖展开</div>',
      width: '390px',
      height: '850px',
      borderRadius: '0',
    }),
    // §6 边界：空状态
    edgeEmpty: snap('edgeEmpty', {
      state: 'collapsed',
      body: '<div class="sheet-empty">当前状态暂无新增事件。</div>',
      width: '390px',
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
            <h4>① 遮罩层（sheet-overlay）</h4>
            <blockquote>
              <p>半透明黑色 0.30 + 高斯模糊 blur(3px)，z-index:200，覆盖整个手机壳。点击遮罩关闭；浮层内部不关闭。</p>
            </blockquote>
            <h4>② 浮层主体（bottom-sheet）</h4>
            <blockquote>
              <p>白底 #FAFAFA，顶部圆角 34px，高度按百分比切换：折叠 40% / 展开 80%。transform:translateY 驱动进出。</p>
            </blockquote>
            <h4>③ 顶部栏（sheet-top）</h4>
            <blockquote>
              <p>三段式布局：左侧 slot（sheet-top-start）、中央拖拽条（sheet-handle 72×6px）、右侧关闭按钮（sheet-top-end）。拖拽条是折叠/展开的核心操作入口。</p>
            </blockquote>
            <h4>④ 内容区（sheet-body）</h4>
            <blockquote>
              <p>承载事件行、待办、二级详情。折叠态 overflow:hidden 裁剪溢出，展开态 overflow:auto 可滚动。示例展示的是"创建代办"场景——事件行 + 待办列表。</p>
            </blockquote>
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
              <p>半透明黑色 0.18，无高斯模糊，z-index:80。比事件 Sheet 更轻——代码查看是"专注阅读"场景，不需要强隔离感。</p>
            </blockquote>
            <h4>② 浮层主体（code-sheet-panel）</h4>
            <blockquote>
              <p>白底 #fafafa，顶部圆角 30px，<strong>固定撑满到导航栏下方</strong>（top:54px），不按百分比切换高度。从底部 translateY(102%) 升起。</p>
            </blockquote>
            <h4>③ 顶部栏（code-sheet-header）</h4>
            <blockquote>
              <p>两端布局：左侧标题（code-sheet-title，如"JavaScript"），右侧玻璃胶囊按钮组（code-sheet-actions.glass-capsule）。<strong>无拖拽条</strong>——代码 Sheet 不支持拖拽折叠/展开。</p>
            </blockquote>
            <h4>④ 内容区（code-sheet-body）</h4>
            <blockquote>
              <p>白底 + #e9ecf1 边框 + 圆角 16px，flex:1 撑满剩余空间。内部 pre 自带滚动，HTML 类型可用 iframe 预览。</p>
            </blockquote>
          </div>
        </div>

        <h3>2.3 结构差异对比</h3>
        <table>
          <thead>
            <tr><th>对比项</th><th>事件 Sheet</th><th>代码 Sheet</th></tr>
          </thead>
          <tbody>
            <tr><td>遮罩透明度</td><td>0.30 + blur(3px)</td><td>0.18，无模糊</td></tr>
            <tr><td>z-index</td><td>200</td><td>80</td></tr>
            <tr><td>高度策略</td><td>百分比切换（40% / 80%）</td><td>固定撑满（top:54px → bottom:0）</td></tr>
            <tr><td>顶栏结构</td><td>三段式：slot + 拖拽条 + 关闭按钮</td><td>两端式：标题 + 玻璃胶囊按钮组</td></tr>
            <tr><td>拖拽条</td><td>有（sheet-handle）</td><td>无</td></tr>
            <tr><td>拖拽折叠/展开</td><td>支持</td><td>不支持</td></tr>
            <tr><td>内容区容器</td><td>sheet-body（无独立边框）</td><td>code-sheet-body（白底 + 边框 + 圆角）</td></tr>
            <tr><td>圆角</td><td>34px</td><td>30px</td></tr>
            <tr><td>进出动画时长</td><td>0.36s</td><td>0.28s</td></tr>
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

        <h3>3.2 出现与消失</h3>
        <table>
          <thead>
            <tr><th>Sheet 类型</th><th>动作</th><th>触发方式</th><th>行为</th></tr>
          </thead>
          <tbody>
            <tr><td>事件 Sheet</td><td>出现</td><td>点击对话流中的状态行</td><td>高度复位到 40% → 遮罩淡入 → 浮层从底部升起 → 流式渲染内容</td></tr>
            <tr><td>事件 Sheet</td><td>消失（点击遮罩）</td><td>点击浮层外的遮罩背景</td><td>浮层滑下 → 遮罩淡出 → 完全隐藏</td></tr>
            <tr><td>事件 Sheet</td><td>消失（关闭按钮）</td><td>点击右上角关闭按钮</td><td>同上</td></tr>
            <tr><td>事件 Sheet</td><td>消失（下拉关闭）</td><td>40% 状态下拖超过 40px</td><td>直接触发 closeSheet</td></tr>
            <tr><td>代码 Sheet</td><td>出现</td><td>点击代码卡片的「全屏」或「查看全部」按钮</td><td>遮罩淡入 → 面板从底部升起（撑满到导航栏下方）→ 渲染完整代码</td></tr>
            <tr><td>代码 Sheet</td><td>消失（关闭按钮）</td><td>点击玻璃胶囊组内的关闭按钮</td><td>面板滑下 → 遮罩淡出</td></tr>
            <tr><td>代码 Sheet</td><td>消失（点击遮罩）</td><td>点击面板外的遮罩背景</td><td>同上</td></tr>
          </tbody>
        </table>

        <h3>3.3 拖拽状态机（事件 Sheet 专属）</h3>
        <p>拖拽是事件 Sheet 最核心的交互，用户通过拖拽在折叠/展开之间切换，或直接下拉关闭。代码 Sheet 无拖拽条，不参与此交互。拖拽逻辑采用<strong>双向滞后阈值</strong>，避免在临界点反复抖动。</p>
        <div class="fp-motion-diagram">
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
        <table>
          <thead>
            <tr><th>当前状态</th><th>手势</th><th>结果</th></tr>
          </thead>
          <tbody>
            <tr><td>40%</td><td>上拖</td><td>面板跟随手指升高，松手后按吸附阈值决定 40% 或 80%</td></tr>
            <tr><td>40%</td><td>下拖 > 40px</td><td>直接关闭 sheet</td></tr>
            <tr><td>40%</td><td>轻点/短拖</td><td>松手吸附回 40%</td></tr>
            <tr><td>80% + 内容在顶部</td><td>下拖</td><td>面板跟随手指降低，松手后按吸附阈值决定 40% 或 80%</td></tr>
            <tr><td>80% + 内容在顶部</td><td>上拖</td><td>释放拖拽，内容向上滚动</td></tr>
            <tr><td>80% + 内容不在顶部</td><td>任意方向</td><td>不拦截，走原生滚动</td></tr>
          </tbody>
        </table>
        <h4>吸附阈值（双向滞后）</h4>
        <blockquote>
          <p>松手后，面板根据当前拖拽到达的高度百分比决定最终落点：</p>
          <ul>
            <li><strong>从 40% 拉起</strong>：松手时高度 ≥ 50% → 展开到 80%；否则吸附回 40%</li>
            <li><strong>从 80% 拉下</strong>：松手时高度 < 75% → 折叠到 40%；否则吸附回 80%</li>
          </ul>
          <p>两个阈值不对称（50% vs 75%），制造<strong>滞后带</strong>：用户需要"明确地"拖过中点才会切换状态，避免在临界区域反复弹跳。</p>
        </blockquote>
      </section>

      <section data-section="motion">
        <h2>4. 动效</h2>
        <p>两种 Sheet 共享"从底部升起"的动效语言，但参数不同。事件 Sheet 的进出更沉稳（0.36s），代码 Sheet 更轻快（0.28s）。此外，事件 Sheet 还有拖拽展开/折叠的高度切换动效，代码 Sheet 无此交互。</p>

        <h3>4.1 进出动效</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage fp-sheet-motion-rise" data-motion-loop="sheet-rise-fall">
              ${s.motionRiseFall}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>打开时，遮罩先淡入（opacity 0→1），浮层紧随其后从底部 translateY(100%) 升起至 translateY(0)。关闭时顺序相反：浮层滑下，遮罩淡出。</p>
            <table>
              <thead>
                <tr><th>Sheet 类型</th><th>元素</th><th>属性</th><th>时长</th><th>缓动</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>事件 Sheet</td>
                  <td>遮罩 sheet-overlay</td>
                  <td>opacity</td>
                  <td>0.28s</td>
                  <td>ease</td>
                </tr>
                <tr>
                  <td>事件 Sheet</td>
                  <td>浮层 bottom-sheet</td>
                  <td>transform: translateY</td>
                  <td>0.36s</td>
                  <td>cubic-bezier(0.32, 0.72, 0, 1)</td>
                </tr>
                <tr>
                  <td>代码 Sheet</td>
                  <td>遮罩 code-sheet-overlay</td>
                  <td>opacity + visibility</td>
                  <td>0.28s</td>
                  <td>ease</td>
                </tr>
                <tr>
                  <td>代码 Sheet</td>
                  <td>面板 code-sheet-panel</td>
                  <td>transform: translateY</td>
                  <td>0.28s</td>
                  <td>cubic-bezier(0.32, 0.72, 0, 1)</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>事件 Sheet 的浮层比遮罩慢（0.36s vs 0.28s）——遮罩快速建立"空间隔离"的氛围，浮层随后"沉稳落座"。代码 Sheet 遮罩与面板同为 0.28s，更轻快——代码查看是专注阅读场景，不需要过强的进场仪式感。两者共用同一条 cubic-bezier(0.32,0.72,0,1) 缓动曲线，前段加速、后段减速，让浮层有"从下方推上来"的物理质感。</p>
            </blockquote>
          </div>
        </div>

        <h3>4.2 展开/折叠动效（事件 Sheet 专属）</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage fp-sheet-motion-expand" data-motion-loop="sheet-expand">
              ${s.motionExpand}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>拖拽松手后，面板在 40% 和 80% 之间吸附切换。高度变化使用与进出动效一致的缓动曲线，保持整体节奏统一。</p>
            <table>
              <thead>
                <tr><th>属性</th><th>时长</th><th>缓动</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>height</td>
                  <td>0.32s</td>
                  <td>cubic-bezier(0.32, 0.72, 0, 1)</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>拖拽过程中 transition 临时关闭（实时跟随手指），松手瞬间恢复 transition，产生"吸附"的顿挫感。这种"跟手→吸附"的两段式反馈，是拖拽交互手感的核心。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="edge-cases">
        <h2>5. 边界与异常</h2>
        <table>
          <thead>
            <tr><th>边界场景</th><th>体验要求</th></tr>
          </thead>
          <tbody>
            <tr><td>无内容（空状态）</td><td>显示"当前状态暂无新增事件。"，不显示空浮层</td></tr>
            <tr><td>折叠态内容溢出</td><td>由 overflow:hidden 裁剪，流式输出时自动滚到底部展示最新</td></tr>
            <tr><td>展开态用户已翻上去</td><td>流式输出不打断用户阅读，不强制滚到底部</td></tr>
            <tr><td>快速连续开关</td><td>renderToken 机制保证只有最后一次 openSheet 生效，旧渲染被丢弃</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row edge-scroll">
          ${labeled('空状态', s.edgeEmpty)}
        </div>
      </section>

      <section data-section="rationale">
        <h2>6. 设计原理</h2>
        <h3>为什么事件 Sheet 打开时永远是 40%</h3>
        <p>40% 是"瞥一眼"的高度——用户点击状态行想看的是"刚才发生了什么"，不需要占据全屏。如果打开就直接 80%，浮层会遮挡对话流，破坏阅读连贯性。展开是用户的主动选择，不是系统的默认行为。</p>
        <h3>为什么拖拽阈值不对称（50% vs 75%）</h3>
        <p>对称阈值（都是 50%）会让面板在临界点反复抖动——用户拖到 49% 松手弹回 40%，拖到 51% 松手弹到 80%，体验割裂。双向滞后制造了一个 50%~75% 的"缓冲带"，用户必须明确地拖过这个带子才会切换状态，消除抖动。</p>
        <h3>为什么折叠态不自动展开</h3>
        <p>折叠态的 overflow:hidden 裁剪是有意为之——它传递"这些内容不是最重要的"的信号。如果内容多了就自动展开，等于系统替用户做了"这很重要"的判断。用户想看全部，自己拖一下就好。</p>
        <h3>为什么代码 Sheet 不用拖拽和百分比高度</h3>
        <p>代码 Sheet 的场景是"专注阅读完整代码"——用户已经明确想看全部内容（点了全屏或查看全部），不需要"瞥一眼"的中间态。固定撑满到导航栏下方，给代码最大的展示空间；去掉拖拽条，避免用户在阅读时误触折叠。两种 Sheet 的差异本质上是<strong>使用场景的差异</strong>：过程信息需要分级查看，专注阅读需要一步到位。</p>
        <h3>为什么事件 Sheet 遮罩比浮层快</h3>
        <p>遮罩的职责是"建立隔离"，越快越好；浮层的职责是"承载内容"，需要一点时间建立存在感。如果两者同步，遮罩会显得拖沓；如果浮层更快，会在遮罩还没建立时就"撞"出来，缺乏层次。代码 Sheet 遮罩与面板同为 0.28s，因为代码查看的隔离感需求较弱（遮罩仅 0.18 透明度），不需要分层进场。</p>
      </section>

      <section data-section="related">
        <h2>7. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>事件 Sheet 打开时保持 40%，让用户决定是否展开。</li>
              <li>事件 Sheet 拖拽时实时跟随手指，松手后吸附。</li>
              <li>事件 Sheet 遮罩先建立隔离，浮层随后升起。</li>
              <li>事件 Sheet 折叠态裁剪溢出，传递"非核心信息"的信号。</li>
              <li>代码 Sheet 固定撑满，给代码最大展示空间。</li>
              <li>代码 Sheet 遮罩更轻（0.18），匹配专注阅读场景。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要根据内容量自动展开事件 Sheet 到 80%。</li>
              <li>不要在事件 Sheet 拖拽过程中使用 transition，会产生延迟跟手感。</li>
              <li>不要让事件 Sheet 遮罩和浮层使用相同时长，会失去层次感。</li>
              <li>不要在事件 Sheet 折叠态允许用户手动滚动，会破坏 40% 的空间约束。</li>
              <li>不要给代码 Sheet 加拖拽条，阅读时误触折叠会打断专注。</li>
              <li>不要让代码 Sheet 用百分比高度，固定撑满才能保证代码区最大化。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};