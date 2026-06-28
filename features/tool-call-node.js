// ============================================================
// TOOL CALL NODE — 工具调用节点 交互设计文档（完整版）
// ============================================================
// 快照：复用 engine/icons.js 的 statusLineHTML / statusStackHTML
//       + engine/sheet.js 的 renderStaticSheet / renderStaticDetail
// 锚点：跳转到 Demo 中工具调用节点的真实画面
// ============================================================

import { statusLineHTML, statusStackHTML } from '../engine/icons.js';
import { renderStaticSheet, renderStaticDetail, getFrames } from '../engine/sheet.js';
import { glassCloseBtn, glassNavBtn, GLYPH_PREV } from '../engine/ask-question.js';

// ── 样例数据 ───────────────────────────────────────
const L = {
  run:  '正在执行命令',
  done: '执行命令',
};

// 第 2 节「设计样式」循环 demo 用 3 条不同任务
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
function modeBlock(modeLabel, phoneClass, initialLine) {
  const isStack = phoneClass === 'tool-call-stack';
  return `<div class="fp-tcn-mode-demo ${phoneClass}" data-mode="${modeLabel}">
    <button type="button" class="step-detail-link is-running fp-tcn-mode-line${isStack ? ' tcn-stack-mode' : ''}" tabindex="-1" data-initial-state="running">${initialLine}</button>
  </div>`;
}

// ── Sheet 章节的样例（用 F3.4d，3 条执行命令）──────────
const SHEET_FRAMES = getFrames('F3.4d');
const SHEET_EVENTS = SHEET_FRAMES.flatMap(f => f.events || []);
const SHEET_DETAIL = SHEET_EVENTS[1]?.detail;

// ── 图标推断查找表（用于 §2 构成说明）─────────────────
// 来源：engine/icons.js → inferToolIconKey() 的 regex 匹配规则
const ICON_RULES = [
  { pattern: '🧠/思考/subagent/agent',  key: 'agent',    label: 'Agent/子任务' },
  { pattern: '🖼/图片/image',           key: 'image',    label: '生成图片' },
  { pattern: '📖/技能/skill/docx',      key: 'skill',    label: '调用技能' },
  { pattern: '⚠/失败/异常/debug',       key: 'debug',    label: '调试警告' },
  { pattern: '✏/编辑/创建文件/patch',    key: 'edit',     label: '创建/编辑文件' },
  { pattern: '👀/读取/查看/view/read',   key: 'view',     label: '读取文件' },
  { pattern: '🖥/执行命令/terminal',     key: 'terminal', label: '执行命令' },
  { pattern: '☑/待办/计划/todo',         key: 'plan',     label: '待办管理' },
  { pattern: '🔍/搜索/search',           key: 'search',   label: '搜索网页' },
  { pattern: '网页/网站/联网',            key: 'website',  label: '网页访问' },
  { pattern: '（无匹配）',                key: 'tools',    label: '默认工具图标' },
];

// ── 快照缓存 ───────────────────────────────────────
const snapCache = {};
function snap(key, html) {
  if (!snapCache[key]) snapCache[key] = html;
  return snapCache[key];
}

function getSnapshots() {
  return {
    // §2 构成：单个工具进行中（用于结构拆解）
    anatomy: snap('anatomy', sl(['正在执行命令'], { state: 'running' })),

    // §3 状态：单工具
    singleRunning: snap('singleRunning', sl(['正在执行命令'], { state: 'running' })),
    singleDone:    snap('singleDone',    sl(['执行命令'])),

    // §3 状态：多工具
    multiRunning:  snap('multiRunning',  sl(['搜索网页', '创建文件', '正在读取文件'], { state: 'running' })),
    multiDone:     snap('multiDone',     sl(['搜索网页', '创建文件', '读取文件'])),

    // §4 设计样式：3 模式
    modeFlat:  snap('modeFlat',  modeBlock('文字', 'tool-call-flat', statusLineHTML(M_PHASE0))),
    modeStack: snap('modeStack', modeBlock('堆叠', 'tool-call-stack', statusStackHTML(['执行命令', '搜索网页', '创建文件']))),
    modeCard:  snap('modeCard',  modeBlock('边框', 'tool-call-card', statusLineHTML(M_PHASE0))),

    // §5 动效：扫光 demo（reuse singleRunning，扫光由 CSS 自动播放）
    sweepDemo: snap('sweepDemo', sl(['正在执行命令'], { state: 'running' })),

    // §6 Sheet（复用现有）
    sheetOverview: snap('sheetOverview', renderStaticSheet(SHEET_EVENTS)),
    sheetDetail:   snap('sheetDetail',  renderStaticDetail(SHEET_DETAIL)),

    // §7 边界
    edgeLongName:  snap('edgeLongName',  sl(['正在这是一个非常非常长的工具名称可能会超出预期宽度'], { state: 'running' })),
    edgeManyTools: snap('edgeManyTools', sl(['工具1', '工具2', '工具3', '工具4', '工具5', '正在工具6'], { state: 'running' })),
    edgeIconFallback: snap('edgeIconFallback', sl(['正在未知工具类型'], { state: 'running' })),
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

// ── 锚点目标节点（scenario.js 第 538 行 nodes 数组）──
// nodes[0] = n1「任务理解与分解」— 含「正在创建待办」「正在搜索网页」等 tool call
// nodes[2] = n3「整合信息」— 含「正在执行命令」「正在委派 Subagent」等 tool call
const STEP_N1 = 0;
const STEP_N3 = 2;

export default {
  id: 'tool-call-node',
  type: 'feature',
  label: '工具调用节点',
  anchors: {
    'single-appear': {
      nodeIndex: STEP_N1,
      actionOffset: 1,
      until: () => {
        const link = document.querySelector('.step-detail-link');
        return link && link.textContent.includes('创建待办');
      },
      label: '看工具调用节点画面',
    },
    'single-running': {
      nodeIndex: STEP_N1,
      actionOffset: 1,
      until: () => {
        const link = document.querySelector('.step-detail-link.is-running');
        return link && link.textContent.includes('创建待办');
      },
      label: '看执行中状态',
    },
  },
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>工具调用节点</h1>
        <p class="fp-subtitle">Agent 每一次工具调用的状态行 · 位于 AI 消息气泡内、思考按钮下方、正式回答上方</p>
      </header>

      <!-- ==================================================
           §1 概述
           ================================================== -->
      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>工具调用节点是 agent 在执行任务过程中<strong>调用外部工具时的状态指示器</strong>，位于 AI 消息气泡内、思考按钮下方、正式回答上方。它回答两个问题：「agent 正在干什么」和「干到哪了」。</p>

        <h3>使用场景</h3>
        <ul>
          <li>Agent 需要联网搜索时，显示「正在搜索网页」</li>
          <li>Agent 需要读写文件时，显示「正在创建文件」「正在读取文件」</li>
          <li>Agent 需要执行命令行工具时，显示「正在执行命令」</li>
          <li>Agent 需要调用外部技能时，显示「正在调用技能」</li>
          <li>Agent 需要委派子任务时，显示「正在委派 Subagent」</li>
        </ul>

        <h3>设计目标</h3>
        <p>让用户<strong>感知 agent 正在工作</strong>，而不是面对一个静止的界面等待。同时通过 Sheet 交互提供执行详情的回溯能力——工具调用不仅是"进度条"，还是"执行日志的入口"。</p>
      </section>

      <!-- ==================================================
           §2 构成（结构拆解）
           ================================================== -->
      <section data-section="anatomy">
        <h2>2. 构成（结构）</h2>
        <p>工具调用节点由工具图标、状态文字、分隔符、展开箭头和扫光动效组成。节点需要同时表达"正在执行什么"和"执行结果可回溯"。</p>

        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">完整节点结构（进行中状态）</span>
            <div class="fp-snapshot">${s.anatomy}</div>
            <button class="fp-anchor-btn" data-anchor="single-running" style="margin-top:12px">看左侧执行中示例</button>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 工具图标</h4>
            <blockquote>
              <p>根据工具类型自动推断（搜索→🔍、文件→📄、命令→🖥️、技能→📖、Agent→🧠）。推断失败时显示默认工具图标。</p>
            </blockquote>

            <h4>② 状态文字</h4>
            <blockquote>
              <p>进行中显示「正在XXX」，完成后去掉「正在」。文字颜色：进行中 <code>#999</code>（中性灰），完成后 <code>rgba(0,0,0,0.30)</code>（浅灰，退为背景）。</p>
            </blockquote>

            <h4>③ 分隔符 ·</h4>
            <blockquote>
              <p>多个工具时，用 <code>·</code>（U+00B7）分隔不同工具的状态行。分隔符宽度固定 8px（<code>.status-sep</code>），不随文字长度变化。</p>
            </blockquote>

            <h4>④ 展开箭头 ›</h4>
            <blockquote>
              <p>点击节点展开 Sheet 查看执行详情。完成后箭头保留，提示"可回溯"。进行中时箭头同样可点击——用户随时可以查看当前进度。</p>
            </blockquote>

            <h4>⑤ 扫光动效</h4>
            <blockquote>
              <p>仅在进行中的<strong>最后一条</strong>显示，左→右循环扫过，表示"正在处理中"。已完成的所有条目扫光消失。实现方式：<code>.status-fragments::after</code> 伪元素，不增加额外 DOM 节点。</p>
            </blockquote>
          </div>
        </div>

        <h3>图标推断规则</h3>
        <p>工具图标不是 agent 指定的，而是<strong>从工具调用数据（icon/text/dim/card.title）中自动推断</strong>的。这保证了视觉与行为的一致性——agent "说一套做一套"时，图标仍然准确。</p>
        <table>
          <thead>
            <tr><th>匹配模式</th><th>图标</th><th>典型场景</th></tr>
          </thead>
          <tbody>
            ${ICON_RULES.map(r => `<tr><td>${r.pattern}</td><td><code>${r.key}.svg</code></td><td>${r.label}</td></tr>`).join('')}
          </tbody>
        </table>
      </section>

      <!-- ==================================================
           §3 状态与触发
           ================================================== -->
      <section data-section="states">
        <h2>3. 状态与触发</h2>
        <p>两个状态，<strong>前缀「正在」是唯一的状态标记</strong>——同一工具调用在两个状态共用同一段文案，仅靠「正在」区分。不需要"失败"状态，因为工具调用失败通过权限确认框或错误提示表达，不混在节点里。</p>

        <h3>3.1 单个工具</h3>
        <div class="fp-states-row">
          <div class="fp-states-group">
            <span class="tag">单个工具的状态变化</span>
            <p class="fp-states-note">进行中行灰 <code>#999</code>，扫光 1.15s 左→右循环；完成后行浅灰 <code>rgba(0,0,0,0.30)</code>，扫光消失，<code>›</code> 保留可点击。</p>
            <div class="fp-states-inner-row">
              <div class="fp-snapshot-wrap">
                <span class="tag">进行中</span>
                <div class="fp-tcn-inline">${s.singleRunning}</div>
              </div>
              <div class="fp-snapshot-wrap">
                <span class="tag">已完成</span>
                <div class="fp-tcn-inline">${s.singleDone}</div>
              </div>
            </div>
            <blockquote>
              <p><strong>触发条件</strong>：Agent 开始调用工具时进入"进行中"（显示「正在XXX」+ 扫光动效）；工具执行完成后进入"已完成"（去掉「正在」，扫光消失，<code>›</code> 保留）。</p>
              <p><strong>用户可操作</strong>：进行中时可点击节点查看实时进度（Sheet 随执行过程流式更新）；完成后可点击节点回溯执行详情。</p>
            </blockquote>
          </div>
        </div>

        <h3>3.2 多个工具</h3>
        <div class="fp-states-row">
          <div class="fp-states-group">
            <span class="tag">多个工具的状态变化</span>
            <p class="fp-states-note">连续工具调用合并为同一条节点。已完成条目留在前面，进行中放在最末——<strong>只有最末那条带扫光</strong>。每完成一个工具，对应条目去掉「正在」，扫光"移到"下一个。</p>
            <div class="fp-states-inner-row">
              <div class="fp-snapshot-wrap">
                <span class="tag">进行中</span>
                <div class="fp-tcn-inline">${s.multiRunning}</div>
              </div>
              <div class="fp-snapshot-wrap">
                <span class="tag">已完成</span>
                <div class="fp-tcn-inline">${s.multiDone}</div>
              </div>
            </div>
            <blockquote>
              <p><strong>触发条件</strong>：每完成一个工具，对应条目从"进行中"变为"已完成"，扫光移到下一个工具；最后一个工具完成时，整条节点全部变为已完成态，扫光消失。</p>
              <p><strong>为什么扫光只出现在最后一条</strong>：多条工具顺序执行时，只有最后一条是"当前正在处理的"。如果每条各自扫光，用户会以为所有工具都在同时执行。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <!-- ==================================================
           §4 设计样式（3 种视觉模式）
           ================================================== -->
      <section data-section="modes">
        <h2>4. 设计样式</h2>
        <p>工具调用节点有 3 种视觉样式，通过给 <code>.phone-shell</code> 添加不同 class 切换。它们不是"主题"，而是<strong>信息密度和强调程度</strong>的不同选择。</p>

        <h3>4.1 文字模式（默认）</h3>
        <p>工具调用节点以<strong>文字链接</strong>形式内联在对话流中，无边框，像一段可点击的文字。适用于工具调用较少、不想打断阅读流的场景。</p>
        <div class="fp-snapshot-row fp-tcn-modes">
          <div class="fp-snapshot-wrap">
            <span class="tag">文字模式 · 进行中</span>
            <div class="fp-snapshot">${s.modeFlat}</div>
          </div>
        </div>
        <blockquote>
          <p><strong>何时使用</strong>：工具调用是"背景信息"，不是用户需要重点关注的内容。比如搜索网页、读取文件这类"准备步骤"。</p>
        </blockquote>

        <h3>4.2 堆叠模式</h3>
        <p>多条工具调用完成时，<strong>折叠为图标堆 + 已执行 N 项</strong>的紧凑形式。适用于工具调用很多、需要节省空间的场景。图标重叠排列（<code>margin-left: -5px</code>），有切角投影的"堆"效果。</p>
        <div class="fp-snapshot-row fp-tcn-modes">
          <div class="fp-snapshot-wrap">
            <span class="tag">堆叠模式 · 已完成态</span>
            <div class="fp-snapshot">${s.modeStack}</div>
          </div>
        </div>
        <blockquote>
          <p><strong>何时使用</strong>：同一节点包含 3 条以上工具调用时，自动切换为堆叠模式。用户不需要知道每条工具的细节，只需要知道"执行了 N 件事"。需要细节时，点击节点展开 Sheet 回溯。</p>
          </blockquote>

        <h3>4.3 边框模式</h3>
        <p>工具调用节点以<strong>卡片</strong>形式展示，有边框和圆角（<code>--cv-status-radius: 10px</code>）。适用于需要强调工具调用、或工具调用是核心交互的场景。</p>
        <div class="fp-snapshot-row fp-tcn-modes">
          <div class="fp-snapshot-wrap">
            <span class="tag">边框模式 · 进行中</span>
            <div class="fp-snapshot">${s.modeCard}</div>
          </div>
        </div>
        <blockquote>
          <p><strong>何时使用</strong>：工具调用是 agent 的核心动作（比如"执行命令"涉及真实系统操作），需要用户注意到它。边框模式让工具调用从对话流中"浮"出来。</p>
        </blockquote>

        <h3>4.4 模式切换规则</h3>
        <table>
          <thead>
            <tr><th>从</th><th>到</th><th>触发条件</th></tr>
          </thead>
          <tbody>
            <tr><td>文字模式</td><td>堆叠模式</td><td>同一节点包含 3 条以上工具调用，且全部完成</td></tr>
            <tr><td>文字模式</td><td>边框模式</td><td>工具调用涉及系统操作（执行命令、删除文件等）</td></tr>
            <tr><td>堆叠模式</td><td>文字模式</td><td>用户展开 Sheet 后，可以切换回文字模式（显示完整文字列表）</td></tr>
          </tbody>
        </table>
      </section>

      <!-- ==================================================
           §5 动效
           ================================================== -->
      <section data-section="motion">
        <h2>5. 动效</h2>
        <p>工具调用节点有两个核心动效：扫光（表示"正在处理"）和节点出现（表示"工具调用开始"）。两者各自承担不同的表意职责。</p>

        <h3>5.1 扫光动效</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage" data-motion-loop="sweep">
              ${s.sweepDemo}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>进行中的工具调用，状态文字上方会有一道白色扫光左→右循环扫过。扫光只出现在<strong>最后一条</strong>进行中的工具上，表示"当前正在处理这个"。</p>
            <table>
              <thead>
                <tr><th>参数</th><th>值</th><th>意图</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>时长</td>
                  <td>1.15s</td>
                  <td>足够让用户注意到"正在处理"，又不会因太快而忽略。循环间隔 0s（无缝循环）。</td>
                </tr>
                <tr>
                  <td>缓动</td>
                  <td>ease-in-out</td>
                  <td>扫光两端慢、中间快，模拟真实光效的物理感</td>
                </tr>
                <tr>
                  <td>方向</td>
                  <td>左→右（translateX -115% → +115%）</td>
                  <td>与自然阅读方向一致，引导视线跟随处理进度</td>
                </tr>
                <tr>
                  <td>颜色</td>
                  <td>白色 @ 72% 不透明度</td>
                  <td>足够明显，但不会完全遮挡文字。渐变过渡（transparent → white@72% → transparent）让扫光有"宽度"。</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>扫光使用 <code>::after</code> 伪元素实现，不增加额外 DOM 节点。但伪元素方案在渐变背景上效果不好（会露出渐变），目前只用于纯色/半透明背景。</p>
              <p style="color:#86868b;font-size:12px;margin-top:6px">左侧演示按真实参数循环：扫光 1.15s 无限循环，模拟"正在执行命令"的进行中状态。</p>
            </blockquote>
          </div>
        </div>

        <h3>5.2 节点出现动效</h3>
        <p>工具调用节点第一次出现时，从下方淡入上移（<code>agentIn 0.22s cubic-bezier(.2,.8,.2,1)</code>）。与 AskQuestion 面板的升降动效不同，工具调用节点的出现更轻量，因为它出现在对话流中，不是覆盖在内容上。</p>
        <table>
          <thead>
            <tr><th>参数</th><th>值</th><th>意图</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>时长</td>
              <td>0.22s</td>
              <td>比 AskQuestion 面板升降（0.3s）更快——工具调用节点是"流内元素"，不需要那么强的"到来感"</td>
            </tr>
            <tr>
              <td>缓动</td>
              <td>cubic-bezier(.2,.8,.2,1)</td>
              <td>快进慢收，末尾有落点感。与 agent 消息气泡的出现动效一致。</td>
            </tr>
            <tr>
              <td>位移</td>
              <td>translateY(8px) → 0</td>
              <td>从下方轻微移入，提示"新内容出现了"，但不会让用户觉得被打断</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- ==================================================
           §6 Sheet 交互
           ================================================== -->
      <section data-section="sheet">
        <h2>6. Sheet 交互</h2>
        <p>点击工具调用节点，弹出 Sheet 查看执行详情。以「执行命令」（<code>F3.4d</code>，含 3 个命令事件）为例。</p>

        <div class="fp-sheet-pair">
          <div class="fp-sheet-pair-item">
            <span class="tag">一级 sheet-概览</span>
            <div class="fp-sheet-mock">
              <div class="bottom-sheet fp-bottom-sheet-static">
                <div class="sheet-top">
                  <div class="sheet-top-start"></div>
                  <div class="sheet-handle"></div>
                  <div class="sheet-top-end">${glassCloseBtn()}</div>
                </div>
                <div class="sheet-body">${s.sheetOverview}</div>
              </div>
            </div>
          </div>
          <div class="fp-sheet-pair-arrow"><span>›</span></div>
          <div class="fp-sheet-pair-item">
            <span class="tag">二级 sheet-详情</span>
            <div class="fp-sheet-mock fp-sheet-mock-detail">
              <div class="bottom-sheet detail-mode fp-bottom-sheet-static">
                <div class="sheet-top">
                  <div class="sheet-top-start">${glassNavBtn(GLYPH_PREV, false)}</div>
                  <div class="sheet-handle"></div>
                  <div class="sheet-top-end">${glassCloseBtn()}</div>
                </div>
                <div class="sheet-body detail-mode">${s.sheetDetail}</div>
              </div>
            </div>
          </div>
        </div>

        <h3>6.1 Sheet 状态与交互</h3>
        <table>
          <thead>
            <tr><th>状态</th><th>触发</th><th>表现</th></tr>
          </thead>
          <tbody>
            <tr><td>收起（40% 高度）</td><td>点击工具调用节点</td><td>Sheet 从下方滑入，显示事件列表。可拖拽展开。</td></tr>
            <tr><td>展开（80% 高度）</td><td>向上拖拽超过 50% 阈值</td><td>Sheet 展开到 80% 高度，显示更多内容。只有滚动到顶时才能拖拽收起。</td></tr>
            <tr><td>详情模式</td><td>点击含 detail 的事件行</td><td>滑出二级 Sheet，显示详细输入/输出。带返回按钮。</td></tr>
            <tr><td>关闭</td><td>点击 ✕ 或向下拖拽</td><td>Sheet 滑出画面。若是从详情模式返回，则先回到一级 Sheet。</td></tr>
          </tbody>
        </table>

        <h3>6.2 Sheet 流式更新</h3>
        <p>工具调用进行中时打开 Sheet，事件列表会<strong>随执行过程流式更新</strong>——新事件从顶部逐条出现，待办状态在底部同步更新。这让用户不仅能"回溯"，还能"围观"执行过程。</p>
      </section>

      <!-- ==================================================
           §7 边界与异常
           ================================================== -->
      <section data-section="edge-cases">
        <h2>7. 边界与异常</h2>
        <p>边界状态的重点不是"能不能装下"，而是极端内容下仍然不能影响可读性和可点击性。</p>
        <table>
          <thead>
            <tr><th>边界</th><th>体验要求</th><th>实现方式</th></tr>
          </thead>
          <tbody>
            <tr><td>工具名称过长</td><td>文字自然折行，不压缩图标或箭头</td><td><code>.status-fragments</code> 允许折行，图标和箭头不压缩</td></tr>
            <tr><td>同时调用 10+ 个工具</td><td>堆叠模式图标堆横向滚动，计数文字保持可见</td><td>图标堆 <code>overflow-x: auto</code>，计数文字固定在右侧</td></tr>
            <tr><td>图标推断失败</td><td>显示默认 tools 图标，不中断流程</td><td><code>inferToolIconKey()</code> 无匹配时返回 <code>'tools'</code></td></tr>
            <tr><td>工具调用失败</td><td>不混在工具调用节点里，走独立错误提示</td><td>失败通过权限确认框或红色错误提示表达</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row edge-scroll">
          ${labeled('工具名称过长：自然折行', s.edgeLongName)}
          ${labeled('多工具（6 个）', s.edgeManyTools)}
          ${labeled('图标推断失败（默认图标）', s.edgeIconFallback)}
        </div>
      </section>

      <!-- ==================================================
           §8 设计原理
           ================================================== -->
      <section data-section="rationale">
        <h2>8. 设计原理</h2>

        <h3>为什么「正在」是唯一的状态标记，而不是"进行中/已完成/失败"三态？</h3>
        <p>工具调用的核心是"agent 正在做什么"。用户最关心的是"它现在在干吗"，而不是精细的状态分类。用「正在」一个前缀区分进行中/已完成，是最简方案——文案只需要一份，状态切换时只改前缀，不换整段文字。</p>
        <p>失败状态通过其他方式表达（红色提示、权限确认框），不混在工具调用节点里。如果失败了也显示在节点里，用户会以为"失败了但还在跑"，造成认知错配。</p>

        <h3>为什么扫光只在最后一条，而不是每条各自扫光？</h3>
        <p>多条工具同时执行时，只有最后一条是"当前正在处理的"。如果每条各自扫光，用户会以为所有工具都在同时执行，而实际上它们是顺序执行的。只扫最后一条，准确表达"当前进度"。</p>
        <p>这也带来一个副作用：当只有一条工具时，扫光在"这条"上；当有多条时，扫光在"最后一条"上。用户的视线会自然跟随扫光，不需要额外提示"当前在第几条"。</p>

        <h3>为什么堆叠模式完成时折叠为「图标堆 + 已执行 N 项」，而不是保留文字列表？</h3>
        <p>工具调用完成后，用户更关心"执行了什么"的结果摘要，而不是逐条细节。图标堆提供视觉摘要（不同工具类型一眼可辨），计数提供数量感。需要细节时，点击节点展开 Sheet 回溯。</p>
        <p>这是"默认紧凑、按需详细"的信息层次设计。工具调用节点在对话流中，不能占用太多垂直空间——堆叠模式把 6 条工具调用压缩成一行。</p>

        <h3>为什么工具图标要自动推断，而不是让 agent 显式指定？</h3>
        <p>自动推断降低 agent 的输出复杂度，也避免 agent "说一套做一套"（比如指定了搜索图标但实际在执行命令）。从工具调用数据推断图标，是保证视觉与行为一致性的最可靠方式。</p>
        <p>推断失败时有兜底（默认 tools 图标），不会因图标缺失而中断流程。</p>
      </section>

      <!-- ==================================================
           §9 Do / Don't
           ================================================== -->
      <section data-section="related">
        <h2>9. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>在 agent 真正调用工具时使用，让用户感知进度。</li>
              <li>工具名称使用动宾结构（"搜索网页"，不是"网页搜索"），与「正在」前缀自然衔接。</li>
              <li>多条工具调用合并为同一条节点，利用 Sheet 展示细节。</li>
              <li>工具调用完成后，保留节点可点击（Sheet 回溯），不要让完成态"消失"。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要用工具调用节点做长时间等待的 loading 指示器（超过 10s 的工具调用应考虑拆分）。</li>
              <li>不要手动指定工具图标，让自动推断系统工作。如果推断结果不对，改推断规则，而不是绕开它。</li>
              <li>不要在工具调用节点中混入确认类交互（确认应走独立的 Permission 组件）。</li>
              <li>不要让工具调用节点在对话流中"消失"——它是执行日志的入口，完成后仍然有价值。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};
