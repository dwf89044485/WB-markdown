// ============================================================
// CODE BLOCK — 代码块容器 交互设计文档
// ============================================================
// 4 种类型：可执行 / 可预览 / 静态 / 可视化
// 快照：复用 engine/markdown.js 的 renderStaticCodeCard
// 全屏快照：复用 Demo 的 code-sheet-panel / tbl-fullscreen-overlay DOM 结构
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
| 晚餐 | 鸡胸肉沙拉 | 380 kcal | 36g | 已记录 |`,
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
    // 折叠与展开：用长代码样本，确保超过 280px 阈值
    foldCollapsed: snap('foldCollapsed', { lang: 'javascript', code: SAMPLES.jsLong, collapsed: true }),
    foldExpanded:  snap('foldExpanded',  { lang: 'javascript', code: SAMPLES.jsLong, collapsed: false }),
    // 全屏查看 — 对话流中的卡片快照
    fsCardJs:      snap('fsCardJs',     { lang: 'javascript', code: SAMPLES.jsLong, collapsed: true }),
    fsCardHtml:    snap('fsCardHtml',   { lang: 'html',       code: SAMPLES.html, collapsed: null }),
    fsCardTable:   snap('fsCardTable',  { lang: 'mermaid',    code: SAMPLES.mermaid, collapsed: null }),
    fsCardMermaid: snap('fsCardMermaid',{ lang: 'mermaid',    code: SAMPLES.mermaid, collapsed: null }),
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

// ── 全屏快照辅助 ──
// 复用 Demo 的真实 DOM 结构（code-sheet-panel / tbl-fullscreen-overlay），
// 包裹在 .fp-fs-preview 容器内，以"预览模式"展示。
// 样式由 feature-panel.css 中 .fp-fs-preview 专门控制（不依赖 phone-shell 定位）。

function fsSheetPreview({ title, bodyHtml, actionsHtml }) {
  return `<div class="fp-fs-preview fp-fs-sheet">
    <div class="fp-fs-preview-label">底部 Sheet 模态</div>
    <div class="code-sheet-overlay is-open fp-fs-static">
      <div class="code-sheet-backdrop"></div>
      <div class="code-sheet-panel">
        <header class="code-sheet-header">
          <div class="code-sheet-left">
            <span class="code-sheet-title">${title}</span>
          </div>
          <div class="code-sheet-actions glass-capsule">${actionsHtml}</div>
        </header>
        <div class="code-sheet-body">${bodyHtml}</div>
      </div>
    </div>
  </div>`;
}

function fsLandscapePreview({ title, bodyHtml, actionsHtml }) {
  return `<div class="fp-fs-preview fp-fs-landscape">
    <div class="fp-fs-preview-label">横屏二级页模态</div>
    <div class="tbl-fullscreen-overlay is-active fp-fs-static">
      <div class="tbl-fs-nav">
        <button class="tbl-fs-back" aria-label="返回" disabled>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3.5L5.5 8L10 12.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="tbl-fs-title">${title}</div>
        <div class="tbl-fs-actions">${actionsHtml}</div>
      </div>
      <div class="tbl-fs-content md">${bodyHtml}</div>
    </div>
  </div>`;
}

// 玻璃胶囊按钮组 HTML（复用 Demo 的图标和 class）
// 从 window.WORKBUDDY_INLINE_ICONS 取图标，与 Demo 完全一致
function getInlineIcon(name) {
  const reg = (typeof window !== 'undefined' && window.WORKBUDDY_INLINE_ICONS) || {};
  const raw = reg[name];
  if (!raw) return '';
  return raw
    .replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')
    .replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"');
}

const ICON_COPY = () => getInlineIcon('wb-copy.svg');
const ICON_SHARE = () => getInlineIcon('wb-share.svg');
const ICON_IMAGE = () => getInlineIcon('image.svg');
const ICON_CLOSE = () => getInlineIcon('wb-close.svg');
const ICON_RUN = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0ZM7.38086 5.70898C6.70946 5.30615 6.37376 5.10444 6.12012 5.24805C5.86664 5.39174 5.86621 5.78353 5.86621 6.56641V9.43359C5.86621 10.2165 5.86664 10.6083 6.12012 10.752C6.37376 10.8956 6.70946 10.6939 7.38086 10.291L9.77051 8.85742C10.4087 8.47449 10.7285 8.2831 10.7285 8C10.7285 7.7169 10.4087 7.52551 9.77051 7.14258L7.38086 5.70898Z"/></svg>';
const ICON_VIEW = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path fill="currentColor" d="M8 1.14551C9.6472 1.14551 11.1583 1.6536 12.5332 2.6709C13.9081 3.68831 14.9194 5.04667 15.5674 6.74512L15.998 8.19238L16 8.2041C15.5529 10.2747 14.5828 11.9687 13.0898 13.2861C11.5967 14.6036 9.89997 15.2627 8 15.2627C6.10009 15.2627 4.40335 14.6036 2.91016 13.2861C1.41714 11.9687 0.447029 10.2747 0 8.2041C0.447021 6.13325 1.41696 4.43859 2.91016 3.12109C4.40335 1.8036 6.10009 1.14551 8 1.14551ZM8 4.75684C7.04822 4.75684 6.23551 5.09359 5.5625 5.7666C4.88952 6.43961 4.55273 7.25234 4.55273 8.2041C4.55277 9.15581 4.88953 9.96863 5.5625 10.6416C6.23549 11.3145 7.04828 11.6504 8 11.6504C8.95172 11.6504 9.76452 11.3146 10.4375 10.6416C11.1105 9.96863 11.4462 9.15581 11.4463 8.2041C11.4463 7.25238 11.1104 6.43959 10.4375 5.7666C9.76451 5.09361 8.95174 4.75686 8 4.75684ZM8 5.99707C8.60931 5.99709 9.12974 6.21275 9.56055 6.64355C9.99129 7.07436 10.2061 7.59481 10.2061 8.2041C10.206 8.81331 9.99134 9.33379 9.56055 9.76465C9.12975 10.1954 8.60929 10.4101 8 10.4102C7.39078 10.4102 6.87033 10.1954 6.43945 9.76465C6.00866 9.33379 5.79301 8.81331 5.79297 8.2041C5.79297 7.59477 6.00865 7.07438 6.43945 6.64355C6.87035 6.21272 7.39072 5.99707 8 5.99707Z"/></svg>';

// Sheet 按钮组：运行 + 复制 + 分享 + 分隔线 + 关闭
function sheetActionsCode() {
  return `<button class="code-sheet-btn-primary" aria-label="运行" disabled>${ICON_RUN}<span>运行</span></button><button class="code-sheet-btn" aria-label="复制" disabled>${ICON_COPY()}</button><button class="code-sheet-btn" aria-label="分享" disabled>${ICON_SHARE()}</button><span class="code-sheet-divider" aria-hidden="true"></span><button class="code-sheet-btn" aria-label="关闭" disabled>${ICON_CLOSE()}</button>`;
}
// Sheet 按钮组：预览/代码切换 + 复制 + 分享 + 分隔线 + 关闭
function sheetActionsHtml() {
  return `<button class="code-sheet-btn-primary" aria-label="预览" disabled>${ICON_VIEW}<span>预览</span></button><button class="code-sheet-btn" aria-label="复制" disabled>${ICON_COPY()}</button><button class="code-sheet-btn" aria-label="分享" disabled>${ICON_SHARE()}</button><span class="code-sheet-divider" aria-hidden="true"></span><button class="code-sheet-btn" aria-label="关闭" disabled>${ICON_CLOSE()}</button>`;
}
// 横屏按钮组：复制 + 保存图片 + 分享
function landscapeActions() {
  return `<button class="tbl-fs-btn" data-action="copy" aria-label="复制" disabled></button><button class="tbl-fs-btn" data-action="save-image" aria-label="保存图片" disabled></button><button class="tbl-fs-btn" data-action="share" aria-label="分享" disabled></button>`;
}

function escapeHtmlFs(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
        <p>代码区高度超过 280px（约屏幕 1/3）时自动折叠，底部出现渐隐遮罩和「展开」按钮。点击切换两个状态——折叠态限高 280px 并用渐隐遮罩遮住溢出部分，展开态完整显示代码，按钮文案变为「收起」、箭头旋转 180°。</p>
        <div class="fp-snapshot-row">
          ${labeled('折叠态（限高 280px + 渐隐遮罩）', s.foldCollapsed, 'fp-collapse-demo')}
          ${labeled('展开态（完整代码 + 收起按钮）', s.foldExpanded, 'fp-collapse-demo')}
        </div>
        <blockquote>
          <p>折叠态：代码区 <code>max-height: 280px</code>，底部 80px 渐变白色遮罩（<code>linear-gradient</code>），展开按钮定位在遮罩上方居中，文案「展开」。</p>
          <p>展开态：代码区不限高，完整显示，展开按钮文案变为「收起」，箭头图标 <code>rotate(180deg)</code>。</p>
          <p>短代码（≤ 280px）不出现折叠按钮，完整展示。</p>
        </blockquote>

        <h3>4.2 全屏查看</h3>
        <p>点击工具栏「全屏」按钮后，根据代码块类型进入两种不同的全屏模态：</p>

        <h4>4.2.1 底部 Sheet 模态（代码类）</h4>
        <p>可执行类（js / py / sh）、可预览类（html）、静态类（json / css / yaml）点击全屏 → 从底部滑入 Sheet 面板，覆盖到导航栏下方。Sheet 顶部为标题 + 玻璃胶囊按钮组，内容区展示完整代码并支持语法高亮。</p>
        <div class="fp-fs-flow">
          <div class="fp-fs-flow-step">
            <div class="fp-fs-flow-label">对话流中的卡片</div>
            ${labeled('JavaScript 代码块（折叠态）', s.fsCardJs)}
          </div>
          <div class="fp-fs-flow-arrow">↓ 点击全屏按钮</div>
          <div class="fp-fs-flow-step">
            <div class="fp-fs-flow-label">底部 Sheet 全屏</div>
            ${fsSheetPreview({
              title: 'JavaScript',
              bodyHtml: `<pre><code class="lang-javascript">${escapeHtmlFs(SAMPLES.jsLong)}</code></pre>`,
              actionsHtml: sheetActionsCode()
            })}
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
            <div class="fp-fs-flow-label">对话流中的卡片</div>
            ${labeled('Mermaid 代码块', s.fsCardMermaid)}
          </div>
          <div class="fp-fs-flow-arrow">↓ 点击全屏按钮</div>
          <div class="fp-fs-flow-step">
            <div class="fp-fs-flow-label">横屏二级页全屏</div>
            ${fsLandscapePreview({
              title: 'Mermaid',
              bodyHtml: `<div class="tbl-mermaid-fs"><div style="padding:24px;color:var(--md-text-muted);font-size:14px;text-align:center;">Mermaid SVG 渲染区</div></div>`,
              actionsHtml: landscapeActions()
            })}
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