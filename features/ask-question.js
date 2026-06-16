// ============================================================
// ASK-QUESTION — AskQuestion 交互设计文档（图文并茂版）
// ============================================================
// 内容来源：docs/plans/2026-06-15-AskQuestion-交互设计文档.md（v2 已审）
// 快照：由 engine/ask-question.js 的 renderStaticAskQuestion() 实时渲染
//       改左边组件样式 → 右边文档自动同步
// ============================================================

import { renderStaticAskQuestion } from '../engine/ask-question.js';

// ── 样例数据（与 scenario.js 中 AskUser 的 questions 一致）──
const SAMPLE_Q = [
  { id: 'q1', type: 'single', question: '你希望住宿偏向哪种风格？', options: ['商务酒店', '日式旅馆', '民宿', '青旅'] },
  { id: 'q2', type: 'multiple', question: '你希望行程包含哪些类型？', options: ['寺庙神社', '自然风光', '购物美食', '文化体验'] },
  { id: 'q3', type: 'sort',    question: '请按优先级排列你的出行考量', options: ['性价比', '舒适度', '特色体验', '交通便利'] },
  { id: 'q4', type: 'single',  question: '行程节奏你更偏好哪种？', options: ['紧凑高效', '适中均衡', '悠闲随性', '深度慢游'] },
];

function defaultAnswers() {
  return SAMPLE_Q.map(q => ({
    type: q.type,
    selected: q.type === 'single' ? null : (q.type === 'sort' ? q.options.map((_, i) => i) : []),
    customInput: '',
  }));
}

// ── 不同状态的 answers ──────────────────────────
const A = {
  unanswered:   defaultAnswers(),                                                        // 全未答
  singleSel:    (() => { const a=defaultAnswers(); a[0].selected=1; return a; })(),      // q1 选第2项
  multiSel:     (() => { const a=defaultAnswers(); a[1].selected=[0,2]; return a; })(),  // q2 选第1、3项
  sortReordered:(() => { const a=defaultAnswers(); a[2].selected=[3,0,1,2]; return a; })(), // 交通便利→顶
};

// ── 预渲染所有快照（lazy：首次访问时才计算）─────────
const snapCache = {};
function snap(key, ...args) {
  if (!snapCache[key]) snapCache[key] = renderStaticAskQuestion(...args);
  return snapCache[key];
}

function getSnapshots() {
  return {
    // §2 构成：显示完整卡片
    anatomy: snap('anatomy', SAMPLE_Q, 0, A.singleSel, { hideInput: true }),

    // §3 类型：三种题型并排
    typeSingle: snap('typeSingle', SAMPLE_Q, 0, A.unanswered, { hideHeader: true, hideInput: true }),
    typeMulti:  snap('typeMulti', SAMPLE_Q, 1, A.unanswered, { hideHeader: true, hideInput: true }),
    typeSort:   snap('typeSort', SAMPLE_Q, 2, A.unanswered, { hideHeader: true, hideInput: true }),

    // §4 状态：各种状态对比
    singleUnselected: snap('singleUnselected', SAMPLE_Q, 0, A.unanswered, { hideHeader: true, hideInput: true }),
    singleSelected:   snap('singleSelected', SAMPLE_Q, 0, A.singleSel, { hideHeader: true, hideInput: true }),
    multiUnselected:  snap('multiUnselected', SAMPLE_Q, 1, A.unanswered, { hideHeader: true, hideInput: true }),
    multiChecked:     snap('multiChecked', SAMPLE_Q, 1, A.multiSel, { hideHeader: true, hideInput: true }),
    sortDefault:      snap('sortDefault', SAMPLE_Q, 2, A.unanswered, { hideHeader: true, hideInput: true }),
    sortReordered:    snap('sortReordered', SAMPLE_Q, 2, A.sortReordered, { hideHeader: true, hideInput: true }),
  };
}

// ── 辅助：带标签的快照块 ──────────────────────────
function labeled(label, html) {
  return `<div class="fp-snapshot-wrap"><span class="fp-snapshot-label">${label}</span><div class="fp-snapshot">${html}</div></div>`;
}

// 实际 step 索引：nodes[2]（n3，scenario.js 第 548 行，含 askUser action）
const STEP_ASK_QUESTION = 2;

export default {
  id: 'ask-question',
  type: 'feature',
  label: 'AskQuestion',
  anchors: {
    'single-appear': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const card = document.querySelector('.ask-question-card');
        if (!card) return false;
        const badge = card.querySelector('.aq-badge');
        return badge && badge.textContent.includes('单选');
      },
      label: '看单选题画面',
    },
    'single-auto-next': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const stepIndicator = document.querySelector('.aq-step-indicator');
        if (!stepIndicator) return false;
        return /\b2\s*\/\s*\d+/.test(stepIndicator.textContent);
      },
      label: '看自动前进效果',
    },
    'multi-appear': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const badge = document.querySelector('.ask-question-card .aq-badge');
        return badge && badge.textContent.includes('多选');
      },
      label: '看多选题画面',
    },
    'multi-checked': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const checked = document.querySelectorAll('.ask-question-card .aq-option.is-selected');
        return checked.length >= 2;
      },
      label: '看多选已勾选状态',
    },
    'sort-appear': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const badge = document.querySelector('.ask-question-card .aq-badge');
        const hint = document.querySelector('.aq-sort-hint');
        return badge && badge.textContent.includes('排序') && hint;
      },
      label: '看排序题 + 拖拽提示',
    },
    'sort-after-drag': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const badge = document.querySelector('.ask-question-card .aq-badge');
        const hint = document.querySelector('.aq-sort-hint');
        return badge && badge.textContent.includes('排序') && !hint;
      },
      label: '看拖拽后状态',
    },
  },
  // getter 确保每次读取都重新计算（不过 feature-panel 只读一次）
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>AskQuestion</h1>
        <p class="fp-subtitle">询问用户 · agent 在不确定时的结构化提问组件</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>AskQuestion 是 agent 在执行任务过程中遇到不确定时，<strong>暂停输出并向用户发起结构化提问</strong>的对话内嵌组件。</p>
        <h3>使用场景</h3>
        <ul>
          <li>用户初始指令不完整，agent 需要补全关键信息再继续</li>
          <li>agent 面临两个及以上合理执行路径，选错代价高</li>
          <li>用户输入存在歧义，agent 不愿擅自"翻译"成熟悉的意图</li>
        </ul>
        <h3>设计目标</h3>
        <p>让 agent 的"不确定"成为一种<strong>可感知、可结构化、低打扰</strong>的协作信号。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 构成</h2>
        <p>AskQuestion 卡片自上而下五层结构：<strong>① 顶栏</strong>（导航箭头 + 步骤指示器 + 关闭）→ <strong>② 问题区</strong>（题型药丸 + 题干）→ <strong>③ 选项列表</strong> → <strong>④ 输入栏</strong> → <strong>⑤ 操作按钮</strong>。</p>
        ${labeled('完整卡片结构', s.anatomy)}
        <button class="fp-anchor-btn" data-anchor="single-appear">在左侧看实例 →</button>
      </section>

      <section data-section="variants">
        <h2>3. 类型</h2>
        <p>支持三种题型，对应三种不同的选项交互模式：</p>
        <div class="fp-snapshot-grid-3">
          ${labeled('单选', s.typeSingle)}
          ${labeled('多选', s.typeMulti)}
          ${labeled('排序', s.typeSort)}
        </div>
        <div class="fp-anchor-row">
          <button class="fp-anchor-btn" data-anchor="single-appear">单选 →</button>
          <button class="fp-anchor-btn" data-anchor="multi-appear">多选 →</button>
          <button class="fp-anchor-btn" data-anchor="sort-appear">排序 →</button>
        </div>
      </section>

      <section data-section="states">
        <h2>4. 状态</h2>

        <h3>单选</h3>
        <p>未选 → 白底，无右侧图标 / 已选 → 浅灰底，加粗，✓ 图标</p>
        <div class="fp-snapshot-grid-2">
          ${labeled('未选', s.singleUnselected)}
          ${labeled('已选', s.singleSelected)}
        </div>

        <h3>多选</h3>
        <p>复选框未选 → 空框 / 已选 → 实心 ☑，可同时多选</p>
        <div class="fp-snapshot-grid-2">
          ${labeled('未选', s.multiUnselected)}
          ${labeled('已选（2项）', s.multiChecked)}
        </div>

        <h3>排序</h3>
        <p>右侧 ≡ 拖拽手柄，序号动态跟随位置</p>
        <div class="fp-snapshot-grid-2">
          ${labeled('默认顺序', s.sortDefault)}
          ${labeled('拖拽后', s.sortReordered)}
        </div>

        <h3>操作按钮</h3>
        <p>未答 → "跳过"（浅灰底）；已答 → "下一步"（深色底，最后一题为"提交"）。底色变化是主信号，文案变化是辅助。</p>
      </section>

      <section data-section="behavior">
        <h2>5. 交互行为</h2>
        <h3>单选</h3>
        <p>点未选项 → 选中该项 → 输入框清空 → <strong>非最后题自动前进</strong>。</p>
        <button class="fp-anchor-btn" data-anchor="single-auto-next">看自动前进效果 →</button>
        <h3>多选</h3>
        <p>点选项 toggle 选中/取消，可同时多选；不自动前进，需手动按"下一步"。</p>
        <button class="fp-anchor-btn" data-anchor="multi-checked">看已勾选状态 →</button>
        <h3>排序</h3>
        <p>按下选项并位移 ≥ 3px 进入拖拽（无需长按）；首次进入有循环 pop 引导动效，<strong>用户首次拖动后永久消失</strong>。</p>
        <div class="fp-anchor-row">
          <button class="fp-anchor-btn" data-anchor="sort-appear">看引导动效 →</button>
          <button class="fp-anchor-btn" data-anchor="sort-after-drag">看拖拽后状态 →</button>
        </div>
      </section>

      <section data-section="flow">
        <h2>6. 使用流程</h2>
        <pre>agent 输出中
   │
   ▼
遇到不确定 → 暂停输出 → 对话流底部展开问答卡片
   │
   ▼
逐题作答（任意顺序、任意跳过）
   │
   ▼
最后题作答完 → 按钮文案变"提交"
   │
   ├─ 点提交 → 卡片消失 → agent 收到结构化答案 → 继续输出
   └─ 点关闭 ✕ → 视为全部跳过 → agent 收到空答案 → 继续输出</pre>
      </section>

      <section data-section="edge-cases">
        <h2>7. 边界与异常</h2>
        <ul>
          <li><strong>问题文字过长</strong>：自然换行</li>
          <li><strong>选项过多（≥ 8 项）</strong>：选项列表内部纵向滚动，顶栏与按钮固定</li>
          <li><strong>中途关闭</strong>：不保存草稿，下次进入相当于全部跳过</li>
          <li><strong>误触关闭</strong>：无二次确认（轻量打扰原则）</li>
        </ul>
        <h3>输入与选项的互斥规则</h3>
        <p><strong>单选</strong>：选项与输入互斥 / <strong>多选</strong>：选项与输入并存 / <strong>排序</strong>：顺序与输入并存。</p>
      </section>

      <section data-section="content-spec">
        <h2>8. 文案规范</h2>
        <p><strong>单选输入框 placeholder</strong>："以上都不是，我来告诉你"——明确告诉用户这是 escape hatch。</p>
        <p><strong>多选/排序 placeholder</strong>："我来额外补充说明"——表明是叠加而非替代。</p>
        <p><strong>关闭按钮无文案</strong>，仅 ✕ 图标——避免与"跳过"按钮的语义混淆。</p>
      </section>

      <section data-section="motion">
        <h2>10. 动效</h2>
        <h3>节奏分级</h3>
        <p><strong>快（100-150ms）</strong>：选项点击反馈、按钮按下态、复选框打勾——必须感觉"零延迟"</p>
        <p><strong>中（200-300ms）</strong>：切题、排序拖拽落位（200ms）、按钮文案与底色切换</p>
        <p><strong>慢（600-1000ms）</strong>：卡片首次展开、排序首次的 pop 引导动效</p>
        <h3>反原则</h3>
        <ul>
          <li>不为了动而动——AskQuestion 本身已经是打断，过多动效加重打扰</li>
          <li>快档不允许超过 200ms——否则点击感会"粘滞"</li>
          <li>教学性动效绝不重复——首次播完一轮后永久消失</li>
        </ul>
      </section>

      <section data-section="rationale">
        <h2>13. 设计原理</h2>
        <h3>为什么单选自动前进、多选不自动前进</h3>
        <p>单选有明确的"作答完成"信号——选了一个就是答完。多选没有，系统不知道用户是想选 1 个还是 5 个，必须由用户主动声明"我选完了"。强行让多选自动前进会"系统替用户做决定"，违反用户主导原则。</p>
        <h3>为什么排序题没有"跳过"按钮</h3>
        <p>排序题的初始状态本身就是一种顺序。没有"未答"概念——用户不动等于接受默认顺序。设"跳过"会造成认知错配："我没拖动过，那我是答了还是没答？"</p>
        <h3>为什么按钮变色 + 改文案两个信号同时给</h3>
        <p>用户在快速作答时先用余光感知按钮颜色（"可跳" vs "可前进"），真要按之前才会读文案确认。两个信号叠加，认知负担最低。</p>
        <p class="fp-meta">完整设计原理见 <code>docs/plans/2026-06-15-AskQuestion-交互设计文档.md</code> 第 13 章（共 7 个决策的"为什么"）。</p>
      </section>

      <section data-section="related">
        <h2>14. 关联组件 与 Do's / Don'ts</h2>
        <h3>Do's</h3>
        <ul>
          <li>agent 应在<strong>真正不确定时</strong>使用——避免"问以确认"的礼貌性提问</li>
          <li>题目数量 1-5 题，选项数 4-6 个</li>
          <li>题干清晰自闭合，能脱离上下文独立读懂</li>
        </ul>
        <h3>Don'ts</h3>
        <ul>
          <li>不要用来确认 agent 的判断（如"我打算用 React，可以吗？"）</li>
          <li>不要嵌套 AskQuestion</li>
          <li>不要用单选模拟二元确认（"继续 / 取消"）</li>
          <li>不要让用户在 AskQuestion 中执行复杂任务（它是"问询"工具，不是"录入"工具）</li>
        </ul>
      </section>
    </article>`;
  },
};
