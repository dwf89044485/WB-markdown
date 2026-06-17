// ============================================================
// TOOL CALL NODE — 工具调用节点 交互设计文档
// ============================================================
// 内容来源：docs/plans/2026-06-17-工具调用节点-交互设计.md
// 快照：直接复用 engine/icons.js 的 statusLineHTML / statusStackHTML
//       真实渲染 + 真实 CSS → 样式改了文档自动同步；扫光动画天然在文档里跑
// ============================================================

import { statusLineHTML, statusStackHTML } from '../engine/icons.js';

// ── 样例标签（覆盖 icons.js 的 icon 推断关键字）──────────
const L = {
  // running
  read:    '正在读取文件',
  edit:    '正在编辑文件',
  search:  '正在搜索网页',
  web:     '正在搜索文件',
  create:  '正在创建文件',
  cmd:     '正在执行命令',
  image:   '正在生成图片',
  todo:    '正在更新待办',
  agent:   '正在委派 Subagent',
  skill:   '正在调用技能',
  // done
  dRead:   '已读取文件',
  dEdit:   '已编辑文件',
  dSearch: '已搜索网页',
  dWeb:    '已搜索文件',
  dCreate: '已创建文件',
  dCmd:    '已执行命令',
  dImage:  '已生成图片',
  dTodo:   '已更新待办',
  dAgent:  '已委派 Subagent',
  dSkill:  '已调用技能',
  dThink:  '已思考',
};

// ── 快照辅助：单条 status line（flat 模式）──────────
function sl(labels, opts = {}) {
  const { state = 'done' } = opts;
  const cls = `step-detail-link${state === 'running' ? ' is-running' : ''}`;
  return `<button type="button" class="${cls}" tabindex="-1">${statusLineHTML(labels)}</button>`;
}

// ── 快照辅助：stack 模式折叠后 ──────────
function ss(labels) {
  return `<button type="button" class="step-detail-link" tabindex="-1">${statusStackHTML(labels)}<span class="status-chevron">›</span></button>`;
}

// ── 快照辅助：多条垂直堆叠（模拟 demo 中 status line 累积）─────
function stack(...rows) {
  return `<div class="fp-tcn-stack">${rows.join('')}</div>`;
}

// ── 预渲染快照（lazy 缓存）───────────
const _cache = {};
function snap(key, fn) {
  if (!_cache[key]) _cache[key] = fn();
  return _cache[key];
}

// ── Demo 跳转：用 data-action（feature-panel.js 处理），不用 anchor ──────────
// 原因：fast-render 到 statusGroup 终点时，is-running 已被移除，扫光态不保留
// 需要跳转后手动注入 is-running 才能展示"运行中"快照
// 详见 engine/feature-panel.js 的 tcn-demo-running / tcn-demo-done 处理

export default {
  id: 'tool-call-node',
  type: 'feature',
  label: '工具调用节点',
  anchors: {},
  content: `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>工具调用节点</h1>
        <p class="fp-subtitle">Agent 每一次工具调用的轻量状态指示 · 结果在主对话流，过程折叠成可下钻的入口</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>工具调用节点是 agent 在执行任务过程中，<strong>对每一次工具调用</strong>（搜索网页、读取文件、生成图片……）的轻量状态指示行，位于 AI 消息气泡内、思考按钮下方、正式回答（<code>main-content</code>）上方。</p>
        <h3>设计目标</h3>
        <ul>
          <li><strong>让 agent 的"在做事"成为可感知信号</strong>——不是黑盒等结果，而是看到节奏推进</li>
          <li><strong>不抢戏</strong>——过程是配角，结论（<code>main-content</code>）才是主角</li>
          <li><strong>想看能下钻</strong>——任何时候点开都有完整的工具调用证据</li>
        </ul>
        <h3>与 Sheet 的关系</h3>
        <p>工具调用节点是<strong>过程的"轻量入口"</strong>，点击后展开的底部浮层（Sheet）是<strong>过程的"完整证据"</strong>。两者是一对：一个轻量在主对话流，一个完整在浮层；默认折叠 Sheet，需要时一键下钻。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 节点构成</h2>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">flat 模式 · 单条节点</span>
            <div class="fp-snapshot">
              ${snap('anatomy', () => sl([L.search], { state: 'running' }))}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>自左至右四部件：</p>
            <p><strong>① 工具图标</strong>（16×16）——<code>engine/icons.js</code> 根据标签文字自动推断：搜索→🔍、编辑→✏️、读取→👀、命令→🖥️、图片→🖼️、委派→🐱</p>
            <p><strong>② 标签文字</strong>——当前正在做什么的语义化描述，超长省略号截断</p>
            <p><strong>③ 行末 <code>›</code></strong>——可点击的视觉暗示</p>
            <p><strong>（隐）行底扫光</strong>——仅 running 态存在，1.15s 循环从左滑到右</p>
          </div>
        </div>
        <h3>为什么用"节点"而不是"行"</h3>
        <p>它不是装饰性的进度条，而是<strong>一次工具调用的状态节点</strong>。多个连续的工具调用会合并为一条带「、」分隔的复合节点（如「已搜索网页、已更新待办」），整条依然是一个可点击的入口。</p>
      </section>

      <section data-section="states">
        <h2>3. 三态</h2>

        <h3>3.1 Running 态</h3>
        <p>扫光在跑，整行颜色 <code>#999</code>，标签显示 <code>runningText</code>（如"正在搜索网页"）。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">running · 单条</span>
          <div class="fp-snapshot">
            ${snap('s-running', () => sl([L.search], { state: 'running' }))}
          </div>
        </div>
        <p>多条状态行累积时，<strong>已完成的留在上面，正在跑的在最下面</strong>，扫光只有最末那条有——视觉上"进度在推进"而非"全屏都在闪"。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">running · 累计（1 done + 1 running）</span>
          <div class="fp-snapshot">
            ${snap('s-mixed', () => stack(
              sl([L.todo]),
              sl([L.search], { state: 'running' })
            ))}
          </div>
        </div>
        <div class="fp-anchor-row">
          <button class="fp-action-btn" data-action="tcn-demo-running">看 Demo 运行态<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>

        <h3>3.2 Done 态</h3>
        <p>扫光消失，颜色降到 <code>rgba(0,0,0,0.30)</code>，标签显示 <code>doneText</code>（如"已搜索网页"），<code>›</code> 仍在。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">done · 3 条全部完成</span>
          <div class="fp-snapshot">
            ${snap('s-done', () => stack(
              sl([L.dTodo]),
              sl([L.dSearch]),
              sl([L.dTodo])
            ))}
          </div>
        </div>
        <div class="fp-anchor-row">
          <button class="fp-action-btn" data-action="tcn-demo-done">看 Demo 完成态<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>

        <h3>3.3 Collapsed 态（stack 模式专属）</h3>
        <p>在 stack 显示模式下，节点完成后<strong>折叠为层叠图标 + 已执行数量文字</strong>，腾出主对话流空间给后续内容。</p>
        <div class="fp-snapshot-wrap">
          <span class="tag">collapsed · 5 项折叠后</span>
          <div class="fp-snapshot">
            ${snap('s-collapsed', () => ss([L.dTodo, L.dSearch, L.dWeb, L.dCreate, L.dImage]))}
          </div>
        </div>
        <p>折叠后仍可点击——Sheet 浮层依然展示完整工具调用链。</p>
      </section>

      <section data-section="modes">
        <h2>4. 三种显示模式</h2>
        <p>节点的视觉密度有 3 档可切换，由演示控制台的工具调用模式（card / flat / stack）控制：</p>
        <div class="fp-snapshot-grid-3">
          <div class="fp-snapshot-wrap">
            <span class="tag">card · 卡片</span>
            <div class="fp-snapshot">
              ${snap('m-card', () => `<div class="phone-shell tool-call-card" style="width:340px;padding:12px;border:1px solid #ebebef;border-radius:14px;background:#fff;">
                <div class="phone-shell tool-call-card" style="width:100%;">
                  <div class="flat-container">${sl([L.search])}</div>
                </div>
              </div>`)}
            </div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">flat · 内联（默认）</span>
            <div class="fp-snapshot">
              ${snap('m-flat', () => `<div class="phone-shell tool-call-flat" style="width:340px;padding:12px;border:1px solid #ebebef;border-radius:14px;background:#fff;">
                <div class="phone-shell tool-call-flat" style="width:100%;">
                  <div class="flat-container">${sl([L.search])}</div>
                </div>
              </div>`)}
            </div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">stack · 折叠</span>
            <div class="fp-snapshot">
              ${snap('m-stack', () => `<div class="phone-shell tool-call-stack" style="width:340px;padding:12px;border:1px solid #ebebef;border-radius:14px;background:#fff;">
                <div class="phone-shell tool-call-stack" style="width:100%;">
                  <div class="flat-container">${ss([L.dTodo, L.dSearch, L.dWeb])}</div>
                </div>
              </div>`)}
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr><th>模式</th><th>外观</th><th>适用</th></tr>
          </thead>
          <tbody>
            <tr><td>card</td><td>全宽、有边框、胶囊圆角</td><td>强提示场景，强调"这是个独立的执行块"</td></tr>
            <tr><td>flat</td><td>内联、无边框、不占满宽</td><td><strong>默认档</strong>，节奏轻，不抢正文焦点</td></tr>
            <tr><td>stack</td><td>完成后折叠为图标堆 + 数量文字</td><td>长任务，需要在主对话流腾空间</td></tr>
          </tbody>
        </table>
        <div class="fp-anchor-row">
          <button class="fp-action-btn" data-action="tcn-mode-flat">flat<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="fp-action-btn" data-action="tcn-mode-card">card<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button class="fp-action-btn" data-action="tcn-mode-stack">stack<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
      </section>

      <section data-section="interaction">
        <h2>5. 交互</h2>

        <h3>5.1 点击展开 Sheet</h3>
        <p>任何状态下点击节点 → 弹出底部浮层（Sheet），展示该节点关联的<strong>完整工具调用链</strong>：每一步的图标、描述、参数、输出摘要。</p>
        <p>Sheet 标题为节点当前所有 <code>doneText</code> 的拼接（用「、」连接），例如"搜索网页、更新待办"。</p>

        <h3>5.2 Sheet 内的"重播"</h3>
        <p>当节点处于 <code>is-running</code> 状态时点开，Sheet 顶部出现"重播"按钮——可重新走一遍这个节点的执行过程，用于演示或回看。</p>

        <h3>5.3 关闭</h3>
        <p>点 Sheet 外 / 滑动下滑 / 点 ✕ 关闭。关闭后节点状态保留，不影响主对话流后续内容。</p>

        <h3>5.4 与"思考"按钮的关系</h3>
        <p>思考（thinking）也是一个 status 节点，但默认渲染在 <code>#thinkingMount</code> 区域、<code>stepsList</code> 之上。点击它展开的 Sheet 是"思考过程"，点击工具调用节点展开的 Sheet 是"工具调用过程"——两者不同源、不合并。</p>
      </section>

      <section data-section="motion">
        <h2>6. 动效</h2>

        <h3>6.1 扫光（Sweep）</h3>
        <p>Running 态专属：<code>.status-fragments::after</code> 是一层半透明白色（<code>rgba(255,255,255,.72)</code>），从 <code>translateX(-115%)</code> 滑到 <code>115%</code>，<code>1.15s ease-in-out infinite</code>。</p>
        <p>节奏选择：<strong>1.15s 比典型"忙碌 spinner"（0.8-1.0s）略慢</strong>——传达"在做事，但不需要焦虑"；比"加载完成"反馈（2-3s）快得多——避免用户以为卡住。</p>

        <h3>6.2 入场</h3>
        <p>节点创建时 <code>.status-line-enter</code> 触发 <code>agentIn .22s cubic-bezier(.2,.8,.2,1)</code>——一个 220ms 的轻微上浮渐入。新的工具调用出现时不会"砸"下来。</p>

        <h3>6.3 Stack 模式折叠</h3>
        <p>节点全部完成时（<code>is-running</code> 移除），若当前为 stack 模式则调用 <code>collapseToStack()</code>，内层 <code>statusLineHTML</code> 被替换为 <code>statusStackHTML</code>——图标堆 + "已执行 N 项任务"。</p>

        <h3>6.4 反原则</h3>
        <ul>
          <li><strong>扫光只属于 running</strong>——done 态绝对不带，否则用户在静态页会以为"还在跑"</li>
          <li><strong>不闪烁</strong>——扫光是单向流动而非明暗交替，减少视觉噪声</li>
          <li><strong>不阻塞滚动</strong>——节点 hover/active 不改变 layout，避免对话流跳动</li>
        </ul>
      </section>

      <section data-section="rationale">
        <h2>7. 设计原理</h2>

        <h3>为什么是"轻量入口"而不是"完整过程"</h3>
        <p>工具调用的完整参数、输出、错误信息动辄几百行；如果直接堆在主对话流，会<strong>过程污染结果</strong>——用户看不到结论。原则 1（结果优先）要求"过程折叠为追溯入口"，节点就是这个入口。</p>

        <h3>为什么默认 flat 而不是 card</h3>
        <p>card 的边框和占满宽会形成视觉块，把主对话流切碎；flat 模式是<strong>贴边的注脚</strong>，提醒"有过程可看"但不阻断阅读。stack 模式则用于工具调用特别密集的场景。</p>

        <h3>为什么扫光用白色而不是品牌色</h3>
        <p>扫光不是"进度指示"（那是 spinner 的活），而是"在做事"的氛围信号。白色 + 轻流动 = 一种"持续、安静"的语感；用品牌色会过于"用力"，每条节点都在争抢用户注意力。</p>

        <h3>为什么 Sheet 标题用 doneText 拼接</h3>
        <p>Sheet 是"事后追溯"——用户在节点完成后才打开的概率最大。用 <code>doneText</code>（"已搜索网页"）而非 <code>runningText</code>（"正在搜索网页"），符合"过去时"的语境。运行中点开则同时显示当前正在跑的 <code>runningText</code>。</p>
      </section>
    </article>`,
};
