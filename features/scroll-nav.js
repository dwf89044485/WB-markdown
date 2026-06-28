// ============================================================
// SCROLL-NAV — 快速滚动按钮（↑ ↓）交互设计文档（图文并茂版）
// ============================================================
// 快照：由 engine/scroll-nav.js 的 renderStaticScrollNav() 实时渲染
//       改左边组件样式 → 右边文档自动同步
// ============================================================

import { renderStaticScrollNav } from '../engine/scroll-nav.js';

const snapCache = {};
function snap(key, opts) {
  if (!snapCache[key]) snapCache[key] = renderStaticScrollNav(opts);
  return snapCache[key];
}

function getSnapshots() {
  return {
    // §2 构成：两个按钮都可见
    bothVisible: snap('bothVisible', { upVisible: true, downVisible: true }),
    // §2 构成：只显示 ↑（在底部）
    onlyUp: snap('onlyUp', { upVisible: true, downVisible: false }),
    // §2 构成：只显示 ↓（在顶部）
    onlyDown: snap('onlyDown', { upVisible: false, downVisible: true }),
    // §2 构成：全部隐藏
    bothHidden: snap('bothHidden', { upVisible: false, downVisible: false }),

    // §4 交互：双击后出现的教学提示（↑ 按钮）
    tooltipUp: snap('tooltipUp', { upVisible: true, downVisible: true, tooltip: { on: 'up', text: '双击 ↑ 可跳转对话顶部' } }),
    // §4 交互：教学提示（↓ 按钮）
    tooltipDown: snap('tooltipDown', { upVisible: true, downVisible: true, tooltip: { on: 'down', text: '双击 ↓ 可跳转对话底部' } }),

    // §6 边界：对话只有一轮（只显示 ↓）
    edgeOneTurn: snap('edgeOneTurn', { upVisible: false, downVisible: true }),
    // §6 边界：表格全屏时强制隐藏
    edgeFullscreen: snap('edgeFullscreen', { upVisible: false, downVisible: false }),
  };
}

// 辅助：带标签的快照块
function labeled(label, html, desc) {
  const descHtml = desc ? `<span style="color:#86868b;font-size:13px">${desc}</span>` : '';
  const rightPart = descHtml;
  return `<div class="fp-snapshot-wrap"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span class="tag">${label}</span>${rightPart}</div><div class="fp-snapshot" style="padding:16px;background:#f5f5f7;border-radius:12px">${html}</div></div>`;
}

// 辅助：并排快照
function labeledRow(items) {
  return `<div class="fp-snapshot-row">${items.map(i => labeled(i.label, i.html, i.desc)).join('')}</div>`;
}

// 实际锚点目标：nodeIndex 2（含多轮对话，滚动按钮可见）
// 滚动按钮在 playback 多轮对话后出现，resolveNodeStep 换算 timeline 索引
const STEP_SCROLL_VISIBLE = 2;

export default {
  id: 'scroll-nav',
  type: 'feature',
  label: '快速滚动',
  anchors: {
    'buttons-appear': {
      nodeIndex: STEP_SCROLL_VISIBLE,
      actionOffset: 0,
      until: () => {
        const up = document.getElementById('scrollUp');
        return up && !up.classList.contains('is-hidden');
      },
      label: '看滚动按钮出现',
    },
    'single-click-up': {
      nodeIndex: STEP_SCROLL_VISIBLE,
      actionOffset: 0,
      until: () => {
        const up = document.getElementById('scrollUp');
        return up && !up.classList.contains('is-hidden');
      },
      label: '看单击 ↑ 跳转',
    },
    'double-click-tooltip': {
      nodeIndex: STEP_SCROLL_VISIBLE,
      actionOffset: 0,
      until: () => {
        const up = document.getElementById('scrollUp');
        return up && !up.classList.contains('is-hidden');
      },
      label: '看双击提示',
    },
  },
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>快速滚动</h1>
        <p class="fp-subtitle">按轮次跳转 · 两个毛玻璃圆形按钮悬浮在对话右下角，输入框上方</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>快速滚动按钮是悬浮在对话区域的<strong>向上/向下快捷导航</strong>，让用户在不拖拽滚动条的情况下，按「轮次」快速跳转对话位置。</p>
        <h3>使用场景</h3>
        <ul>
          <li>对话较长时，快速回到上一轮或跳到最新一轮</li>
          <li>用户想顶部查看初始指令，或底部查看 agent 最新回复</li>
          <li>流式输出时，用户想自由翻阅历史而不被自动滚底打断</li>
        </ul>
        <h3>设计目标</h3>
        <p>让<strong>长对话中的导航</strong>成为一种<strong>可感知、低认知成本</strong>的操作。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 按钮构成（结构）</h2>
        <h3>显隐规则</h3>
        <p>只取决于滚动位置，让不需要的按钮自动消失：</p>
        <table>
          <thead><tr><th>滚动位置</th><th>↑</th><th>↓</th></tr></thead>
          <tbody>
            <tr><td>对话在顶部</td><td>消失</td><td>可见</td></tr>
            <tr><td>翻到中间</td><td>可见</td><td>可见</td></tr>
            <tr><td>对话在底部</td><td>可见</td><td>消失</td></tr>
          </tbody>
        </table>
        <p><strong>例外</strong>：表格全屏时强制隐藏；对话不足一轮整体隐藏；输入框激活/全屏态时禁用。</p>
        <div class="fp-snapshot-row">
          ${labeled('对话在顶部<br>↓ 可见', s.onlyDown)}
          ${labeled('对话在中间<br>↑↓ 都可见', s.bothVisible)}
          ${labeled('对话在底部<br>↑ 可见', s.onlyUp)}
        </div>
      </section>

      <section data-section="interaction" id="sec-interaction">
        <h2>3. 交互与状态</h2>

        <h3>3.1 ↑ 向上按钮</h3>
        <p>设计原则：<em>优先带你回去看上一轮，但你正在读的内容还没看完就不强拉。</em></p>

        <h4>单击</h4>
        <p>判断当前轮的 Agent 回复是否在可视区内：<strong>还在看</strong> → 回到当前轮开头；<strong>已看完</strong>（屏幕里已看不到当前轮回复）→ 翻到上一轮。已在最早一轮时按钮消失。</p>

        <h4>双击（≤300ms）</h4>
        <p>直接跳转到对话最顶部。<strong>首次双击</strong>弹提示"双击 ↑ 可跳转对话顶部"（2.5s 消失，仅一次），此后静默执行。</p>

        <h4>连续快戳</h4>
        <p>连续点击 ≥ 3 次且间隔 < 500ms（无阅读停顿），判断为用户在找快捷方式。弹提示"双击 ↑ 可跳转对话顶部"，直到用户双击过一次（毕业）后不再弹。</p>

        <div class="fp-snapshot-row">
          ${labeled('首次双击 ↑<br>教学提示出现', s.tooltipUp, '提示 2.5s 后自动淡出，毕业后不再出现')}
        </div>

        <h3>3.2 ↓ 向下按钮</h3>
        <p><strong>单击</strong>：跳到下一轮开头；已是最后一轮则滚到底部。<strong>双击</strong>：直接跳到底部。<strong>教学机制同 ↑</strong>：首次双击弹"双击 ↓ 可跳转对话底部"，毕业后静默。连戳 ≥ 3 次弹同款提示。</p>

        <div class="fp-snapshot-row">
          ${labeled('首次双击 ↓<br>教学提示出现', s.tooltipDown)}
        </div>

        <h3>3.3 滚动保护</h3>
        <p>Agent 流式输出时，通过 ↑↓ 翻页会临时阻止自动滚底——用户在 Agent 输出的同时可以自由翻阅历史，不会被打断。</p>
      </section>

      <section data-section="motion">
        <h2>4. 动效</h2>
        <p>快速滚动按钮有两个动效：按钮的入场出现，以及点击后的平滑滚动。</p>

        <h3>4.1 按钮入场</h3>
        <p>按钮从隐藏变为显示时，使用<strong>纯渐显（opacity 0→1）</strong>，无位移。这样按钮「出现」但不会突然移动内容位置，避免干扰阅读。</p>
        <table>
          <thead><tr><th>参数</th><th>值</th><th>意图</th></tr></thead>
          <tbody>
            <tr><td>动画类型</td><td>opacity 0 → 1</td><td>纯渐显，无位移，不打断阅读流</td></tr>
            <tr><td>时长</td><td>由浏览器默认 transition（opacity）</td><td>短促出现，不拖沓</td></tr>
            <tr><td>离场</td><td>display: none（无动画）</td><td>消失不需要动画，减少状态管理复杂度</td></tr>
          </tbody>
        </table>

        <h3>4.2 滚动过渡</h3>
        <p>点击按钮后，对话容器使用 <code>scroll-behavior: smooth</code> 实现平滑滚动。动画期间内，临时阻止 Agent 流式输出的自动滚底，避免冲突。</p>
        <table>
          <thead><tr><th>参数</th><th>值</th><th>意图</th></tr></thead>
          <tbody>
            <tr><td>滚动方式</td><td><code>scrollTo({ behavior: 'smooth' })</code></td><td>原生平滑滚动，与系统滚动体验一致</td></tr>
            <tr><td>保护时长</td><td>scrollend 事件 或 500ms 超时兜底</td><td>确保在滚动完成前，自动滚底不会中途插入</td></tr>
          </tbody>
        </table>
      </section>

      <section data-section="edge-cases">
        <h2>5. 边界与异常</h2>
        <p>边界状态的重点是「按钮不能出现在不该出现的地方」，以及「该消失时要彻底消失」。</p>
        <table>
          <thead><tr><th>边界</th><th>体验要求</th></tr></thead>
          <tbody>
            <tr><td>对话只有一轮</td><td>↑ 隐藏（无更早轮次），↓ 可用（滚到底部）</td></tr>
            <tr><td>表格全屏</td><td>整体强制隐藏，不叠加显示</td></tr>
            <tr><td>输入框激活/全屏</td><td>整体禁用，避免与输入框操作冲突</td></tr>
            <tr><td>最顶部双击 ↑</td><td>无效果（本来就在顶部），但不报错</td></tr>
            <tr><td>快速 ↑ 后快速 ↓</td><td>各自独立，不触发跳顶/跳底</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row edge-scroll">
          ${labeled('对话只有一轮<br>↓ 可见，↑ 隐藏', s.edgeOneTurn)}
          ${labeled('表格全屏<br>整体隐藏', s.edgeFullscreen, 'is-hidden 生效，按钮完全不可见')}
        </div>
      </section>

      <section data-section="rationale">
        <h2>6. 设计原理</h2>
        <h3>为什么用「双击」而不是「长按」触发跳顶/跳底</h3>
        <p>双击是一个<strong>已有用户心智</strong>的操作（如网页双击选中、文件双击打开）。长按需要等待系统反馈（Haptic Touch），且移动端长按容易与拖拽冲突。双击 300ms 内完成，感知成本低。</p>
        <h3>为什么教学提示要「毕业后静默」</h3>
        <p>提示的目的是<strong>教会用户一个隐藏操作</strong>，不是每次都提醒。毕业后不再提示，避免变成「狼来了」——用户会习惯性忽略。</p>
        <h3>为什么「连续快戳」要触发提示</h3>
        <p>用户在快速点击时，通常是在<strong>找快捷方式但不敢试</strong>。这时候弹出提示，比等用户自己发现双击更及时。快戳 ≥ 3 次是一个强信号：用户想更快，但不知道怎么做。</p>
        <h3>为什么按钮入场用「纯渐显」而不是「从底部滑入」</h3>
        <p>按钮出现在输入框上方，如果带位移，会让用户觉得「内容被顶上去了」。纯渐显让按钮「出现」但不「移动」，对阅读流的干扰最小。</p>
      </section>

      <section data-section="related">
        <h2>7. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>只在多轮对话时出现，避免单轮时按钮无意义。</li>
              <li>教学提示用「操作 + 效果」的文案，让用户看完就知道双击能做什么。</li>
              <li>滚动保护要在 scrollend 或超时后及时解除，避免永久阻止自动滚底。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要让按钮覆盖可点击区域（输入框、发送按钮等）。</li>
              <li>不要给按钮离场做动画——消失就要彻底消失，避免残影。</li>
              <li>不要在非用户操作时自动触发跳顶/跳底，这会让用户失去位置感。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};
