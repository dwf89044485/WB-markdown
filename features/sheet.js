// ============================================================
// SHEET — 底部浮层交互逻辑设计文档
// ============================================================
// 第一优先级：sheet 本身的交互逻辑（40%/80%状态、出现/消失、拖拽、动效）
// 不涉及 sheet 内部具体内容渲染（事件行、待办、二级详情等）
// 快照：由 engine/sheet.js 的 renderStaticSheetShell() 实时渲染
//       改左边 sheet 样式 → 右边文档自动同步
// ============================================================

import { renderStaticSheetShell } from '../engine/sheet.js';

// ── 快照缓存 ──────────────────────────────────
const snapCache = {};
function snap(key, opts) {
  if (!snapCache[key]) snapCache[key] = renderStaticSheetShell(opts);
  return snapCache[key];
}

function getSnapshots() {
  return {
    // §2 构成：40% 折叠态完整外壳，带示意 body
    anatomy: snap('anatomy', {
      state: 'collapsed',
      body: '<div class="sheet-empty" style="padding:40px 20px;text-align:center;color:#86868b">sheet-body 内容区</div>',
    }),
    // §2 构成：80% 展开态
    anatomyExpanded: snap('anatomyExpanded', {
      state: 'expanded',
      body: '<div class="sheet-empty" style="padding:60px 20px;text-align:center;color:#86868b">sheet-body 内容区（可滚动）</div>',
    }),
    // §4 状态对比
    stateCollapsed: snap('stateCollapsed', {
      state: 'collapsed',
      body: '<div class="sheet-empty" style="padding:30px 20px;text-align:center;color:#86868b;font-size:13px">40% · 内容超限被裁剪</div>',
    }),
    stateExpanded: snap('stateExpanded', {
      state: 'expanded',
      body: '<div class="sheet-empty" style="padding:50px 20px;text-align:center;color:#86868b;font-size:13px">80% · 内容可滚动</div>',
    }),
    // §5 动效：进入循环（从底部升起）
    motionRiseFall: snap('motionRiseFall', {
      state: 'collapsed',
      showClose: false,
      showOverlay: true,
      body: '<div class="sheet-empty" style="padding:30px 20px;text-align:center;color:#86868b;font-size:13px">底部浮层升起</div>',
    }),
    // §5 动效：展开循环（40% → 80%）
    motionExpand: snap('motionExpand', {
      state: 'collapsed',
      showClose: false,
      showOverlay: false,
      body: '<div class="sheet-empty" style="padding:40px 20px;text-align:center;color:#86868b;font-size:13px">上拖展开</div>',
    }),
    // §6 边界：空状态
    edgeEmpty: snap('edgeEmpty', {
      state: 'collapsed',
      body: '<div class="sheet-empty">当前状态暂无新增事件。</div>',
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
        <p>Sheet 是 Agent 执行任务过程中，<strong>从屏幕底部升起的浮层容器</strong>，用于承载执行详情、工具事件、待办列表等内容。它覆盖在对话流之上，通过半透明遮罩与底部操作栏形成空间隔离。</p>
        <h3>核心职责</h3>
        <ul>
          <li>承载 Agent 执行过程的详情，不占用对话流空间</li>
          <li>通过折叠/展开两种高度，适配"快速瞥一眼"与"深入查看"两种阅读姿态</li>
          <li>提供统一的进出动效，让浮层的到来与离开有可感知的节奏</li>
        </ul>
        <h3>设计目标</h3>
        <p>让 Agent 的"执行细节"成为一种<strong>按需展开、随手收起</strong>的次级信息层，不打断主对话流的阅读连贯性。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 构成</h2>
        <p>Sheet 由遮罩层、浮层主体、顶部拖拽条、内容区四部分组成。遮罩负责空间隔离与点击关闭，主体负责承载内容，顶部拖拽条是折叠/展开的核心操作区。</p>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">折叠态 40%</span>
            <div class="fp-snapshot">${s.anatomy}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 遮罩层（overlay）</h4>
            <blockquote>
              <p>半透明黑色 + 高斯模糊，覆盖整个手机壳区域。点击遮罩背景关闭 sheet；点击浮层内部不关闭。</p>
            </blockquote>
            <h4>② 浮层主体（bottom-sheet）</h4>
            <blockquote>
              <p>白底圆角容器，顶部圆角，固定在屏幕底部。两种高度状态：折叠 40%、展开 80%。</p>
            </blockquote>
            <h4>③ 顶部拖拽条（sheet-handle）</h4>
            <blockquote>
              <p>72×6px 的灰色圆角条，位于顶部栏中央。上拖展开、下拖折叠/关闭的核心操作入口。</p>
            </blockquote>
            <h4>④ 内容区（sheet-body）</h4>
            <blockquote>
              <p>承载事件行、待办、二级详情等实际内容。折叠态 overflow:hidden 裁剪溢出，展开态 overflow:auto 可滚动。</p>
            </blockquote>
          </div>
        </div>
        <div class="fp-snapshot-side" style="margin-top:16px">
          <div class="fp-snapshot-wrap">
            <span class="tag">展开态 80%</span>
            <div class="fp-snapshot">${s.anatomyExpanded}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>展开态下，浮层占据屏幕 80% 高度，内容区获得滚动权限。顶部拖拽条始终可见，用户可随时下拖折叠回 40%。</p>
          </div>
        </div>
      </section>

      <section data-section="interaction" id="sec-interaction">
        <h2>3. 交互与状态</h2>

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
            <tr><th>动作</th><th>触发方式</th><th>行为</th></tr>
          </thead>
          <tbody>
            <tr><td>出现</td><td>点击对话流中的状态行</td><td>高度复位到 40% → 遮罩淡入 → 浮层从底部升起 → 流式渲染内容</td></tr>
            <tr><td>消失（点击遮罩）</td><td>点击浮层外的遮罩背景</td><td>浮层滑下 → 遮罩淡出 → 完全隐藏</td></tr>
            <tr><td>消失（关闭按钮）</td><td>点击右上角关闭按钮</td><td>同上</td></tr>
            <tr><td>消失（下拉关闭）</td><td>40% 状态下拖超过 40px</td><td>直接触发 closeSheet</td></tr>
          </tbody>
        </table>

        <h3>3.3 拖拽状态机</h3>
        <p>拖拽是 sheet 最核心的交互，用户通过拖拽在折叠/展开之间切换，或直接下拉关闭。拖拽逻辑采用<strong>双向滞后阈值</strong>，避免在临界点反复抖动。</p>
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
        <p>Sheet 有两个核心动效：遮罩与浮层的进出过渡，以及拖拽展开/折叠的高度变化。两者使用不同的时长与缓动，分别承担"到来/离开"和"状态切换"的表意职责。</p>

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
                <tr><th>元素</th><th>属性</th><th>时长</th><th>缓动</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>遮罩 overlay</td>
                  <td>opacity</td>
                  <td>0.28s</td>
                  <td>ease</td>
                </tr>
                <tr>
                  <td>浮层 bottom-sheet</td>
                  <td>transform: translateY</td>
                  <td>0.36s</td>
                  <td>cubic-bezier(0.32, 0.72, 0, 1)</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>遮罩比浮层快（0.28s vs 0.36s）——遮罩快速建立"空间隔离"的氛围，浮层随后"沉稳落座"。cubic-bezier(0.32,0.72,0,1) 前段加速、后段减速，让浮层有"从下方推上来"的物理质感。</p>
            </blockquote>
          </div>
        </div>

        <h3>4.2 展开/折叠动效</h3>
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
        <h3>为什么打开时永远是 40%</h3>
        <p>40% 是"瞥一眼"的高度——用户点击状态行想看的是"刚才发生了什么"，不需要占据全屏。如果打开就直接 80%，浮层会遮挡对话流，破坏阅读连贯性。展开是用户的主动选择，不是系统的默认行为。</p>
        <h3>为什么拖拽阈值不对称（50% vs 75%）</h3>
        <p>对称阈值（都是 50%）会让面板在临界点反复抖动——用户拖到 49% 松手弹回 40%，拖到 51% 松手弹到 80%，体验割裂。双向滞后制造了一个 50%~75% 的"缓冲带"，用户必须明确地拖过这个带子才会切换状态，消除抖动。</p>
        <h3>为什么折叠态不自动展开</h3>
        <p>折叠态的 overflow:hidden 裁剪是有意为之——它传递"这些内容不是最重要的"的信号。如果内容多了就自动展开，等于系统替用户做了"这很重要"的判断。用户想看全部，自己拖一下就好。</p>
        <h3>为什么遮罩比浮层快</h3>
        <p>遮罩的职责是"建立隔离"，越快越好；浮层的职责是"承载内容"，需要一点时间建立存在感。如果两者同步，遮罩会显得拖沓；如果浮层更快，会在遮罩还没建立时就"撞"出来，缺乏层次。</p>
      </section>

      <section data-section="related">
        <h2>7. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>打开时保持 40%，让用户决定是否展开。</li>
              <li>拖拽时实时跟随手指，松手后吸附。</li>
              <li>遮罩先建立隔离，浮层随后升起。</li>
              <li>折叠态裁剪溢出，传递"非核心信息"的信号。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要根据内容量自动展开到 80%。</li>
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
