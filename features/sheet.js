// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// SHEET — 底部浮层交互逻辑设计文档
// ============================================================
// 第一优先级：sheet 本身的交互逻辑（50%/90%状态、出现/消失、拖拽物理、动效）
// 不涉及 sheet 内部具体内容渲染（事件行、待办、二级详情等）
// 快照：由 engine/sheet.js 的 renderStaticSheetShell() 实时渲染
//       改左边 sheet 样式 → 右边文档自动同步
// 拖拽物理：2026-07-28 重写为「动量投影 + 可中断弹簧 + 橡皮筋」
//       （commit 93f09b1e），本文档 §4 与该实现一一对应
// ============================================================

import { renderStaticSheetShell, renderStaticDetail, renderStaticEventSheet, renderStaticSheet } from '../engine/sheet.js';
import { renderStaticCodeSheetShell } from '../engine/code-fullscreen-sheet.js';

// ── 快照缓存 ──────────────────────────────────
const snapCache = {};
function snap(key, opts) {
  if (!snapCache[key]) snapCache[key] = renderStaticSheetShell(opts);
  return snapCache[key];
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

// ── 从 scenario 真实帧获取二级详情数据 ──
function getDetailFromScenario() {
  const s = window.WORKBUDDY_SCENARIO;
  const frame = s.sheetFrames && s.sheetFrames['F3.4b'];
  if (frame && frame.events && frame.events[0] && frame.events[0].detail) {
    return frame.events[0].detail;
  }
  return { sections: [] };
}

function getSnapshots() {
  return {
    // §2 构成：事件 Sheet（创建代办示例）
    anatomyEvent: snap('anatomyEvent', {
      state: 'collapsed',
      body: renderStaticEventSheet('F1.a,F1.b'),
      width: '393px',
      height: '852px',
      borderRadius: '0',
      frameCls: 'fp-show-overlay',
    }),
    // §2 构成：事件 Sheet 二级详情（从 scenario 真实帧数据获取）
    anatomyDetail: snap('anatomyDetail', {
      state: 'collapsed',
      body: renderStaticDetail(getDetailFromScenario()),
      detailMode: true,
      width: '393px',
      height: '852px',
      borderRadius: '0',
      frameCls: 'fp-show-overlay',
    }),
    // §2 构成：代码 Sheet（带遮罩）
    anatomyCode: renderStaticCodeSheetShell({ lang: 'javascript', code: CODE_SAMPLE, width: '393px', height: '852px', borderRadius: '0', frameCls: 'fp-show-overlay' }),
    // §3 高度对比：折叠/展开
    stateCollapsed: snap('stateCollapsed', {
      state: 'collapsed',
      body: renderStaticEventSheet('F1.a,F1.b'),
      width: '393px',
      height: '852px',
      borderRadius: '0',
      frameCls: 'fp-show-overlay',
    }),
    stateExpanded: snap('stateExpanded', {
      state: 'expanded',
      body: renderStaticEventSheet('F1.a,F1.b'),
      width: '393px',
      height: '852px',
      borderRadius: '0',
      frameCls: 'fp-show-overlay',
    }),
    // §3 进出动效：升起/落下循环
    motionRiseFall: snap('motionRiseFall', {
      state: 'collapsed',
      showClose: false,
      showOverlay: true,
      body: renderStaticEventSheet('F1.a,F1.b'),
      width: '393px',
      height: '852px',
      borderRadius: '0',
      frameCls: 'fp-show-overlay',
    }),
    // §5 边界：空状态
    edgeEmpty: snap('edgeEmpty', {
      state: 'collapsed',
      body: renderStaticSheet([]),
      width: '393px',
      height: '852px',
      borderRadius: '0',
      frameCls: 'fp-show-overlay',
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

// ── §4 落点规则示意图（内联 SVG）──────────────────
// 纵轴 = Sheet 高度百分比，标注三个落点、两条决策边界、两端橡皮筋区
const SNAP_DIAGRAM_SVG = `
<svg viewBox="0 0 340 420" width="100%" style="max-width:340px;display:block;margin:0 auto" role="img" aria-label="落点规则示意">
  <!-- 橡皮筋区 -->
  <rect x="70" y="8"   width="180" height="32" rx="6" fill="#f5f5f7"/>
  <rect x="70" y="380" width="180" height="32" rx="6" fill="#f5f5f7"/>
  <!-- 展开区 -->
  <rect x="70" y="40"  width="180" height="102" rx="6" fill="#e8f0fe"/>
  <!-- 折叠区 -->
  <rect x="70" y="142" width="180" height="204" rx="6" fill="#e9f9ee"/>
  <!-- 关闭区 -->
  <rect x="70" y="346" width="180" height="34" rx="6" fill="#fdecea"/>
  <!-- 档位线 -->
  <line x1="60" y1="57"  x2="260" y2="57"  stroke="#1d1d1f" stroke-width="2"/>
  <line x1="60" y1="244" x2="260" y2="244" stroke="#1d1d1f" stroke-width="2"/>
  <!-- 决策边界线（虚线） -->
  <line x1="60" y1="142" x2="260" y2="142" stroke="#86868b" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="60" y1="346" x2="260" y2="346" stroke="#86868b" stroke-width="1" stroke-dasharray="4 3"/>
  <!-- 文字标注 -->
  <text x="266" y="61"  font-size="12" fill="#1d1d1f" font-weight="600">90% 展开</text>
  <text x="266" y="248" font-size="12" fill="#1d1d1f" font-weight="600">50% 折叠</text>
  <text x="266" y="146" font-size="11" fill="#86868b">70 边界</text>
  <text x="266" y="350" font-size="11" fill="#86868b">25 边界</text>
  <text x="160" y="95"  font-size="12" fill="#2456c4" text-anchor="middle">预测点落这里 → 展开</text>
  <text x="160" y="248" font-size="12" fill="#137333" text-anchor="middle">预测点落这里 → 折叠</text>
  <text x="160" y="367" font-size="11" fill="#c5221f" text-anchor="middle">→ 关闭</text>
  <text x="160" y="30"  font-size="11" fill="#86868b" text-anchor="middle">95 以上 · 橡皮筋</text>
  <text x="160" y="402" font-size="11" fill="#86868b" text-anchor="middle">20 以下 · 橡皮筋</text>
</svg>`;

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
          <li>拖拽即物理：用户可以直接"抓住"这块面板，甩出去、拉回来、中途反悔——运动始终连续</li>
        </ul>
        <h3>三种变体一览</h3>
        <table>
          <thead>
            <tr><th>变体</th><th>承载内容</th><th>高度</th><th>可拖拽</th></tr>
          </thead>
          <tbody>
            <tr><td>事件 Sheet</td><td>工具事件行、待办列表、二级详情</td><td>50% / 90% 两档</td><td>✓（本文 §4 的全部规则）</td></tr>
            <tr><td>代码 Sheet</td><td>代码块全屏查看</td><td>90% 固定</td><td>✗ 固定高度 + 专属关闭按钮</td></tr>
            <tr><td>产物 Sheet</td><td>全部产物列表</td><td>50% 固定</td><td>✗ 固定高度 + 专属关闭按钮</td></tr>
          </tbody>
        </table>
      </section>

      <section data-section="anatomy">
        <h2>2. 构成</h2>
        <p>事件 Sheet 与代码 Sheet 共享"从底部升起"的动效语言，但 DOM 结构、高度策略、顶栏布局完全不同——差异源于使用场景：事件 Sheet 是"过程信息按需查看"，需要中间态；代码 Sheet 是"专注阅读完整代码"，打开即沉浸。</p>

        <h3>2.1 事件 Sheet</h3>
        <div class="fp-snapshot-side fp-snapshot-trio">
          <div class="fp-snapshot-wrap">
            <span class="tag">一级 SHEET</span>
            <div class="fp-snapshot">${s.anatomyEvent}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag" style="margin:8px 0">二级 Sheet · 详情卡片</span>
            <div class="fp-snapshot">${s.anatomyDetail}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 遮罩区</h4>
            <blockquote><p>半透明遮罩 + 高斯模糊，覆盖整个手机壳。点击遮罩关闭；浮层内部不关闭。</p></blockquote>
            <h4>② 浮层顶部栏</h4>
            <blockquote><p>三段式布局：左侧 slot、中央拖拽条、右侧关闭按钮。一级 Sheet 左侧空置，二级 Sheet 左侧有返回按钮。</p></blockquote>
            <h4>③ 内容区</h4>
            <blockquote><p>一级 Sheet 承载事件行 + 待办列表。二级 Sheet 承载分组的详情卡片，支持文本和代码两种变体。</p></blockquote>
          </div>
        </div>

        <h3>2.2 代码 Sheet</h3>
        <div class="fp-snapshot-side" style="margin-top:24px">
          <div class="fp-snapshot-wrap">
            <span class="tag">代码 Sheet</span>
            <div class="fp-snapshot">${s.anatomyCode}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 遮罩层</h4>
            <blockquote><p>与事件 Sheet 共用同一套遮罩样式。点击遮罩关闭。</p></blockquote>
            <h4>② 浮层主体</h4>
            <blockquote><p>白底，顶部圆角，<strong>90% 固定高度</strong>（与事件 Sheet 展开态一致），从底部升起。</p></blockquote>
            <h4>③ 顶部栏</h4>
            <blockquote><p>两端布局：左侧标题，右侧玻璃胶囊按钮组。<strong>无拖拽条</strong>——代码 Sheet 不参与高度拖拽。</p></blockquote>
            <h4>④ 内容区</h4>
            <blockquote><p>白底 + 边框 + 圆角，撑满剩余空间。内部 pre 自带滚动，HTML 类型可用 iframe 预览。</p></blockquote>
          </div>
        </div>
      </section>

      <section data-section="space">
        <h2>3. 空间与进出</h2>

        <h3>3.1 两种高度状态</h3>
        <div class="fp-snapshot-row">
          ${labeled('折叠态 50%', s.stateCollapsed)}
          ${labeled('展开态 90%', s.stateExpanded)}
        </div>
        <table>
          <thead>
            <tr><th>状态</th><th>高度</th><th>overflow-y</th><th>滚动权限</th></tr>
          </thead>
          <tbody>
            <tr><td>折叠态</td><td>50%</td><td>hidden</td><td>代码内可设 scrollTop 偏移，用户不可手动滚动</td></tr>
            <tr><td>展开态</td><td>90%</td><td>auto</td><td>用户可自由滚动</td></tr>
          </tbody>
        </table>
        <blockquote>
          <p><strong>打开时永远是 50%</strong>。无论后续流式加载多少内容，面板高度不自动变化。内容溢出由 overflow:hidden 裁剪，用户需主动展开才能看到全部。</p>
        </blockquote>

        <h3>3.2 进出动效：同一条路进，同一条路出</h3>
        <p>Sheet 从底部升起，也从底部落下——<strong>进入和退出走同一条路径</strong>。这是空间一致性的底线：如果一个东西从下方来、却从侧面消失，用户脑中的空间地图就断了。</p>
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
                <tr><td>遮罩</td><td>opacity</td><td>0.28s</td><td>ease</td></tr>
                <tr><td>浮层</td><td>transform: translateY</td><td>0.36s</td><td>cubic-bezier(0.32, 0.72, 0, 1)</td></tr>
              </tbody>
            </table>
            <blockquote>
              <p>遮罩先淡入，浮层紧随其后从 translateY(100%) 升起。遮罩比浮层快（0.28s vs 0.36s）——遮罩快速建立"空间隔离"，浮层随后"沉稳落座"。两者共用同一条缓动曲线，前段加速、后段减速。</p>
              <p>进出动效是<strong>预设动画</strong>（无用户手势参与），用固定时长 CSS transition 是正确的；一旦用户上手拖拽，就切换到 §4 的弹簧物理——两套机制各司其职。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="drag" id="sec-drag">
        <h2>4. 拖拽物理</h2>
        <blockquote>
          <p>本章全部规则<strong>仅适用于事件 Sheet</strong>。代码 / 产物 Sheet 是固定高度，有专属关闭按钮，不参与高度拖拽。</p>
        </blockquote>

        <h3>4.1 设计原则：这是一块可以抓住的板子</h3>
        <p>拖拽不是"到达某个刻度就触发开关"，而是<strong>直接操控</strong>：面板始终粘在手指上，松手后的运动是拖拽的自然延续，而不是另一段动画的开始。判断标准只有一条——<strong>任何时刻，面板的位置和速度都是连续的</strong>，没有跳变、没有锁死、没有"机关触发感"。</p>
        <p>这条原则拆成五个机制，下面逐条定义：跟手 → 落点 → 弹簧 → 边界 → 可中断。</p>

        <h3>4.2 跟手：1:1 追踪，10px 意图阈值</h3>
        <ul>
          <li>拖动全程<strong>实时 1:1 跟手</strong>，面板位置 = 拖拽起始位置 + 手指位移，无任何 transition 介入。</li>
          <li>位移超过 <strong>10px</strong> 才判定为拖拽意图——避免把"想点事件行"误判成"想拖面板"。</li>
          <li>50% 态整个面板都是抓手；90% 态只有在<strong>内容滚动到顶部</strong>时下拖才接管，否则让给原生滚动（首次向上拖即释放）。</li>
          <li>鼠标按下时阻止浏览器默认行为，避免拖拽变成文字框选；触屏不拦（拦了会杀掉原生滚动）。</li>
        </ul>

        <h3>4.3 落点：动量投影，不是位置刻度</h3>
        <p>松手时不看"拖到了哪"，而是<strong>预测"照这个拖法会停在哪"</strong>，吸附到离预测点最近的档位：</p>
        <blockquote>
          <p><strong>预测停驻点 = 松手位置 + 松手速度 × 0.5s</strong>（衰减率 0.998，Apple《Designing Fluid Interfaces》公开公式）</p>
        </blockquote>
        <div class="fp-snapshot-row fp-snapshot-row--eq-height">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-diagram" style="border:1px solid #e9ecf1;border-radius:12px;padding:20px;display:flex;justify-content:center">
              ${SNAP_DIAGRAM_SVG}
            </div>
          </div>
          <div class="fp-snapshot-wrap">
            <h4>落点规则</h4>
            <table>
              <thead>
                <tr><th>预测停驻点</th><th>落点</th></tr>
              </thead>
              <tbody>
                <tr><td>≥ 70</td><td>展开 90%</td></tr>
                <tr><td>25 – 70</td><td>折叠 50%</td></tr>
                <tr><td>&lt; 25</td><td>关闭</td></tr>
              </tbody>
            </table>
            <blockquote>
              <p><strong>慢拖</strong>（速度≈0）时预测点≈当前位置，边界 70 / 25 就是两个档位的中点——符合直觉。</p>
              <p><strong>快甩</strong>时速度说了算：在 60% 快速下甩可以直接关闭；在 40% 快速上甩可以直接展开——不需要真的拖到刻度。</p>
              <p>松手速度取<strong>最近 120ms</strong> 的采样窗口，避免整个拖拽过程的平均速度稀释了最后那一下"甩"的意图。</p>
            </blockquote>
          </div>
        </div>

        <h3>4.4 弹簧：松手后的运动是拖拽的延续</h3>
        <p>落点确定后，面板由<strong>弹簧</strong>送过去，并且<strong>带着松手时的速度出发</strong>——拖拽和动画之间没有接缝。</p>
        <table>
          <thead>
            <tr><th>参数</th><th>值</th><th>含义</th></tr>
          </thead>
          <tbody>
            <tr><td>阻尼比</td><td>0.8</td><td>轻微过冲，有一点"活"感；1.0 则是完全无弹跳</td></tr>
            <tr><td>响应</td><td>0.3s</td><td>多快到达目标（不是固定时长——弹簧没有时长概念）</td></tr>
            <tr><td>初速度</td><td>松手速度</td><td>速度交接：甩出去的板子不会在松手瞬间"愣一下"</td></tr>
          </tbody>
        </table>
        <blockquote>
          <p>为什么不用 CSS transition？固定时长的动画是"预录好的表演"，用户中途想反悔只能干等；弹簧是"活的"，新输入只是改变目标值，运动保持连续。这组参数（0.8 / 0.3s）正是 Apple 为 drawer / sheet 类交互给出的参考值。</p>
        </blockquote>

        <h3>4.5 边界：橡皮筋，不是硬墙</h3>
        <p>拖过视觉上限（95）或下限（20）后进入<strong>渐进阻尼</strong>：面板仍然跟手，但跟随程度随超出距离衰减——手感是"被拽住"，不是"撞上墙"，更不会像机关一样"拖过某条线就突然关闭"。</p>
        <blockquote>
          <p>橡皮筋公式：<code>(超出距离 × 40 × 0.55) / (40 + 0.55 × |超出距离|)</code>，系数 0.55 为 Apple 参考值。下拖关闭的唯一路径是 §4.3 的动量投影——果断下拉或快速下甩，预测点低于 25 才关闭。</p>
        </blockquote>

        <h3>4.6 可中断：任何时刻可以反悔</h3>
        <ul>
          <li>弹簧飞行途中按下手指/鼠标 → <strong>立即从当前位置接管</strong>，可以反向拖走，不需要等动画播完。</li>
          <li>拖拽中途反向 → 速度历史持续采样，松手时按最新速度投影，不产生"速度断层"。</li>
          <li>这是弹簧（§4.4）天然的能力：它永远从当前值和当前速度出发，所以"打断"不需要特殊处理。</li>
        </ul>
      </section>

      <section data-section="edge">
        <h2>5. 边界与变体差异</h2>

        <h3>5.1 空状态</h3>
        <div class="fp-snapshot-row">
          ${labeled('无新增事件', s.edgeEmpty)}
        </div>
        <blockquote><p>帧数据无事件且无待办时，显示"当前状态暂无新增事件"，面板仍保持 50% 高度、可正常拖拽与关闭。</p></blockquote>

        <h3>5.2 输入方式差异</h3>
        <table>
          <thead>
            <tr><th>场景</th><th>触屏</th><th>鼠标</th></tr>
          </thead>
          <tbody>
            <tr><td>50% 态拖拽</td><td>整个面板可拖</td><td>整个面板可拖（已防文字框选）</td></tr>
            <tr><td>90% 态内容未置顶</td><td>原生滚动</td><td>滚轮滚动；拖拽不接管</td></tr>
            <tr><td>90% 态内容置顶</td><td>下拖折叠，上拖滚动</td><td>下拖折叠</td></tr>
            <tr><td>拖出面板边界</td><td>手势继续跟踪（document 级监听）</td><td>同左</td></tr>
          </tbody>
        </table>

        <h3>5.3 为什么代码 / 产物 Sheet 不可拖拽</h3>
        <blockquote>
          <p>它们是"打开即沉浸"的查看型容器：固定高度、顶栏有专属关闭按钮、内容区自带滚动。如果允许高度拖拽，抓着代码内容往下拉时无法区分"想滚动代码"还是"想关面板"——固定高度是消除歧义的设计决策，不是功能缺失。</p>
        </blockquote>
      </section>

      <section data-section="related">
        <h2>6. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>事件 Sheet 打开时保持 50%，让用户决定是否展开。</li>
              <li>松手落点用动量投影判断：慢拖看位置（中点边界），快甩看速度。</li>
              <li>弹簧接管时带上松手速度，拖拽与动画无缝衔接。</li>
              <li>边界用橡皮筋渐进阻尼，保留"被拽住"的反馈。</li>
              <li>任何动画中途都允许用户重新抓住面板。</li>
              <li>遮罩先建立隔离，浮层随后升起；进出走同一条路径。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要根据内容量自动展开事件 Sheet。</li>
              <li>不要用纯位置阈值决定落点（"拖过 X% 就展开"是机关，不是物理）。</li>
              <li>不要让拖拽越过边界时硬停或立即触发关闭。</li>
              <li>不要在拖拽过程中使用 transition，会产生延迟跟手感。</li>
              <li>不要锁死动画等它播完——用户的反悔永远优先。</li>
              <li>不要在折叠态允许用户手动滚动，会破坏 50% 的空间约束。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};