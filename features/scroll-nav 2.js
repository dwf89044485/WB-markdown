// ============================================================
// SCROLL-NAV — 快速滚动按钮（↑ ↓）交互设计文档
// ============================================================

export default {
  id: 'scroll-nav',
  type: 'feature',
  label: '快速滚动',
  anchors: {},
  get content() {
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>快速滚动</h1>
        <p class="fp-subtitle">按轮次跳转 · 两个毛玻璃圆形按钮悬浮在对话右下角，输入框上方</p>
      </header>

      <section data-section="visibility">
        <h2>1. 显隐</h2>
        <p>只取决于滚动位置，让不需要的按钮自动消失：</p>
        <table>
          <thead><tr><th>滚动位置</th><th>↑</th><th>↓</th></tr></thead>
          <tbody>
            <tr><td>对话在顶部</td><td>消失</td><td>可见</td></tr>
            <tr><td>翻到中间</td><td>可见</td><td>可见</td></tr>
            <tr><td>对话在底部</td><td>可见</td><td>消失</td></tr>
          </tbody>
        </table>
        <p><strong>例外</strong>：表格全屏时强制隐藏；对话不足一轮整体隐藏。</p>
      </section>

      <section data-section="up">
        <h2>2. ↑ 向上按钮</h2>
        <p>设计原则：<em>优先带你回去看上一轮，但你正在读的内容还没看完就不强拉。</em></p>

        <h3>单击</h3>
        <p>判断当前轮的 Agent 回复是否在可视区内：<strong>还在看</strong> → 回到当前轮开头；<strong>已看完</strong>（屏幕里已看不到当前轮回复） → 翻到上一轮。已在最早一轮时按钮消失。</p>

        <h3>双击（≤300ms）</h3>
        <p>直接跳转到对话最顶部。<strong>首次双击</strong>弹提示"双击 ↑ 可跳转对话顶部"（2.5s 消失，仅一次），此后静默执行。</p>

        <h3>连续快戳</h3>
        <p>连续点击 ≥ 3 次且间隔 < 500ms（无阅读停顿），判断为用户在找快捷方式。弹提示"双击 ↑ 可跳转对话顶部"，直到用户双击过一次（毕业）后不再弹。</p>
      </section>

      <section data-section="down">
        <h2>3. ↓ 向下按钮</h2>
        <p><strong>单击</strong>：跳到下一轮开头；已是最后一轮则滚到底部。<strong>双击</strong>：直接跳到底部。<strong>教学机制同 ↑</strong>：首次双击弹"双击 ↓ 可跳转对话底部"，毕业后静默。连戳 ≥ 3 次弹同款提示。</p>
      </section>

      <section data-section="teaching">
        <h2>4. 教学提示</h2>
        <p>出现在按钮左侧，深灰半透明圆角浮层，淡入 200ms → 保持 2.5s → 淡出 200ms。同一按钮不叠加。↑ 和 ↓ 的毕业状态<strong>独立追踪</strong>——在 ↑ 学会双击不代表 ↓ 也会了。</p>
      </section>

      <section data-section="protection">
        <h2>5. 滚动保护</h2>
        <p>Agent 流式输出时，通过 ↑↓ 翻页会临时阻止自动滚底——用户在 Agent 输出的同时可以自由翻阅历史，不会被打断。</p>
      </section>

      <section data-section="edge-cases">
        <h2>6. 边界</h2>
        <ul>
          <li><strong>最顶部双击 ↑ / 最底部双击 ↓</strong>：无效果（本来就在）</li>
          <li><strong>快速 ↑ 后快速 ↓</strong>：各自独立，不触发跳顶 / 跳底</li>
          <li><strong>对话只有一轮</strong>：↑ 隐藏（无更早轮次），↓ 可用（滚到底）</li>
        </ul>
      </section>
    </article>`;
  },
};
