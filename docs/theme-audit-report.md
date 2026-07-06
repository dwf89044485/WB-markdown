# 暗色模式前置审计报告

> 生成日期：2026-07-06
> 目的：为暗色模式切换功能做完整的前置颜色/图标体系梳理，摸清所有硬编码情况

---

## 目录

1. [图标系统——两套渲染入口](#1-图标系统)
2. [CSS 设计 Token——已有变量体系](#2-css-设计-token)
3. [硬编码颜色分布——按文件](#3-硬编码颜色分布)
4. [已存在的暗色模式基础设施](#4-现有基础设施)
5. [暗色模式实施路线](#5-实施路线)
6. [风险与注意事项](#6-风险与注意事项)

---

## 1. 图标系统

项目有两套图标渲染入口，对主题的适配能力不同。

### 1.1 A 套：SVG Registry（`icons-inline.js`）

`window.WORKBUDDY_INLINE_ICONS` 下注册了 34 个 SVG 图标（统计实测），使用 `engine/icons.js:59-63` 的 `svgFromRegistry()` 渲染时自动将 `fill="#xxx"` / `stroke="#xxx"` 替换为 `currentColor`：

```js
// engine/icons.js:59-63
const modified = raw
  .replace(/fill="#[0-9a-fA-F]+"/g, 'fill="currentColor"')
  .replace(/stroke="#[0-9a-fA-F]+"/g, 'stroke="currentColor"')
  .replace(/fill="rgba\([^)]+\)"/gi, 'fill="currentColor"')
  .replace(/stroke="rgba\([^)]+\)"/gi, 'stroke="currentColor"');
```

**32 个图标已可通过 CSS `color` 控制颜色**。但不能自动转换 2 处异常：

| 图标键 | 问题 | 行号 |
|--------|------|------|
| `ing.svg` | 使用 `fill="white"`（命名色，非 hex/non-rgba），regex 未覆盖 | `icons-inline.js:6` |
| `wb-more-indicator.svg` | 使用 `fill="#D97757"`（暖橙语义色），会被误替换为 `currentColor`，不应变色 | `icons-inline.js:36` |

同款 `currentColor` 替换逻辑还出现在：
- `engine/markdown.js:22-24`（表格工具栏图标）
- `engine/table-fullscreen.js:23-24`（全屏工具栏图标）
- `engine/code-fullscreen-sheet.js:16-17`（代码全屏工具栏图标）

### 1.2 B 套：`ICONS` 对象（`engine/icons.js`）

7 个特殊状态图标以内联 SVG 字符串定义在 `engine/icons.js:7-13`，**不走 `svgFromRegistry()`**：

| 键 | 颜色 | 当前处理 | 暗色模式问题 |
|----|------|----------|-------------|
| `ok` | `stroke="white"` | 硬编码命名色 | 暗色底上不可见 |
| `spin` | `stroke="#e9e9eb"` + `#5e5ce6` | 硬编码 | 浅灰太亮、紫可保留但调亮度 |
| `chevron` | `stroke="currentColor"` | 已主题可控 | 无需改动 |
| `todoOk` | `fill="#000" fill-opacity="0.3"` | 硬编码 | 暗色底上太暗 |
| `todoSpin` | `fill="#00C29A"` | 硬编码语义绿 | 需保留但可能调亮度 |
| `todoEmpty` | `fill="#000" fill-opacity="0.7"` | 硬编码 | 暗色底上太暗 |
| `warn` | `stroke="#F2991C"` + `fill="rgba(242,153,28,0.08)"` | 硬编码 | 语义警告色保留 |

### 1.3 `icons-inline.js` 中的非黑色图标

全部 34 个图标中，32 个使用 `fill="#000"`（部分带 fill-opacity），仅 2 个有非黑色：

| 图标 | 颜色 | 备注 |
|------|------|------|
| `loading.svg` | `#00C29A` | 品牌色，加载动画 |
| `wb-more-indicator.svg` | `#D97757` | 暖橙铜色，more 按钮指示器 |

### 1.4 `index.html` 内联 SVG（不经过替换，需手动处理）

| 位置 | 色值 | 说明 |
|------|------|------|
| 状态栏信号/WiFi/电池 (L46-50) | `fill="black"` | 5 个 path |
| 导航菜单按钮 (L62) | `fill="#1c1c1e" fill-opacity="0.86"` | 汉堡图标 |
| 新建会话按钮 (L79) | `fill="#1c1c1e" fill-opacity="0.86"` | 加号图标 |
| 文件按钮 (L88) | `fill="#1c1c1e" fill-opacity="0.86"` | 文件图标 |
| Agent 头像 (L99) | `fill="#000"` + `fill="#FFF"` | 黑底白图案 |
| 添加按钮 (L180) | `fill="black"` | 加号 |
| 发送按钮 (L186) | `fill="#1c1c1e" fill-opacity="0.86"` | 箭头 |
| 停止按钮 (L193) | `fill="white"` | 停止方块 |

### 1.5 JS 内联动态图标色

| 文件 | 位置 | 色值 | 说明 |
|------|------|------|------|
| `engine/ask-question.js:5-8` | `CHECK_BLACK_SVG` / `DRAG_SVG` | `black` | 选中勾、拖拽手柄 |
| `engine/ask-question.js:6` | `CHECK_WHITE_SVG` | `white` | 多选选中勾 |
| `engine/ask-question.js:11` | `VOICE_SVG` | `#F2F2F2` 圆底 | 语音按钮 |
| `engine/ask-question.js:12` | `SENT_SVG` | `#3D3D3D` | 发送按钮 |
| `engine/ask-question.js:20-21` | `GLYPH_PREV` / `GLYPH_NEXT` | `black` | 翻页箭头 |
| `engine/composer.js:388` | chip 关闭按钮 | `#030303` | 暗色底不可见 |
| `engine/player-state.js:63-72` | 回复操作图标 7 个 | `#000` | copy/refresh/like/dislike 等 |
| `engine/player-dom.js:27` | Agent 头像 SVG | `#000` + `#FFF` | |

### 1.6 图标调用链

```
renderToolIcon(item)
  ├─ isWarningEvent → ICONS.warn（固定色）
  └─ svgFromRegistry(file) → currentColor（主题可控）
       └─ fallback: <img src="./icons/xxx">（内联已控）

renderActionIcon(alias) → svgFromRegistry(alias) → currentColor
renderStatusToolIcon(label) → renderToolIcon({ text: label })
statusLineHTML(labels) → renderStatusToolIcon(label)
statusStackHTML(labels) → renderStatusToolIcon(label)
```

---

## 2. CSS 设计 Token

### 2.1 已变量化的颜色（暗色只需加 `[data-theme="dark"]` 区块）

#### `styles/markdown.css :root` — 16 个 token（最完整）

| 变量 | 值 | 物理语义 | 暗色参考 |
|------|-----|---------|---------|
| `--md-text-primary` | `#1c1c1e` | 正文主色 | `#f5f5f7` |
| `--md-text-secondary` | `#3c3c43` | 次要文字 | `#a1a1a6` |
| `--md-text-muted` | `#6e6e73` | 弱化文字 | `#8e8e93` |
| `--md-heading` | `#111114` | 标题 | `#f5f5f7` |
| `--md-accent` | `#007AFF` | 链接/强调蓝 | `#0A84FF` |
| `--md-accent-soft` | `rgba(0,122,255,0.08)` | 链接卡片背景 | `rgba(10,132,255,0.15)` |
| `--md-accent-border` | `rgba(0,122,255,0.22)` | 链接卡片边框 | `rgba(10,132,255,0.30)` |
| `--md-purple` | `#5e5ce6` | 行内代码 | `#7d7aff` |
| `--md-warning` | `#ff9f0a` | 警告色 | `#ffb340` |
| `--md-warning-soft` | `rgba(255,159,10,0.10)` | 警告背景 | `rgba(255,179,64,0.15)` |
| `--md-blockquote-bg` | `#F4F4F4` | 引用块背景 | `#2c2c2e` |
| `--md-blockquote-border` | `rgba(0,0,0,0.10)` | ��用块左边框 | `rgba(255,255,255,0.15)` |
| `--md-surface` | `#fff` | 卡片/表面 | `#1c1c1e` |
| `--md-surface-soft` | `#f7f7fb` | 代码块外容器 | `#2c2c2e` |
| `--md-border` | `#e5e5ea` | 分割线 | `#38383a` |
| `--md-border-soft` | `#f2f2f7` | 弱分割线 | `#2c2c2e` |

#### `styles/ask-question.css :root` — 11 个 token

| 变量 | 值 |
|------|-----|
| `--aq-bg` | `#FAFAFA` |
| `--aq-text` | `#3D3D3D` |
| `--aq-option-bg` | `#F2F2F2` |
| `--aq-option-selected-bg` | `#EBEBEB` |
| `--aq-badge-bg` | `#EBEBEB` |
| `--aq-num-bg` | `#F2F2F2` |
| `--aq-checkbox-border` | `#D5D5D5` |
| `--aq-checkbox-checked-bg` | `#3D3D3D` |
| `--aq-btn-skip-bg` | `#F4F2F2` |
| `--aq-btn-action-bg` | `#3D3D3D` |
| `--aq-input-placeholder-opacity` | `0.3` |

#### `styles/base.css :root` — 1 个颜色变量

| 变量 | 值 |
|------|-----|
| `--status-icon-color` | `#000` |

### 2.2 高频重复硬编码色（下一步应抽成全局变量）

| 色值 | 出现频次 | 典型用途 | 应���取变量名 |
|------|---------|---------|-------------|
| **`#fafafa`** | ~25 | 页面/phone shell/导航栏/composer/对话区/sheet 背景 | `--color-bg-base` |
| **`#fff`** | ~20 | 卡片表面/弹出层/代码区/选中态 | `--color-bg-surface` |
| **`#1c1c1e`** | ~10 | 标题/副标题文字 | `--color-text-primary` |
| **`#000`** | ~10 | 状态栏时间/卡片标题/图标 fill | `--color-text-strong` |
| **`#111114`** | ~6 | 标题（feature-panel） | `--color-heading` |
| **`#8e8e93`** | ~12 | 副标题/弱文字 | `--color-text-secondary` |
| **`#6e6e73`** | ~8 | muted 文字/标签色 | `--color-text-muted` |
| **`#EBEBEB`** | ~12 | demo 控件按钮/滑块/灰底 | `--color-bg-control` |
| **`rgba(0,0,0,0.30)`** | ~6 | 弱文字（timing-bar、thinking-btn） | `--color-text-weak` |
| **`rgba(0,0,0,0.7)`** | ~6 | 演示控件次级文字、停止按钮 | `--color-text-dim` |
| **`#3B3B3B`** | ~3 | demo 控件激活态背景 | `--color-bg-active` |
| **`#e9ecf1`** | ~3 | wb-card / code sheet 边框 | `--color-border` |
| **`rgba(0,0,0,0.08)`** | ~5 | 弱边框 | `--color-border-weak` |
| **`#f2f2f2`** | ~4 | 文件卡片背景/代码 tab 底 | `--color-bg-soft` |

---

## 3. 硬编码颜色分布

### 3.1 CSS 文件总览

| 文件 | 硬编码处数 | 变量化比例 | 复杂程度 |
|------|-----------|-----------|---------|
| `feature-panel.css` | **~100+** | <10% | 最大头，右侧说明栏 |
| `demo-controls.css` | ~50+ | 0% | 量大但独立 |
| `markdown.css` | ~40+ | ~40% | 有 --md-* 但硬编码多 |
| `sheet.css` | ~30+ | 0% | 结构清晰 |
| `base.css` | ~25 | ~4% | 全局背景色多 |
| `composer.css` | ~18 | 0% | 中等 |
| `conversation.css` | ~12 | 0% | 中等 |
| **合计** | **~280+** | **<15%** | |

### 3.2 JS 引擎硬编码颜色

| 文件 | 颜色数 | 明细 |
|------|-------|------|
| `engine/icons.js` | 7 | `ICONS.{ok/spin/todoOk/todoSpin/todoEmpty/warn}` 内联 SVG |
| `engine/ask-question.js` | 6 | CHECK_SVG/DRAG/VOICE/SENT/NEXT/GLYPH |
| `engine/player-state.js` | 7 | RESPONSE_SVGS 7 个占位图标 |
| `engine/player-dom.js` | 2 | Agent 头像 #000 + #FFF |
| `engine/scroll-nav.js` | 2 | 上下箭头 `fill="black"` |
| `engine/composer.js` | 1 | chip close `#030303` |
| `engine/showcase-codeblock.js` | 2 | 营养环 `#eee` / `#34c759` |
| `engine/table-fullscreen.js` | 2 | 复制成功 `#34C759`、mermaid fail `#c62828` |
| `engine/click-indicator.js` | 2 | 指示点 `rgba(0,0,0,0.1)` |

### 3.3 `index.html` 内联脚本颜色

| 位置 | 色值 | 说明 |
|------|------|------|
| L430 `btn.style.color = '#34C759'` | 复制成功 green | 语义色保留 |
| L490 `var COLOR = '#BBBAB0'` | 网格线 | 桌面展示用 |
| L611 `fill="#F8F6F1"` | 网格回字 | 桌面展示用 |

### 3.4 `features/*.js` 文档内容色（非组件样式，纯说明文本）

| 色值 | 频次 | 用途 |
|------|------|------|
| `#86868b` | 8 | `labeled()` 辅助描述文字 |
| `#a8071a` | 5 | 交互强调红色 |
| `#e9ecf1` | 1 | 状态机边框 |
| `#f5f5f7` | 1 | 快照容器背景 |
| Mermaid 色板 | 10 | 流程图节点配色（info-arch.js） |

---

## 4. 现有基础设施

### 4.1 已存在但未接线的暗色模式入口

- `index.html:327`：`#ctrlTheme` 按钮已存在，带有 `.dc-theme-btn` 类名和 `aria-label="切换为暗色模式"`
- `styles/demo-controls.css:543`：`.dc-theme-btn` 样式已定义（仅基础尺寸，无暗色样式）
- `engine/feature-panel.js:76`：右侧面板 `.fp-scroll` 已有 `data-theme="light"` 属性

**当前状态：没有任何 JS handler 绑定 `#ctrlTheme`，点击无反应。**

### 4.2 右侧 Feature Panel 的 GitHub Markdown 主题

`index.html:16` 从 CDN 加载 `github-markdown.css`：

```html
<link rel="stylesheet" href="./vendor/github-markdown.css">
```

GitHub Markdown CSS 本身没有 `.markdown-body[data-theme="dark"]` 支持。暗色模式时需要另外加载 GitHub Dark 主题（CDN 或 vendor），或者自己覆盖。

### 4.3 代码高亮（highlight.js）

`index.html:18` 从 CDN 加载 `github.min.css`：

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github.min.css">
```

暗色模式时需要切换为 `github-dark.min.css`。

### 4.4 Mermaid 图表

`engine/table-fullscreen.js:85` 和 `engine/mermaid-render.js:14` 初始化为 `theme: 'default'`。暗色模式需要切换为 `theme: 'dark'` 或通过 `themeVariables` 自定义。

---

## 5. 实施路线

### Step 1 — 修 SVG Registry 异常（2 处，低风险）

- `icons-inline.js:6`：`ing.svg` 的 `fill="white"` → 需确认语义。如果它是空态占位，应改为 `fill="currentColor"` + 父级控制 color
- `icons-inline.js:36`：`wb-more-indicator.svg` 的 `#D97757` → 需在 `svgFromRegistry()` 增加白名单，或改用 CSS class 控制颜色

### Step 2 — `engine/icons.js` ICONS 对象（7 项）

- `ok`、`todoOk`、`todoEmpty`：改用 `currentColor` 或 CSS 变量
- `spin`、`todoSpin`、`warn`：语义色保留，但支持暗色微调（通过 CSS 或 theme-aware 值）
- `chevron`：已用 `currentColor`，无需改动

### Step 3 — 抽取全局颜色变量

在 `styles/markdown.css :root` 增补全局变量（推荐命名 `--cv-*` 或 `--color-*`）：

```
--color-bg-base: #fafafa;      /* 页面/phone shell 背景 */
--color-bg-surface: #fff;      /* 卡片/面板 */
--color-bg-control: #EBEBEB;   /* 控制面板按钮 */
--color-bg-soft: #f2f2f2;     /* 弱背景 */
--color-text-primary: #1c1c1e; /* 正文主色 */
--color-text-secondary: #8e8e93; /* 弱文字 */
--color-text-weak: rgba(0,0,0,0.30); /* 最弱文字 */
--color-text-dim: rgba(0,0,0,0.7); /* 中弱文字 */
--color-border: #e9ecf1;       /* 标准边框 */
--color-border-weak: rgba(0,0,0,0.08); /* 弱边框 */
```

然后在 `:root [data-theme="dark"]` 或 `[data-theme="dark"]` 里覆盖。

### Step 4 — 各 CSS 文件追加暗色覆盖（按优先级排序）

1. `styles/base.css` — 全局背景 `#fafafa`、文本、玻璃按钮
2. `styles/conversation.css` — 消息气泡、状态行
3. `styles/composer.css` — 输入框外壳、按钮、wb-more
4. `styles/sheet.css` — 底部浮层遮盖、面板
5. `styles/demo-controls.css` — 控制面板按压/激活态
6. `styles/markdown.css` — 卡片/toolbar/表格（变量已定义，直接覆盖）
7. `styles/feature-panel.css` — 右侧说明栏（~100+ 处，最大头）

### Step 5 — Engine JS 内联颜色

- `composer.js`、`ask-question.js`：内联 SVG 颜色改用 CSS class 或 `currentColor`
- `showcase-codeblock.js`、`table-fullscreen.js`：语义色保留但调亮度
- `player-state.js`、`player-dom.js`：确认具体用途后处理

### Step 6 — `index.html` 内联 SVG 和脚本颜色

- 状态栏 SVG 图标（L46-50 + L62-99）→ 改 `currentColor`
- 导航栏按钮图标（L62、L79、L88）→ 改 `currentColor`
- 网格颜色（L490: `#BBBAB0`、L611: `#F8F6F1`）→ 定义 CSS 变量

### Step 7 — `#ctrlTheme` 接线

- 创建 `engine/controls-theme.js`，绑定 `#ctrlTheme.click`
- 切换逻辑：`document.documentElement.dataset.theme = 'dark' / 'light'`
- 持久化：`localStorage.setItem('wb-theme', ...)`
- 右侧面板同步：`feature-panel.js` 中 `.fp-scroll` 的 `data-theme` 属性
- 同步 Mermaid 和 highlight.js 主题切换

---

## 6. 风险与注意事项

### 6.1 SVG 颜色替换白名单缺失

`svgFromRegistry()` 的无差别替换会把所有 `fill="#xxx"` 替换成 `currentColor`，但 `wb-more-indicator.svg`（`#D97757`）是语义色，不应变色。需要增加白名单机制：要么在 SVG 自身标记 `data-color="fixed"`，要么在 `svgFromRegistry()` 中增加 exclude 列表。

**涉及文件**：
- `engine/icons.js:59-63`
- `engine/markdown.js:22-24`
- `engine/table-fullscreen.js:23-24`
- `engine/code-fullscreen-sheet.js:16-17`

### 6.2 右侧 Feature Panel 的 GitHub Markdown 主题静态加载

`index.html:16` 加载了 `vendor/github-markdown.css`（Light 版），但 `index.html:18` 还加载了 CDN 版 `github.min.css`（highlight.js 主题）。暗色模式需要：
- 加载 `vendor/github-markdown-dark.css` 或自行覆盖
- 切换 highlight.js 主题为 `github-dark.min.css`
- 切换 Mermaid `theme: 'dark'`

这些是外部样式，不是 CSS 变量可以覆盖的，需��额外加载。

### 6.3 `#fafafa` 全局背景色的影响面

`#fafafa` 出现在 ~25 处，是使用最广的色值。它覆盖了页面背景、phone shell、导航栏、对话区、status bar、composer 区、sheet 面板等多个区域。暗色模式需要将其统一替换（或通过全局 CSS 变量控制），但需要注意导航栏渐变（`#fafafa → transparent`）和 sheet 遮罩（`rgba(0,0,0,0.30)`）的过渡一致性。

### 6.4 Glass 按钮系统的浅色质感

`.glass-btn / .glass-capsule` 使用大量 `rgba(255,255,255, ...)` 的渐变和阴影来模拟毛玻璃效果（`base.css:353-371`）。暗色模式下需要重新设计玻璃质感：
- 白色透明层 → 改为黑色透明层
- 浅白色内阴影 → 改为深色内发光
- 浅色外边框 → 改为深色外边框

### 6.5 `demo-controls.css` 的高频点击态

demo 控件的按钮有 4-5 层级（normal / hover / active / is-active / is-active:hover / is-active:active），每个状态都硬编码了颜色。暗色模式需要保持同样的层级关系，不能只覆盖基础态。

### 6.6 `feature-panel.css` 的规模

约 100+ 处硬编码，是该文件中最多的。但它结构清晰，按区域分组（nav / content / tab / principle / compare / snapshot / code / table / do-dont），可以分批处理。部分已有 `var(--md-border)` 作为 fallback（Figma 设计时引入），说明设计已考虑 token 化。

### 6.7 右侧面板的 `data-theme="light"` 不可被 `:root` 的 `data-theme` 继承

`feature-panel.js:76` 在 `.fp-scroll` 上硬写了 `data-theme="light"`，这是一个**绝对属性**，不会因为 `document.documentElement.dataset.theme = 'dark'` 而自动变。切换暗色模式时需要同步更新此属性。
