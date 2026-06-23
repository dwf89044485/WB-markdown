# Composer 移植方案

> chatboxgreen（React 定稿版）→ WorkBuddy（纯 HTML/CSS/原生 JS）

---

## 1. 源端分析

### 1.1 React 版文件清单

| 文件 | 行数 | 职责 |
|------|------|------|
| `chatboxgreen.tsx` | 512 | UI 渲染（JSX + inline style + motion.div） |
| `use-composer-core.ts` | 537 | 状态机（30+ useState/useRef，50+ 导出字段） |
| `voice-hold-input.tsx` | 478 | 语音覆盖层（VoiceHoldOverlay + VoiceModeToolbar） |
| `use-composer-voice-edit.ts` | — | 语音编辑状态 |

### 1.2 React 版依赖链

```
chatboxgreen.tsx
├── useComposerCore (30+ 状态变量)
│   ├── @assistant-ui/react (ComposerPrimitive)
│   └── zustand (useAppStore)
├── useComposerVoiceEdit
├── motion/react (AnimatePresence, motion.div)
├── VoiceHoldOverlay / VoiceModeToolbar
├── BackdropContext (composer-backdrop)
├── VirtualKeyboardPanel
├── AddPanel / ModelSelector / SlashSkillsPanel
└── lucide-react (图标)
```

### 1.3 核心状态（2.1~2.7 范围内）

| 状态 | 类型 | 作用 |
|------|------|------|
| `expanded` | boolean | 折叠 ↔ 展开 |
| `fullScreen` | boolean | 展开 ↔ 全屏 |
| `voiceMode` | boolean | 语音模式 |
| `recording` | boolean | 录音中 |
| `hasKeyboard` | boolean | 键盘面板是否显示 |
| `chip` / `chipId` / `chipSuggestions` / `chipPlaceholder` | string/array | Chip 标签系统 |
| `lineCount` | number | textarea 行数 |
| `hasComposerContent` | computed | 是否有文字或附件 |
| `hasRecommendations` | computed | chip 是否有建议项 |
| `showExpandHandle` | computed | lineCount >= 4 |
| `compactHeightPx` | number | ResizeObserver 测量值 |
| `addPanelOpen` | boolean | 添加面板 |

---

## 2. 目标端分析

### 2.1 项目架构特征

```
index.html          ← DOM 骨架（手机壳、导航、对话、composer、浮层）
styles/*.css        ← 视觉层（CSS 变量 tokens、class 驱动状态、transition 动画）
engine/*.js         ← 逻辑层（ES Module，一个文件一个职责，导出函数）
scenario.js         ← 数据层（剧本、配置）
```

### 2.2 现有模式：CSS class 驱动状态

```js
// player-state.js — 现有 composer 集成点
export function setComposerGenerating(generating) {
  const shell = document.querySelector('.composer-shell');
  if (!shell) return;
  shell.classList.toggle('is-generating', generating);
}
```

动画全靠 CSS，JS 只 toggle class。这是项目已验证的成功模式。

### 2.3 现有 composer HTML（index.html）

当前是极简版：固定 46px 高度，placeholder 居中，两个按钮（+ / 麦克风），无展开态，无 chip，无全屏。

---

## 3. 架构设计原则

针对 "AI 改得准、改得快、改得对" 这个核心目标：

| 原则 | 含义 | 反例 |
|------|------|------|
| **视觉归 CSS，状态归 JS，互不越界** | JS 只管 `classList` 和 CSS 变量；CSS 管所有视觉参数 | inline style 写颜色、字号 |
| **一个文件一件事，纵深 ≤ 2 层** | 每个文件职责一句话说清 | React 版 Backdrop → context → store → composer |
| **状态用 class 表达，不用 JS 表达** | `.is-expanded` 驱动 CSS，而非 `if (state.expanded) renderX()` | React 版 4 层嵌套条件渲染 |

---

## 4. 目标架构

```
                    ┌─────────────────────────┐
                    │     index.html           │
                    │  composer HTML 骨架      │
                    │  （静态 DOM，class 驱动） │
                    └──────────┬──────────────┘
                               │ querySelector
                    ┌──────────▼──────────────┐
                    │  engine/composer.js      │
                    │  状态机 + 事件绑定       │
                    │  只做三件事：            │
                    │  ① 读写 CSS 变量         │
                    │  ② toggle classList     │
                    │  ③ 绑定事件监听         │
                    └──────────┬──────────────┘
                               │ CSS 变量 / class
                    ┌──────────▼──────────────┐
                    │  styles/composer.css     │
                    │  所有视觉：尺寸、颜色、   │
                    │  圆角、阴影、transition、 │
                    │  keyframe、各状态样式     │
                    └─────────────────────────┘
```

**只有 3 个文件，零依赖，零构建。**

### 4.1 文件职责

| 文件 | 职责 | AI 改什么时动它 |
|------|------|----------------|
| `index.html` | composer DOM 骨架 | 增删按钮、调整 DOM 结构 |
| `engine/composer.js` | 状态机 + 事件绑定 | 改交互逻辑、加新状态 |
| `styles/composer.css` | 所有视觉样式 + 动画 | 调颜色、圆角、间距、动画 |

### 4.2 状态表达方式

不写条件渲染，只用 class：

```css
.composer-shell { height: 46px; }                              /* 折叠态 */
.composer-shell.is-expanded { height: var(--cp-height); }       /* 展开态 */
.composer-shell.is-fullscreen { height: 100dvh; border-radius: 24px 24px 0 0; }
```

JS 只做：

```js
shell.classList.add('is-expanded');
shell.style.setProperty('--cp-height', px + 'px');
```

### 4.3 CSS 自定义属性（替代 inline style）

需要动态传值的场景用 CSS 变量：

| CSS 变量 | 来源 | 作用 |
|----------|------|------|
| `--cp-height` | ResizeObserver 测量 | compact 态动态高度 |
| `--cp-chip-color` | 未来扩展 | chip 主题色 |
| 间距 | `--cv-agent-stack-gap` / `--cv-exec-stack-gap` | 沿用项目 token |

### 4.4 composer.js 内部结构（预估 150-200 行）

```js
// engine/composer.js

const state = {
  expanded: false,
  fullScreen: false,
  hasContent: false,
  lineCount: 1,
  chip: null,           // { id, label, suggestions, placeholder }
};

// 核心函数
function syncHeight()      // ResizeObserver → --cp-height
function syncLineCount()   // scrollHeight / 20 → lineCount → .has-expand-handle
function updateToolbar()   // hasContent → 发送/语音按钮切换
function showSuggestions() // chip.suggestions → 弹出列表
function enterFullScreen() // .is-fullscreen + 事件
function exitFullScreen()  // 恢复 compact
function collapse()        // .is-expanded 移除
function expand()          // .is-expanded 添加

export function initComposer() { bindEvents(); }
```

---

## 5. 功能映射

| React 版实现 | 本项目实现 |
|-------------|-----------|
| `useState(expanded)` | `state.expanded` + `.is-expanded` class |
| `useState(fullScreen)` | `state.fullScreen` + `.is-fullscreen` class |
| `useState(chip)` | `state.chip` + DOM 渲染 chip |
| `useState(lineCount)` | `state.lineCount` + `.has-expand-handle` class |
| `hasComposerContent` | `state.hasContent` + `.has-content` class |
| `compactHeightPx` (ResizeObserver) | `--cp-height` CSS 变量 |
| `motion.div` animate | CSS `transition`（相同 cubic-bezier） |
| `AnimatePresence` | CSS `animation` + `animationDelay` stagger |
| `suggestionSlideUp` keyframe | CSS `@keyframes cp-suggest-slide` |
| `GreenSendButton` 动画 | `.has-content .cp-btn-send { width:26px; }` |
| VoiceModeToolbar | 延期（2.8-2.15） |
| VoiceHoldOverlay | 延期（2.8-2.15） |
| VirtualKeyboardPanel | 先用原生键盘 |
| ModelSelector / AddPanel / SlashSkills | 先用占位 |

---

## 6. 与现有系统集成

### 6.1 替换范围

`index.html` 中 `<div class="composer">` 整个块替换为新 DOM 骨架。

### 6.2 播放引擎接口

现有 `setComposerGenerating(generating)` 通过 `.is-generating` class 控制。新 composer 保留此 class，**引擎侧零改动**。

### 6.3 对外暴露

```js
// engine/composer.js 导出的公共 API
export { initComposer, composeState, setComposerChip, setComposerText };
```

### 6.4 加载顺序

```html
<!-- index.html 底部 -->
<script type="module">
  import { initComposer } from './engine/composer.js';
  initComposer();
</script>
```

---

## 7. CSS 动画清单（本次范围）

| 动画 | 属性 | 时长 | 缓动 |
|------|------|------|------|
| 容器高度过渡 | `height`, `width`, `margin` | 320ms | `cubic-bezier(0.22,1,0.36,1)` |
| 容器圆角过渡 | `border-radius` | 320ms | 同上 |
| 发送按钮宽高 | `width`, `opacity` | 220ms | `ease` |
| 语音按钮位移 | `right` | 220ms | `ease` |
| 全屏蒙层 | `opacity` | 300ms | `ease-out` |
| 建议项滑入 | `animation` stagger | 250ms/item | `ease`，每项 35ms 延迟 |

---

## 8. 资源清单（本次范围）

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `plus-button.svg` | 20×20 | [+] 按钮 |
| `send-button.svg` | 26×26 | 发送按钮 |
| `mic-button.svg` | 20×20 | 麦克风按钮 |
| `composer-expand-v2.svg` | 26×26 | 展开手柄 |
| `composer-collapse-v2.svg` | 26×26 | 全屏缩小按钮 |

> 语音相关资源（5 个）属于 2.8-2.15 范围，暂不引入。

---

## 9. 不纳入本次移植的内容

| 功能 | 原因 |
|------|------|
| 语音模式（VoiceModeToolbar） | 2.8~2.15 延期 |
| 语音覆盖层（VoiceHoldOverlay） | 同上 |
| 虚拟键盘面板（VirtualKeyboardPanel） | 复杂度过高，先用原生 |
| 添加面板（AddPanel） | 保留 [+] 按钮入口，面板内容暂用占位 |
| 模型选择器（ModelSelector） | 同上 |
| Slash Skills 面板 | 同上 |
| ComposerAttachments（附件列表） | 暂无附件上传功能 |
| Backdrop 背景遮罩 | 全屏态本身已覆盖全屏，暂不需要 |
| 图片建议（image suggestions） | 暂无图片上传 |

---

## 10. 执行批次

| 批次 | 内容 | 预估行数 |
|------|------|---------|
| Batch 1 | `styles/composer.css` — 折叠态 + 展开 compact 态样式 | ~120 行 |
| Batch 2 | `styles/composer.css` — 全屏态 + 动画 keyframe | ~80 行 |
| Batch 3 | `styles/composer.css` — Chip 标签 + 建议列表 + 工具栏 | ~80 行 |
| Batch 4 | `index.html` — composer DOM 骨架 | ~50 行 |
| Batch 5 | `engine/composer.js` — 状态机 + 事件绑定 | ~200 行 |
| Batch 6 | 集成联调 + 播放引擎兼容 | ~20 行 |

---

## 11. 关键设计决策记录

| # | 决策 | 理由 |
|---|------|------|
| 1 | CSS 变量 `--cp-height` 传动态高度，不写 inline style | inline style 优先级过高，后续 CSS class 无法覆盖 |
| 2 | 状态用 class 而非 data-attribute | class 天然支持多状态组合，CSS 选择器更简洁 |
| 3 | 不引入 ResizeObserver polyfill | 目标浏览器（iOS Safari 13.4+）原生支持 |
| 4 | 折叠态右侧按钮先点击展开，不直接进语音 | 简化交互，语音模式后续补 |
| 5 | 全屏蒙层用独立 div + fixed 定位 | 与 React 版一致，不受容器 overflow:hidden 影响 |
| 6 | textarea 用 `inputMode="none"` 阻止原生键盘 | 后续可选择性开启，当前聚焦于输入体验 |

---

## 12. 风险与应对

| 风险 | 应对 |
|------|------|
| iOS 软键盘弹起导致布局抖动 | textarea `inputMode="none"` + 虚拟键盘面板（后续补） |
| 全屏态安全区域（刘海屏） | `env(safe-area-inset-top)` + `env(safe-area-inset-bottom)` |
| ResizeObserver 回调频率过高 | 只更新 CSS 变量，由浏览器合批渲染 |
| 现有 `.composer` 样式冲突 | 新 CSS 文件在 `base.css` 之后加载，用更高特异性覆盖 |
