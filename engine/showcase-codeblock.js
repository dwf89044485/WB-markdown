// engine/showcase-codeblock.js
// 「代码块样式」场景：独立展示 4 种容器样式，与剧本无关
// 触发：index.html 中带 data-scene="codeblock-showcase" 的按钮
// 行为：暂停剧本播放 → 清空对话区 → 渲染静态 markdown 内容

import { markdownToHtml } from './markdown.js';
import { pauseDirector } from './player.js';
import { pushRoute } from './feature-router.js';

const SHOWCASE_MARKDOWN = `# 今日营养摄入组件方案

好的，我来帮你做一个简单的「今日营养摄入」组件。先把数据结构、UI 和交互理清楚，再给具体实现。

### 一、数据结构

每日数据按这个格式存储，餐次按时间排序：

\`\`\`json
{
  "date": "2026-06-27",
  "user": "Joseph",
  "goal": { "calories": 2000, "protein": 100 },
  "meals": [
    {
      "type": "breakfast",
      "items": [
        { "name": "鸡蛋三明治", "calories": 320, "protein": 14 },
        { "name": "牛奶（全脂 200ml）", "calories": 130, "protein": 6 }
      ]
    },
    {
      "type": "lunch",
      "items": [
        { "name": "番茄牛肉饭", "calories": 650, "protein": 32 }
      ]
    }
  ]
}
\`\`\`

### 二、今日餐次概览

| 餐次 | 主要食物 | 热量 | 蛋白质 | 状态 |
| --- | --- | --- | --- | --- |
| 早餐 | 鸡蛋三明治 + 牛奶 | 450 kcal | 20g | 已记录 |
| 午餐 | 番茄牛肉饭 | 650 kcal | 32g | 已记录 |
| 加餐 | 苹果 + 酸奶 | 220 kcal | 8g | 已记录 |
| 晚餐 | 鸡胸肉沙拉 | 380 kcal | 36g | 已记录 |
| 合计 | — | 1700 kcal | 96g | 接近目标 |

### 三、核心计算逻辑

把当天所有餐次合并成一个汇总，并算出离目标值的差距：

\`\`\`javascript
// 计算当日营养摄入汇总
function calcDailyNutrition(data) {
  const totals = data.meals.reduce((acc, meal) => {
    meal.items.forEach(item => {
      acc.calories += item.calories;
      acc.protein += item.protein;
    });
    return acc;
  }, { calories: 0, protein: 0 });

  return {
    ...totals,
    caloriesLeft: data.goal.calories - totals.calories,
    proteinLeft: data.goal.protein - totals.protein,
    progress: Math.min(1, totals.calories / data.goal.calories)
  };
}

// 示例
const result = calcDailyNutrition(todayData);
console.log(result.progress); // 0.85 → 完成 85%
\`\`\`

### 四、组件 UI

下面是渲染出来的卡片样式，可以直接嵌入移动端 H5：

\`\`\`html
<div class="nutrition-card">
  <header class="nc-header">
    <h2>今日营养</h2>
    <span class="nc-date">2026-06-27</span>
  </header>

  <div class="nc-ring">
    <svg viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="42" stroke="var(--color-border-weak)" stroke-width="8" fill="none"/>
      <circle cx="50" cy="50" r="42" stroke="var(--color-accent-green)" stroke-width="8" fill="none"
              stroke-dasharray="263" stroke-dashoffset="40"
              transform="rotate(-90 50 50)"/>
    </svg>
    <div class="nc-ring-text">
      <strong>1700</strong>
      <span>/ 2000 kcal</span>
    </div>
  </div>

  <ul class="nc-meals">
    <li><span>早餐</span><span>450 kcal</span></li>
    <li><span>午餐</span><span>650 kcal</span></li>
    <li><span>加餐</span><span>220 kcal</span></li>
    <li><span>晚餐</span><span>380 kcal</span></li>
  </ul>
</div>
\`\`\`

### 五、用户操作流程

新增一条饮食记录的完整闭环：

\`\`\`mermaid
flowchart LR
  A[点击+按钮] --> B{选择来源}
  B -- 拍照识别 --> C[AI 识别食物]
  B -- 手动搜索 --> D[食物库匹配]
  C --> E[确认营养数据]
  D --> E
  E --> F[写入今日记录]
  F --> G[环形进度条更新]
\`\`\`

接下来如果要继续，我可以补一份完整的 React 组件（含状态管理）+ 一个 Mock 接口给你调试。要做哪个？
`;

export function renderShowcase() {
  const conv = document.getElementById('conv');
  if (!conv) return;

  // 暂停剧本播放，避免 typewriter 继续往里塞内容
  try { pauseDirector(); } catch (e) { /* ignore */ }

  // 隐藏对话流相关的固定元素：用户气泡、agent 包裹、timing-bar、final 渲染区
  const idsToHide = ['userMsgWrap', 'agentMsg'];
  idsToHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('is-hidden');
  });

  // 移除可能由剧本播放生成的 .agent-msg / .user-msg-wrap 节点（不是固定 id 的）
  conv.querySelectorAll('.agent-msg:not(#agentMsg), .user-msg-wrap:not(#userMsgWrap)').forEach(n => n.remove());
  // 也清理 final-block / response-actions 等渲染产物
  conv.querySelectorAll('.final-block, .response-actions, .timing-bar').forEach(n => n.remove());

  // 移除上次渲染的 showcase 容器（如果有）
  const oldShowcase = document.getElementById('showcaseMount');
  if (oldShowcase) oldShowcase.remove();

  // 渲染 showcase 内容
  const mount = document.createElement('div');
  mount.id = 'showcaseMount';
  mount.className = 'agent-msg showcase-msg';
  mount.innerHTML = `<div class="md">${markdownToHtml(SHOWCASE_MARKDOWN)}</div>`;
  conv.appendChild(mount);

  // 触发 highlight.js 高亮所有代码块（mermaid 跳过）
  if (window.hljs) {
    mount.querySelectorAll('pre code').forEach(el => {
      if (el.classList.contains('lang-mermaid')) return;
      try { window.hljs.highlightElement(el); } catch (e) { /* ignore */ }
    });
  }

  // 渲染 mermaid 图（替换源码为 SVG）
  if (window.__wbRenderMermaid) window.__wbRenderMermaid(mount);

  // 评估代码块是否需要折叠（超过 280px 就折叠）
  if (window.__wbEvalCodeCollapse) window.__wbEvalCodeCollapse();

  // 滚到顶部
  conv.scrollTop = 0;
}

document.querySelectorAll('[data-scene="codeblock-showcase"]').forEach(btn => {
  btn.addEventListener('click', () => {
    // 切换 active 态
    document.querySelectorAll('.dc-scene-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    renderShowcase();

    // 联动右侧 Feature Panel：跳转到 code-block 交互说明
    pushRoute('feature', 'code-block');
  });
});
