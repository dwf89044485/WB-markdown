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
// ============================================================

import { statusLineHTML, statusStackHTML } from '../engine/icons.js';
import { renderStaticSheet, renderStaticDetail, getFrames } from '../engine/sheet.js';
import { glassCloseBtn, glassNavBtn, GLYPH_PREV } from '../engine/ask-question.js';

// ── 第 1 节「状态」用「执行命令」作为唯一示例 ──────────
const L = {
  run:  '正在执行命令',
  done: '执行命令',
};

// ── 第 2 节「设计样式」循环 demo 用 3 条不同任务 ──────
const M_RUN  = ['正在搜索网页', '正在创建文件', '正在读取文件'];
const M_DONE = ['搜索网页',     '创建文件',     '读取文件'];

// 顺序循环的初始阶段：仅第 1 条 running（与 feature-panel.js 的 TCN_PHASES[0] 一致）
const M_PHASE0 = ['正在搜索网页'];

// ── 状态行快照（用真实 CSS + 真实 icon 推断）──────────
function sl(labels, opts = {}) {
  const { state = 'done' } = opts;
  const cls = `step-detail-link${state === 'running' ? ' is-running' : ''}`;
  return `<button type="button" class="${cls}" tabindex="-1">${statusLineHTML(labels)}</button>`;
}

// ── 设计样式章节的 demo 块（3 模式顺序循环）──────────
// 样式类直接挂在容器上，替代 phone-shell 的区分作用
function modeBlock(modeLabel, phoneClass, initialLine) {
  const isStack = phoneClass === 'tool-call-stack';
  return `<div class="fp-tcn-mode-demo ${phoneClass}" data-mode="${modeLabel}">
    <button type="button" class="step-detail-link is-running fp-tcn-mode-line${isStack ? ' tcn-stack-mode' : ''}" tabindex="-1" data-initial-state="running">${initialLine}</button>
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
        <p>两个状态，<strong>前缀「正在」是唯一的状态标记</strong>——同一工具调用在两个状态共用同一段文案，仅靠「正在」区分。</p>

        <div class="fp-states-row">
          <div class="fp-states-group">
            <span class="tag">1.1 单个工具</span>
            <p class="fp-states-note">进行中行灰 <code>#999</code>，扫光 1.15s 左→右循环；完成后行浅灰 <code>rgba(0,0,0,0.30)</code>，扫光消失，<code>›</code> 保留。</p>
            <div class="fp-states-inner-row">
              <div class="fp-snapshot-wrap">
                <span class="fp-label">进行中</span>
                <div class="fp-tcn-inline">${sl([L.run], { state: 'running' })}</div>
              </div>
              <div class="fp-snapshot-wrap">
                <span class="fp-label">已完成</span>
                <div class="fp-tcn-inline">${sl([L.done])}</div>
              </div>
            </div>
          </div>

          <div class="fp-states-group">
            <span class="tag">1.2 多个工具</span>
            <p class="fp-states-note">连续工具调用合并为同一条节点。已完成条目留在前面，进行中放在最末——<strong>只有最末那条带扫光</strong>。</p>
            <div class="fp-states-inner-row">
              <div class="fp-snapshot-wrap">
                <span class="fp-label">进行中</span>
                <div class="fp-tcn-inline">${sl(['搜索网页', '创建文件', '正在读取文件'], { state: 'running' })}</div>
              </div>
              <div class="fp-snapshot-wrap">
                <span class="fp-label">已完成</span>
                <div class="fp-tcn-inline">${sl(['搜索网页', '创建文件', '读取文件'])}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-section="modes">
        <h2>2. 设计样式</h2>
        <p>工具调用节点有 3 种视觉样式：<strong>文字</strong>（默认内联）/ <strong>堆叠</strong>（多条完成时折叠）/ <strong>边框</strong>（卡片强调）。下方同步演示从逐条执行到全部完成的完整过程——<strong>堆叠模式在完成时折叠为「图标堆 + 已执行 3 项」</strong>。</p>
        <div class="fp-snapshot-row fp-tcn-modes">
          <div class="fp-snapshot-wrap">
            <span class="tag">文字</span>
            <div class="fp-snapshot">${modeBlock('文字', 'tool-call-flat', statusLineHTML(M_PHASE0))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">堆叠</span>
            <div class="fp-snapshot">${modeBlock('堆叠', 'tool-call-stack', statusLineHTML(M_PHASE0))}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">边框</span>
            <div class="fp-snapshot">${modeBlock('边框', 'tool-call-card', statusLineHTML(M_PHASE0))}</div>
          </div>
        </div>
      </section>

      <section data-section="sheet">
        <h2>3. Sheet 交互</h2>
        <p>点击工具调用节点，弹出 Sheet 查看执行详情。以「执行命令」（<code>F3.4d</code>，含 3 个命令事件）为例。</p>

        <div class="fp-sheet-pair">
          <div class="fp-sheet-pair-item">
            <span class="tag-fp">一级 sheet-概览</span>
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
          <div class="fp-sheet-pair-arrow"><span>›</span></div>
          <div class="fp-sheet-pair-item">
            <span class="tag-fp">二级 sheet-详情</span>
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
