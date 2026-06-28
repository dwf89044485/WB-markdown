// ============================================================
// CODE BLOCK — 代码块容器 交互设计文档
// ============================================================
// 5 种类型：可执行 / 可预览 / 静态 / 可视化 / 表格
// 快照：复用 engine/markdown.js 的 renderStaticCodeCard
// 全屏快照：复用 engine/code-fullscreen-sheet.js 的 renderStaticCodeSheet
//           复用 engine/table-fullscreen.js 的 renderStaticTableFullscreen
// ============================================================

import { renderStaticCodeCard, renderStaticMermaidCard, markdownToHtml } from '../engine/markdown.js';
import { renderStaticCodeSheet } from '../engine/code-fullscreen-sheet.js';
import { renderStaticTableFullscreen } from '../engine/table-fullscreen.js';

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
  // 长代码样本 — 用于展示折叠态（超过 280px 阈值）
  jsLong: `// 计算当日营养摄入汇总
function calcDailyNutrition(data) {
  const totals = data.meals.reduce((acc, meal) => {
    meal.items.forEach(item => {
      acc.calories += item.calories;
      acc.protein += item.protein;
      acc.carbs += item.carbs || 0;
      acc.fat += item.fat || 0;
      acc.fiber += item.fiber || 0;
    });
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  return {
    ...totals,
    caloriesLeft: data.goal.calories - totals.calories,
    proteinLeft: data.goal.protein - totals.protein,
    progress: Math.min(1, totals.calories / data.goal.calories)
  };
}

// 示例
const result = calcDailyNutrition(todayData);
console.log(result.progress); // 0.85 → 完成 85%`,
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
  table: `| 餐次 | 主要食物 | 热量 | 蛋白质 | 状态 |
| --- | --- | --- | --- | --- |
| 早餐 | 鸡蛋三明治 + 牛奶 | 450 kcal | 20g | 已记录 |
| 午餐 | 番茄牛肉饭 | 650 kcal | 32g | 已记录 |
| 加餐 | 苹果 + 酸奶 | 220 kcal | 8g | 已记录 |
| 晚餐 | 鸡胸肉沙拉 | 380 kcal | 36g | 已记录 |
| 合计 | — | 1700 kcal | 96g | 接近目标 |`,
};

// ── 快照缓存 ──
const snapCache = {};
function snap(key, ...args) {
  if (!snapCache[key]) snapCache[key] = renderStaticCodeCard(...args);
  return snapCache[key];
}

function getSnapshots() {
  let tableCard = '<div style="color:red">表格渲染失败</div>';
  try {
    tableCard = markdownToHtml(SAMPLES.table);
  } catch (e) {
    console.error('[code-block] markdownToHtml error:', e);
    tableCard = `<div style="color:red">markdownToHtml 错误: ${e.message}</div>`;
  }
  return {
    typeExec:      snap('typeExec',     { lang: 'javascript', code: SAMPLES.js }),
    typeView:      snap('typeView',     { lang: 'html',       code: SAMPLES.html }),
    typeStatic:    snap('typeStatic',   { lang: 'json',       code: SAMPLES.json }),
    typeVisual:    renderStaticMermaidCard(SAMPLES.mermaid),
    typeTable:     tableCard,
    // 折叠与展开：用长代码样本，确保超过 280px 阈值
    foldCollapsed: snap('foldCollapsed', { lang: 'javascript', code: SAMPLES.jsLong, collapsed: true }),
    // 全屏查看 — 对话流中的卡片快照
    fsCardJs:      snap('fsCardJs',     { lang: 'javascript', code: SAMPLES.jsLong, collapsed: true }),
    fsCardHtml:    snap('fsCardHtml',   { lang: 'html',       code: SAMPLES.html, collapsed: null }),
    fsCardTable:   tableCard,
    fsCardMermaid: renderStaticMermaidCard(SAMPLES.mermaid),
  };
}

// ── 展示辅助 ──
function labeled(label, html, extraClass = '') {
  const cls = extraClass ? ` ${extraClass}` : '';
  return `<div class="fp-snapshot-wrap">
    <span class="tag">${label}</span>
    <div class="fp-snapshot${cls}">${html}</div>
  </div>`;
}

// ── 全屏预览包装器 ──
// 直接调用 engine 导出的真实渲染函数（完整 overlay DOM），
// 包裹在 .fp-fs-preview 容器内，由 feature-panel.css 覆盖 fixed/translateY 定位。
// 确保 Demo 改动时交互说明自动同步。
function fsSheetWrap(html) {
  return `<div class="fp-fs-preview fp-fs-sheet">
  <div class="fp-fs-preview-label">底部 Sheet 模态</div>
  ${html}
</div>`;
}
function fsLandscapeWrap(html) {
  return `<div class="fp-fs-preview fp-fs-landscape">
  <div class="fp-fs-preview-label">横屏二级页模态</div>
  ${html}
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
            <div class="fp-snapshot">${s.foldCollapsed}</div>
          </div>
            <div class="fp-snapshot-side-desc">
            <h4>① 标题栏</h4>
            <blockquote>
              <p>左侧显示语言名（如 JavaScript / HTML / JSON）。未识别语言首字母大写做标题。</p>
            </blockquote>
            <h4>② 操作按钮</h4>
            <blockquote>
              <p>操作按钮区，固定的按钮为复制、分享、放大，此外，不同类型还会对应出现不同按钮，具体见3.类型</p>
            </blockquote>
            <h4>③ 内容区</h4>
            <blockquote>
              <p>代码区域，支持语法高亮着色，提升代码可读性。</p>
              <p>当内容超过280px时，出现"查看全部"按钮，点击拉起Sheet。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="types">
        <h2>3. 类型</h2>
        <div class="fp-snapshot-row">
          ${labeled('可执行', s.typeExec)}
          ${labeled('可预览', s.typeView)}
          ${labeled('静态', s.typeStatic)}
          ${labeled('可视化', s.typeVisual)}
          ${labeled('表格', s.typeTable)}
        </div>
      </section>

      <section data-section="interactions">
        <h2>4. 交互与状态</h2>

        <h3>4.1 折叠与查看全部</h3>
        <p>代码区高度超过 280px（约屏幕 1/3）时自动折叠，底部出现渐隐遮罩和「查看全部」按钮。点击后拉起二级 Sheet 查看完整代码，关闭后回到折叠态。</p>
        <div class="fp-snapshot-row">
          ${labeled('折叠态（限高 280px + 渐隐遮罩）', s.foldCollapsed, 'fp-collapse-demo')}
        </div>
        <blockquote>
          <p>折叠态：代码区 <code>max-height: 280px</code>，底部 80px 渐变白色遮罩（<code>linear-gradient</code>），「查看全部」按钮定位在遮罩上方居中。</p>
          <p>点击「查看全部」→ 从底部滑入二级 Sheet，完整展示代码并支持语法高亮；关闭 Sheet 后回到对话流折叠态。</p>
          <p>短代码（≤ 280px）不出现折叠按钮，完整展示。</p>
        </blockquote>

        <h3>4.2 全屏查看</h3>
        <p>点击工具栏「全屏」按钮后，根据代码块类型进入两种不同的全屏模态：</p>

        <h4>4.2.1 底部 Sheet 模态（代码类）</h4>
        <p>可执行类（js / py / sh）、可预览类（html）、静态类（json / css / yaml）点击全屏 → 从底部滑入 Sheet 面板，覆盖到导航栏下方。Sheet 顶部为标题 + 玻璃胶囊按钮组，内容区展示完整代码并支持语法高亮。</p>
        <div class="fp-fs-flow">
          <div class="fp-fs-flow-step">
            <div class="fp-fs-flow-label">对话流代码块渲染</div>
            <div class="fp-snapshot-wrap">
              <div class="fp-snapshot">${s.fsCardJs}</div>
            </div>
          </div>
          <div class="fp-fs-flow-step">
            <div class="fp-fs-flow-label">点击展开底部 Sheet 全屏</div>
            ${fsSheetWrap(renderStaticCodeSheet({ lang: 'javascript', code: SAMPLES.jsLong }))}
          </div>
        </div>
        <blockquote>
          <p>Sheet 结构：<code>code-sheet-panel</code> 从底部上滑（<code>translateY(102%) → 0</code>），圆角 30px，顶部 <code>code-sheet-header</code>（左标题 + 右玻璃胶囊按钮组），下方 <code>code-sheet-body</code> 展示完整代码。</p>
          <p>HTML 类型的 Sheet 额外支持「预览 / 代码」模式切换：顶栏主按钮在两种模式间切换，预览模式用 iframe 渲染 HTML。</p>
          <p>退出全屏：点击关闭按钮或下拉滑动关闭。</p>
        </blockquote>

        <h4>4.2.2 横屏二级页模态（可视化类）</h4>
        <p>可视化类（mermaid / 表格）点击全屏 → 手机壳物理旋转为横屏，进入全屏二级页面。顶部导航栏（返回按钮 + 标题 + 玻璃胶囊按钮组），内容区横向铺满展示 Mermaid SVG 或表格。</p>
        <div class="fp-fs-flow">
          <div class="fp-fs-flow-step">
            <div class="fp-fs-flow-label">对话流代码块渲染</div>
            <div class="fp-snapshot-wrap">
              <div class="fp-snapshot">${s.fsCardMermaid}</div>
            </div>
          </div>
          <div class="fp-fs-flow-step">
            <div class="fp-fs-flow-label">点击展开进入二级页横屏</div>
            ${fsLandscapeWrap(renderStaticTableFullscreen({
              title: 'Mermaid',
              bodyHtml: `<div class="tbl-mermaid-fs"><div class="mermaid">${SAMPLES.mermaid}</div></div>`,
              type: 'mermaid'
            }))}
          </div>
        </div>
        <blockquote>
          <p>横屏结构：<code>tbl-fullscreen-overlay</code> 全屏覆盖，<code>phone-shell</code> 物理旋转为横屏尺寸（852×393），隐藏对话流和输入框。<code>tbl-fs-nav</code> 导航栏（左返回 + 中标题 + 右玻璃胶囊按钮组），<code>tbl-fs-content</code> 内容区横向滚动。</p>
          <p>表格类型：内容区复用 <code>tbl-outer</code> 结构，支持横向滚动。Mermaid 类型：内容区渲染 SVG，居中自适应缩放。</p>
          <p>退出全屏：点击左上角返回按钮，手机壳旋转回竖屏。</p>
        </blockquote>

        <h4>4.2.3 两种模态的对比</h4>
        <table>
          <thead><tr><th>对比项</th><th>底部 Sheet 模态</th><th>横屏二级页模态</th></tr></thead>
          <tbody>
            <tr><td>适用类型</td><td>可执行 / 可预览 / 静态</td><td>可视化（Mermaid / 表格）</td></tr>
            <tr><td>触发方式</td><td>点击全屏按钮</td><td>点击全屏按钮</td></tr>
            <tr><td>进入动画</td><td>底部上滑（translateY）</td><td>手机壳物理旋转</td></tr>
            <tr><td>布局方向</td><td>竖屏</td><td>横屏</td></tr>
            <tr><td>导航栏</td><td>标题 + 按钮组（无返回）</td><td>返回 + 标题 + 按钮组</td></tr>
            <tr><td>按钮组</td><td>复制 / 分享 / 关闭（+ 运行或预览）</td><td>复制 / 保存图片 / 分享</td></tr>
            <tr><td>退出方式</td><td>关闭按钮 / 下拉滑动</td><td>返回按钮</td></tr>
          </tbody>
        </table>

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
