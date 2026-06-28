// ============================================================
// TOOL-CALL-NODE — 工具调用节点 交互设计文档（图文并茂版）
// ============================================================
// 内容来源：engine/icons.js（statusLineHTML / statusStackHTML）
//           styles/conversation.css（.step-detail-link / .is-running / 三种样式类）
//           engine/sheet.js（renderStaticSheet / renderStaticDetail）
// 快照：直接复用 engine/icons.js 的 statusLineHTML / statusStackHTML
//       + engine/sheet.js 的 renderStaticSheet / renderStaticDetail
//       改左边组件样式 → 右边文档自动同步
// ============================================================

import { statusLineHTML, statusStackHTML, renderToolIcon, inferToolIconKey } from '../engine/icons.js';
import { renderStaticSheet, renderStaticDetail, getFrames } from '../engine/sheet.js';
import { glassCloseBtn, glassNavBtn, GLYPH_PREV } from '../engine/ask-question.js';

// ── 样例数据（典型工具调用）────────────────────────────
const SAMPLE_TOOLS = [
  { label: '正在搜索网页', type: 'website' },
  { label: '搜索网页', type: 'website' },
  { label: '正在创建文件', type: 'edit' },
  { label: '创建文件', type: 'edit' },
  { label: '正在执行命令', type: 'terminal' },
  { label: '执行命令', type: 'terminal' },
];

// ── 不同状态的工具调用列表 ─────────────────────────────
const T = {
  // 单个工具
  singleRunning: ['正在搜索网页'],
  singleDone:    ['搜索网页'],
  // 多个工具（进行中：前 2 条完成，最后 1 条进行中）
  multiRunning:  ['搜索网页', '创建文件', '正在执行命令'],
  multiDone:     ['搜索网页', '创建文件', '执行命令'],
  // 多个工具（全部完成，用于堆叠模式）
  multiAllDone:  ['搜索网页', '创建文件', '执行命令', '读取文件', '搜索网页'],
};

// ── 边界异常样例数据 ───────────────────────────────────
const EDGE_LONG_NAME = ['正在执行非常长的命令名称这可能导致文本溢出需要正确处理'];
const EDGE_MANY_TOOLS = Array.from({ length: 8 }, (_, i) => `正在执行命令 ${i + 1}`);
const EDGE_FALLBACK_ICON = ['正在未知操作'];

// ── 快照缓存 ───────────────────────────────────────────
const snapCache = {};
function snap(key, labels, opts = {}) {
  if (!snapCache[key]) {
    const { state = 'done', mode = 'flat' } = opts;
    const cls = `step-detail-link${state === 'running' ? ' is-running' : ''}`;
    const html = `<button type="button" class="${cls}" tabindex="-1">${statusLineHTML(labels)}</button>`;
    snapCache[key] = `<div class="phone-shell ${mode}">${html}</div>`;
  }
  return snapCache[key];
}

function getSnapshots() {
  return {
    // §2 构成：状态行内部结构标注（用 HTML+CSS 标注线）
    anatomy: statusLineHTML(['正在搜索网页']),

    // §4 交互与状态
    singleRunning: snap('singleRunning', T.singleRunning, { state: 'running' }),
    singleDone:    snap('singleDone',    T.singleDone,    { state: 'done' }),
    multiRunning:  snap('multiRunning',  T.multiRunning,  { state: 'running' }),
    multiDone:     snap('multiDone',     T.multiDone,     { state: 'done' }),

    // §3 设计样式（3 种模式）
    modeFlat:  snap('modeFlat',  T.multiRunning, { state: 'running', mode: 'tool-call-flat' }),
    modeStack: snap('modeStack', T.multiAllDone, { state: 'done',    mode: 'tool-call-stack' }),
    modeCard:  snap('modeCard',  T.singleRunning, { state: 'running', mode: 'tool-call-card' }),

    // §5 动效：扫光循环
    motionSweep: snap('motionSweep', ['正在搜索网页'], { state: 'running' }),

    // §6 边界与异常
    edgeLongName:    snap('edgeLongName',    EDGE_LONG_NAME,    { state: 'running' }),
    edgeManyTools:   snap('edgeManyTools',   EDGE_MANY_TOOLS.map(l => l.replace('正在', '')), { state: 'done' }),
    edgeFallback:    snap('edgeFallback',    EDGE_FALLBACK_ICON, { state: 'running' }),
  };
}

// ── 辅助：带标签的快照块 ───────────────────────────────
function labeled(label, html, desc) {
  const descHtml = desc ? `<span style="color:#86868b;font-size:13px">${desc}</span>` : '';
  return `<div class="fp-snapshot-wrap"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span class="tag">${label}</span>${descHtml}</div><div class="fp-snapshot">${html}</div></div>`;
}

// ── Sheet 章节的样例（用 F3.4d，3 条执行命令）────────
const SHEET_FRAMES = getFrames('F3.4d');
const SHEET_EVENTS = SHEET_FRAMES.flatMap(f => f.events || []);
const SHEET_DETAIL = SHEET_EVENTS[1]?.detail; // 第 2 条：git diff --stat

export default {
  id: 'tool-call-node',
  type: 'feature',
  label: '工具调用节点',
  anchors: {
    // TODO: 根据实际 scenario.js 中的节点索引补充锚点
  },
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>工具调用节点</h1>
        <p class="fp-subtitle">Agent 每一次工具调用的状态行 · 位于 AI 消息气泡内、思考按钮下方、正式回答上方</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>工具调用节点是 <strong>Agent 在执行任务过程中调用工具时，在对话流中展示的状态行</strong>。它让用户感知到 Agent 正在"干活"，而不是静止等待。</p>
        <h3>使用场景</h3>
        <ul>
          <li>Agent 需要搜索网页获取信息</li>
          <li>Agent 需要创建或修改文件</li>
          <li>Agent 需要执行命令行命令</li>
          <li>Agent 需要读取或查看文件内容</li>
        </ul>
        <h3>设计目标</h3>
        <p>让 Agent 的"工作过程"<strong>可感知、不打扰、可回溯</strong>——用户能知道 Agent 在做什么，但不会被动画或频繁更新干扰阅读节奏。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 构成（结构）</h2>
        <p>工具调用节点由工具图标、文案、扫光动画（进行时）和展开箭头组成。状态行需要同时表达"正在做什么"和"完成了什么"。</p>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">状态行内部结构</span>
            <div class="fp-snapshot">
              <div class="phone-shell tool-call-flat">
                <button type="button" class="step-detail-link is-running" tabindex="-1" style="position:relative;">
                  ${s.anatomy}
                  <div class="fp-anatomy-annotations">
                    <div class="fp-annotation fp-annotation--icon">
                      <div class="fp-annotation-line"></div>
                      <span class="fp-annotation-label">① 工具图标</span>
                    </div>
                    <div class="fp-annotation fp-annotation--text">
                      <div class="fp-annotation-line"></div>
                      <span class="fp-annotation-label">② 文案</span>
                    </div>
                    <div class="fp-annotation fp-annotation--sweep">
                      <div class="fp-annotation-line"></div>
                      <span class="fp-annotation-label">③ 扫光</span>
                    </div>
                    <div class="fp-annotation fp-annotation--chevron">
                      <div class="fp-annotation-line"></div>
                      <span class="fp-annotation-label">④ 展开箭头</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 工具图标</h4>
            <blockquote>
              <p>根据工具类型自动推断图标。搜索网页用🌐，创建文件用✏️，执行命令用💻。推断失败时使用通用工具图标🔧。</p>
            </blockquote>

            <h4>② 文案</h4>
            <blockquote>
              <p><strong>前缀「正在」是唯一的状态标记</strong>——同一工具调用在两个状态共用同一段文案，仅靠「正在」区分进行中与已完成。</p>
            </blockquote>

            <h4>③ 扫光动画</h4>
            <blockquote>
              <p>进行中状态时，文案区域有从左到右的扫光效果（1.15s 循环）。<strong>只有最后一条进行中的工具显示扫光</strong>，已完成的和前面的工具都不显示。</p>
            </blockquote>

            <h4>④ 展开箭头</h4>
            <blockquote>
              <p>完成后显示「›」箭头，提示可点击查看详情。进行中时不显示箭头，避免打断用户注意力。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="modes">
        <h2>3. 设计样式</h2>
        <p>工具调用节点有 3 种视觉样式：<strong>文字</strong>（默认内联）/ <strong>堆叠</strong>（多条完成时折叠）/ <strong>边框</strong>（卡片强调）。下方同步演示从逐条执行到全部完成的完整过程——<strong>堆叠模式在完成时折叠为「图标堆 + 已执行 3 项」</strong>。</p>
        <div class="fp-snapshot-row fp-tcn-modes">
          ${labeled('文字', s.modeFlat, '1-2 条工具时默认使用，内联在对话流中')}
          ${labeled('堆叠', s.modeStack, '≥3 条工具完成后折叠，节省空间')}
          ${labeled('边框', s.modeCard, '需要强调的工具调用（如执行命令）')}
        </div>
      </section>

      <section data-section="interaction">
        <h2>4. 交互与状态</h2>

        <h3>4.1 单个工具</h3>
        <div class="fp-snapshot-row">
          ${labeled('进行中', s.singleRunning, '灰 #999，扫光 1.15s 左→右循环')}
          ${labeled('已完成', s.singleDone, '浅灰 rgba(0,0,0,0.30)，扫光消失，› 保留')}
        </div>
        <blockquote>
          <p><strong>交互</strong>：进行中时不可点击，完成后可点击查看详情（弹出 Sheet）。</p>
          <p><strong>状态变迁</strong>：工具开始执行 → 显示"正在 X" + 扫光 → 执行完成 → 去掉"正在" + 扫光消失 + 显示"›"。</p>
        </blockquote>

        <h3>4.2 多个工具</h3>
        <div class="fp-snapshot-row">
          ${labeled('进行中', s.multiRunning, '前 2 条已完成（无扫光），最后 1 条进行中（有扫光）')}
          ${labeled('全部完成', s.multiDone, '所有条目无扫光，全部显示 ›')}
        </div>
        <blockquote>
          <p><strong>交互</strong>：多条工具调用合并为同一条节点。已完成条目留在前面，进行中放在最末——<strong>只有最末那条带扫光</strong>。</p>
          <p><strong>样式切换</strong>：当工具数量 ≥3 且全部完成时，自动切换为堆叠模式（图标堆 + 已执行 N 项）。</p>
        </blockquote>
      </section>

      <section data-section="motion">
        <h2>5. 动效</h2>
        <p>工具调用节点有两个核心动效：扫光动画（表示进行中）和堆叠展开/折叠（切换显示模式）。</p>

        <h3>5.1 扫光动画</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage" data-motion-loop="sweep">
              ${s.motionSweep}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>进行中的工具调用，文案区域有从左到右的扫光效果。扫光使用 CSS keyframe <code>wbSweep</code>，模拟光线掠过的感觉，暗示"正在处理"。</p>
            <table>
              <thead>
                <tr><th>参数</th><th>值</th><th>意图</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>时长</td>
                  <td>1.15s</td>
                  <td>足够慢，让用户感知到"正在发生"；足够快，不显得拖沓</td>
                </tr>
                <tr>
                  <td>缓动</td>
                  <td>ease-in-out</td>
                  <td>扫光进入和离开时略慢，中间快，模拟真实光线</td>
                </tr>
                <tr>
                  <td>循环</td>
                  <td>infinite</td>
                  <td>工具执行期间持续显示，直到完成</td>
                </tr>
                <tr>
                  <td>方向</td>
                  <td>左→右</td>
                  <td>符合阅读顺序，暗示"正在进行"</td>
                </tr>
              </tbody>
            </table>
            <blockquote>
              <p>扫光只在最后一条进行中的工具上显示——前面的工具已经完成，不需要持续吸引注意力。</p>
            </blockquote>
          </div>
        </div>

        <h3>5.2 堆叠展开/折叠</h3>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage" data-motion-loop="stack-toggle">
              ${s.modeStack}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>当工具数量 ≥3 且全部完成时，状态行从"文字模式"切换为"堆叠模式"：多条工具调用折叠为「图标堆 + 已执行 N 项」。</p>
            <table>
              <thead>
                <tr><th>参数</th><th>值</th><th>意图</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>切换时长</td>
                  <td>300ms</td>
                  <td>与面板升降入场同步，保持整体节奏一致</td>
                </tr>
                <tr>
                  <td>缓动</td>
                  <td>ease-out</td>
                  <td>切换末尾减速，让内容"落座"而不是骤停</td>
                </tr>
              </tbody>
            </table>
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
            <tr><td>工具名过长</td><td>文案自然截断，显示"..."，避免撑破状态行</td></tr>
            <tr><td>工具数量很多</td><td>堆叠模式显示前 5 个图标 + "...", 点击后展开全部</td></tr>
            <tr><td>工具图标推断失败</td><td>显示通用工具图标🔧，不报错</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row edge-scroll">
          ${labeled('工具名过长：截断显示', s.edgeLongName)}
          ${labeled('工具数量很多：堆叠显示', s.edgeManyTools)}
          ${labeled('图标推断失败：通用图标', s.edgeFallback)}
        </div>
      </section>

      <section data-section="rationale">
        <h2>7. 设计原理</h2>
        <h3>为什么"正在"是唯一的状态标记</h3>
        <p>如果为每个状态设计不同的文案（如"进行中"、"已完成"、"失败"），会增加用户的认知负担。用「正在」作为唯一标记，用户只需要知道"有没有正在"就能判断状态，非常简单直接。</p>
        <h3>为什么扫光只在最后一条进行中的工具上显示</h3>
        <p>如果所有进行中的工具都显示扫光，当有多个工具并行执行时，用户会被多个扫光干扰，不知道该关注哪一个。只在最后一条显示扫光，明确告诉用户"当前正在处理这一个"。</p>
        <h3>为什么三种样式而不是一种</h3>
        <p>不同场景下，工具调用的重要性和空间占用不同：</p>
        <ul>
          <li><strong>文字模式</strong>：最轻量，适合 1-2 条工具，不占用额外空间</li>
          <li><strong>堆叠模式</strong>：节省空间，适合 ≥3 条工具完成后，避免状态行过长</li>
          <li><strong>边框模式</strong>：强调重要性，适合需要用户特别关注的工具调用（如执行命令）</li>
        </ul>
      </section>

      <section data-section="related">
        <h2>8. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>在 Agent 真正调用工具时使用，让用户感知到"正在干活"。</li>
              <li>工具数量 ≥3 时优先考虑堆叠模式，节省空间。</li>
              <li>完成后及时去掉"正在"，让扫光消失、箭头出现。</li>
              <li>工具图标推断失败时，使用通用工具图标🔧，不报错。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要用工具调用节点展示纯文本进度（如"正在思考..."）。</li>
              <li>不要手动改"正在"文案，让系统自动添加/移除。</li>
              <li>不要在有进行中工具时清空节点，会造成用户困惑。</li>
              <li>不要让扫光在已完成工具上继续显示，会造成状态混乱。</li>
            </ul>
          </div>
        </div>
      </section>
    </article>`;
  },
};
