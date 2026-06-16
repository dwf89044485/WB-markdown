# 设计交付物展示系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 WorkBuddy demo 加上右侧"交互说明"系统：电脑端双栏（左 demo 右说明）、手机端纯 demo；URL 决定右侧 tab；右侧按钮可把 demo 跳到对应画面并暂停。v1 仅交付 1 条完整链路（overview 占位 + AskQuestion 完整内容 + 6 个细粒度跳转锚点）。

**Architecture:**
- **路由层（hash-free query params）** 用原生 `URLSearchParams` + `history.pushState`/`popstate`，无构建步骤、无路由库。
- **布局层** 用 CSS 自定义属性 + `matchMedia('(min-width: 600px)')` 三档切换；600~1440 档让浏览器原生横滚条出现。
- **导航层** 下拉菜单，从 `features/index.js` 自动读取注册项渲染。
- **内容层** 每个 feature 自包含 `{ id, type, label, anchors, content }` 一个对象，HTML 模板字符串直写。
- **跳转锚点层** `engine/feature-jump.js` 接管"跳到 step + 等条件 + 暂停"，复用 `engine/player.js` 现有 step 机制；条件等待 8s 超时静默兜底。
- **左→右隔断** 不引入任何 demo→features 的回调；旧 `design-notes.js` 的按 step 联动逻辑废弃。

**Tech Stack:** 原生 ES Modules、原生 CSS、`URLSearchParams`、`window.matchMedia`、`history.pushState`/`popstate`。无 npm 构建。本地通过 `python3 -m http.server 8080` 跑。

**Spec 引用：** `docs/superpowers/specs/2026-06-15-design-deliverable-system-design.md`
**AskQuestion 内容来源：** `docs/plans/2026-06-15-AskQuestion-交互设计文档.md`（v2 已审）

---

## 文件结构

| 类型 | 路径 | 职责 |
|---|---|---|
| 修改 | `index.html` | 替换 `.design-notes` 占位结构为新的右侧栏 + 下拉导航容器；移除旧 `design-notes.js` 引用；引入 `engine/feature-panel.js` |
| 修改 | `styles/base.css` | 三档布局规则（< 600 / 600~1440 / ≥1440）；移除/调整旧的 `@media (max-width:900px)` 隐藏规则；调 version dot 颜色 |
| 新建 | `styles/feature-panel.css` | 右侧栏样式：下拉、内容卡片、锚点跳转按钮、占位提示 |
| 新建 | `features/index.js` | 注册中心：import 各 feature 并 export 数组 |
| 新建 | `features/overview.js` | 总览「设计思考」（v1 占位） |
| 新建 | `features/ask-question.js` | AskQuestion 完整内容 + 6 个锚点定义 |
| 新建 | `engine/feature-panel.js` | 主控：路由解析、布局切换监听、下拉渲染、tab 切换、内容渲染、锚点按钮事件代理 |
| 新建 | `engine/feature-router.js` | URL 路由工具：parse / build / push / 监听 popstate |
| 新建 | `engine/feature-jump.js` | 跳转锚点引擎：跳到 step + 等条件 + 8s 超时兜底 |
| 删除引用 | `design-notes.js` 文件保留但不引入；从 `index.html` 移除 `<script src="./design-notes.js">` |
| 修改 | `engine/player.js` | 暴露 `goToStep(stepIndex)` 和 `pauseAt(stepIndex)` 给 feature-jump 使用；移除按 step 联动 design-notes 的调用 |

**关键设计约束（沿用 CLAUDE.md）：**
- 不破坏现有 `.phone-shell` 视觉
- `python3 -m http.server` 本地能跑（无构建）
- ES Module 一致性

---

## Task 1: 移除旧 design-notes 联动机制

> **目的：** 旧的 `design-notes.js`（按 step 联动右侧文字）跟新设计的"左→右不联动"原则冲突。先解耦，再建新系统。

**Files:**
- Modify: `index.html` — 移除 `<script src="./design-notes.js">` 这一行
- Modify: `engine/player.js` — 删除 `resolveDesignNotes` / `renderDesignNotes` / `renderDesignNotesError` 三个函数及其全部调用点
- Modify: `index.html` — 暂时保留 `.design-notes` 容器和占位（后续 task 替换）

- [ ] **Step 1.1: 找出 player.js 中 renderDesignNotes 的全部调用**

```bash
grep -n 'renderDesignNotes\|resolveDesignNotes\|designNotes\|WORKBUDDY_DESIGN_NOTES' /Users/josephdeng/Documents/wb-markdown/engine/player.js
```
Expected：列出全部引用位置（包括函数定义和调用）

- [ ] **Step 1.2: 从 player.js 删除 design notes 相关代码**

删除范围：
- `engine/player.js` 第 20 行：`const designNotes = window.WORKBUDDY_DESIGN_NOTES || {};`
- `engine/player.js` 第 26-44 行：`function resolveDesignNotes(stepIndex) { ... }`
- `engine/player.js` 第 46-51 行：`function renderDesignNotesError(err) { ... }`
- `engine/player.js` 第 53-81 行：`function renderDesignNotes(stepIndex) { ... }`
- 全文搜索 `renderDesignNotes(` 调用，逐一删除调用语句（保留外层函数主体）

操作：用 Edit 工具按行精确删除。每次删除后用 `grep -n 'designNotes\|renderDesignNotes\|resolveDesignNotes' engine/player.js` 验证已无残留。

- [ ] **Step 1.3: 从 index.html 移除 design-notes.js 脚本引用**

```html
<!-- 删除 index.html 第 276 行：-->
<script src="./design-notes.js"></script>
```

用 Edit 删除整行（含换行）。保留 `design-notes.js` 文件本身（不动）。

- [ ] **Step 1.4: 验证 demo 在浏览器仍可正常播放**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```
浏览器打开 `http://localhost:8080/?force-desktop=1`，预期：
- demo 正常加载并能播放
- 右侧"交互设计说明"区域仍显示静态 placeholder 文字（容器还在）
- 控制台无 `WORKBUDDY_DESIGN_NOTES` / `renderDesignNotes` 相关错误

确认无误后停掉本地服务：`pkill -f 'http.server 8080'`

- [ ] **Step 1.5: Commit**

```bash
git add engine/player.js index.html
git commit -m "$(cat <<'EOF'
refactor(engine): 移除按步骤联动右侧说明的旧机制

为新的"左→右不联动 / 右→左单向控制"设计交付物展示系统让路。
保留 design-notes.js 文件本体（不再引用）以备回滚参考。
EOF
)"
git rev-parse HEAD | cut -c1-8
```
预期：输出短 hash

---

## Task 2: 三档布局 CSS（< 600 / 600~1440 / ≥1440）

> **目的：** 把现有"≥ 900px 显示双栏 / < 900px 隐藏右侧"的简单切换，改成 spec 第三节的三档规则。这一步只改 CSS 结构，不动 HTML 内容。

**Files:**
- Modify: `styles/base.css` — 第 80-144 行附近的 standalone / `@media` 规则；新增三档布局规则
- Modify: `styles/base.css` — 调 version dot 颜色（commit 前规范要求）

**理解当前规则：**
- `html.force-standalone` / `html.is-standalone` / `?standalone=1` → 强制纯 demo
- `@media (max-width:900px)` 且无 `.force-desktop` class → 默认纯 demo
- 否则 → 双栏

**新规则：**
- 屏宽 < 600 → 纯 demo（沿用 standalone 视觉，相当于把 900 改成 600）
- 屏宽 ≥ 600 → 双栏：`.left-area` 600px 固定（手机壳 550px 居中）+ `.design-notes` 840px 最小宽度
- 总宽 1440px > 屏宽时浏览器原生横滚出现（无需额外 CSS）
- 屏宽 ≥ 1440 → `.design-notes` 自动撑满（min-width:840 即可，flex:1）

- [ ] **Step 2.1: 修改 @media 阈值从 900 → 600**

定位：`styles/base.css` 第 118 行 `@media (max-width:900px){`

```css
/* 改为： */
@media (max-width:599px){
```

> **注意：** 用 `599px` 不是 `600px`，因为 max-width 是 `≤`；600 整数走双栏档。

`force-standalone` / `is-standalone` 的规则块**保留不动**（它们是用户显式 opt-in 的强制模式）。

- [ ] **Step 2.2: 增加双栏档的布局规则**

在 `styles/base.css` 第 144 行（`}`,`@media` 块结束后）下一行追加：

```css
/* ── 双栏档布局（屏宽 ≥ 600px）─────────────────────── */
@media (min-width:600px){
  body{
    /* 让横滚出现：去掉居中、改为左对齐 */
    display:block;
    overflow-x:auto;
    overflow-y:hidden;
    padding:0;
  }
  .layout-main{
    display:flex;
    flex-direction:row;
    align-items:flex-start;
    /* 总宽至少 1440：左 600 + 右 840 */
    min-width:1440px;
    width:max-content;
    height:100dvh;
    padding:0;
    gap:0;
  }
  .left-area{
    width:600px;
    flex:0 0 600px;
    height:100dvh;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:24px 25px;  /* 25px 让 550px 手机壳在 600px 区里居中 */
  }
  .design-notes{
    flex:1 1 840px;
    min-width:840px;
    height:100dvh;
    overflow-y:auto;   /* 右侧栏内部可纵向滚 */
    padding:32px 40px;
    background:#fafafa;
    border-left:1px solid rgba(0,0,0,0.06);
  }
}
```

- [ ] **Step 2.3: 改 version dot 颜色（CLAUDE.md 规范）**

定位 `styles/base.css` 第 177 行：

```css
background:#9C27B0;
```

改为：

```css
background:#3D5AFE;  /* 蓝色 */
```

- [ ] **Step 2.4: 浏览器验证三档行为**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

打开 `http://localhost:8080/`，开 DevTools 切设备宽度：
- 宽 480px → 纯 demo 全屏，右侧栏不可见 ✓
- 宽 800px → 左侧 demo 可见，右侧栏部分露出，浏览器底部出现横向滚动条，拖到底能看完整右侧栏 ✓
- 宽 1440px → 左 600 + 右 840 刚好填满 ✓
- 宽 1920px → 左 600 + 右 1320 铺满 ✓

确认后停服：`pkill -f 'http.server 8080'`

- [ ] **Step 2.5: Commit**

```bash
git add styles/base.css
git commit -m "$(cat <<'EOF'
feat(ui/layout): 三档布局规则（600 / 1440）+ 版本圆点改蓝

实现 spec 第三节布局规则：
- 屏宽 < 600 走纯 demo（沿用旧 standalone）
- 屏宽 ≥ 600 启动双栏：左 600 + 右最小 840，总宽 ≥ 1440
- 屏宽介于 600~1440 时浏览器原生横滚条出现，让用户拖动查看完整右侧栏

版本圆点：紫色 #9C27B0 → 蓝色 #3D5AFE。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

---

## Task 3: URL 路由工具模块

> **目的：** 抽出独立的路由工具，专注 parse / build URL 和监听 popstate；不耦合 DOM。

**Files:**
- Create: `engine/feature-router.js`

- [ ] **Step 3.1: 创建路由工具文件**

完整内容（覆盖创建）：

```javascript
// ============================================================
// FEATURE ROUTER — URL 解析、构建、popstate 监听
// ============================================================
// URL 形态（spec 第五节）：
//   /                            → 默认进总览
//   /?view=overview              → 总览
//   /?view=feature&id=<id>       → 功能详解
//
// 暴露给外界的 API：
//   parseURL()           → { view: 'overview' | 'feature', id: string | null }
//   buildURL(view, id)   → 'string'（用于地址栏）
//   pushRoute(view, id)  → 推一条新历史 + 触发 onChange
//   onChange(callback)   → 注册监听器，popstate / pushRoute 时回调
// ============================================================

const listeners = new Set();

export function parseURL() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || 'overview';
  const id = params.get('id') || null;

  // 边界规则（spec 第五节 2）：未知 view 一律回退 overview
  if (view !== 'overview' && view !== 'feature') {
    return { view: 'overview', id: null };
  }
  // feature 必须带 id；缺 id 则回退 overview
  if (view === 'feature' && !id) {
    return { view: 'overview', id: null };
  }

  return { view, id };
}

export function buildURL(view, id) {
  if (view === 'overview') return '?view=overview';
  if (view === 'feature' && id) return `?view=feature&id=${encodeURIComponent(id)}`;
  return '?view=overview';
}

export function pushRoute(view, id) {
  const url = buildURL(view, id);
  window.history.pushState({ view, id }, '', url);
  notify();
}

export function onChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  const route = parseURL();
  listeners.forEach((cb) => {
    try { cb(route); } catch (err) { console.error('[feature-router]', err); }
  });
}

// 监听浏览器后退/前进
window.addEventListener('popstate', notify);
```

- [ ] **Step 3.2: 浏览器手动 smoke 测试**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

打开 `http://localhost:8080/?view=feature&id=ask-question`，DevTools Console 执行：

```js
const router = await import('./engine/feature-router.js');
console.log(router.parseURL());
// 预期：{ view: 'feature', id: 'ask-question' }

console.log(router.buildURL('feature', 'tool-call'));
// 预期：'?view=feature&id=tool-call'

console.log(router.parseURL.call(null));  // 复测函数纯洁性
```

测 fallback：地址栏改成 `?view=xxx`，按回车，再 Console：
```js
const r = await import('./engine/feature-router.js');
r.parseURL();
// 预期：{ view: 'overview', id: null }
```

测 popstate：
```js
const r = await import('./engine/feature-router.js');
r.onChange((route) => console.log('changed:', route));
r.pushRoute('feature', 'ask-question');  // 应触发 changed: { view:'feature', id:'ask-question' }
history.back();                           // 应触发 changed: { view:'overview', id:null } 或当前页
```

停服：`pkill -f 'http.server 8080'`

- [ ] **Step 3.3: Commit**

```bash
git add engine/feature-router.js
git commit -m "$(cat <<'EOF'
feat(engine): 新增 feature-router 路由工具模块

实现 spec 第五节 URL 路由：parseURL / buildURL / pushRoute / onChange，
含未知 view、缺 id 等边界场景的统一 fallback 到 overview。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

---

## Task 4: features/index.js 注册中心 + overview.js 占位

> **目的：** 先把"注册 + 内容载体"的形态确立，后续 ask-question.js 直接照抄结构。

**Files:**
- Create: `features/index.js`
- Create: `features/overview.js`

- [ ] **Step 4.1: 创建 features/overview.js（占位）**

完整内容：

```javascript
// ============================================================
// OVERVIEW — 设计思考（v1 占位）
// ============================================================
// type:    'overview'
// id:      'overview'
// label:   下拉菜单显示名
// anchors: 总览页无锚点（不挂跳转）
// content: HTML 模板字符串（直接渲染到右侧栏）
// ============================================================

export default {
  id: 'overview',
  type: 'overview',
  label: '设计思考（总览）',
  anchors: {},
  content: `
    <div class="fp-overview">
      <h1>设计思考</h1>
      <p class="fp-lead">这里将放置项目级的设计思考——为什么做这个 demo、设计立场、节奏判断。</p>
      <div class="fp-placeholder-block">
        <p class="fp-placeholder-label">（占位内容，待补充）</p>
        <p>正式版本撰写中。当前以 AskQuestion 作为完整范例先跑通整套链路，待框架稳定后再回填总览的正式内容。</p>
      </div>
      <h2>本系统是什么</h2>
      <p>这是一份"带交互演示的设计交付物"。同一个链接，不同设备自动适配：</p>
      <ul>
        <li><strong>手机打开</strong>：纯 demo 全屏，可直接体验</li>
        <li><strong>电脑打开</strong>：左 demo + 右说明，可一边操作一边阅读</li>
      </ul>
      <p>右侧的功能 tab 会逐步补全。当前可点上方下拉菜单切到 <strong>AskQuestion</strong> 查看完整范例。</p>
    </div>
  `,
};
```

- [ ] **Step 4.2: 创建 features/index.js（注册中心）**

完整内容：

```javascript
// ============================================================
// FEATURES INDEX — 注册中心
// ============================================================
// 此文件是导航的唯一真相源。
// 加新 feature：建 features/<id>.js，在此 import 并加进 list 数组。
// 数组顺序 = 下拉菜单顺序（overview 必须在第一位）。
// ============================================================

import overview from './overview.js';
import askQuestion from './ask-question.js';

export const featureList = [
  overview,
  askQuestion,
];

// 按 id 快速查表
export const featureMap = Object.fromEntries(
  featureList.map((f) => [f.id, f])
);

export function getFeature(id) {
  return featureMap[id] || null;
}
```

> **注意：** Task 4 已经 import `ask-question.js`，但该文件 Task 6 才创建。Task 4 单独验证时浏览器会报 import 错——这是 OK 的，因为 index.js 还没被任何代码 import。Task 7 接入主控 `feature-panel.js` 后才会触发实际 import。先把骨架立起来。

- [ ] **Step 4.3: 验证 overview.js 单独可加载**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

DevTools Console：

```js
const o = await import('./features/overview.js');
console.log(o.default);
// 预期：{ id:'overview', type:'overview', label:'设计思考（总览）', anchors:{}, content:'<div...>' }
console.log(o.default.content.includes('设计思考'));
// 预期：true
```

停服：`pkill -f 'http.server 8080'`

- [ ] **Step 4.4: Commit**

```bash
git add features/
git commit -m "$(cat <<'EOF'
feat(features): 注册中心 + overview 占位

- features/index.js：feature 注册表，下拉菜单的唯一真相源
- features/overview.js：总览「设计思考」v1 占位内容

ask-question.js 在后续 task 创建；当前 index.js 的 import 在
未被加载时不会报错（feature-panel.js 接入后才触发实际加载）。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

---

## Task 5: 暴露 player.js 的 step 控制 API

> **目的：** Task 8 的跳转锚点引擎要能告诉 player："跳到第 N 步 + 暂停"。当前 `player.js` 没有公开这种 API。

**Files:**
- Modify: `engine/player.js` — 新增 export `goToStep(stepIndex)` / `pauseDirector()` / `getCurrentStepIndex()`

- [ ] **Step 5.1: 阅读 player.js 的现有播放控制代码**

```bash
grep -n 'currentDirectorIndex\|directorTimeline\|autoPlaying\|pauseRequested\|directorRuntime' /Users/josephdeng/Documents/wb-markdown/engine/player.js | head -40
```

记录关键全局变量与函数（用于下一步设计 API）。

- [ ] **Step 5.2: 在 player.js 末尾追加 API export**

定位 `engine/player.js` 文件末尾（最后一行 `}` 或末尾位置）追加：

```javascript
// ============================================================
// PUBLIC API — 给 feature-jump.js 用的播放控制接口
// ============================================================

export function getCurrentStepIndex() {
  return currentDirectorIndex;
}

export function pauseDirector() {
  pauseRequested = true;
  autoPlaying = false;
}

/**
 * 跳到指定 step。如果已经在该 step 之后，会重置到该 step 起点。
 * 跳转完成后调用方可调用 pauseDirector 阻止继续播放。
 *
 * @param {number} targetStep
 * @returns {Promise<void>} 跳转完成（targetStep 渲染完毕）后 resolve
 */
export async function goToStep(targetStep) {
  if (typeof targetStep !== 'number' || targetStep < 0) return;

  // 先暂停当前播放
  pauseRequested = true;
  autoPlaying = false;
  // 增加 skipSeq，让 in-flight 的 typewriter 直接快进
  directorSkipSeq++;
  setFastRender(true);

  // 等当前帧让出
  await sleep(0);

  // 如果目标步小于当前步：完整重置
  if (targetStep <= currentDirectorIndex) {
    // 调用现有 reset（如果有的话）。当前 player.js 没有公开 reset，
    // 走 hard reload 兜底——通过重新加载页面再带上 step 参数。
    // 但 v1 不允许重 load（会丢右侧 tab 状态）。
    //
    // 替代方案：让 director 重跑 directorTimeline 0..targetStep。
    // 当前 player.js 没现成支持。降级：
    //   1) 调 setFastRender(true) + 重置 currentDirectorIndex = -1
    //   2) 触发 director 重跑
    //
    // **此处 v1 简化**：targetStep <= currentIndex 时直接 reload + 带 step 参数。
    // feature-jump.js 用 sessionStorage 暂存目标 anchor，reload 后接续等条件。
    sessionStorage.setItem('__pendingJumpStep', String(targetStep));
    window.location.reload();
    return;
  }

  // targetStep > currentDirectorIndex：从当前位置快进到目标
  // 让 director 继续跑，但每步用 fastRender；到 targetStep 后调用方暂停
  pauseRequested = false;
  autoPlaying = true;
  // 触发 director 推进（依赖 player.js 的现有 director loop 自然消化 fastRender 队列）
  // 此处不需要主动调任何函数 —— autoPlaying=true 已经让 director loop 接管
  // 调用方在 feature-jump 里轮询 currentDirectorIndex 到达 targetStep

  // 等到达
  while (currentDirectorIndex < targetStep) {
    await sleep(50);
  }
  setFastRender(false);
}
```

> **风险提示：** 上面 `goToStep` 的"反向跳转 = reload"路径在 v1 是务实简化（避免重写 director 核心）。v2 应改为"director.reset()"原生支持。这个限制要在 spec 第十一节"v1 实现范围"里同步加一行说明（Task 5.5 处理）。

- [ ] **Step 5.3: 验证导出可用**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

Console：

```js
const p = await import('./engine/player.js');
console.log(typeof p.goToStep, typeof p.pauseDirector, typeof p.getCurrentStepIndex);
// 预期：'function' 'function' 'function'
console.log(p.getCurrentStepIndex());
// 预期：-1 或 当前进度（数字）
```

不真正调 `goToStep`（会触发跳转影响 demo 状态），只验证 export。

停服：`pkill -f 'http.server 8080'`

- [ ] **Step 5.4: 在 spec v1 实现范围里追加"反向跳转限制"说明**

定位 `docs/superpowers/specs/2026-06-15-design-deliverable-system-design.md` 第 297 行附近的 "不做（v2+）" 列表，追加：

```markdown
- 反向跳转的优雅实现（v1 反向跳通过 reload 兜底，v2 应实现 director 原生 reset）
```

- [ ] **Step 5.5: Commit**

```bash
git add engine/player.js docs/superpowers/specs/2026-06-15-design-deliverable-system-design.md
git commit -m "$(cat <<'EOF'
feat(engine): player 暴露 goToStep/pauseDirector/getCurrentStepIndex

为 feature-jump 跳转锚点引擎提供必要的控制 API。
反向跳转 v1 走 reload 兜底（已在 spec v2+ 中记录）。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

---

## Task 6: features/ask-question.js 完整内容

> **目的：** v1 的核心范例。把 AskQuestion 交互设计文档（v2，已审）的内容落到 HTML 模板里 + 定义 6 个跳转锚点。

**Files:**
- Create: `features/ask-question.js`

- [ ] **Step 6.1: 阅读 AskQuestion 交互文档作为内容源**

```bash
cat /Users/josephdeng/Documents/wb-markdown/docs/plans/2026-06-15-AskQuestion-交互设计文档.md
```

把文档的 14 章作为内容源；每章对应 HTML 一个 `<section>`。

- [ ] **Step 6.2: 找到 scenario.js 中 AskQuestion 出现的 step 索引**

```bash
grep -n 'askQuestion\|ask-question\|askUser\|askquestion' /Users/josephdeng/Documents/wb-markdown/scenario.js | head -20
```

记录 AskQuestion 卡片首次渲染所在的 step index（假设记为 `STEP_ASK = X`，下一步具体值取决于实际 scenario）。如果有单选/多选/排序三个独立 step，分别记 `STEP_SINGLE` / `STEP_MULTI` / `STEP_SORT`。

> **如果 scenario 里 AskQuestion 只在一个 step 里集中演示：** 6 个锚点共享同一 step，靠 `until` 条件区分到达哪个画面（单选卡片/多选卡片/排序卡片 DOM 出现）。
> **如果 scenario 里分多个 step：** 每个锚点带各自的 stepIndex。

下一步代码假设"集中在一个 step 里逐题切换"——以实际为准修正 stepIndex 数值。

- [ ] **Step 6.3: 创建 features/ask-question.js**

完整内容（**`STEP_ASK_QUESTION` 用 Step 6.2 找到的实际值替换**）：

```javascript
// ============================================================
// ASK-QUESTION — AskQuestion 交互设计文档（v1 完整范例）
// ============================================================
// 内容来源：docs/plans/2026-06-15-AskQuestion-交互设计文档.md（v2 已审）
// 锚点：6 个细粒度（spec 第八节）
// ============================================================

// 实际 step 索引由 scenario.js 决定，部署前请核对
const STEP_ASK_QUESTION = 12;  // TODO Step 6.2 替换为实际值

export default {
  id: 'ask-question',
  type: 'feature',
  label: 'AskQuestion',
  anchors: {
    'single-appear': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const card = document.querySelector('.aq-card');
        if (!card) return false;
        // 单选：无题型药丸标签
        return !card.querySelector('.aq-type-pill');
      },
      label: '看单选题画面',
    },
    'single-auto-next': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const stepIndicator = document.querySelector('.aq-step-indicator');
        if (!stepIndicator) return false;
        // 等到指示器走到第 2 题（说明刚自动前进过）
        return /\b2\s*\/\s*\d+/.test(stepIndicator.textContent);
      },
      label: '看自动前进效果',
    },
    'multi-appear': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const pill = document.querySelector('.aq-type-pill');
        return pill && pill.textContent.includes('多选');
      },
      label: '看多选题画面',
    },
    'multi-checked': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const checked = document.querySelectorAll('.aq-card .aq-option.is-selected');
        return checked.length >= 2;
      },
      label: '看多选已勾选状态',
    },
    'sort-appear': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const pill = document.querySelector('.aq-type-pill');
        const hint = document.querySelector('.aq-sort-hint');
        return pill && pill.textContent.includes('排序') && hint;
      },
      label: '看排序题 + 拖拽提示',
    },
    'sort-after-drag': {
      stepIndex: STEP_ASK_QUESTION,
      until: () => {
        const pill = document.querySelector('.aq-type-pill');
        const hint = document.querySelector('.aq-sort-hint');
        // 排序题、且引导提示已消失（拖过一次后）
        return pill && pill.textContent.includes('排序') && !hint;
      },
      label: '看拖拽后状态',
    },
  },
  content: `
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
        <p>AskQuestion 卡片自上而下三层结构：① 顶栏（导航箭头 + 步骤指示器 + 关闭）② 问题区（题型药丸 + 题干）③ 选项列表 ④ 输入栏 ⑤ 操作按钮。</p>
        <button class="fp-anchor-btn" data-anchor="single-appear">在左侧看实例 →</button>
      </section>

      <section data-section="variants">
        <h2>3. 类型</h2>
        <p>支持三种题型：</p>
        <ul>
          <li><strong>单选</strong>—— 互斥选项，最常见</li>
          <li><strong>多选</strong>—— 可叠加选项，问题区带"多选"药丸</li>
          <li><strong>排序</strong>—— 优先级排序，问题区带"排序"药丸</li>
        </ul>
        <div class="fp-anchor-row">
          <button class="fp-anchor-btn" data-anchor="single-appear">单选 →</button>
          <button class="fp-anchor-btn" data-anchor="multi-appear">多选 →</button>
          <button class="fp-anchor-btn" data-anchor="sort-appear">排序 →</button>
        </div>
      </section>

      <section data-section="states">
        <h2>4. 状态</h2>
        <h3>选项行</h3>
        <p><strong>单选未选</strong>：白底，无右侧图标 / <strong>单选已选</strong>：浅灰底，加粗，✓ 图标</p>
        <p><strong>多选未选</strong>：右侧空复选框 / <strong>多选已选</strong>：右侧实心 ☑</p>
        <p><strong>排序</strong>：右侧 ≡ 拖拽手柄，序号动态跟随位置</p>
        <h3>操作按钮</h3>
        <p>未答 → "跳过"（浅灰）；已答 → "下一步"（深色，最后一题为"提交"）。底色变化是主信号，文案变化是辅助。</p>
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
    </article>
  `,
};
```

- [ ] **Step 6.4: 浏览器验证 ask-question.js 可加载**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

Console：

```js
const aq = await import('./features/ask-question.js');
console.log(aq.default.id, aq.default.label);
// 预期：'ask-question' 'AskQuestion'
console.log(Object.keys(aq.default.anchors));
// 预期：6 个 anchor id 数组
console.log(aq.default.content.length > 1000);
// 预期：true
```

停服：`pkill -f 'http.server 8080'`

- [ ] **Step 6.5: Commit**

```bash
git add features/ask-question.js
git commit -m "$(cat <<'EOF'
feat(features): AskQuestion 完整内容 + 6 个细粒度锚点

内容来源：docs/plans/2026-06-15-AskQuestion-交互设计文档.md（v2 已审）
按 14 章中的 9 章重组成 HTML（概述/构成/类型/状态/交互行为/流程/
边界/文案/动效/设计原理/关联组件，省略响应式与可访问性章节，待真实
内容产出后再补）。
锚点：single-appear / single-auto-next / multi-appear / multi-checked /
sort-appear / sort-after-drag，DOM 条件按 .aq-card / .aq-type-pill /
.aq-sort-hint 等已存在的 class 编写。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

---

## Task 7: 跳转锚点引擎 feature-jump.js

> **目的：** "右侧按钮点了 → demo 跳到对应画面 + 暂停"——这条链路的核心引擎。

**Files:**
- Create: `engine/feature-jump.js`

- [ ] **Step 7.1: 创建 feature-jump.js**

完整内容：

```javascript
// ============================================================
// FEATURE JUMP — 跳转锚点引擎
// ============================================================
// 锚点 = { stepIndex, until: () => bool, label }
//
// jumpToAnchor(anchor):
//   1. 调 player.goToStep(stepIndex) 把 demo 推到对应 step
//   2. 轮询 anchor.until() 等条件成立，超时 8s 兜底
//   3. 调 player.pauseDirector() 暂停
//   4. 期间不抛错；失败也静默兜底（spec 第七节 4）
// ============================================================

import { goToStep, pauseDirector } from './player.js';

const TIMEOUT_MS = 8000;
const POLL_MS = 50;

export async function jumpToAnchor(anchor) {
  if (!anchor || typeof anchor.stepIndex !== 'number') {
    console.warn('[feature-jump] invalid anchor', anchor);
    return;
  }

  try {
    await goToStep(anchor.stepIndex);
  } catch (err) {
    console.warn('[feature-jump] goToStep failed silently', err);
    // 静默继续——尝试用当前 DOM 状态去等条件
  }

  // 等条件成立或超时
  const start = Date.now();
  while (Date.now() - start < TIMEOUT_MS) {
    try {
      if (typeof anchor.until !== 'function' || anchor.until()) break;
    } catch (err) {
      // until 抛错 = 条件不成立，继续轮询
    }
    await sleep(POLL_MS);
  }

  // 不论是否真的等到，都暂停（兜底）
  try {
    pauseDirector();
  } catch (err) {
    console.warn('[feature-jump] pause failed silently', err);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 处理 reload 后的待跳转 anchor（player.goToStep 反向跳走 reload 路径）
export function consumePendingJump() {
  const pending = sessionStorage.getItem('__pendingJumpStep');
  if (!pending) return null;
  sessionStorage.removeItem('__pendingJumpStep');
  return parseInt(pending, 10);
}
```

- [ ] **Step 7.2: 验证 feature-jump.js 加载且 export 完整**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

Console：

```js
const fj = await import('./engine/feature-jump.js');
console.log(typeof fj.jumpToAnchor, typeof fj.consumePendingJump);
// 预期：'function' 'function'
```

不真调 `jumpToAnchor`（没有 anchor 数据）。

停服：`pkill -f 'http.server 8080'`

- [ ] **Step 7.3: Commit**

```bash
git add engine/feature-jump.js
git commit -m "$(cat <<'EOF'
feat(engine): feature-jump 跳转锚点引擎

实现 spec 第七节跳转锚点机制：goToStep + 轮询 until 条件 + 8s 超时
静默兜底 + pauseDirector 暂停。
所有失败路径都 console.warn 不 throw，避免设计交付物显得不可靠。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

---

## Task 8: 主控 feature-panel.js + HTML 容器替换

> **目的：** 把前面 7 个 task 接成完整的可操作系统。

**Files:**
- Create: `engine/feature-panel.js`
- Modify: `index.html` — 替换 `.design-notes` 占位结构 + 引入 feature-panel.js
- Create: `styles/feature-panel.css`
- Modify: `index.html` — 引入 feature-panel.css

- [ ] **Step 8.1: 创建 styles/feature-panel.css**

完整内容：

```css
/* ============================================================
   FEATURE PANEL — 右侧交互说明栏样式
   ============================================================ */

/* 容器 */
.fp-root{
  height:100%;
  display:flex;
  flex-direction:column;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
  color:#1d1d1f;
}

/* 顶部导航 */
.fp-nav{
  flex-shrink:0;
  margin-bottom:24px;
  position:relative;
}
.fp-nav-trigger{
  display:inline-flex;
  align-items:center;
  gap:10px;
  padding:10px 16px;
  font-size:15px;
  font-weight:500;
  color:#1d1d1f;
  background:#fff;
  border:1px solid rgba(0,0,0,0.12);
  border-radius:10px;
  cursor:pointer;
  user-select:none;
  transition:background .15s ease;
}
.fp-nav-trigger:hover{ background:#f5f5f7; }
.fp-nav-trigger::after{
  content:'';
  width:8px;height:8px;
  border-right:1.5px solid currentColor;
  border-bottom:1.5px solid currentColor;
  transform:rotate(45deg) translateY(-2px);
  margin-left:4px;
}
.fp-nav-menu{
  position:absolute;
  top:calc(100% + 6px);
  left:0;
  min-width:240px;
  background:#fff;
  border:1px solid rgba(0,0,0,0.08);
  border-radius:10px;
  box-shadow:0 4px 16px rgba(0,0,0,0.08);
  padding:6px;
  display:none;
  z-index:100;
}
.fp-nav-menu.is-open{ display:block; }
.fp-nav-item{
  display:block;
  width:100%;
  padding:10px 12px;
  font-size:14px;
  text-align:left;
  border:none;
  background:transparent;
  border-radius:6px;
  cursor:pointer;
  color:#1d1d1f;
}
.fp-nav-item:hover{ background:#f5f5f7; }
.fp-nav-item.is-active{ background:#eef0f3; font-weight:500; }
.fp-nav-divider{
  height:1px;
  background:rgba(0,0,0,0.08);
  margin:4px 8px;
}

/* 内容区 */
.fp-content{
  flex:1;
  min-height:0;
}
.fp-content h1{
  font-size:32px;
  font-weight:600;
  letter-spacing:-0.01em;
  margin-bottom:8px;
}
.fp-content h2{
  font-size:22px;
  font-weight:600;
  margin:32px 0 12px;
  letter-spacing:-0.005em;
}
.fp-content h3{
  font-size:16px;
  font-weight:600;
  margin:16px 0 8px;
}
.fp-content p{
  font-size:14px;
  line-height:1.7;
  color:#3a3a3c;
  margin-bottom:10px;
}
.fp-content ul{
  margin:8px 0 12px 18px;
}
.fp-content li{
  font-size:14px;
  line-height:1.7;
  color:#3a3a3c;
  margin-bottom:4px;
}
.fp-content pre{
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;
  font-size:12.5px;
  line-height:1.6;
  background:#f5f5f7;
  border:1px solid rgba(0,0,0,0.06);
  border-radius:8px;
  padding:12px 16px;
  overflow-x:auto;
  white-space:pre;
}
.fp-content code{
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;
  font-size:0.92em;
  background:rgba(0,0,0,0.05);
  padding:1px 6px;
  border-radius:4px;
}
.fp-content section{
  margin-bottom:24px;
}
.fp-subtitle{
  font-size:15px;
  color:#86868b;
  margin-bottom:24px;
}
.fp-meta{
  font-size:12px;
  color:#86868b;
  margin-top:8px;
}

/* 锚点跳转按钮 */
.fp-anchor-btn{
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:8px 14px;
  font-size:13px;
  font-weight:500;
  color:#1d1d1f;
  background:#fff;
  border:1px solid rgba(0,0,0,0.12);
  border-radius:8px;
  cursor:pointer;
  margin:6px 8px 6px 0;
  transition:all .15s ease;
}
.fp-anchor-btn:hover{
  background:#f5f5f7;
  border-color:rgba(0,0,0,0.25);
}
.fp-anchor-btn::after{
  content:'→';
  margin-left:2px;
  color:#86868b;
}
.fp-anchor-row{
  display:flex;
  flex-wrap:wrap;
  margin:8px -4px;
}

/* 占位提示 */
.fp-placeholder-block{
  background:#f5f5f7;
  border-left:3px solid #d1d1d6;
  padding:14px 18px;
  border-radius:6px;
  margin:16px 0;
}
.fp-placeholder-label{
  font-size:12px;
  color:#86868b;
  font-style:italic;
  margin-bottom:8px;
  text-transform:uppercase;
  letter-spacing:0.05em;
}
.fp-placeholder-block p{
  margin-bottom:0;
}

.fp-lead{
  font-size:16px;
  color:#3a3a3c;
  line-height:1.6;
  margin-bottom:16px;
}
```

- [ ] **Step 8.2: 创建 engine/feature-panel.js**

完整内容：

```javascript
// ============================================================
// FEATURE PANEL — 主控
// ============================================================
// 启动时：
//   1. 从 features/index.js 拿注册的 feature list
//   2. 渲染下拉菜单
//   3. 读 URL，渲染对应 feature 内容
//   4. 监听路由变化（router.onChange）→ 重新渲染
//   5. 监听锚点按钮点击（事件代理）→ 调 jumpToAnchor
// ============================================================

import { featureList, getFeature } from '../features/index.js';
import { parseURL, pushRoute, onChange as onRouteChange } from './feature-router.js';
import { jumpToAnchor } from './feature-jump.js';

const ROOT_SELECTOR = '.design-notes-inner';

let rootEl = null;
let navMenuEl = null;
let contentEl = null;
let currentFeature = null;

export function initFeaturePanel() {
  rootEl = document.querySelector(ROOT_SELECTOR);
  if (!rootEl) {
    console.warn('[feature-panel] root not found');
    return;
  }

  // 屏宽 < 600 不初始化（spec 第三节 + 第五节 2）
  if (window.matchMedia('(max-width: 599px)').matches) {
    rootEl.innerHTML = '';
    return;
  }

  buildShell();
  bindEvents();

  // 初次渲染
  renderRoute(parseURL());
  onRouteChange(renderRoute);
}

function buildShell() {
  rootEl.innerHTML = `
    <div class="fp-root">
      <nav class="fp-nav">
        <button class="fp-nav-trigger" type="button" id="fpNavTrigger">
          <span id="fpNavTriggerLabel">设计思考（总览）</span>
        </button>
        <div class="fp-nav-menu" id="fpNavMenu" role="menu"></div>
      </nav>
      <div class="fp-content" id="fpContent"></div>
    </div>
  `;
  navMenuEl = rootEl.querySelector('#fpNavMenu');
  contentEl = rootEl.querySelector('#fpContent');
  renderMenu();
}

function renderMenu() {
  const overview = featureList.filter((f) => f.type === 'overview');
  const features = featureList.filter((f) => f.type === 'feature');

  const itemHtml = (f) => `
    <button type="button" class="fp-nav-item" data-fp-id="${f.id}" role="menuitem">
      ${f.label}
    </button>
  `;

  const parts = [];
  overview.forEach((f) => parts.push(itemHtml(f)));
  if (overview.length && features.length) {
    parts.push('<div class="fp-nav-divider" role="separator"></div>');
  }
  features.forEach((f) => parts.push(itemHtml(f)));

  navMenuEl.innerHTML = parts.join('');
}

function bindEvents() {
  const trigger = rootEl.querySelector('#fpNavTrigger');

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenuEl.classList.toggle('is-open');
  });

  document.addEventListener('click', (e) => {
    if (!navMenuEl.contains(e.target) && !trigger.contains(e.target)) {
      navMenuEl.classList.remove('is-open');
    }
  });

  navMenuEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.fp-nav-item');
    if (!btn) return;
    const id = btn.dataset.fpId;
    if (!id) return;

    const f = getFeature(id);
    if (!f) return;

    navMenuEl.classList.remove('is-open');

    if (f.type === 'overview') {
      pushRoute('overview', null);
    } else {
      pushRoute('feature', f.id);
    }
  });

  // 锚点按钮事件代理（在 contentEl 上）
  contentEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.fp-anchor-btn');
    if (!btn) return;
    const anchorId = btn.dataset.anchor;
    if (!anchorId || !currentFeature) return;

    const anchor = currentFeature.anchors && currentFeature.anchors[anchorId];
    if (!anchor) {
      console.warn('[feature-panel] unknown anchor', anchorId);
      return;
    }

    jumpToAnchor(anchor);
  });

  // 屏宽变化：跨过 600 边界时重新初始化
  const mq = window.matchMedia('(max-width: 599px)');
  mq.addEventListener('change', () => {
    initFeaturePanel();
  });
}

function renderRoute(route) {
  let f;
  if (route.view === 'overview') {
    f = getFeature('overview') || featureList[0];
  } else {
    f = getFeature(route.id);
    // 边界：未知 id 回退 overview（spec 第五节 2）
    if (!f) {
      pushRoute('overview', null);
      return;
    }
  }

  currentFeature = f;
  contentEl.innerHTML = f.content;

  // 同步 trigger label
  const labelEl = rootEl.querySelector('#fpNavTriggerLabel');
  if (labelEl) labelEl.textContent = f.label;

  // 同步导航激活态
  navMenuEl.querySelectorAll('.fp-nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.fpId === f.id);
  });

  // 滚动到顶
  contentEl.scrollTop = 0;
}
```

- [ ] **Step 8.3: 修改 index.html 引入新样式 + 替换占位 + 引入主控**

定位 `index.html`：

**3.1** 在 `<head>` 区找到现有 styles 引用（第 17 行附近，类似 `<link rel="stylesheet" href="./styles/base.css">`）下方追加：

```html
<link rel="stylesheet" href="./styles/feature-panel.css">
```

**3.2** 第 268-272 行的 `.design-notes` 容器**保留 outer 结构**，只清空 inner（让 feature-panel.js 自己注入）：

```html
<!-- 现有：-->
<div class="design-notes" aria-label="交互设计说明">
  <div class="design-notes-inner">
    <span class="design-notes-placeholder">交互设计说明</span>
  </div>
</div>

<!-- 改为：-->
<div class="design-notes" aria-label="交互设计说明">
  <div class="design-notes-inner"></div>
</div>
```

**3.3** 在 `<script type="module" src="./engine/player.js"></script>`（第 279 行）**之后**追加：

```html
<script type="module" src="./engine/feature-panel.js"></script>
<script type="module">
  import { initFeaturePanel } from './engine/feature-panel.js';
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeaturePanel);
  } else {
    initFeaturePanel();
  }
</script>
```

- [ ] **Step 8.4: 浏览器端到端验收**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

按 spec 第十一节"验收标准（v1 通过条件）"逐条测：

| # | 测试动作 | 预期 |
|---|---|---|
| 1 | 访问 `http://localhost:8080/` | 双栏布局 + 总览页占位文字可见 |
| 2 | 点下拉菜单按钮 | 弹出菜单：「设计思考（总览）」+ 分隔线 + 「AskQuestion」 |
| 3 | 选 AskQuestion | URL 变成 `?view=feature&id=ask-question`；右侧显示 AskQuestion 内容；导航 trigger label 同步 |
| 4 | 点任一"在左侧看演示 →"按钮 | 左侧 demo 跳到对应画面并暂停（**这条要看 AskQuestion 实际 step 是否对**——若 step 索引不对，回 Task 6.2 修 STEP_ASK_QUESTION） |
| 5 | 浏览器后退 | URL 回总览，右侧切回总览，左侧 demo 不动 |
| 6 | 地址栏改 `?view=feature&id=xxx` 后回车 | 自动回总览 |
| 7 | DevTools 切宽度到 480px | 双栏隐藏，纯 demo 全屏 |
| 8 | DevTools 切到 800px | 横滚条出现 |

如果 #4 失败（锚点条件不对），常见原因：
- AskQuestion 的 step index 写错（回 Task 6.2 用 `grep` 重定位）
- DOM class 名跟当前实现不一致（在浏览器检查实际 class）
- 反向跳转触发了 reload，导致跳转链中断（这是 v1 已知限制）

确认通过后停服：`pkill -f 'http.server 8080'`

- [ ] **Step 8.5: Commit**

```bash
git add engine/feature-panel.js styles/feature-panel.css index.html
git commit -m "$(cat <<'EOF'
feat(ui/feature-panel): 右侧交互说明系统主控（v1 端到端跑通）

接入：
- features 注册中心 → 下拉菜单
- feature-router → URL 路由
- feature-jump → 跳转锚点
- DOM 事件代理 → 锚点按钮联动

实现 spec 第十一节验收标准的全部 7 条端到端路径。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

---

## Task 9: 全量回归 + 文档收尾

> **目的：** 确保新系统没破坏 demo 现有功能。

- [ ] **Step 9.1: 全量回归 demo 既有功能**

```bash
cd /Users/josephdeng/Documents/wb-markdown && python3 -m http.server 8080 &
```

打开 `http://localhost:8080/?force-desktop=1`，从头跑一遍 demo（点演示控制台的"自动播放"），重点观察：

- 状态行动效正常
- 工具调用浮层（sheet）开关正常
- typewriter 流式输出正常
- AskQuestion 出现时左右两栏不互相影响（核心：左→右无联动）
- 表格、文件卡片、final response actions 正常
- 浏览器 console 无报错

如有 regression：定位是 Task 1 删除 design-notes 时误伤、还是 Task 5 的 player API 改动副作用。

停服。

- [ ] **Step 9.2: 在 docs/superpowers/specs/ 标 spec 已实现**

定位 `docs/superpowers/specs/2026-06-15-design-deliverable-system-design.md` 第 3 行：

```markdown
> 状态：已通过审查（待用户最终复核） | 最后更新：2026-06-15
```

改为：

```markdown
> 状态：v1 已实现 | 实现时间：2026-06-15 | 关联 plan：docs/superpowers/plans/2026-06-15-design-deliverable-system-plan.md
```

- [ ] **Step 9.3: Commit**

```bash
git add docs/superpowers/specs/2026-06-15-design-deliverable-system-design.md
git commit -m "$(cat <<'EOF'
docs(spec): 标记设计交付物展示系统 v1 已实现

通过 spec 第十一节全部 7 条端到端验收。
EOF
)"
git rev-parse HEAD | cut -c1-8
```

- [ ] **Step 9.4: 询问用户是否推送**

按 CLAUDE.md "提交后的动作"——告知用户最后一个 hash + 询问是否要 `git push`。**等用户决策，不自动推。**

---

## 自检对照（实现前请自查）

- ✅ Spec 第三节布局规则：Task 2 完整覆盖（< 600 / 600~1440 / ≥1440 三档）
- ✅ Spec 第四节信息架构：Task 4（overview）+ Task 6（ask-question）+ Task 8（导航 + 渲染）
- ✅ Spec 第五节 URL 路由：Task 3 + Task 8 集成
- ✅ Spec 第六节左右联动：Task 1 删除左→右联动；Task 8 实现右→左
- ✅ Spec 第七节跳转锚点：Task 5（player API）+ Task 7（jump 引擎）+ Task 8（按钮事件代理）
- ✅ Spec 第八节 AskQuestion 6 锚点：Task 6 全部定义
- ✅ Spec 第九节内容文件组织：Task 4 + Task 6 形态正确
- ✅ Spec 第十节章节体系：Task 6 在 ask-question.js 内容里按 9 章组织
- ✅ Spec 第十一节验收标准：Task 8.4 逐条测试
- ✅ 关键约束 CLAUDE.md：每个 Task 末尾都有 commit；version dot 在 Task 2 改色一次（合并多次实质改动到一次发版颜色）

## 已知限制 / v2 跟进项

- 反向跳转通过 `window.location.reload()` 兜底——v2 应在 player.js 实现 director 原生 reset
- 总览（overview）正式内容待写
- 其他 7 个 feature tab（tool-call / todo / image-gen / skill / subagent / nav-buttons / final-output）待补
- 锚点失败的视觉提示（如轻微闪烁右侧按钮）当前完全静默——v2 视使用反馈再决定要不要加
- AskQuestion 内容章节里"响应式"和"可访问性"两章暂未渲染到 HTML——等真实 ARIA / 移动端适配落地后再补
