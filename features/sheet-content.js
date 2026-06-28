// ============================================================
// SHEET-CONTENT — Sheet 内容类型 交互设计文档
// ============================================================
// 展示 Sheet 内部所有工具调用事件行的类型、状态和交互
// 快照：由 engine/sheet.js 的 renderStaticSheet() 实时渲染
//       改左边事件行样式 → 右边文档自动同步
// ============================================================

import { renderStaticSheet, renderStaticDetail, renderStaticSheetShell, renderEvent } from '../engine/sheet.js';

// ── 快照缓存 ──────────────────────────────────
const snapCache = {};
function snap(key, ...args) {
  if (!snapCache[key]) snapCache[key] = renderStaticSheet(...args);
  return snapCache[key];
}

// ── 样本数据：每种工具调用类型的 events ────────

// 1. 思考过程（🧠 → agent）
const THINKING_EVENTS = [
  { icon: '🧠', text: '思考过程', card: { title: '需求识别', body: '收到一个旅行规划请求。用户需要为一家四口设计关西7日行程。初步分析，这是典型的家庭旅行规划任务，涉及签证政策查询、交通方案设计、景点筛选等多个维度。' } },
];

// 2. 创建待办（☐ → plan）
const TODO_CREATE_EVENTS = [
  { icon: '☐', text: '创建待办', dim: '任务理解与分解：明确需求、约束和输出格式' },
];

// 3. 搜索网页（🔍 → search）
const SEARCH_WEB_EVENTS = [
  { icon: '🔍', text: '搜索网页', dim: '正在搜索签证/入境政策、交通卡信息' },
];

// 4. 搜索网页 - 带搜索结果
const SEARCH_RESULT_EVENTS = [
  { icon: '🔍', text: '搜索网页', dim: '10项搜索已完成' },
];

// 5. 更新待办（☑️ → plan）
const TODO_UPDATE_EVENTS = [
  { icon: '☑️', text: '更新待办', dim: '搜索信息已收集完毕，更新任务进度' },
];

// 6. 生成图片（🖼️ → image）
const IMAGE_GEN_EVENTS = [
  { icon: '🖼️', text: '生成图片' },
];

// 7. 调用技能（📖 → skill）
const SKILL_CALL_EVENTS = [
  { icon: '📖', text: '调用技能', dim: 'docx' },
];

// 8. 创建文件（✏️ → edit / ⚠️ → debug / 👀 → view）
const FILE_CREATE_EVENTS = [
  { icon: '⚠️', text: '文件创建失败' },
  { icon: '✏️', text: '创建文件', dim: 'generate_plan.js' },
  { icon: '👀', text: '读取文件', dim: 'JS …generate_plan.js  308-317' },
  { icon: '✏️', text: '编辑文件', dim: 'JS …generate_plan.js  +1 -1', card: { title: 'Edit patch', body: '+1 -1 · 修正脚本中的异常字符。' } },
];

// 9. 搜索文件（🔍 → search）
const FILE_SEARCH_EVENTS = [
  { icon: '🔍', text: '搜索文件', dim: '\\u81EA\\u7136|\\u81EA\\u7然' },
];

// 10. 执行命令（🖥️ → terminal）— 有二级详情
const CMD_EXEC_EVENTS = [
  { icon: '🖥️', text: '执行命令', dim: 'python3 -c "import json; print(json.dumps(plan, ensure_ascii=False))"',
    detail: {
      sections: [
        { label: '输入命令', variant: 'code', content: 'python3 -c "import json; print(json.dumps(plan, ensure_ascii=False))"' },
        { label: '输出结果', variant: 'text', content: '{"title": "日本关西旅行方案", "days": [{"day": 1, "city": "大阪", "spots": ["道顿堀", "大阪城"]}]}' },
        { label: '退出码', variant: 'text', content: '0' },
      ],
    },
  },
];

// 11. 搜索文件 + 编辑文件（混合）
const FILE_SEARCH_EDIT_EVENTS = [
  { icon: '🔍', text: '搜索文件', dim: '\\u81EA\\u7136|\\u81EA\\u7然' },
  { icon: '✏️', text: '编辑文件', dim: '… +1 -1' },
];

// 12. 委派 Subagent（🐱 → agent）
const SUBAGENT_EVENTS = [
  { icon: '🐱', text: 'Sub Coding Agent', dim: 'Rewrite docx generator script' },
  { icon: '↳', text: '嵌套子对话流', card: { title: 'Subagent result', body: '重写 docx generator script，移除异常转义，重新生成文档。' } },
];

// 13. 多事件混合（执行命令多条）
const CMD_MULTI_EVENTS = [
  { icon: '🖥️', text: '执行命令', dim: 'python3 -c "import json; d=json.load(open(\'plan.json\')); print(d[\'title\'])"',
    detail: {
      sections: [
        { label: '输入命令', variant: 'code', content: 'python3 -c "import json; d=json.load(open(\'plan.json\')); print(d[\'title\'])"' },
        { label: '输出结果', variant: 'text', content: '日本关西旅行方案 v1.0' },
        { label: '退出码', variant: 'text', content: '0' },
      ],
    },
  },
  { icon: '🖥️', text: '执行命令', dim: 'cd /sessions/6a2189a4ac3de7 && git diff --stat',
    detail: {
      sections: [
        { label: '输入命令', variant: 'code', content: 'cd /sessions/6a2189a4ac3de7 && git diff --stat' },
        { label: '输出结果', variant: 'text', content: 'plan.json      | 2 +-\nitinerary.md   | 15 +++++++++++++++\n3 files changed, 17 insertions(+), 1 deletion(-)' },
        { label: '退出码', variant: 'text', content: '0' },
      ],
    },
  },
];

// ── 二级详情样本 ──
const SHEET_DETAIL = {
  title: '执行命令',
  sections: [
    { label: '输入命令', variant: 'code', content: 'python3 -c "import json; print(json.dumps(plan, ensure_ascii=False))"' },
    { label: '输出结果', variant: 'text', content: '{"title": "日本关西旅行方案", "days": [{"day": 1, "city": "大阪", "spots": ["道顿堀", "大阪城"]}]}' },
    { label: '退出码', variant: 'text', content: '0' },
  ],
};

function getSnapshots() {
  return {
    // §2 构成
    anatomy: snap('anatomy', THINKING_EVENTS),

    // §3 类型
    typeThinking:    snap('typeThinking', THINKING_EVENTS),
    typeTodoCreate:  snap('typeTodoCreate', TODO_CREATE_EVENTS),
    typeSearchWeb:   snap('typeSearchWeb', SEARCH_WEB_EVENTS),
    typeTodoUpdate:  snap('typeTodoUpdate', TODO_UPDATE_EVENTS),
    typeImageGen:    snap('typeImageGen', IMAGE_GEN_EVENTS),
    typeSkillCall:   snap('typeSkillCall', SKILL_CALL_EVENTS),
    typeFileCreate:  snap('typeFileCreate', FILE_CREATE_EVENTS),
    typeFileSearch:  snap('typeFileSearch', FILE_SEARCH_EVENTS),
    typeCmdExec:     snap('typeCmdExec', CMD_EXEC_EVENTS),
    typeSubagent:    snap('typeSubagent', SUBAGENT_EVENTS),
    typeCmdMulti:    snap('typeCmdMulti', CMD_MULTI_EVENTS),
    typeFileSearchEdit: snap('typeFileSearchEdit', FILE_SEARCH_EDIT_EVENTS),

    // §4 状态
    stateRunning:  snap('stateRunning', [{ icon: '🖥️', text: '正在执行命令', dim: 'python3 -c "import json; print(json.dumps(plan, ensure_ascii=False))"' }]),
    stateDone:     snap('stateDone', CMD_EXEC_EVENTS),
    stateWarning:  snap('stateWarning', [{ icon: '⚠️', text: '文件创建失败' }]),
    stateCard:     snap('stateCard', THINKING_EVENTS),
    stateChevron:  snap('stateChevron', CMD_EXEC_EVENTS),

    // §5 动效
    motionStream: snap('motionStream', [
      { icon: '🔍', text: '搜索网页', dim: '正在搜索签证/入境政策' },
      { icon: '🔍', text: '搜索网页', dim: '正在查询天气趋势' },
      { icon: '🔍', text: '搜索网页', dim: '正在查询汇率与预算换算' },
    ]),

    // §6 边界
    edgeLong: snap('edgeLong', [
      { icon: '🖥️', text: '执行命令', dim: 'python3 -c "import json; import sys; data=json.load(sys.stdin); print(json.dumps({k: v for k, v in data.items() if v is not None}, ensure_ascii=False, indent=2))"' },
    ]),
    edgeEmpty: snap('edgeEmpty', []),
    edgeMany: snap('edgeMany', Array.from({ length: 8 }, (_, i) => ({
      icon: i % 2 === 0 ? '🔍' : '🖥️',
      text: i % 2 === 0 ? '搜索网页' : '执行命令',
      dim: `第 ${i + 1} 项工具调用`,
      detail: i % 2 === 1 ? {
        sections: [
          { label: '输入命令', variant: 'code', content: `echo "task ${i + 1}"` },
          { label: '输出结果', variant: 'text', content: `task ${i + 1} completed` },
          { label: '退出码', variant: 'text', content: '0' },
        ],
      } : undefined,
    }))),
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

// 带锚点按钮
function labeledWithAnchor(label, html, anchorId) {
  return `<div class="fp-snapshot-wrap"><div class="fp-tag-row"><span class="tag">${label}</span><button class="dc-btn" data-anchor="${anchorId}">查看示例<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><div class="fp-snapshot">${html}</div></div>`;
}

export default {
  id: 'sheet-content',
  type: 'feature',
  label: 'Sheet 内容类型',
  anchors: {},
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>Sheet 内容类型</h1>
        <p class="fp-subtitle">工具调用事件行 · Sheet 内部承载的所有事件类型、状态与交互</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>工具调用事件行是 Sheet 内部的基本内容单元，每条事件行对应 Agent 的一次工具调用——搜索网页、执行命令、生成图片、创建文件等。事件行按时间顺序从上到下排列，构成 Agent 执行过程的完整记录。</p>
        <h3>使用场景</h3>
        <ul>
          <li>Agent 执行过程中，每次工具调用产生一条事件行</li>
          <li>用户点击状态行上的 <code>›</code> 展开二级详情时，Sheet 展示该工具调用的完整细节</li>
          <li>多条工具调用并行或连续执行时，事件行逐条追加</li>
        </ul>
        <h3>设计目标</h3>
        <p>让 Agent 的每一次工具调用都<strong>可感知、可追溯、可展开</strong>——用户能快速扫一眼知道 Agent 在做什么，也能深入查看每条调用的原始细节。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 事件行构成</h2>
        <p>每条工具调用事件行由图标、文本、状态标记和可选的展开入口组成。事件行有两种层级：<strong>一级事件行</strong>展示概要信息，<strong>二级详情</strong>展示完整细节。</p>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">一级事件行 · 思考过程</span>
            <div class="fp-snapshot">${s.anatomy}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 图标区</h4>
            <blockquote>
              <p>每种工具调用类型有专属图标，支持 SVG 内联注册和 <code>img</code> 回退。图标颜色由 CSS 变量 <code>--tool-{key}-color</code> 控制。</p>
            </blockquote>
            <h4>② 文本区</h4>
            <blockquote>
              <p>主文本显示工具调用名称（如"搜索网页"、"执行命令"），副文本（dim）显示具体参数或上下文摘要。</p>
            </blockquote>
            <h4>③ 展开箭头 <code>›</code></h4>
            <blockquote>
              <p>当事件行携带 <code>detail</code> 数据时显示，点击后从一级 Sheet 切换到二级详情页。</p>
            </blockquote>
            <h4>④ 信息卡片</h4>
            <blockquote>
              <p>部分事件行（思考过程、编辑文件、Subagent）携带 <code>card</code> 数据，在事件行下方直接展示摘要信息。</p>
            </blockquote>
          </div>
        </div>

        <h3>2.2 二级详情页</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">二级详情 · 执行命令</span>
            <div class="fp-snapshot">${renderStaticDetail(SHEET_DETAIL)}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 返回按钮</h4>
            <blockquote>
              <p>左上角返回箭头，点击回到一级 Sheet 列表。返回时保留一级 Sheet 的滚动位置。</p>
            </blockquote>
            <h4>② 详情卡片</h4>
            <blockquote>
              <p>按 <code>sections</code> 数组顺序渲染，每项包含标签（label）和内容（content）。内容支持 <code>text</code> 和 <code>code</code> 两种变体。</p>
            </blockquote>
            <h4>③ 滑入动效</h4>
            <blockquote>
              <p>二级详情页从右侧滑入，返回时从左侧滑出。与 Sheet 升起方向垂直，形成空间层次感。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="types">
        <h2>3. 工具调用类型</h2>
        <p>目前共有 <strong>10 种</strong>工具调用类型，按图标和文本自动推断。每种类型有专属图标和视觉风格。</p>

        <h3>3.1 基础类型（无二级详情）</h3>
        <p>以下类型展示概要信息，不携带 <code>detail</code> 数据，事件行无 <code>›</code> 箭头。</p>
        <div class="fp-snapshot-row">
          ${labeled('创建待办', s.typeTodoCreate)}
          ${labeled('搜索网页', s.typeSearchWeb)}
          ${labeled('更新待办', s.typeTodoUpdate)}
        </div>
        <div class="fp-snapshot-row">
          ${labeled('生成图片', s.typeImageGen)}
          ${labeled('调用技能', s.typeSkillCall)}
          ${labeled('搜索文件', s.typeFileSearch)}
        </div>

        <h3>3.2 复杂类型（有二级详情）</h3>
        <p>以下类型携带 <code>detail</code> 数据，事件行右侧显示 <code>›</code> 箭头，点击可展开二级详情页。</p>
        <div class="fp-snapshot-row">
          ${labeled('思考过程', s.typeThinking)}
          ${labeled('执行命令', s.typeCmdExec)}
          ${labeled('委派 Subagent', s.typeSubagent)}
        </div>

        <h3>3.3 混合类型（多事件组合）</h3>
        <p>同一工具调用阶段内可能包含多种事件类型，按时间顺序排列。例如创建文件阶段可能包含失败、创建、读取、编辑等多个事件。</p>
        <div class="fp-snapshot-row">
          ${labeled('创建文件阶段', s.typeFileCreate)}
          ${labeled('搜索+编辑', s.typeFileSearchEdit)}
          ${labeled('多条执行命令', s.typeCmdMulti)}
        </div>
      </section>

      <section data-section="interaction">
        <h2>4. 交互与状态</h2>

        <h3>4.1 进行中 vs 已完成</h3>
        <p>事件行的状态由文本前缀决定：<strong>「正在」前缀表示进行中</strong>，去掉「正在」表示已完成。图标和文本颜色也随之变化。</p>
        <div class="fp-snapshot-row">
          ${labeled('进行中', s.stateRunning)}
          ${labeled('已完成', s.stateDone)}
        </div>
        <blockquote>
          <p><strong>进行中</strong>：文本带「正在」前缀，图标使用原始颜色，右上角有旋转加载动画。</p>
          <p><strong>已完成</strong>：文本去掉「正在」前缀，图标和文本变为灰色（<code>rgba(0,0,0,0.30)</code>），加载动画消失。</p>
        </blockquote>

        <h3>4.2 警告状态</h3>
        <p>工具调用失败时，事件行显示警告图标（⚠️），文本颜色变为橙色，不显示 <code>›</code> 箭头。</p>
        <div class="fp-snapshot-row">
          ${labeled('警告状态', s.stateWarning)}
        </div>
        <blockquote>
          <p>警告状态由 <code>isWarningEvent()</code> 函数判断，匹配 <code>⚠</code>、<code>失败</code>、<code>异常</code> 等关键词。警告行使用独立的 <code>icon.warn</code> SVG 图标，不受 <code>inferToolIconKey</code> 推断影响。</p>
        </blockquote>

        <h3>4.3 信息卡片</h3>
        <p>部分事件行携带 <code>card</code> 数据，在事件行下方直接展示摘要信息卡片，无需点击展开。</p>
        <div class="fp-snapshot-row">
          ${labeled('思考过程卡片', s.stateCard)}
        </div>
        <blockquote>
          <p>卡片由 <code>event-card</code> 容器承载，包含 <code>event-card-title</code>（标题）和 <code>event-card-body</code>（正文）。流式渲染时，卡片正文以打字机效果逐字输出。</p>
        </blockquote>

        <h3>4.4 展开箭头</h3>
        <p>携带 <code>detail</code> 数据的事件行右侧显示 <code>›</code> 箭头，点击后从一级 Sheet 切换到二级详情页。</p>
        <div class="fp-snapshot-row">
          ${labeled('有箭头（可展开）', s.stateChevron)}
        </div>
        <blockquote>
          <p>点击箭头后，当前 Sheet 状态被保存到 <code>sheetBackState</code>，左上角出现返回按钮。二级详情页以 <code>slide-in-right</code> 动效滑入。</p>
        </blockquote>
      </section>

      <section data-section="motion">
        <h2>5. 动效</h2>
        <p>Sheet 内容层有两个核心动效：事件行的流式追加和二级详情页的滑入滑出。</p>

        <h3>5.1 流式追加</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">流式追加演示</span>
            <div class="fp-snapshot">${s.motionStream}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>事件行从上到下逐条出现，间隔由 <code>frameDelay</code>（默认 520ms）控制。每条事件行出现时无入场动画（直接出现），但 Sheet 内容区自动滚动到底部。</p>
            <table>
              <thead>
                <tr><th>参数</th><th>值</th><th>意图</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>帧间隔</td>
                  <td>520ms（默认）</td>
                  <td>让用户有时间感知每条事件的出现，又不会太慢</td>
                </tr>
                <tr>
                  <td>打字机速度</td>
                  <td>200 tokens/s（默认）</td>
                  <td>卡片正文以打字机效果逐字输出，与 AI 消息打字速度一致</td>
                </tr>
                <tr>
                  <td>自动滚动</td>
                  <td>每次追加后</td>
                  <td>新事件始终出现在可视区域内</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>事件行之间没有入场动画——它们不是"弹入"的，而是"出现"的。这保持了 Sheet 作为"记录"的客观感，避免过度动效干扰阅读。</p>
            </blockquote>
          </div>
        </div>

        <h3>5.2 二级详情滑入</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-side-desc">
            <p>点击 <code>›</code> 箭头后，二级详情页从右侧滑入，覆盖一级 Sheet 的列表视图。返回时从左侧滑出。</p>
            <table>
              <thead>
                <tr><th>方向</th><th>时长</th><th>缓动</th><th>意图</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>滑入（入场）</td>
                  <td>300ms</td>
                  <td>ease-out</td>
                  <td>详情页从右侧"推入"，末尾减速让内容落座</td>
                </tr>
                <tr>
                  <td>滑出（出场）</td>
                  <td>250ms</td>
                  <td>ease-in-out</td>
                  <td>比入场略快，避免返回后的等待感</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>二级详情页的滑入方向与 Sheet 升起方向垂直（Sheet 从下往上，详情从右往左），形成空间的层次感——用户能直觉地感知"我在 Sheet 内部又深入了一层"。</p>
            </blockquote>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">二级详情页</span>
            <div class="fp-snapshot">${renderStaticDetail(SHEET_DETAIL)}</div>
          </div>
        </div>
      </section>

      <section data-section="edge-cases">
        <h2>6. 边界与异常</h2>
        <p>边界状态的重点不是"能不能装下"，而是极端内容下仍然不能影响判断。</p>
        <table>
          <thead>
            <tr><th>边界</th><th>体验要求</th></tr>
          </thead>
          <tbody>
            <tr><td>命令文本超长</td><td>事件行自然截断，不破坏行内布局</td></tr>
            <tr><td>空状态</td><td>显示"当前状态暂无新增事件"占位符</td></tr>
            <tr><td>事件行过多（10+）</td><td>Sheet 内部纵向滚动，不影响 Sheet 高度</td></tr>
            <tr><td>二级详情 sections 为空</td><td>不渲染详情页，保持一级 Sheet 列表</td></tr>
            <tr><td>事件行 detail 数据缺失</td><td>不显示 <code>›</code> 箭头，事件行不可展开</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row">
          ${labeled('命令文本超长', s.edgeLong)}
          ${labeled('空状态', s.edgeEmpty)}
          ${labeled('多条事件行', s.edgeMany)}
        </div>
      </section>

      <section data-section="rationale">
        <h2>7. 设计原理</h2>
        <h3>为什么事件行没有入场动画？</h3>
        <p>Sheet 的职责是"记录"而不是"表演"。事件行逐条出现已经提供了足够的时序感知，再加入场动画会让用户觉得 Sheet 在"播放"而不是"记录"。保持事件行的直接出现，有助于维持 Sheet 作为客观执行日志的认知。</p>
        <h3>为什么二级详情用滑入而不是展开？</h3>
        <p>二级详情的内容结构（标签 + 代码块）与一级 Sheet 的列表结构完全不同，内联展开会破坏列表的视觉连续性。滑入切换提供了"翻到下一页"的直觉，用户不会觉得内容被替换了。</p>
        <h3>为什么图标推断用关键词匹配而不是显式声明？</h3>
        <p>工具调用类型由 Agent 动态生成，无法预知所有可能的工具名。关键词匹配让系统能自动为新工具分配合理图标，而不需要每次新增工具都改代码。匹配失败时回退到通用 <code>tools</code> 图标。</p>
      </section>

      <section data-section="related">
        <h2>8. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>事件行按时间顺序从上到下排列，最新的在最下方。</li>
              <li>携带 detail 的事件行显示 <code>›</code> 箭头，让用户知道可以展开。</li>
              <li>警告状态使用独立图标颜色，与正常状态明显区分。</li>
              <li>卡片正文使用打字机效果输出，与 AI 消息打字速度一致。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要给没有 detail 的事件行显示 <code>›</code> 箭头，会误导用户。</li>
              <li>不要在同一事件行中混合多个工具调用（应该拆分为多条事件行）。</li>
              <li>不要让事件行文本过长不截断，会破坏行内布局。</li>
              <li>不要在二级详情页中再嵌套二级详情，会破坏导航层次。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};
