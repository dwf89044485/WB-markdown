// ============================================================
// SHEET-CONTENT — Sheet 内容类型 交互设计文档
// ============================================================
// 快照：直接复用左侧 Demo 的渲染函数
//       renderStaticSheet() → 事件行 HTML
//       renderStaticSheetShell() → Sheet 外壳 HTML
//       renderStaticDetail() → 二级详情 HTML
// 数据：直接从 scenario.js 的 sheetFrames 读取，不自己定义
// ============================================================

import { renderStaticSheet, renderStaticDetail, renderStaticSheetShell } from '../engine/sheet.js';

// ── 从 scenario.js 读取 sheetFrames 数据 ──────
const SF = () => (window.WORKBUDDY_SCENARIO && window.WORKBUDDY_SCENARIO.sheetFrames) || {};

// ── 快照缓存 ──────────────────────────────────
const snapCache = {};
function snap(key, ...args) {
  if (!snapCache[key]) snapCache[key] = renderStaticSheet(...args);
  return snapCache[key];
}

// ── 带 Sheet 外壳的快照 ────────────────────────
const SHELL_W = '340px';
function shellSnap(key, events, opts = {}) {
  const body = snap(key, events);
  const isEmpty = !events || !events.length;
  return renderStaticSheetShell({
    body,
    width: SHELL_W,
    height: isEmpty ? '120px' : 'auto',
    showClose: false,
    showOverlay: false,
    borderRadius: '12px',
    ...opts,
  });
}

// ── 辅助：带标签的 Sheet 快照 ──────────────────
function sheetLabeled(label, events, opts = {}) {
  const key = label.replace(/\s+/g, '-');
  const html = shellSnap(key, events, opts);
  return `<div class="fp-snapshot-wrap"><div class="fp-tag-row"><span class="tag">${label}</span></div><div class="fp-snapshot">${html}</div></div>`;
}

function detailLabeled(label, detail) {
  const html = renderStaticDetail(detail);
  return `<div class="fp-snapshot-wrap"><div class="fp-tag-row"><span class="tag">${label}</span></div><div class="fp-snapshot">${html}</div></div>`;
}

// ── 从 sheetFrames 中提取各类型样本 ────────────
function pickEvents(...frameKeys) {
  const frames = SF();
  return frameKeys.flatMap(k => (frames[k] && frames[k].events) || []);
}

// 基础类型（无二级详情）
const TODO_CREATE_EVENTS = () => pickEvents('F1.a');
const SEARCH_WEB_EVENTS = () => pickEvents('F1.c');
const TODO_UPDATE_EVENTS = () => pickEvents('F1.h');
const IMAGE_GEN_EVENTS = () => pickEvents('F2.b');
const SKILL_CALL_EVENTS = () => pickEvents('F3.1b');
const FILE_SEARCH_EVENTS = () => pickEvents('F3.3b');

// 复杂类型（有二级详情）
const THINKING_EVENTS = () => pickEvents('T.a');
const CMD_EXEC_EVENTS = () => pickEvents('F3.4b');
const SUBAGENT_EVENTS = () => pickEvents('F3.4b'); // 复用执行命令展示 detail

// 混合类型（多事件组合）
const FILE_CREATE_EVENTS = () => pickEvents('F3.2e');
const FILE_SEARCH_EDIT_EVENTS = () => pickEvents('F3.3c');
const CMD_MULTI_EVENTS = () => pickEvents('F3.4c');

// 进行中状态
const RUNNING_EVENTS = () => [
  { icon: '🖥️', text: '正在执行命令', dim: 'python3 -c "import json; print(json.dumps(plan, ensure_ascii=False))"' },
];

// 二级详情样本
const SHEET_DETAIL = () => {
  const ev = CMD_EXEC_EVENTS();
  return ev[0] && ev[0].detail ? ev[0].detail : { sections: [] };
};

// 流式追加演示
const STREAM_EVENTS = () => [
  { icon: '🔍', text: '搜索网页', dim: '正在搜索签证/入境政策' },
  { icon: '🔍', text: '搜索网页', dim: '正在查询天气趋势' },
  { icon: '🔍', text: '搜索网页', dim: '正在查询汇率与预算换算' },
];

// 命令文本超长
const LONG_CMD_EVENTS = () => [{
  icon: '🖥️', text: '执行命令',
  dim: 'python3 -c "import json; import sys; data=json.load(sys.stdin); print(json.dumps({k: v for k, v in data.items() if v is not None}, ensure_ascii=False, indent=2))"',
}];

// 多条事件行（8条混合）
const MANY_EVENTS = () => Array.from({ length: 8 }, (_, i) => ({
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
}));

export default {
  id: 'sheet-content',
  type: 'feature',
  label: 'Sheet 内容类型',
  anchors: {},
  get content() {
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

        <h3>2.1 一级事件行</h3>
        <div class="fp-snapshot-side">
          <div>${sheetLabeled('思考过程', THINKING_EVENTS())}</div>
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
              <p>部分事件行（思考过程、编辑文件）携带 <code>card</code> 数据，在事件行下方直接展示摘要信息。</p>
            </blockquote>
          </div>
        </div>

        <h3>2.2 二级详情页</h3>
        <div class="fp-snapshot-side">
          <div>${detailLabeled('二级详情 · 执行命令', SHEET_DETAIL())}</div>
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
          ${sheetLabeled('创建待办', TODO_CREATE_EVENTS())}
          ${sheetLabeled('搜索网页', SEARCH_WEB_EVENTS())}
          ${sheetLabeled('更新待办', TODO_UPDATE_EVENTS())}
        </div>
        <div class="fp-snapshot-row">
          ${sheetLabeled('生成图片', IMAGE_GEN_EVENTS())}
          ${sheetLabeled('调用技能', SKILL_CALL_EVENTS())}
          ${sheetLabeled('搜索文件', FILE_SEARCH_EVENTS())}
        </div>

        <h3>3.2 复杂类型（有二级详情）</h3>
        <p>以下类型携带 <code>detail</code> 数据，事件行右侧显示 <code>›</code> 箭头，点击可展开二级详情页。</p>
        <div class="fp-snapshot-row">
          ${sheetLabeled('思考过程', THINKING_EVENTS())}
          ${sheetLabeled('执行命令', CMD_EXEC_EVENTS())}
        </div>

        <h3>3.3 混合类型（多事件组合）</h3>
        <p>同一工具调用阶段内可能包含多种事件类型，按时间顺序排列。例如创建文件阶段可能包含失败、创建、读取、编辑等多个事件。</p>
        <div class="fp-snapshot-row">
          ${sheetLabeled('创建文件阶段', FILE_CREATE_EVENTS())}
          ${sheetLabeled('搜索+编辑', FILE_SEARCH_EDIT_EVENTS())}
          ${sheetLabeled('多条执行命令', CMD_MULTI_EVENTS())}
        </div>
      </section>

      <section data-section="interaction">
        <h2>4. 交互与状态</h2>

        <h3>4.1 进行中 vs 已完成</h3>
        <p>事件行的状态由文本前缀决定：<strong>「正在」前缀表示进行中</strong>，去掉「正在」表示已完成。图标和文本颜色也随之变化。</p>
        <div class="fp-snapshot-row">
          ${sheetLabeled('进行中', RUNNING_EVENTS())}
          ${sheetLabeled('已完成', CMD_EXEC_EVENTS())}
        </div>
        <blockquote>
          <p><strong>进行中</strong>：文本带「正在」前缀，图标使用原始颜色，右上角有旋转加载动画。</p>
          <p><strong>已完成</strong>：文本去掉「正在」前缀，图标和文本变为灰色（<code>rgba(0,0,0,0.30)</code>），加载动画消失。</p>
        </blockquote>

        <h3>4.2 警告状态</h3>
        <p>工具调用失败时，事件行显示警告图标（⚠️），文本颜色变为橙色，不显示 <code>›</code> 箭头。</p>
        <div class="fp-snapshot-row">
          ${sheetLabeled('警告状态', pickEvents('F3.2b'))}
        </div>
        <blockquote>
          <p>警告状态由 <code>isWarningEvent()</code> 函数判断，匹配 <code>⚠</code>、<code>失败</code>、<code>异常</code> 等关键词。警告行使用独立的 <code>icon.warn</code> SVG 图标，不受 <code>inferToolIconKey</code> 推断影响。</p>
        </blockquote>

        <h3>4.3 信息卡片</h3>
        <p>部分事件行携带 <code>card</code> 数据，在事件行下方直接展示摘要信息卡片，无需点击展开。</p>
        <div class="fp-snapshot-row">
          ${sheetLabeled('思考过程卡片', THINKING_EVENTS())}
        </div>
        <blockquote>
          <p>卡片由 <code>event-card</code> 容器承载，包含 <code>event-card-title</code>（标题）和 <code>event-card-body</code>（正文）。流式渲染时，卡片正文以打字机效果逐字输出。</p>
        </blockquote>

        <h3>4.4 展开箭头</h3>
        <p>携带 <code>detail</code> 数据的事件行右侧显示 <code>›</code> 箭头，点击后从一级 Sheet 切换到二级详情页。</p>
        <div class="fp-snapshot-row">
          ${sheetLabeled('有箭头（可展开）', CMD_EXEC_EVENTS())}
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
          <div>${sheetLabeled('流式追加演示', STREAM_EVENTS())}</div>
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
            <tr><td>空状态</td><td>显示"当前状态暂无事件"占位符</td></tr>
            <tr><td>事件行过多（10+）</td><td>Sheet 内部纵向滚动，不影响 Sheet 高度</td></tr>
            <tr><td>二级详情 sections 为空</td><td>不渲染详情页，保持一级 Sheet 列表</td></tr>
            <tr><td>事件行 detail 数据缺失</td><td>不显示 <code>›</code> 箭头，事件行不可展开</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row">
          ${sheetLabeled('命令文本超长', LONG_CMD_EVENTS())}
          ${sheetLabeled('空状态', [])}
          ${sheetLabeled('多条事件行', MANY_EVENTS())}
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
