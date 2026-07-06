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

> **注意**：`:root` 之外仍有 ~11 处硬编码颜色（如 `#3D3D3D`、`#fff !important`、`rgba(0,0,0,0.12)` 等），变量化率实际仅约 50%。暗色改造时不能只覆盖 `:root`，需逐条排查 `:root` 外的硬编码。

#### `styles/base.css :root` — 1 个颜色变量 + 完整 spacing 体系

| 变量 | 值 |
|------|-----|
| `--status-icon-color` | `#000` |

> **重要**：`base.css :root` 已定义完整的 `--spacing-*` 间距体系（约 30 个变量），是全局 token 的正确归属文件。暗色模式的全局颜色变量应在此处增补，而非在 `markdown.css` 中定义。

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
| **`rgba(0,0,0,0.30)`** | ~6 | 弱文字（timing-bar、thinking-btn） | `--color-text-faint` |
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
| `approve-permission.css` | ~13 | ~85% | 已有 --ap-* 变量体系，但变量值仍为硬编码亮色 |
| `ask-question.css` | ~22 | ~50% | :root 有 11 token，但 :root 外仍有 ~11 处硬编码 |
| **合计** | **~300+** | **<15%** | |

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

`index.html:16` 从本地加载 `vendor/github-markdown.css`：

```html
<link rel="stylesheet" href="./vendor/github-markdown.css">
```

**`vendor/github-markdown.css` 已原生支持暗色模式**——该文件第 14 行起通过 `@media (prefers-color-scheme: dark)` 和 `[data-theme="dark"]` 属性选择器提供了完整的暗色变量覆盖。因此 Feature Panel 的暗色切换**不需要额外加载任何 CSS**，只需将 `.fp-scroll` 元素的 `data-theme` 属性从 `"light"` 切换为 `"dark"` 即可。

> **注意**：`github-markdown.css` 的暗色规则作用于 `.markdown-body[data-theme="dark"]`（类选择器），而 `feature-panel.css` 中大量规则使用 `#fpContent .markdown-body`（ID 选择器）。ID 选择器特异性高于类选择器，可能导致 `feature-panel.css` 中的硬编码颜色覆盖掉 `github-markdown.css` 的暗色变量。这是实施时需重点排查的特异性冲突。

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

### Step 0 — 骨架接线（30 分钟，可立即验证）

先搭建可切换的最小骨架，后续每一步都能即时在浏览器中 toggle 验证效果：

1. 在 `styles/base.css :root` 增补 2-3 个核心全局变量（`--color-bg-base`、`--color-text-primary`），并添加 `[data-theme="dark"]` 空壳覆盖块
2. 创建 `engine/controls-theme.js`，绑定 `#ctrlTheme.click`，切换 `document.documentElement.dataset.theme`
3. 在 `index.html` 的 `<head>` 内联一段同步防闪屏脚本（FOUC prevention）：

```html
<script>
  // 在 CSS 加载前同步读取主题，防止暗色用户看到一帧白屏
  (function() {
    var saved = localStorage.getItem('wb-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') document.documentElement.style.colorScheme = 'dark';
  })();
</script>
```

4. `controls-theme.js` 中实现完整切换逻辑：
   - 首次访问读取 `prefers-color-scheme` 系统偏好作为默认值
   - 用户手动切换后 `localStorage.setItem('wb-theme', ...)` 覆盖
   - 设置 `document.documentElement.style.colorScheme` 让浏览器原生控件（滚动条、输入框）自动适配
   - 同步 `.fp-scroll` 的 `data-theme` 属性
5. 在 `html` 上添加全局过渡动画：`transition: background-color 0.3s ease, color 0.3s ease`（**不要用 `transition: all`**，会严重影响性能）

### Step 1 — 抽取全局颜色 Token（地基，必须最先做）

在 `styles/base.css :root` 增补全局颜色变量（**不放 `markdown.css`**，`base.css` 已有完整的 `--spacing-*` 体系，是全局 token 的正确归属）：

```css
:root {
  /* === 全局颜色 Token === */
  --color-bg-canvas: #fafafa;       /* 最底层背景（页面/phone shell） */
  --color-bg-surface: #fff;         /* 卡片/面板表面 */
  --color-bg-elevated: #fff;        /* 浮层/弹窗（z-index 最高层） */
  --color-bg-control: #EBEBEB;      /* 控制面板按钮 */
  --color-bg-soft: #f2f2f2;         /* 弱背景 */
  --color-bg-active: #3B3B3B;       /* 激活态背景 */

  --color-text-primary: #1c1c1e;    /* 正文主色 */
  --color-text-secondary: #8e8e93;  /* 次要文字 */
  --color-text-muted: #6e6e73;      /* 弱化文字 */
  --color-text-faint: rgba(0,0,0,0.30);  /* 最弱文字 */
  --color-text-dim: rgba(0,0,0,0.7);     /* 中弱文字 */
  --color-text-strong: #000;        /* 最强文字（状态栏时间等） */
  --color-heading: #111114;         /* 标题 */

  --color-border: #e9ecf1;          /* 标准边框 */
  --color-border-weak: rgba(0,0,0,0.08); /* 弱边框 */

  /* === 阴影体系 === */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.10);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.12);
}

[data-theme="dark"] {
  --color-bg-canvas: #1c1c1e;
  --color-bg-surface: #2c2c2e;
  --color-bg-elevated: #3a3a3c;
  --color-bg-control: #3a3a3c;
  --color-bg-soft: #2c2c2e;
  --color-bg-active: #48484a;

  --color-text-primary: #f5f5f7;
  --color-text-secondary: #a1a1a6;
  --color-text-muted: #8e8e93;
  --color-text-faint: rgba(255,255,255,0.30);
  --color-text-dim: rgba(255,255,255,0.7);
  --color-text-strong: #fff;
  --color-heading: #f5f5f7;

  --color-border: #38383a;
  --color-border-weak: rgba(255,255,255,0.10);

  /* 暗色阴影需提高不透明度，否则在深色背景上不可见 */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-lg: 0 12px 32px rgba(0,0,0,0.5);
}
```

然后在 `markdown.css :root` 中让模块级 `--md-*` 变量引用全局 `--color-*`：

```css
:root {
  --md-text-primary: var(--color-text-primary);
  --md-surface: var(--color-bg-surface);
  --md-border: var(--color-border);
  /* ... 其余 --md-* 同理引用 --color-* ... */
}
```

这样暗色覆盖只需在 `base.css` 写一处 `[data-theme="dark"]`，所有 `--md-*` 自动跟随。

### Step 2 — 修 SVG Registry 异常（2 处，低风险）

- `icons-inline.js:6`：`ing.svg` 的 `fill="white"` → 需确认语义。如果它是空态占位，应改为 `fill="currentColor"` + 父级控制 color
- `icons-inline.js:36`：`wb-more-indicator.svg` 的 `#D97757` → 需在 `svgFromRegistry()` 增加白名单，或改用 CSS class 控制颜色

### Step 3 — `engine/icons.js` ICONS 对象（7 项）

- `ok`、`todoOk`、`todoEmpty`：改用 `currentColor` 或 CSS 变量
- `spin`、`todoSpin`、`warn`：语义色保留，但支持暗色微调（通过 CSS 或 theme-aware 值）
- `chevron`：已用 `currentColor`，无需改动

### Step 4 — 各 CSS 文件追加暗色覆盖（按优先级排序）

**排序原则：最大头先啃，Token 体系 early 压测。**

1. `styles/base.css` — 全局背景 `#fafafa`、文本、玻璃按钮
2. `styles/feature-panel.css` — 右侧说明栏（~100+ 处，最大头，提前到第二位以压测 Token 体系）
   - **注意特异性冲突**：`#fpContent .markdown-body`（ID 选择器，44 处）会覆盖 `github-markdown.css` 的 `.markdown-body[data-theme="dark"]`（类选择器）。需将 `feature-panel.css` 中的硬编码色替换为 `var(--color-*)`，否则暗色变量无法生效
   - **Feature Panel 快照一致性**：快照通过 `renderStaticXxx(mode: 'static')` 生成，需确认暗色下快照容器是否传入主题信息，避免形成"亮色孤岛"
3. `styles/conversation.css` — 消息气泡、状态行
   - **注意 `drop-shadow` 反向语义**：`conversation.css` 中使用 `#fafafa` 做 `drop-shadow()` 文字描边，暗色底上需改为深色描边，逻辑跟背景色是反的，不能简单用 `var(--color-bg-base)` 替换
4. `styles/composer.css` — 输入框外壳、按钮、wb-more
5. `styles/sheet.css` — 底部浮层遮盖、面板
6. `styles/approve-permission.css` — 权限请求卡片（已有 `--ap-*` 变量体系，只需在 `[data-theme="dark"]` 中覆盖变量值）
7. `styles/ask-question.css` — 问答卡片（`:root` 有 11 token，但 `:root` 外仍有 ~11 处硬编码需逐条排查）
8. `styles/demo-controls.css` — 控制面板按压/激活态（5 层级状态需逐层覆盖）
9. `styles/markdown.css` — 卡片/toolbar/表格（变量已定义，直接覆盖）

### Step 5 — Engine JS 内联颜色

- `composer.js`、`ask-question.js`：内联 SVG 颜色改用 CSS class 或 `currentColor`
- `showcase-codeblock.js`、`table-fullscreen.js`：语义色保留但调亮度
- `player-state.js`、`player-dom.js`：确认具体用途后处理

### Step 6 — `index.html` 内联 SVG 和脚本颜色

- 状态栏 SVG 图标（L46-50 + L62-99）→ 改 `currentColor`
- 导航栏按钮图标（L62、L79、L88）→ 改 `currentColor`
- 网格颜色（L490: `#BBBAB0`、L611: `#F8F6F1`）→ 定义 CSS 变量

### Step 7 — 外部依赖主题切换

- **highlight.js**：切换 `github.min.css` → `github-dark.min.css`
  - 运行时动态替换 `<link>` 有 FOUC 风险，建议预加载双主题 CSS + `disabled` 属性切换
- **Mermaid**：`theme: 'default'` → `theme: 'dark'`
  - **必须重新渲染**：Mermaid 渲染是一次性的，切主题需重新调用 `mermaid.run({ theme: 'dark' })` 重绘所有已渲染图表，不能仅靠 CSS 变量切换
  - 切回亮色时同理需 `mermaid.run({ theme: 'default' })` 重绘

---

## 6. 风险与注意事项

### 6.1 SVG 颜色替换白名单缺失

`svgFromRegistry()` 的无差别替换会把所有 `fill="#xxx"` 替换成 `currentColor`，但 `wb-more-indicator.svg`（`#D97757`）是语义色，不应变色。需要增加白名单机制：要么在 SVG 自身标记 `data-color="fixed"`，要么在 `svgFromRegistry()` 中增加 exclude 列表。

**涉及文件**：
- `engine/icons.js:59-63`
- `engine/markdown.js:22-24`
- `engine/table-fullscreen.js:23-24`
- `engine/code-fullscreen-sheet.js:16-17`

### 6.2 右侧 Feature Panel 的 GitHub Markdown 主题

`vendor/github-markdown.css` **已原生支持暗色模式**（第 14 行起通过 `[data-theme="dark"]` 属性选择器提供暗色变量覆盖）。暗色切换只需将 `.fp-scroll` 的 `data-theme` 属性从 `"light"` 改为 `"dark"`，无需额外加载 CSS。

**但需注意特异性冲突**：`feature-panel.css` 中 44 处使用 `#fpContent .markdown-body`（ID 选择器），特异性高于 `github-markdown.css` 的 `.markdown-body[data-theme="dark"]`（类选择器）。如果不把 `feature-panel.css` 中的硬编码色替换为 `var(--color-*)`，暗色变量会被 ID 选择器覆盖而失效。

highlight.js 主题切换（`github.min.css` → `github-dark.min.css`）和 Mermaid 主题切换（`theme: 'dark'` + 重新渲染）仍需处理。

### 6.3 `#fafafa` 全局背景色的影响面

`#fafafa` 出现在 ~25 处，是使用最广的色值。它覆盖了页面背景、phone shell、导航栏、对话区、status bar、composer 区、sheet 面板等多个区域。暗色模式需要将其统一替换（或通过全局 CSS 变量控制），但需要注意导航栏渐变（`#fafafa → transparent`）和 sheet 遮罩（`rgba(0,0,0,0.30)`）的过渡一致性。

### 6.4 Glass 按钮系统的浅色质感

`.glass-btn / .glass-capsule` 使用大量 `rgba(255,255,255, ...)` 的渐变和阴影来模拟毛玻璃效果（`base.css:353-371`）。暗色模式下需要重新设计玻璃质感：
- 白色透明层 → 改为黑色透明层
- 浅白色内阴影 → 改为深色内发光
- 浅色外边框 → 改为深色外边框

> **警告：不能纯代码反色**。白色透明层多层叠加的毛玻璃质感，直接反色会得到浑浊灰色块，丧失折射层次感。暗色玻璃仍需保留浅色高光层模拟折射（参考 Apple `UIBlurEffect.systemMaterialDark` 的实现思路）。**建议在实施前先做视觉 PoC 验证**，由设计师确认暗色玻璃参数后再批量替换。

### 6.5 `demo-controls.css` 的高频点击态

demo 控件的按钮有 4-5 层级（normal / hover / active / is-active / is-active:hover / is-active:active），每个状态都硬编码了颜色。暗色模式需要保持同样的层级关系，不能只覆盖基础态。

### 6.6 `feature-panel.css` 的规模

约 100+ 处硬编码，是该文件中最多的。但它结构清晰，按区域分组（nav / content / tab / principle / compare / snapshot / code / table / do-dont），可以分批处理。部分已有 `var(--md-border)` 作为 fallback（Figma 设计时引入），说明设计已考虑 token 化。

### 6.7 右侧面板的 `data-theme="light"` 不可被 `:root` 的 `data-theme` 继承

`feature-panel.js:76` 在 `.fp-scroll` 上硬写了 `data-theme="light"`，这是一个**绝对属性**，不会因为 `document.documentElement.dataset.theme = 'dark'` 而自动变。切换暗色模式时需要同步更新此属性。

### 6.8 FOUC 防闪屏（Flash of Unstyled Content）

使用 `localStorage` 持久化主题时，如果主题切换逻辑在 CSS 加载之后执行，暗色用户会先看到一帧白屏再跳变为暗色。**必须在 `<head>` 内联一段同步脚本**，在 CSS 加载前读取并设置 `data-theme`（见 Step 0 中的内联脚本）。

### 6.9 `prefers-color-scheme` 系统偏好缺失

报告原方案只考虑了手动 toggle + localStorage，未考虑首次访问时读取系统偏好。完整策略应是：**系统偏好作默认 → 用户手动切换后 localStorage 覆盖**。否则首次访问的暗色系统用户仍会看到亮色主题。

### 6.10 阴影体系在暗色下不可见

当前阴影均为 `rgba(0,0,0,0.08)` 等低对比度设计，在暗色背景上几乎不可见，会导致卡片/浮层的层级关系丢失。需定义 `--shadow-sm/md/lg` 暗色变量集，提高不透明度至 `0.3~0.5`（见 Step 1 中的阴影 Token 定义）。

### 6.11 主题切换过渡动画

直接切换 `data-theme` 会导致颜色瞬间跳变，体验生硬。需在 `html` 上添加 `transition: background-color 0.3s ease, color 0.3s ease`。**注意不要用 `transition: all`**，会严重影响性能并导致布局抖动。

### 6.12 `color-scheme` 元属性

在 `html[data-theme="dark"]` 上设置 `color-scheme: dark` 可让浏览器原生控件（滚动条、表单输入框、`<select>` 下拉等）自动适配暗色，无需额外 CSS。报告原方案未提及此属性。
