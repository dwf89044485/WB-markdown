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
  singleInput:  (() => { const a=defaultAnswers(); a[0].selected=null; a[0].customInput='找找当地的特色名宿'; return a; })(), // q1 输入(互斥清空选项)
  multiSel:     (() => { const a=defaultAnswers(); a[1].selected=[0,2]; return a; })(),  // q2 选第1、3项
  multiInput:   (() => { const a=defaultAnswers(); a[1].selected=[0,2]; a[1].customInput='也找点当地的特色美食'; return a; })(), // q2 已选 + 输入
  sortReordered:(() => { const a=defaultAnswers(); a[2].selected=[3,0,1,2]; return a; })(), // 交通便利→顶
  sortInput:    (() => { const a=defaultAnswers(); a[2].selected=[3,0,1,2]; a[2].customInput='安全和便利也需要重点考虑'; return a; })(), // q3 排序 + 输入
};

// ── 边界异常样本数据（4 题结构，step indicator 显示 1/4）─────
const LONG_Q = [
  { id: 'q-long', type: 'single', question: '请根据以下要求，从候选方案中选择最符合当前项目需求的实施方案，需综合考虑成本、周期、团队能力等多方面因素。', options: ['方案 A：独立部署', '方案 B：云托管', '方案 C：混合架构', '方案 D：外包开发'] },
  { id: '_1', type: 'single', question: '', options: ['—'] },
  { id: '_2', type: 'single', question: '', options: ['—'] },
  { id: '_3', type: 'single', question: '', options: ['—'] },
];
const MANY_OPTS = [
  { id: 'q-many', type: 'multiple', question: '请选择您感兴趣的主题领域：', options: Array.from({ length: 10 }, (_, i) => `主题领域 ${i + 1}：详细描述内容`) },
  { id: '_1', type: 'multiple', question: '', options: ['—'] },
  { id: '_2', type: 'multiple', question: '', options: ['—'] },
  { id: '_3', type: 'multiple', question: '', options: ['—'] },
];
const LONG_OPT = [
  { id: 'q-longopt', type: 'single', question: '请从以下选项中选择最合适的方案：', options: [
    '方案一：搭建本地私有化部署方案，数据完全由企业内部管控，安全性最高但需要自建运维团队',
    '方案二：采用混合云架构，核心数据本地存储，弹性计算上云，兼顾安全与灵活性',
    '方案三：全托管 SaaS 服务，零运维成本，快速上线，但数据存储在服务商侧',
  ]},
  { id: '_1', type: 'single', question: '', options: ['—'] },
  { id: '_2', type: 'single', question: '', options: ['—'] },
  { id: '_3', type: 'single', question: '', options: ['—'] },
];

function singleAnswer(questions) {
  return questions.map(q => ({
    type: q.type,
    selected: q.type === 'single' ? null : (q.type === 'sort' ? q.options.map((_, i) => i) : []),
    customInput: '',
  }));
}
const snapCache = {};
function snap(key, ...args) {
  if (!snapCache[key]) snapCache[key] = renderStaticAskQuestion(...args);
  return snapCache[key];
}

function getSnapshots() {
  return {
    // §2 构成：显示完整卡片
    anatomy: snap('anatomy', SAMPLE_Q, 0, A.singleSel, { hideInput: false }),

    // §3 类型：三种题型并排
    typeSingle: snap('typeSingle', SAMPLE_Q, 0, A.unanswered, { hideHeader: false, hideInput: false }),
    typeMulti:  snap('typeMulti', SAMPLE_Q, 1, A.unanswered, { hideHeader: false, hideInput: false }),
    typeSort:   snap('typeSort', SAMPLE_Q, 2, A.unanswered, { hideHeader: false, hideInput: false }),

    // §4 状态：各种状态对比
    singleUnselected: snap('singleUnselected', SAMPLE_Q, 0, A.unanswered, { hideHeader: false, hideInput: false }),
    singleSelected:   snap('singleSelected', SAMPLE_Q, 0, A.singleSel, { hideHeader: false, hideInput: false }),
    singleInput:      snap('singleInput', SAMPLE_Q, 0, A.singleInput, { hideHeader: false, hideInput: false }),
    multiUnselected:  snap('multiUnselected', SAMPLE_Q, 1, A.unanswered, { hideHeader: false, hideInput: false }),
    multiChecked:     snap('multiChecked', SAMPLE_Q, 1, A.multiSel, { hideHeader: false, hideInput: false }),
    multiInput:       snap('multiInput', SAMPLE_Q, 1, A.multiInput, { hideHeader: false, hideInput: false }),
    sortDefault:      snap('sortDefault', SAMPLE_Q, 2, A.unanswered, { hideHeader: false, hideInput: false }),
    sortReordered:    snap('sortReordered', SAMPLE_Q, 2, A.sortReordered, { hideHeader: false, hideInput: false }),
    sortDragging:     snap('sortDragging', SAMPLE_Q, 2, A.unanswered, { hideHeader: false, hideInput: false, dragging: true }),
    sortGuide:       snap('sortGuide', SAMPLE_Q, 2, A.unanswered, { hideHeader: false, hideInput: false, showHint: true }),
    sortInput:        snap('sortInput', SAMPLE_Q, 2, A.sortInput, { hideHeader: false, hideInput: false }),

    // §6 边界异常
    edgeLongQ: snap('edgeLongQ', LONG_Q, 0, singleAnswer(LONG_Q), { hideInput: false }),
    edgeMany: snap('edgeMany', MANY_OPTS, 0, singleAnswer(MANY_OPTS), { hideInput: false }),
    edgeLongOpt: snap('edgeLongOpt', LONG_OPT, 0, singleAnswer(LONG_OPT), { hideInput: false }),
  };
}

// ── 辅助：带标签的快照块 ──────────────────────────
// 标签走全局排版组件 .tag（styles/base.css），本文件不再持有标签样式
function labeled(label, html, btnAnchor, desc) {
  const btn = btnAnchor
    ? `<button class="fp-anchor-btn" data-anchor="${btnAnchor}" style="margin-left:auto;font-size:12px;padding:5px 10px">查看示例</button>`
    : '';
  const descHtml = desc ? `<span style="color:#86868b;font-size:13px">${desc}</span>` : '';
  const rightPart = descHtml + btn;
  return `<div class="fp-snapshot-wrap"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span class="tag">${label}</span>${rightPart}</div><div class="fp-snapshot">${html}</div></div>`;
}

// tag 右侧带锚点按钮
function labeledWithAnchor(label, html, anchorId, btnLabel = `看${label}示例`) {
  return `<div class="fp-snapshot-wrap"><div class="fp-tag-row"><span class="tag">${label}</span><button class="dc-btn" data-anchor="${anchorId}">${btnLabel}<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><div class="fp-snapshot">${html}</div></div>`;
}

// 实际 node 索引：nodes[2]（n3，scenario.js 第 592 行，含 askUser action）
// nodeIndex 由 feature-jump.js 通过 resolveNodeStep() 换算为 director timeline 索引
// 初始 actionOffset=8，提交 434a0987 新增 approvePermission + markdown 两个 action 后 → 变为 10
const STEP_ASK_QUESTION = 2;
const ASKUSER_ACTION_OFFSET = 10;

export default {
  id: 'ask-question',
  type: 'feature',
  label: 'AskQuestion',
  anchors: {
    'single-appear': {
      nodeIndex: STEP_ASK_QUESTION,
      actionOffset: ASKUSER_ACTION_OFFSET,
      questionIndex: 0,
      until: () => {
        const card = document.querySelector('.ask-question-card');
        if (!card) return false;
        const badge = card.querySelector('.aq-badge');
        return badge && badge.textContent.includes('单选');
      },
      label: '看单选题画面',
    },
    'single-auto-next': {
      nodeIndex: STEP_ASK_QUESTION,
      actionOffset: ASKUSER_ACTION_OFFSET,
      questionIndex: 1,
      until: () => {
        const stepIndicator = document.querySelector('.aq-step-indicator');
        if (!stepIndicator) return false;
        return /\b2\s*\/\s*\d+/.test(stepIndicator.textContent);
      },
      label: '看自动前进效果',
    },
    'multi-appear': {
      nodeIndex: STEP_ASK_QUESTION,
      actionOffset: ASKUSER_ACTION_OFFSET,
      questionIndex: 1,
      until: () => {
        const badge = document.querySelector('.ask-question-card .aq-badge');
        return badge && badge.textContent.includes('多选');
      },
      label: '看多选题画面',
    },
    'multi-checked': {
      nodeIndex: STEP_ASK_QUESTION,
      actionOffset: ASKUSER_ACTION_OFFSET,
      questionIndex: 1,
      until: () => {
        const checked = document.querySelectorAll('.ask-question-card .aq-option.is-selected');
        return checked.length >= 2;
      },
      label: '看多选已勾选状态',
    },
    'sort-appear': {
      nodeIndex: STEP_ASK_QUESTION,
      actionOffset: ASKUSER_ACTION_OFFSET,
      questionIndex: 2,
      until: () => {
        const badge = document.querySelector('.ask-question-card .aq-badge');
        const hint = document.querySelector('.aq-sort-hint');
        return badge && badge.textContent.includes('排序') && hint;
      },
      label: '看排序题 + 拖拽提示',
    },
    'sort-after-drag': {
      nodeIndex: STEP_ASK_QUESTION,
      actionOffset: ASKUSER_ACTION_OFFSET,
      questionIndex: 2,
      // 降级：fast-render 无法模拟真实拖拽，仅检查 card 存在 + 排序题 badge
      until: () => {
        const card = document.querySelector('.ask-question-card');
        if (!card) return false;
        const badge = card.querySelector('.aq-badge');
        return badge && badge.textContent.includes('排序');
      },
      label: '看排序题画面',
    },
  },
  // getter 确保每次读取都重新计算（不过 feature-panel 只读一次）
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>AskQuestion</h1>
        <p class="fp-subtitle">询问用户 · Agent 在不确定时暂停执行并主动对齐</p>
      </header>

      <section data-section="overview">
        <h2>1. 为什么需要 AskQuestion</h2>
        <blockquote class="fp-lead-quote">
          <p>Agent 遇到关键信息缺口时，如果继续猜，结果可能偏离用户真实意图；如果直接开放式追问，又会把用户重新拉回一轮聊天。</p>
          <p>AskQuestion 把这个断点收敛成结构化卡片：用户只需要选择、补充或排序，Agent 就能带着更明确的约束继续执行。</p>
        </blockquote>
        <table>
          <thead>
            <tr><th>协作断点</th><th>不用 AskQuestion 的问题</th><th>AskQuestion 的作用</th></tr>
          </thead>
          <tbody>
            <tr><td>信息不完整</td><td>Agent 只能猜用户偏好</td><td>把缺口变成明确问题</td></tr>
            <tr><td>路径分岔</td><td>Agent 替用户做高代价选择</td><td>让用户在可比较选项中决定</td></tr>
            <tr><td>意图有歧义</td><td>开放追问容易继续发散</td><td>把追问收敛成可回答结构</td></tr>
          </tbody>
        </table>
      </section>

      <section data-section="principle">
        <h2>2. 面板体验原则</h2>
        <div class="fp-principle-summary">问题要可快速回答，输入要说明关系，操作要让用户知道下一步会发生什么。</div>
        <table>
          <thead>
            <tr><th>原则</th><th>说明</th><th>对应表现</th></tr>
          </thead>
          <tbody>
            <tr><td>题型先行</td><td>用户看到题目之前，先知道该单选、多选还是排序</td><td>题型标签固定出现在题干上方</td></tr>
            <tr><td>输入关系必须明示</td><td>单选输入是替代答案，多选/排序输入是补充说明</td><td>placeholder 分别写“以上都不是”和“额外补充”</td></tr>
            <tr><td>完成信号跟随题型</td><td>单选可以自动前进，多选需要手动确认，排序默认已有答案</td><td>按钮文案和底色随状态变化</td></tr>
            <tr><td>切题不丢状态</td><td>用户可以来回核对，不因切换题目丢失选择</td><td>选择、输入、排序顺序都保留</td></tr>
          </tbody>
        </table>
      </section>

      <section data-section="anatomy">
        <h2>3. 卡片构成</h2>
        <p>AskQuestion 由题间导航、题型提示、题干、选项、自由输入和底部动作组成。卡片需要同时表达“当前问什么”和“回答后怎么继续”。</p>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">完整卡片结构</span>
            <div class="fp-snapshot">${s.anatomy}</div>
            <button class="fp-anchor-btn" data-anchor="single-appear" style="margin-top:12px">看左侧单选题示例</button>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 顶栏 · 题间导航</h4>
            <blockquote>
              <p><strong>步骤与切题</strong>：显示 <code>当前 / 总数</code>，左右箭头支持直接切题；切走时已选内容保留，未选题保持留空。</p>
              <p><strong>关闭 ✕</strong>：结束整组提问，不等同于“跳过当前题”。关闭后 Agent 继续执行，但不会收到这组问题的有效答案。</p>
            </blockquote>

            <h4>② 题型与题干</h4>
            <blockquote>
              <p>题型标签让用户先知道回答方式；题干必须自闭合，尽量不依赖上下文也能读懂。</p>
            </blockquote>

            <h4>③ 选项区</h4>
            <blockquote>
              <p>选项区承载主要回答动作。单选、多选、排序对应三种不同的决策结构。</p>
            </blockquote>

            <h4>④ 输入栏</h4>
            <blockquote>
              <p>自由输入提供非预设答案出口。单选时通常是替代答案，多选和排序时通常是补充说明。</p>
            </blockquote>

            <h4>⑤ 操作按钮</h4>
            <blockquote>
              <p>底部按钮随作答状态切换：未答时是“跳过”，已答后是“下一步”，最后一题是“提交”。按钮颜色变化是主信号，文案变化是辅助信号。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="variants">
        <h2>4. 题型</h2>
        <p>AskQuestion 支持三种题型。这里不需要复杂分类，关键是让用户知道每种题型怎么完成。</p>
        <table>
          <thead>
            <tr><th>题型</th><th>交互差异</th><th>输入栏关系</th></tr>
          </thead>
          <tbody>
            <tr><td>单选</td><td>点选后自动进入下一题</td><td>输入是替代答案，会清空已选项</td></tr>
            <tr><td>多选</td><td>点选只负责勾选，需要手动点“下一步”</td><td>输入是补充说明，可以和选项共存</td></tr>
            <tr><td>排序</td><td>默认已有顺序，可拖动调整，也可以不改</td><td>输入是补充说明，不影响排序结果</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row">
          ${labeledWithAnchor('单选', s.typeSingle, 'single-appear', '看单选题示例')}
          ${labeledWithAnchor('多选', s.typeMulti, 'multi-appear', '看多选题示例')}
          ${labeledWithAnchor('排序', s.typeSort, 'sort-appear', '看排序题示例')}
        </div>
      </section>

      <section data-section="interaction" id="sec-interaction">
        <h2>5. 状态与交互</h2>

        <h3 id="sec-single">5.1 单选题</h3>
        <div class="fp-snapshot-row">
          ${labeled('未选', s.singleUnselected)}
          ${labeled('已选', s.singleSelected)}
          ${labeled('用户输入', s.singleInput)}
        </div>
        <blockquote>
          <p><strong>交互</strong>：点选即进入下一题，最后一题除外，按钮为“提交”。</p>
          <p><strong>输入与选项互斥</strong>：输入框输入则清空已选项，点击选项则清空输入框。placeholder「以上都不是，我来告诉你」用于说明互斥关系。</p>
        </blockquote>

        <h3>5.2 多选题</h3>
        <div class="fp-snapshot-row">
          ${labeled('未选', s.multiUnselected)}
          ${labeled('已选（2项）', s.multiChecked)}
          ${labeled('用户输入', s.multiInput)}
        </div>
        <blockquote>
          <p><strong>交互</strong>：点选项 toggle 选中 / 取消，不会自动前进，需要用户手动按“下一步”确认。</p>
          <p><strong>输入与选项共存</strong>：输入框输入不影响已选项，点击选项也不影响输入框内容。placeholder「我来额外补充说明」用于说明补充关系。</p>
        </blockquote>

        <h3 id="sec-sort">5.3 排序题</h3>
        <div class="fp-snapshot-row">
          ${labeled('默认状态', s.sortDefault)}
          ${labeled('拖拽时', s.sortDragging)}
          ${labeled('新手指引', s.sortGuide)}
          ${labeled('用户输入', s.sortInput)}
        </div>
        <blockquote>
          <p><strong>交互</strong>：拖拽手柄或长按选项进入拖拽模式，松手后选项落位。首次进入有引导气泡，完成首次拖拽后消失。</p>
          <p><strong>输入与排序共存</strong>：输入框输入不影响排序结果，排序操作也不影响输入框内容。placeholder「我来额外补充说明」用于说明可额外补充。</p>
        </blockquote>
      </section>

      <section data-section="edge-cases">
        <h2>6. 边界与异常</h2>
        <p>边界状态的重点不是“能不能装下”，而是极端内容下仍然不能影响判断。</p>
        <table>
          <thead>
            <tr><th>边界</th><th>体验要求</th></tr>
          </thead>
          <tbody>
            <tr><td>问题文字过长</td><td>题干自然换行，不能压缩选项或遮挡操作按钮</td></tr>
            <tr><td>选项过多</td><td>选项区纵向滚动，卡片主操作仍固定可见</td></tr>
            <tr><td>选项文字过长</td><td>选项保留完整语义，避免截断造成误选</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row edge-scroll">
          ${labeled('问题文字过长：自然换行', s.edgeLongQ)}
          ${labeled('选项过多：纵向滚动', s.edgeMany)}
          ${labeled('选项文字过长：自然折行', s.edgeLongOpt)}
        </div>
      </section>

      <section data-section="motion">
        <h2>7. 动效设计</h2>
        <p>卡片内的动效服务于三个目的：让面板的出现有来源感，让切题有连续感，让拖拽有操作确认感。</p>

        <h3>7.1 入场：从下方升起的卡片</h3>
        <blockquote>
          <p><strong>效果</strong>：卡片从屏幕下方整体滑入（完全在可见区外 → 到位），同时淡入。</p>
          <p><strong>时机</strong>：Agent 发出 AskQuestion 消息时，卡片替换 composer 的位置出现。</p>
          <p><strong>时长</strong>：300ms ease-out。</p>
        </blockquote>
        <p>卡片从 composer 所在的位置自下而上滑入，让用户建立“原来的输入框被一张卡片替换了”的感知。这个方向也暗示了用完还会降回去的可逆性。</p>
        <p>后续切题、选选项、输入等操作不会重播入场动效——只有关闭后再打开时才会再次播放。</p>

        <h3>7.2 切题过渡：横向翻页</h3>
        <blockquote>
          <p><strong>效果</strong>：旧题内容横向滑出，新题内容横向滑入，两者之间保持 40px 间距。</p>
          <p><strong>时机</strong>：点击“下一步” / “上一步” / 单选自动前进 / 外部锚点跳转。</p>
          <p><strong>时长</strong>：300ms ease-out。</p>
        </blockquote>
        <p>前后题之间用横向滑切，帮助用户建立“这些题目是一个集合里的连续页”的心智模型。方向与操作一致：点“下一步”向左滑出（符合推进的心理预期），点“上一步”向右滑回。</p>
        <p>步骤指示器（1/4）固定在原位不动，只更新数字，保证导航锚点不丢失。动效期间忽略所有导航操作，避免快速连点导致跳题错乱。</p>

        <h3>7.3 排序拖拽：物理感的操作反馈</h3>
        <blockquote>
          <p><strong>效果</strong>：按下时选项浮起（白底 + 投影），跟随手指移动，松手后 200ms 弹性落位。</p>
          <p><strong>时机</strong>：拖拽手柄或长按选项，移动 3px 触发。</p>
          <p><strong>引导</strong>：进入排序题 1.5s 后，第二个选项上方弹出“拖动可调整顺序”气泡，3s 后自动消失，完成一次实际拖拽后永久不再出现。</p>
        </blockquote>
        <p>拖拽的物理感（浮起、跟随、落位）让用户明确知道“我拿起来了”“我放到这里了”。拖拽只允许纵向移动，不会横向偏移。</p>

        <h3>7.4 单选自动前进的 300ms 节奏</h3>
        <blockquote>
          <p><strong>效果</strong>：单选选中后等待 300ms 再触发切题过渡。</p>
        </blockquote>
        <p>这 300ms 让用户先看到选项变高亮了（确认选中），再翻页。如果没有这个间隔，用户会感觉“我刚碰了一下就跳走了”，怀疑自己是否误触。</p>
      </section>

      <section data-section="rationale">
        <h2>8. 设计原理</h2>
        <h3>为什么单选自动前进，多选不自动前进</h3>
        <p>单选有明确的作答完成信号，选了一个就是答完。多选没有，系统不知道用户是想选 1 个还是 5 个，必须由用户主动声明“我选完了”。强行让多选自动前进会变成系统替用户做决定。</p>
        <h3>为什么排序题没有“跳过”按钮</h3>
        <p>排序题的初始状态本身就是一种顺序。用户不动等于接受默认顺序。再给“跳过”会造成认知错配：我没拖动过，那我是答了还是没答？</p>
        <h3>为什么按钮变色和文案变化同时出现</h3>
        <p>用户快速作答时先用余光感知按钮颜色，真正点击前再读文案确认。两个信号叠加，可以降低确认成本。</p>
      </section>

      <section data-section="related">
        <h2>9. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <span class="fp-do-dont-label">Do</span>
            <ul>
              <li>在真正不确定时使用，让用户补齐关键信息。</li>
              <li>题目数量保持克制，题干清晰自闭合。</li>
              <li>单选、多选、排序只用于各自适合的决策结构。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <span class="fp-do-dont-label">Don't</span>
            <ul>
              <li>不要用来做礼貌性确认。</li>
              <li>不要嵌套 AskQuestion。</li>
              <li>不要用单选模拟二元确认，继续 / 取消这类决策应进入确认类组件。</li>
              <li>不要让用户在 AskQuestion 中执行复杂录入任务。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};
