// ============================================================
// TOOL CALL NODE — 工具调用节点 交互设计文档
// ============================================================
// 快照：直接复用 engine/icons.js 的 statusLineHTML / statusStackHTML
//       + engine/sheet.js 的 renderStaticSheet / renderStaticDetail
//       真实渲染 + 真实 CSS → 样式改了文档自动同步
// 循环动画：第 2 节「设计样式」3 个 mode 块同步跑 running → done → 循环
//           逻辑在 engine/feature-panel.js 的 setupTcnModeLoop() 处理
// ============================================================

import { statusLineHTML, statusStackHTML } from '../engine/icons.js';
import { renderStaticSheet, renderStaticDetail, getFrames } from '../engine/sheet.js';

// ── 状态章节的样例标签 ──────────
const L = {
  singleRun:  '正在搜索网页',
  singleDone: '已搜索网页',
  multiRun:   ['正在搜索网页', '正在创建文件', '正在委派 Subagent'],
  multiDone:  ['已搜索网页', '已创建文件', '已委派 Subagent'],
};

// ── 状态行快照（用真实 CSS + 真实 icon 推断）──────────
function sl(labels, opts = {}) {
  const { state = 'done' } = opts;
  const cls = `step-detail-link${state === 'running' ? ' is-running' : ''}`;
  return `<button type="button" class="${cls}" tabindex="-1">${statusLineHTML(labels)}</button>`;
}

function stackRow(...rows) {
  return `<div class="fp-tcn-stack">${rows.join('')}</div>`;
}

// ── 设计样式章节的 demo 块（3 模式同步循环）──────────
// 每块是一个「手机壳 + 状态行」，由 feature-panel.js 的 setInterval 同步翻转
function modeBlock(mode, phoneClass, initialLine) {
  return `<div class="fp-tcn-mode-demo" data-mode="${mode}">
    <div class="phone-shell ${phoneClass}" style="width:100%;padding:10px;background:#fff;">
      <div class="flat-container">
        <button type="button" class="step-detail-link is-running fp-tcn-mode-line" tabindex="-1" data-initial-state="running">${initialLine}</button>
      </div>
    </div>
  </div>`;
}

// ── Sheet 章节的样例（用 F3.4d，3 条执行命令）──────────
const SHEET_FRAMES = getFrames('F3.4d');
const SHEET_EVENTS = SHEET_FRAMES.flatMap(f => f.events || []);
const SHEET_DETAIL = SHEET_EVENTS[1]?.detail; // 第 2 条：git diff --stat

export default {
  id: 'tool-call-node',
  type: 'feature',
  label: '工具调用节点',
  anchors: {},
  content: `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>工具调用节点</h1>
        <p class="fp-subtitle">Agent 每一次工具调用的状态行 · 位于 AI 消息气泡内、思考按钮下方、正式回答上方</p>
      </header>

      <section data-section="states">
        <h2>1. 状态</h2>

        <h3>1.1 单个 · 进行中</h3>
        <p>行灰（<code>#999</code>），标签显示当前动作，扫光左→右循环。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">running · 单条</span>
          <div class="fp-snapshot">${sl([L.singleRun], { state: 'running' })}</div>
        </div>

        <h3>1.2 单个 · 已完成</h3>
        <p>扫光消失，颜色变浅（<code>rgba(0,0,0,0.30)</code>），标签显示完成态文案。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">done · 单条</span>
          <div class="fp-snapshot">${sl([L.singleDone])}</div>
        </div>

        <h3>1.3 多个 · 部分进行中</h3>
        <p>已完成留在上面，<strong>最末一条 running 并扫光</strong>。视觉上"进度在推进"。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">2 done + 1 running</span>
          <div class="fp-snapshot">${stackRow(
            sl([L.singleDone]),
            sl([L.singleDone]),
            sl([L.singleRun], { state: 'running' })
          )}</div>
        </div>

        <h3>1.4 多个 · 全部已完成</h3>
        <p>全部浅灰，扫光全无。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">3 done</span>
          <div class="fp-snapshot">${stackRow(
            sl([L.singleDone]),
            sl([L.singleDone]),
            sl([L.singleDone])
          )}</div>
        </div>
      </section>

      <section data-section="modes">
        <h2>2. 设计样式</h2>
        <p>视觉密度 3 档。下方 3 块用相同数据、相同动效时长循环演示"运行中 → 完成"全过程；<strong>stack 模式在完成时折叠为「图标堆 + 已执行 N 项」</strong>。</p>
        <div class="fp-snapshot-grid-3 fp-tcn-modes">
          <div class="fp-snapshot-wrap">
            <span class="tag">card · 卡片</span>
            <div class="fp-snapshot">${modeBlock('card', 'tool-call-card', statusLineHTML(L.multiRun))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">flat · 内联</span>
            <div class="fp-snapshot">${modeBlock('flat', 'tool-call-flat', statusLineHTML(L.multiRun))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">stack · 折叠</span>
            <div class="fp-snapshot">${modeBlock('stack', 'tool-call-stack', statusLineHTML(L.multiRun))}</div>
          </div>
        </div>
      </section>

      <section data-section="sheet">
        <h2>3. Sheet 交互（点击节点）</h2>
        <p>以「执行命令」（<code>F3.4d</code>，含 3 个命令事件）为例。</p>

        <h3>3.1 一级 sheet</h3>
        <p>点节点弹出。每行 <code>›</code> 表示可下钻。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">一级 · 3 个事件</span>
          <div class="fp-snapshot">
            <div class="fp-sheet-mock">
              <div class="bottom-sheet fp-bottom-sheet-static">
                <div class="sheet-top">
                  <div class="sheet-top-start"></div>
                  <div class="sheet-handle"></div>
                  <div class="sheet-top-end"></div>
                </div>
                <div class="sheet-body">${renderStaticSheet(SHEET_EVENTS)}</div>
              </div>
            </div>
          </div>
        </div>

        <h3>3.2 二级 sheet</h3>
        <p>点 <code>›</code> 进入。展示「输入命令 / 输出结果 / 退出码」三段。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">二级 · 第 2 条事件（git diff --stat）的 detail</span>
          <div class="fp-snapshot">
            <div class="fp-sheet-mock">
              <div class="bottom-sheet fp-bottom-sheet-static">
                <div class="sheet-top">
                  <div class="sheet-top-start"></div>
                  <div class="sheet-handle"></div>
                  <div class="sheet-top-end"></div>
                </div>
                <div class="sheet-body">${renderStaticDetail(SHEET_DETAIL)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>`,
};
