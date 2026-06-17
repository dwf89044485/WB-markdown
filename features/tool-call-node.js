// ============================================================
// TOOL CALL NODE — 工具调用节点 交互设计文档
// ============================================================
// 核心约定（见 docs/交互设计说明/工具调用节点-状态约定.md）：
//   两个状态，文字前缀「正在」是唯一的状态标记
//   进行中：正在X  /  已完成：X（drop 正在，不加 已）
// 工具调用的 3 种视觉样式：文字（默认内联） / 堆叠（折叠） / 边框（卡片）
// 快照：直接复用 engine/icons.js 的 statusLineHTML / statusStackHTML
//       + engine/sheet.js 的 renderStaticSheet / renderStaticDetail
// 循环动画：第 2 节「设计样式」3 个 mode 块同步跑 running → done → 循环
//           逻辑在 engine/feature-panel.js 的 startTcnModeLoop() 处理
// ============================================================

import { statusLineHTML, statusStackHTML } from '../engine/icons.js';
import { renderStaticSheet, renderStaticDetail, getFrames } from '../engine/sheet.js';
import { glassCloseBtn, glassNavBtn, GLYPH_PREV } from '../engine/ask-question.js';

// ── 第 1 节「状态」用「执行命令」作为唯一示例（用户口径）──────────
const L = {
  run:  '正在执行命令',
  done: '执行命令',
};

// ── 第 2 节「设计样式」循环 demo 用 3 条不同任务（3 个状态合并为 1 个节点）──────
const M_RUN  = ['正在搜索网页', '正在创建文件', '正在读取文件'];
const M_DONE = ['搜索网页',     '创建文件',     '读取文件'];   // drop 正在，不加 已

// ── 状态行快照（用真实 CSS + 真实 icon 推断）──────────
function sl(labels, opts = {}) {
  const { state = 'done' } = opts;
  const cls = `step-detail-link${state === 'running' ? ' is-running' : ''}`;
  return `<button type="button" class="${cls}" tabindex="-1">${statusLineHTML(labels)}</button>`;
}

// ── 设计样式章节的 demo 块（3 模式同步循环）──────────
// 每块是一个「手机壳 + 状态行」，由 feature-panel.js 的 setInterval 同步翻转
// modeLabel：用于 data-mode（用户口径 文字/堆叠/边框）+ loop 内部分支判断
// phoneClass：CSS 类（tool-call-card/flat/stack）
function modeBlock(modeLabel, phoneClass, initialLine) {
  return `<div class="fp-tcn-mode-demo" data-mode="${modeLabel}">
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
        <p>两个状态，<strong>前缀「正在」是唯一的状态标记</strong>——同一工具调用在两个状态共用同一段文案，仅靠「正在」区分。下方用「文字」样式（默认内联）实样展示。</p>

        <h3>进行中</h3>
        <p>标签 <code>${L.run}</code> · 行灰 <code>#999</code> · 扫光 1.15s 左→右循环</p>
        <div class="fp-tcn-inline">${sl([L.run], { state: 'running' })}</div>

        <h3>已完成</h3>
        <p>标签 <code>${L.done}</code> · 行浅灰 <code>rgba(0,0,0,0.30)</code> · 扫光消失 · <code>›</code> 仍在</p>
        <div class="fp-tcn-inline">${sl([L.done])}</div>

        <p>多条叠加时，连续工具调用合并为同一条节点，标签用「、」分隔（如 <code>${L.run}、${L.run}</code> → <code>${L.done}、${L.done}</code>）；已完成留上，进行中在最末——<strong>只有最末那条带扫光</strong>。</p>
      </section>

      <section data-section="modes">
        <h2>2. 设计样式</h2>
        <p>工具调用节点有 3 种视觉样式：<strong>文字</strong>（默认内联）/ <strong>堆叠</strong>（多条完成时折叠）/ <strong>边框</strong>（卡片强调）。下方 3 块用 3 条任务「搜索网页 / 创建文件 / 读取文件」、相同动效时长循环演示「运行中 → 完成」全过程；<strong>堆叠模式在完成时折叠为「图标堆 + 已执行 3 项」</strong>。</p>
        <div class="fp-snapshot-grid-3 fp-tcn-modes">
          <div class="fp-snapshot-wrap">
            <span class="tag">文字</span>
            <div class="fp-snapshot">${modeBlock('文字', 'tool-call-flat', statusLineHTML(M_RUN))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">堆叠</span>
            <div class="fp-snapshot">${modeBlock('堆叠', 'tool-call-stack', statusLineHTML(M_RUN))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">边框</span>
            <div class="fp-snapshot">${modeBlock('边框', 'tool-call-card', statusLineHTML(M_RUN))}</div>
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
                  <div class="sheet-top-end">${glassCloseBtn()}</div>
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
            <div class="fp-sheet-mock fp-sheet-mock-detail">
              <div class="bottom-sheet detail-mode fp-bottom-sheet-static">
                <div class="sheet-top">
                  <div class="sheet-top-start">${glassNavBtn(GLYPH_PREV, false)}</div>
                  <div class="sheet-handle"></div>
                  <div class="sheet-top-end">${glassCloseBtn()}</div>
                </div>
                <div class="sheet-body detail-mode">${renderStaticDetail(SHEET_DETAIL)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>`,
};
