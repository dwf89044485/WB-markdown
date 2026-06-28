// ============================================================
// CODE BLOCK — 代码块容器 交互设计文档
// ============================================================
// 4 种类型：可执行 / 可预览 / 静态 / 可视化
// 快照：复用 engine/markdown.js 的 renderStaticCodeCard
// ============================================================

import { renderStaticCodeCard } from '../engine/markdown.js';

// ── 样本数据（取自 engine/showcase-codeblock.js 的真实场景）──
const SAMPLES = {
  js: `// 计算当日营养摄入汇总
function calcDailyNutrition(data) {
  const totals = data.meals.reduce((acc, meal) => {
    meal.items.forEach(item => {
      acc.calories += item.calories;
      acc.protein += item.protein;
    });
    return acc;
  }, { calories: 0, protein: 0 });
  return totals;
}`,
  html: `<div class="nutrition-card">
  <header class="nc-header">
    <h2>今日营养</h2>
    <span class="nc-date">2026-06-27</span>
  </header>
  <div class="nc-ring">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="42" stroke="#eee" fill="none"/>
    </svg>
  </div>
</div>`,
  json: `{
  "date": "2026-06-27",
  "user": "Joseph",
  "goal": { "calories": 2000, "protein": 100 },
  "meals": [
    { "type": "breakfast", "calories": 450 }
  ]
}`,
  mermaid: `flowchart LR
  A[点击+按钮] --> B{选择来源}
  B -- 拍照识别 --> C[AI识别食物]
  B -- 手动搜索 --> D[食物库匹配]
  C --> E[确认营养数据]
  D --> E`,
};

// ── 快照缓存 ──
const snapCache = {};
function snap(key, ...args) {
  if (!snapCache[key]) snapCache[key] = renderStaticCodeCard(...args);
  return snapCache[key];
}

function getSnapshots() {
  return {
    anatomy:       snap('anatomy',      { lang: 'javascript', code: SAMPLES.js }),
    typeExec:      snap('typeExec',     { lang: 'javascript', code: SAMPLES.js }),
    typeView:      snap('typeView',     { lang: 'html',       code: SAMPLES.html }),
    typeStatic:    snap('typeStatic',   { lang: 'json',       code: SAMPLES.json }),
    typeVisual:    snap('typeVisual',   { lang: 'mermaid',    code: SAMPLES.mermaid }),
    foldCollapsed: snap('foldCollapsed', { lang: 'javascript', code: SAMPLES.js, collapsed: true }),
    foldExpanded:  snap('foldExpanded',  { lang: 'javascript', code: SAMPLES.js, collapsed: false }),
  };
}

// ── 展示辅助 ──
function labeled(label, html) {
  return `<div class="fp-snapshot-wrap">
    <span class="tag">${label}</span>
    <div class="fp-snapshot">${html}</div>
  </div>`;
}

export default {
  id: 'code-block',
  type: 'feature',
  label: '代码块容器',
  anchors: {},
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>代码块容器</h1>
        <p class="fp-subtitle">AI 回答中展示代码片段的统一卡片 · 由语言类型驱动按钮组合与交互能力</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>代码块容器是 AI 消息气泡内用于承载代码片段的通用卡片，左侧标题标注语言、右侧按钮区提供操作、下方代码区可折叠展开。</p>
        <h3>使用场景</h3>
        <ul>
          <li>AI 输出可执行代码（JavaScript / Python / Shell）</li>
          <li>AI 输出可预览的 HTML 结构</li>
          <li>AI 输出配置文件、数据结构（JSON / YAML / CSS）</li>
          <li>AI 输出 Mermaid 流程图</li>
        </ul>
        <h3>设计目标</h3>
        <p>用一个容器覆盖所有代码展示需求——通过语言类型自动推导按钮组合，避免为每种语言设计独立组件；同时用折叠机制控制长代码对对话流的干扰。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 构成</h2>
        <p>所有代码块共用同一套外壳结构，区别只在按钮组合和代码区折叠行为。以可执行类（JavaScript）为例：</p>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-snapshot">${s.anatomy}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 标题栏</h4>
            <blockquote>
              <p>左侧显示语言名（如 JavaScript / HTML / JSON）。未识别语言首字母大写做标题。</p>
            </blockquote>
            <h4>② 主操作按钮</h4>
            <blockquote>
              <p>黑色胶囊按钮，因类型不同而不同：可执行类 → ▶ 运行；可预览类 → ● 预览；静态类 / 可视化类 无主按钮。</p>
            </blockquote>
            <h4>③ 次操作按钮组</h4>
            <blockquote>
              <p>图标按钮组，统一包含复制 / 分享 / 全屏。可视化类额外加「保存图片」。</p>
            </blockquote>
            <h4>④ 代码区</h4>
            <blockquote>
              <p>代码区域，支持语法高亮着色，提升代码可读性。</p>
            </blockquote>
            <h4>⑤ 折叠展开按钮</h4>
            <blockquote>
              <p>代码区底部居中，超过 280px 自动折叠为「展开」按钮；点击切换折叠 / 展开态。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="types">
        <h2>3. 类型</h2>
        <p>由语言类型推导出 4 种类型，每种类型的按钮组合不同。<strong>主按钮的有无和功能是区分类型的唯一视觉标记</strong>。</p>
        <div class="fp-snapshot-row">
          ${labeled('可执行', s.typeExec)}
          ${labeled('可预览', s.typeView)}
          ${labeled('静态', s.typeStatic)}
          ${labeled('可视化', s.typeVisual)}
        </div>
        <blockquote>
          <p><strong>可执行</strong>（js / py / sh）→ ▶ 运行；<strong>可预览</strong>（html）→ ● 预览；<strong>静态</strong>（json / css / yaml）→ 无主按钮；<strong>可视化</strong>（mermaid / 表格）→ 无主按钮 + 保存图片。</p>
        </blockquote>
      </section>

      <section data-section="interactions">
        <h2>4. 交互与状态</h2>

        <h3>4.1 折叠与展开</h3>
        <p>代码区高度超过 280px 时自动折叠，底部出现「展开」按钮。点击切换两个状态：</p>
        <div class="fp-snapshot-row">
          ${labeled('折叠态', s.foldCollapsed)}
          ${labeled('展开态', s.foldExpanded)}
        </div>
        <blockquote>
          <p>折叠态默认展示前几行 + 渐隐遮罩 + 展开按钮；展开态完整显示代码，按钮文案变为收起。短代码（≤ 280px）不出现折叠按钮。</p>
        </blockquote>

        <h3>4.2 全屏查看</h3>
        <p>点击工具栏「全屏」按钮，弹出底部 Sheet 在全屏视口内查看完整代码：</p>
        <div class="fp-snapshot-row">
          ${labeled('卡片内', s.typeExec)}
        </div>
        <blockquote>
          <p>非 Mermaid 代码块点击全屏 → 弹出底部 Sheet，Sheet 内展示代码全文并支持语法高亮；HTML 类额外支持「预览 / 代码」模式切换。Mermaid 和表格的全屏走独立的全屏组件。</p>
          <p>退出全屏：点击 Sheet 顶部下拉条或右上角关闭按钮，也可下拉滑动关闭。</p>
        </blockquote>

        <h3>4.3 运行与预览</h3>
        <p>主按钮行为由类型决定——可执行类点击「运行」执行代码，可预览类点击「预览」渲染 HTML：</p>
        <div class="fp-snapshot-row">
          ${labeled('▶ 运行（可执行）', s.typeExec)}
          ${labeled('● 预览（可预览）', s.typeView)}
        </div>
        <blockquote>
          <p>运行按钮触发代码执行并输出结果；预览按钮将 HTML 代码渲染为可视化卡片。静态类和可视化类无主按钮，不参与此交互。</p>
          <p>运行 / 预览完成后，代码区下方会展开结果区域：运行类显示执行输出或报错信息；预览类显示渲染后的 HTML 效果。再次点击主按钮可收起结果区域。</p>
        </blockquote>

        <h3>4.4 状态反馈</h3>
        <table>
          <thead><tr><th>交互状态</th><th>视觉反馈</th><th>说明</th></tr></thead>
          <tbody>
            <tr><td>运行中</td><td>主按钮文案变为「运行中…」，按钮禁用</td><td>防止重复点击，执行完成后恢复</td></tr>
            <tr><td>运行成功</td><td>结果区域展开，展示输出内容</td><td>输出内容以等宽字体呈现</td></tr>
            <tr><td>运行失败</td><td>结果区域展开，红色文案提示错误信息</td><td>保留代码原文，方便用户修改后重试</td></tr>
            <tr><td>复制成功</td><td>复制按钮短暂变为「已复制」</td><td>1.5 秒后自动恢复</td></tr>
          </tbody>
        </table>
      </section>

      <section data-section="edge-cases">
        <h2>5. 边界与异常</h2>
        <p>代码块容器需要处理代码长度、语言识别、空内容等极端场景：</p>
        <table>
          <thead><tr><th>边界场景</th><th>体验要求</th></tr></thead>
          <tbody>
            <tr><td>超长代码（&gt; 280px）</td><td>自动折叠，不撑爆对话流；全屏 Sheet 查看完整内容</td></tr>
            <tr><td>短代码（≤ 280px）</td><td>不出现折叠按钮，完整展示</td></tr>
            <tr><td>未识别语言</td><td>语言名首字母大写做标题，类型走静态，无主按钮</td></tr>
            <tr><td>空代码块</td><td>仍渲染卡片外壳（标题 + 按钮），代码区为空</td></tr>
            <tr><td>Mermaid 渲染失败</td><td>回退为纯文本代码展示，保留保存图片按钮</td></tr>
          </tbody>
        </table>
      </section>
    </article>`;
  },
};
