// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// TOOL CALL NODE — 工具调用节点 交互设计文档
// ============================================================
// 核心约定：两个状态，文字前缀「正在」是唯一的状态标记
//   进行中：正在X  /  已完成：X（drop 正在，不加 已）
// 工具调用的 3 种视觉样式：文字（默认内联） / 堆叠（折叠） / 边框（卡片）
// 快照：直接复用 engine/icons.js 的 statusLineHTML / statusStackHTML
//       + engine/sheet.js 的 renderStaticSheet / renderStaticDetail
// 循环动画：第 2 节「设计样式」3 个 mode 块顺序播放（逐条执行→全部完成）
//           逻辑在 engine/feature-panel.js 的 startTcnModeLoop() 处理

import { statusLineHTML } from '../engine/icons.js';

function getSnapshots() {
  // 状态行辅助：running 状态自动加 is-running class（触发扫光动画）
  const line = (labels, { running } = {}) => {
    const cls = `step-detail-link${running ? ' is-running' : ''}`;
    return `<button type="button" class="${cls}" tabindex="-1">${statusLineHTML(labels)}</button>`;
  };

  return {
    runningSingle: `<div class="fp-tcn-inline">${line(['正在执行命令'], { running: true })}</div>`,
    doneSingle:   `<div class="fp-tcn-inline">${line(['执行命令'])}</div>`,
    runningMulti: `<div class="fp-tcn-inline">${line(['搜索网页', '创建文件', '正在读取文件'], { running: true })}</div>`,
    doneMulti:    `<div class="fp-tcn-inline">${line(['搜索网页', '创建文件', '读取文件'])}</div>`,
    motionDemo:   `<div class="fp-tcn-inline">${line(['正在搜索网页'], { running: true })}</div>`,
  };
}

// ── 设计样式章节的 demo 块（3 模式顺序循环）──────────
function modeBlock(modeLabel, phoneClass, initialLine) {
  const isStack = phoneClass === 'tool-call-stack';
  return `<div class="fp-tcn-mode-demo ${phoneClass}" data-mode="${modeLabel}">
    <button type="button" class="step-detail-link is-running fp-tcn-mode-line${isStack ? ' tcn-stack-mode' : ''}" tabindex="-1" data-initial-state="running">${initialLine}</button>
  </div>`;
}

export default {
  id: 'tool-call-node',
  type: 'feature',
  label: '工具调用节点',
  anchors: {},
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>工具调用节点</h1>
        <p class="fp-subtitle">Agent 每一次工具调用的状态行 · 位于 AI 消息气泡内、思考按钮下方、正式回答上方</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <p>工具调用节点是 agent 调用外部工具时的状态行，位于 AI 消息气泡内、思考按钮下方、正式回答上方——让用户感知 agent 正在做什么、做完了什么。</p>
      </section>

      <section data-section="states">
        <h2>2. 状态</h2>
        <p>两个状态，<strong>前缀「正在」是唯一的状态标记</strong>——同一工具调用在两个状态共用同一段文案，仅靠「正在」区分。</p>

        <div class="fp-states-row">
          <div class="fp-states-group">
            <span class="tag">3.1 单个工具</span>
            <p class="fp-states-note">进行中行灰 <code>#999</code>，扫光 1.15s 左→右循环；完成后行浅灰 <code>rgba(0,0,0,0.30)</code>，扫光消失，<code>›</code> 保留。</p>
            <div class="fp-states-inner-row">
              <div class="fp-snapshot-wrap">
                <span class="tag">进行中</span>
                <div class="fp-tcn-inline">${s.runningSingle}</div>
              </div>
              <div class="fp-snapshot-wrap">
                <span class="tag">已完成</span>
                <div class="fp-tcn-inline">${s.doneSingle}</div>
              </div>
            </div>
          </div>

          <div class="fp-states-group">
            <span class="tag">3.2 多个工具</span>
            <p class="fp-states-note">连续工具调用合并为同一条节点。已完成条目留在前面，进行中放在最末——<strong>只有最末那条带扫光</strong>。</p>
            <div class="fp-states-inner-row">
              <div class="fp-snapshot-wrap">
                <span class="tag">进行中</span>
                <div class="fp-tcn-inline">${s.runningMulti}</div>
              </div>
              <div class="fp-snapshot-wrap">
                <span class="tag">已完成</span>
                <div class="fp-tcn-inline">${s.doneMulti}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-section="modes">
        <h2>3. 设计样式</h2>
        <p>工具调用节点有 3 种视觉样式：<strong>文字</strong>（默认内联）/ <strong>堆叠</strong>（多条完成时折叠）/ <strong>边框</strong>（卡片强调）。下方同步演示从逐条执行到全部完成的完整过程——<strong>堆叠模式在完成时折叠为「图标堆 + 已执行 3 项」</strong>。</p>
        <div class="fp-snapshot-row fp-tcn-modes">
          <div class="fp-snapshot-wrap">
            <span class="tag">文字</span>
            <div class="fp-snapshot">${modeBlock('文字', 'tool-call-flat', statusLineHTML(['正在搜索网页']))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">堆叠</span>
            <div class="fp-snapshot">${modeBlock('堆叠', 'tool-call-stack', statusLineHTML(['正在搜索网页']))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">边框</span>
            <div class="fp-snapshot">${modeBlock('边框', 'tool-call-card', statusLineHTML(['正在执行命令']))}</div>
          </div>
        </div>
      </section>

      <section data-section="motion">
        <h2>4. 动效</h2>
        <p>工具调用节点的核心动效是<strong>扫光动画</strong>，表示工具调用正在进行中。</p>

        <h3>4.1 扫光动画</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage" data-motion-loop="tcn-sweep">
              ${s.motionDemo}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>扫光从左到右循环播放，表示工具调用正在进行中。完成后扫光消失，只保留静态文本。</p>
            <table>
              <thead>
                <tr><th>参数</th><th>值</th><th>意图</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>时长</td>
                  <td>1.15s</td>
                  <td>足够让用户注意到"正在处理"，又不会太抢眼</td>
                </tr>
                <tr>
                  <td>方向</td>
                  <td>左→右</td>
                  <td>符合阅读顺序，让用户感觉"正在推进"</td>
                </tr>
                <tr>
                  <td>循环</td>
                  <td>infinite</td>
                  <td>工具调用可能持续较长时间，需要持续反馈</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>扫光只在<strong>进行中的那条</strong>上显示。多个工具调用时，只有最后一条（进行中）带扫光，已完成的不显示。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="edge-cases">
        <h2>5. 边界与异常</h2>
        <p>边界状态的重点不是"能不能装下"，而是极端内容下仍然不能影响判断。</p>
        <table>
          <thead>
            <tr><th>边界</th><th>体验要求</th></tr>
          </thead>
          <tbody>
            <tr><td>工具名过长</td><td>状态行自然截断，保留「正在」前缀可见</td></tr>
            <tr><td>多个工具调用（10+）</td><td>堆叠模式的「图标堆」最多显示 5 个图标，超出部分不显示</td></tr>
            <tr><td>工具名含特殊字符</td><td>正常渲染，不影响图标推断</td></tr>
            <tr><td>Sheet 详情内容为空</td><td>显示"暂无详细内容"占位符</td></tr>
          </tbody>
        </table>
      </section>

      <section data-section="rationale">
        <h2>6. 设计原理</h2>
        <h3>为什么只用「正在」前缀区分状态，而不是用 badge 或图标？</h3>
        <p>工具调用节点的核心职责是<strong>轻量反馈</strong>，不是强调状态变化。用「正在」前缀已经足够表达"进行中 vs 已完成"的差异，额外加 badge 或图标会让行内样式变重，干扰用户对后续正式回答的阅读。</p>


        <h3>为什么堆叠模式要在完成时折叠，而不是一直展开？</h3>
        <p>多条工具调用完成后，用户更关心<strong>最终结果</strong>，而不是每条调用的细节。折叠为「图标堆 + 已执行 N 项」既节省空间，又提供了展开查看的入口。</p>

        <h3>为什么状态行点击后打开 Sheet，而不是内联展开？</h3>
        <p>工具调用的详细结果可能很长（如命令输出、文件内容等），内联展开会破坏对话流的连续性。Sheet 从底部滑入，既能展示详细内容，又不会影响上方已有的对话内容。</p>
      </section>

      <section data-section="related">
        <h2>7. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>在 agent 真正调用工具时使用，让用户知道"正在做什么"。</li>
              <li>多个工具调用时，用堆叠样式节省空间。</li>
              <li>关键工具调用（如删除、执行命令）用边框样式强调。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要在每个工具调用前后都插一排状态行（应该用堆叠模式合并）。</li>
              <li>不要用工具调用节点来展示"思考过程"（那是思考按钮的职责）。</li>
              <li>不要让用户在工具调用节点里执行交互操作（它是状态展示，不是操作入口）。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};
