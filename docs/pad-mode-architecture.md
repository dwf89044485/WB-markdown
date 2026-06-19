# Pad 模式架构方案

> 记录时间：2026-06-19
> 状态：方案已定，待实施
> 本文档系统性记录了从需求讨论 → 架构盘查 → Knot 审查 → 方案精炼的全过程

---

## 一、需求背景

### 1.1 核心需求

在现有手机尺寸 Demo 基础上，增加 Pad 模式切换，使 Demo 完全适配 Pad 尺寸，模拟真实 Agent 对话流在 Pad 中运行的情况。

具体包括：
1. **桌面预览模式**：在桌面浏览器打开 `index.html`，通过按钮切换到 Pad 壳子预览，同时保留右侧交互说明
2. **Pad 浏览模式**：直接在 iPad 上打开链接，Demo 全屏适配 Pad 尺寸

### 1.2 操作方式约定

- **不做自动识别**。在 iPad 浏览时先用桌面模式（因为屏幕宽），用户手动点击切换 Pad 模式，此时 Demo 全屏适配 Pad
- 这是一种**简化策略**：省去设备自动检测和适配逻辑，用户口头传达操作方式即可

### 1.3 设计约束

- 不破坏现有系统
- 新功能优先搜寻现有成熟的解决方案或复用现有框架，不造新轮子
- 代码可维护性：AI 能够非常轻松改得动改得对改得好

---

## 二、架构影响评估

### 2.1 架构优势

当前架构有一个关键优势：**对话流内容全部在 `.phone-shell` 内部渲染，采用 flex column 布局，天然支持自适应**。

这意味着：
- 换壳子大小时，内容天然自适应
- 不需要修改任何 engine 代码
- 不需要修改剧本数据

### 2.2 真正需要改的三层

| 层级 | 说明 | 改动性质 |
|------|------|---------|
| 壳子尺寸 | `.phone-shell` 的 width/height | CSS 变量化 |
| 布局框架 | `.left-area`、`.layout-main`、`.design-notes` | CSS 变量化 |
| 网格装饰 | `COLS`/`ROWS` 等分参数 + SVG 绘制 | JS 动态化 |

### 2.3 不需要动的文件

以下文件经过逐文件扫描确认，**零尺寸依赖**：

| 文件 | 结论 |
|------|------|
| `scenario.js` | 剧本数据不绑定手机壳尺寸 |
| `engine/player.js` | 播放引擎无硬编码尺寸 |
| `engine/sheet.js` | 浮层位置计算不依赖手机壳位置 |
| `engine/markdown.js` | 渲染逻辑无尺寸依赖 |
| `engine/typewriter.js` | 流式输出无尺寸依赖 |
| `engine/core.js` | 滚动等核心函数无尺寸依赖 |
| `engine/scroll-nav.js` | ⚠️ 有一个 `+40` 硬编码偏移，需变量化 |
| `engine/ask-question.js` | 问答卡片布局基于 CSS 流式布局 |
| `engine/feature-router.js` | URL 路由无尺寸依赖 |
| `engine/feature-jump.js` | 跳转锚点无尺寸依赖 |
| `engine/feature-panel.js` | ⚠️ 有 3 处 393px 硬编码（通过 markdown.css） |

---

## 三、网格计算方案

### 3.1 核心数学问题

**约束条件**：
- 网格线必须贴着 Demo 四边
- 切出来的格子尽可能接近正方形
- 保持当前密度（手机模式下格子约 65-71px）
- Pad 宽高可以微调（±10px 可接受）

**推导过程**：
- 目标：`壳宽/COLS ≈ 壳高/ROWS`（格子宽高比 ≈ 1）
- 手机模式：393×852, 6×12, 格子 65.5×71.0px，宽高比 0.923（接近正方形）
- Pad 模式需重新计算 COLS 和 ROWS

### 3.2 三种 iPad 的最佳网格方案

| iPad 型号 | 逻辑分辨率 | 微调后壳尺寸 | COLS×ROWS | 格子尺寸 | 宽高比 |
|-----------|-----------|-------------|-----------|---------|--------|
| iPad mini (8.3") | 744×1133 | **750×1125** | **10×15** | 75×75 | 1.0 ✅ 完美正方形 |
| iPad Air 11" | 834×1194 | **840×1190** | **12×17** | 70×70 | 1.0 ✅ 完美正方形 |
| iPad Pro 12.9" | 1024×1366 | **1020×1360** | **12×16** | 85×85 | 1.0 ✅ 完美正方形 |

**推导逻辑**（以 iPad Air 11" 为例）：
1. 逻辑分辨率 834×1194，宽高比 ≈ 0.698
2. 目标格子密度 ≈ 70px（与手机模式接近）
3. `cols = round(834/70) ≈ 12`, `rows = round(1194/70) ≈ 17`
4. 微调壳尺寸：`840×1190`，使得 `840/12 = 1190/17 = 70px` 恰好整除

### 3.3 微调幅度评估

所有微调都在 ±10px 以内，视觉上不可感知：
- iPad mini: 744→750 (+6), 1133→1125 (-8)
- iPad Air: 834→840 (+6), 1194→1190 (-4)
- iPad Pro: 1024→1020 (-4), 1366→1360 (-6)

### 3.4 实现方式

网格线是 **SVG background-image**（不是 DOM div），通过 `buildGrid()` 在 index.html 底部内联 script 中生成。切换设备模式时需动态重算并重绘。

---

## 四、硬编码尺寸清单（完整 14 处）

经过三轮排查（初始盘查 → Knot A 复核 → Knot A-E 五维审查），确认所有硬编码尺寸：

### 4.1 base.css（6 处）

| # | 位置 | 硬编码内容 | 说明 |
|---|------|-----------|------|
| 1 | `.phone-shell` | `width:393px; height:852px` | 手机壳尺寸 — 核心改动点 |
| 2 | `.left-area` | `width:524px; flex:0 0 524px` | 左侧区域宽度 |
| 3 | `.layout-main` | `min-width:1440px` | 双栏最小宽度 |
| 4 | `.design-notes` | `flex:1 1 840px; min-width:840px` | 右侧说明栏 |
| 5 | `.paper-bg::before` | `left:524px` | 纸张纹理左边缘 |
| 6 | Standalone 相关 | `599px` 断点 | 小屏适配 |

### 4.2 conversation.css（1 处）

| # | 位置 | 硬编码内容 | 说明 |
|---|------|-----------|------|
| 7 | `.conversation` | `height:718px` | 对话区固定高度 — 必须改为 flex 撑满 |

### 4.3 markdown.css（4 处）

| # | 位置 | 硬编码内容 | 说明 |
|---|------|-----------|------|
| 8 | `.phone-shell.tbl-landscape` | `width:852px; height:393px` | 表格全屏横屏壳尺寸 |
| 9 | 横屏居中计算 | `margin-top: calc((852px - 393px)/2)` | 横屏居中偏移 |
| 10 | `.fp-tcn-mode-demo .step-detail-link` | `width:393px` | 右侧说明栏快照宽度 |
| 11 | `.fp-sheet-pair-item` | `width:393px` | 右侧说明栏快照宽度 |

### 4.4 feature-panel.css（2 处，Knot A-E 审查新增发现）

| # | 位置 | 硬编码内容 | 说明 |
|---|------|-----------|------|
| 12 | 快照容器宽度 | `width:393px` | Feature Panel 中的快照 |
| 13 | 快照间距 | 基于手机壳宽度计算 | 间距硬编码 |

### 4.5 demo-controls.css（1 处，Knot A-E 审查新增发现）

| # | 位置 | 硬编码内容 | 说明 |
|---|------|-----------|------|
| 14 | 控制面板宽度 | `width:393px` | Demo 控制面板同步壳宽度 |

### 4.6 index.html 内联脚本（1 处）

| # | 位置 | 硬编码内容 | 说明 |
|---|------|-----------|------|
| 15 | `buildGrid()` | `COLS=6, ROWS=12` | 网格等分数 — 需动态化 |

---

## 五、架构方案

### 5.1 核心原则：极简方案

**不做自动检测，不做过度工程化**。参考业界成熟实践（Storybook 的 viewport 切换），采用最简单直接的方式：

1. CSS 中用 5-6 个变量定义设备尺寸
2. 通过 `.device-pad` 类切换变量值
3. 添加一个切换按钮 + `togglePadMode()` 函数
4. 切换时同步重算网格

### 5.2 方案演进历程

方案经历了三轮迭代：

#### 第一轮：初始架构方案
- CSS 变量化硬编码尺寸
- 新增 `engine/grid.js`、`engine/device.js`、`styles/shell-vars.css`
- DeviceManager 单例封装
- 网格计算抽离到独立模块

#### 第二轮：Knot A+B 审查后修正
- 硬编码从 10 处增加到 **14 处**（遗漏了 feature-panel 和 demo-controls）
- 采纳 DeviceManager 薄封装建议
- 采纳网格计算抽离建议
- 补充遗漏的 markdown.css 横屏硬编码

#### 第三轮：五维审查 + 用户审视后精简
- **砍掉 DeviceManager**：全局变量够用
- **砍掉 engine/grid.js**：网格逻辑留在内联脚本
- **砍掉 styles/shell-vars.css**：变量直接放 :root
- **不做自动检测**：手动切换即可
- 确立"极简方案"为最终方案

### 5.3 最终方案：CSS 变量 + Class 切换

#### CSS 变量定义

```css
:root {
  /* ── Device dimensions ── */
  --shell-w: 393px;
  --shell-h: 852px;
  --left-area-w: 524px;
  --layout-min-w: 1440px;
  --notes-min-w: 840px;
  --paper-edge: 524px;
}

:root.device-pad {
  --shell-w: 840px;
  --shell-h: 1190px;
  --left-area-w: 976px;
  --layout-min-w: 1860px;
  --notes-min-w: 840px;
  --paper-edge: 976px;
}
```

#### 切换逻辑（内联在 index.html 底部）

```javascript
function togglePadMode() {
  const root = document.documentElement;
  const isPad = root.classList.toggle('device-pad');
  // 重算网格
  buildGrid();  // 内部读取壳子实际尺寸动态计算
  // 更新切换按钮文字/图标
  updateDeviceButton(isPad);
}
```

#### 使用 CSS 变量替换硬编码

所有 14 处硬编码 + 1 处网格参数，统一替换为 CSS 变量引用。

### 5.4 关键修改细节

#### conversation.css — 718px 改为 flex 撑满

```css
/* 改前 */
.conversation { height: 718px; }

/* 改后 */
.conversation { flex: 1; overflow-y: auto; }
```

这是五维审查一致认为 **必须改** 的一项。718px 是硬编码计算值（852 - 54状态栏 - 80导航栏等），在 Pad 模式下完全不对。

#### scroll-nav.js — +40 偏移变量化

```javascript
// 改前
const offset = rect.bottom + 40;

// 改后：从 CSS 变量读取
const offset = rect.bottom + parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-bar-padding-bottom'));
```

#### 网格动态化

```javascript
// 改前
const COLS = 6, ROWS = 12;

// 改后：根据壳子实际尺寸动态计算
function buildGrid() {
  const shell = document.querySelector('.phone-shell');
  const w = shell.offsetWidth;
  const h = shell.offsetHeight;
  const cellSize = 70; // 目标格子尺寸
  const COLS = Math.round(w / cellSize);
  const ROWS = Math.round(h / cellSize);
  // ... 绘制 SVG
}
```

---

## 六、Pad 设备响应式适配

### 6.1 当前问题

当前页面只有两档布局策略：
- `max-width:599px` → 手机全屏模式
- `min-width:600px` → 桌面双栏模式

所有 Pad 都达不到 `min-width: 1440px` 的门槛，**出现横向滚动条**：

| Pad 型号 | 视口宽度 | 当前效果 |
|----------|---------|---------|
| iPad mini | ~744px | ❌ 横向滚动 |
| iPad Air/Pro 11" | ~834px | ❌ 横向滚动 |
| iPad Pro 12.9" | ~1024px | ❌ 横向滚动 |

### 6.2 适配策略

**方案 A（推荐）**：左侧缩小 + 右侧缩小
- Pad 上左侧展示手机壳（393px），右侧说明栏自适应剩余宽度
- 切换 Pad 模式后，Demo 全屏适配

**方案 B**：Pad 模式下上下布局
- 手机壳在上，说明栏在下

**方案 C**：Pad 专属模式
- Pad 壳 700×1050（或 840×1190）

### 6.3 操作约定

- **iPad 浏览时先展示桌面模式**（因为屏幕宽够显示双栏）
- 用户手动点击 Pad 模式切换按钮 → Demo 全屏适配 Pad
- 不做自动检测，省去复杂逻辑

---

## 七、风险矩阵（五维审查汇总）

| 等级 | 风险 | 建议方案 | 状态 |
|------|------|---------|------|
| 🔴 P0 | `@media` + class 双触发冲突 | class 为唯一切换源，`@media` 只保留 standalone 断点 | ✅ 方案已定 |
| 🔴 P0 | conversation 718px 硬编码 | 改为 flex 自动撑满 | ✅ 方案已定 |
| 🔴 P0 | Split View `screen.width` 误判 | 不做自动检测，手动切换 | ✅ 已简化 |
| 🔴 P0 | left-area width transition 性能 | 用瞬间切换（不做 transition） | ✅ 方案已定 |
| 🔴 P1 | 播放中切换设备竞态 | 播放中禁用切换按钮 | ✅ 方案已定 |
| 🔴 P1 | CSS 变量 + JS 状态不同步 | togglePadMode() 中同步处理 | ✅ 方案已定 |
| 🟡 P1 | 硬编码 14 处全部变量化 | 逐文件替换 | ✅ 清单已确认 |
| 🟡 P1 | scroll-nav `+40` 硬编码 | 改为 CSS 变量 | ✅ 方案已定 |
| 🟡 P1 | iPad 旋转时 screen.width 不变 | 不做自动检测，手动切换 | ✅ 已简化 |
| 🟡 P2 | 缺少 `apple-mobile-web-app-capable` meta | 可选补充 | ⏳ 低优先级 |
| 🟡 P2 | touch-action 设置 | conversation `pan-y` / demo-controls `manipulation` | ⏳ 低优先级 |

---

## 八、Knot 审查详细记录

### 8.1 第一轮审查：Knot A（代码审查员）+ Knot B（架构评审师）

**Knot A 扫描了 14 个文件**，发现 4 处遗漏：
1. `markdown.css` 的 `.phone-shell.tbl-landscape` 横屏壳尺寸
2. `markdown.css` 的横屏居中计算
3. `markdown.css` 的右侧说明栏宽度（2 处）
4. `index.html` 底部表格全屏横屏 JS 逻辑

**Knot B 评审了 7 个方面**：

| # | 评审项 | 结论 |
|---|--------|------|
| 1 | CSS 变量化 vs Container Queries / @media / Web Component | **当前方案最优，沿用** |
| 2 | 网格计算放哪里 | 建议 `engine/grid.js`（后被简化砍掉） |
| 3 | 设备模式状态管理 | 建议 DeviceManager 单例（后被简化砍掉） |
| 4 | Pad 尺寸微调 ±10px | 视觉可接受 |
| 5 | left-area 宽度跳变 | 最需关注的体验问题（后决定瞬间切换） |
| 6 | 真机检测策略 | 建议 `pointer:coarse` + `screen.width` 分层（后简化为手动） |
| 7 | 替代方案对比 | CSS 变量方案最灵活；iframe 隔离→复杂度爆炸❌；CSS scale→只适合手机放大版❌ |

### 8.2 第二轮审查：五维专业审查

派出了 5 个专业 Knot，从五个维度系统性审查：

| Knot | 维度 | 关键发现 |
|------|------|---------|
| **A** CSS 架构师 | CSS 变量体系、级联控制、特异性、渲染性能 | 硬编码 10→14 处；@media + class 双触发冲突 |
| **B** JS/前端引擎架构师 | 模块化、状态管理、事件解耦、职责边界 | scroll-nav +40 硬编码；播放中切换高风险 |
| **C** 响应式与可访问性 | 视口适配、触控交互、布局断点、A11y | 不加 `user-scalable=no`，用 `touch-action: manipulation` |
| **D** 性能与运行时 | 重排重绘、合成层、transition 性能 | 网格是 SVG background-image（不是 DOM div）；left-area width transition 触发 layout 链式反应 |
| **E** 跨设备兼容性 | Safari 差异、iPad 型号适配、PWA | 缺少 `apple-mobile-web-app-capable`；Split View `screen.width` 不反映实际窗口宽度 |

**五方共识**：

| 共识 | 置信度 |
|------|--------|
| CSS 变量化方案最优 | 🟢🟢🟢🟢🟢 |
| conversation 718px 必须改 | 🟢🟢🟢🟢🟢 |
| 不需要 Container Queries / Web Component / iframe | 🟢🟢🟢🟢🟢 |

**冲突裁决**：

| 冲突 | 裁决 |
|------|------|
| left-area transition 方案（A vs D） | 采纳 D——瞬间切换，不做 transition |
| viewport `user-scalable=no`（E vs C） | 采纳 C——不加 `user-scalable=no`，用 `touch-action` |

---

## 九、为什么不用更复杂的方案

### 9.1 为什么不用 DeviceManager？

DeviceManager 单例虽然更规范，但对于只有 2 种模式的 Demo 来说是过度工程化：
- 全局变量 + 一个 toggle 函数就够了
- 状态只有 phone/pad 两个值
- 不需要事件发射机制
- 不需要 `modechange` 事件

### 9.2 为什么不用自动设备检测？

- `screen.width` 在 Split View 下不准
- iPad 旋转时 `screen.width` 不变
- 自动检测增加了代码复杂度
- 手动切换完全可以接受（口头传达操作方式）

### 9.3 为什么不用 Container Queries？

- 浏览器兼容性仍有限
- 当前只需 2 档尺寸，CSS 变量足够
- Container Queries 适合组件库，不适合 Demo 原型

### 9.4 为什么不用 iframe 隔离？

- 复杂度爆炸：跨 iframe 通信、样式隔离、事件穿透
- 当前架构天然支持壳子切换，没必要隔离

### 9.5 为什么不做 left-area transition？

- `width` transition 触发 layout 链式反应
- 0.3s 内 18-24 帧/秒重排
- 瞬间切换更简单，体验也可接受

---

## 十、实施计划

### 10.1 改动清单

| 步骤 | 文件 | 改动内容 | 预估行数 |
|------|------|---------|---------|
| 1 | `styles/base.css` | `:root` 添加设备变量 + `.device-pad` 覆盖块 | ~15 行 |
| 2 | `styles/base.css` | 硬编码替换为 CSS 变量引用 | ~10 行 |
| 3 | `styles/conversation.css` | `718px` → `flex:1` | ~2 行 |
| 4 | `styles/markdown.css` | 横屏尺寸 + 居中计算变量化 | ~5 行 |
| 5 | `styles/markdown.css` | 右侧快照宽度变量化 | ~3 行 |
| 6 | `styles/feature-panel.css` | 快照宽度变量化 | ~3 行 |
| 7 | `styles/demo-controls.css` | 控制面板宽度变量化 | ~2 行 |
| 8 | `index.html` | 添加切换按钮 + `togglePadMode()` | ~15 行 |
| 9 | `index.html` | `buildGrid()` 动态化 | ~10 行 |
| 10 | `engine/scroll-nav.js` | `+40` 偏移变量化 | ~3 行 |

**总预估**：~65 行改动

### 10.2 工作量评估

| 维度 | 评估 |
|------|------|
| 架构改动 | 小 — 只加 CSS 变量 + 切换逻辑 |
| 工作量 | 低 — ~65 行代码 |
| 复杂度 | 低 — 纯 CSS class toggle + CSS 变量 |
| 风险 | 低 — 不影响 engine 核心逻辑 |
| 维护成本 | 低 — 后续加其他尺寸同理加变量覆盖 |

### 10.3 推进顺序

1. **先做 CSS 变量化** — 基础，所有后续依赖
2. **再做 Device mode 切换** — 按钮和 toggle 函数
3. **最后做网格动态化** — `buildGrid()` 改造

---

## 十一、参考信息

### 业界成熟实践

- **Storybook Viewport Addon**：通过下拉菜单切换设备视口，CSS 变量 + class 切换
- **Figma Device Frames**：设备壳参数化，切换时只改变量
- **Chrome DevTools Device Mode**：手动切换设备模拟

### 替代方案对比

| 方案 | 复杂度 | 灵活性 | 适用场景 |
|------|--------|--------|---------|
| ✅ CSS 变量 + Class 切换 | 低 | 高 | 当前项目 |
| ❌ Container Queries | 中 | 高 | 组件库 |
| ❌ iframe 隔离 | 高 | 低 | 完全隔离需求 |
| ❌ CSS scale | 低 | 低 | 只需视觉放大 |
| ❌ Web Component | 高 | 中 | 组件化封装 |

---

## 附录 A：当前网格系统技术细节

- 网格线不是 DOM div，是 **SVG background-image**
- 在 `index.html` 底部内联 `<script>` 中的 `buildGrid()` 函数生成
- 当前参数：`COLS=6, ROWS=12`
- 手机模式格子尺寸：65.5×71.0px（宽高比 0.923）

## 附录 B：横屏模式已有先例

`.tbl-landscape` 通过 CSS class 切换壳尺寸（`width:852px; height:393px`），Pad 模式可复用同一机制。这证明 class 切换方案在当前项目中已被验证过。

## 附录 C：不同 Pad 尺寸适配参数表

| 设备 | --shell-w | --shell-h | --left-area-w | --layout-min-w | COLS | ROWS | cell |
|------|-----------|-----------|---------------|----------------|------|------|------|
| Phone（默认） | 393px | 852px | 524px | 1440px | 6 | 12 | ~66×71 |
| iPad mini | 750px | 1125px | 886px | 1726px | 10 | 15 | 75×75 |
| iPad Air 11" | 840px | 1190px | 976px | 1860px | 12 | 17 | 70×70 |
| iPad Pro 12.9" | 1020px | 1360px | 1156px | 2040px | 12 | 16 | 85×85 |

> 注：`--left-area-w = --shell-w + 左右 padding (约 136px)`；`--layout-min-w = --left-area-w + --notes-min-w`
