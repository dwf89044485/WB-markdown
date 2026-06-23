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

---

## 附录 A：逐状态视觉规格（像素级精确）

> 以下所有数值均从 `chatboxgreen.tsx`（commit: 定稿版）中逐行提取，未经任何主观调整。
> 颜色值已从 shadcn/ui `oklch` 变量转换为本项目体系的实际 rgba/hex。

### A.1 颜色映射

| Tailwind/Token | 实际值 | 本项目使用 |
|---------------|--------|-----------|
| `text-foreground` | `#0a0a0a` | `#1c1c1e`（项目深色文字标准） |
| `text-foreground/75` | `rgba(0,0,0,0.75)` | 同上 |
| `text-muted-foreground` | `rgba(0,0,0,0.5)` | 同上 |
| `text-black/30` | `rgba(0,0,0,0.3)` | placeholder |
| `text-black/40` | `rgba(0,0,0,0.4)` | "清空" 按钮 |
| `bg-black/5` | `rgba(0,0,0,0.05)` | 建议项 active 态 |
| `#FFFFFF` | 纯白 | 容器背景 |
| `#E7EFF4` | 淡蓝 | Chip 标签背景 |
| `#030303` | 近黑 | Chip 文字和图标 |
| `#fafafa` | 页面底色 | 沿用项目 |

### A.2 动画曲线速查

| 场景 | 属性 | 时长 | 缓动函数 |
|------|------|------|----------|
| 容器高度/宽度/margin | `height`, `width`, `margin` | 320ms | `cubic-bezier(0.22, 1, 0.36, 1)` |
| 容器圆角 | `border-radius` | 320ms | 同上 |
| 发送按钮显隐 | `width`, `opacity` | 220ms | `ease` |
| 语音按钮位移 | `right` | 220ms | `ease` |
| 工具栏容器宽度 | `width` | 220ms | `ease` |
| 全屏蒙层 | `opacity` | 300ms | `ease-out` |
| 建议项滑入 (stagger) | `animation` | 250ms/item | `ease`，每项增量延迟 35ms |
| 语音光晕显隐（容器整体） | `opacity` | 250ms | `cubic-bezier(0.32, 0.72, 0, 1)` |

### A.3 全局 Root 容器

```yaml
选择器: "ComposerPrimitive.Root" 渲染的 <div>
定位:
  position: relative
  width: "100%"
  z-index: 50
内边距:
  padding-left: 26px   # Tailwind: px-[26px]
  padding-right: 26px
冻结态:
  pointer-events: none  # 当 core.frozen = true 时追加
```

---

### A.4 状态 1：Collapsed（折叠态，默认）

#### A.4.1 渲染条件

```
core.expanded = false
core.voiceMode = false
```

> 注：collapsed + voiceMode 走 VoiceModeToolbar（2.8-2.15 延期，详见 A.10）。

#### A.4.2 主容器 `.motion.div`

```yaml
定位: relative, z-index: 10
宽度: "100%"
溢出: overflow: hidden
最小高度: "46px"
高度: "46px"
背景: "#FFFFFF"
圆角: "24px"（四角统一）
阴影: "0 4px 10px 0 rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.08)"
外边距: marginInline: "0px"
过渡动画: "height 320ms cubic-bezier(0.22,1,0.36,1), width 320ms cubic-bezier(0.22,1,0.36,1), margin 320ms cubic-bezier(0.22,1,0.36,1), border-radius 320ms cubic-bezier(0.22,1,0.36,1)"
```

#### A.4.3 内部布局

```html
<!-- 结构 -->
<div class="flex h-full items-center">
  <!-- 左侧区域：点击展开（非按钮部分） -->
  <div class="flex items-center flex-1 min-w-0"
       onPointerDown → activateComposerInput()>

    <!-- [+] 按钮 -->
    <button type="button" tabIndex="-1"
            class="flex h-[46px] w-12 items-center justify-center shrink-0"
            aria-label="添加"
            onPointerDown → stopPropagation, setAddPanelOpen(true)>
      <img src="/icons/plus-button.svg" alt="" width="20" height="20" />
    </button>

    <!-- Placeholder 文字 -->
    <span class="flex-1 select-none truncate text-center text-black/30"
          style="fontSize:14px; lineHeight:24px; padding:8px 12px;">
      安排任务，WorkBuddy 帮你完成
    </span>
  </div>

  <!-- [🎤] 按钮 -->
  <button type="button" tabIndex="-1"
          class="flex h-[46px] w-12 items-center justify-center shrink-0"
          aria-label="语音输入"
          onPointerDown → preventDefault, setVoiceMode(true) ...>
    <img src="/icons/mic-button.svg" alt="" width="20" height="20" />
  </button>
</div>
```

#### A.4.4 视觉参数汇总

| 元素 | 属性 | 值 |
|------|------|-----|
| [+] 按钮容器 | width × height | 48px × 46px（`w-12` = 48px） |
| [+] 图标 | width × height | 20px × 20px |
| Placeholder | fontSize | 14px |
| Placeholder | lineHeight | 24px |
| Placeholder | padding | 8px 12px |
| Placeholder | color | `rgba(0,0,0,0.3)` |
| Placeholder | textAlign | center |
| Placeholder | userSelect | none |
| Placeholder | overflow | hidden, text-overflow: ellipsis |
| [🎤] 按钮容器 | width × height | 48px × 46px |
| [🎤] 图标 | width × height | 20px × 20px |

---

### A.5 状态 2：Expanded Compact（展开态，非全屏）

#### A.5.1 渲染条件

```
core.expanded = true
core.fullScreen = false
```

#### A.5.2 主容器变化

```yaml
# 相比 Collapsed 态的变化
高度: compactHeightPx + "px"  # 动态，min=72px，由 ResizeObserver 测量 compactContentRef
# 其余属性（背景、圆角、阴影等）保持不变
```

#### A.5.3 内部结构（compactContentRef）

```html
<div ref={compactContentRef} class="flex w-full flex-col items-start p-[10px]">

  <!-- 内容包裹层 -->
  <div class="flex w-full flex-col px-[4px] py-px">

    <!-- 附件列表（条件渲染） -->
    <ComposerAttachments />  <!-- 暂无，占位 -->

    <!-- Chip 标签（条件渲染，有 chip 才出现） -->
    <button type="button" tabIndex="-1"
            class="inline-flex items-center self-start mb-[4px]"
            style="background:#E7EFF4; borderRadius:100px; padding:6px 10px 6px 8px; gap:6px;"
            aria-label="移除标签"
            onClick → suppressEmptyCollapse, clearChip()>
      <!-- Chip 图标 + 文字 -->
      <div class="flex items-center" style="gap:3px;">
        <ChipIcon  style="width:15px; height:15px; color:#030303;" strokeWidth="1.5" />
        <span style="fontSize:12px; lineHeight:16px; color:#030303;">{chip}</span>
      </div>
      <!-- X 关闭图标 -->
      <XIcon class="shrink-0 opacity-40" style="width:10px; height:10px;" />
    </button>

    <!-- Textarea + 展开手柄行 -->
    <div class="flex w-full items-start gap-[4px]">

      <!-- Textarea -->
      <textarea
        class="chatboxgreenTextarea min-w-0 flex-1 resize-none bg-transparent outline-none
               placeholder:text-black/30 overflow-y-auto"
        style="fontSize:14px; lineHeight:20px; transform:none;"
        max-h: "200px"  # compact 态限制
        placeholder="安排任务，WorkBuddy 帮你完成"  # 或有 chipPlaceholder
        inputMode="none"
        rows=1 />

      <!-- 展开手柄（lineCount >= 4 时可见） -->
      <button type="button" tabIndex="-1"
              aria-label="展开更多"
              class="relative flex items-center justify-center size-[26px] shrink-0
                     after:absolute after:inset-[-9px] after:content-['']"
              style="opacity:{showExpandHandle ? 1 : 0};
                     pointerEvents:{showExpandHandle ? 'auto' : 'none'};"
              onPointerDown → preventDefault, enterFullScreen()>
        <img src="/icons/composer-expand-v2.svg" alt="" width="26" height="26" />
      </button>
    </div>
  </div>

  <!-- 工具栏（非录音态） -->
  <div class="flex gap-[16px] items-center w-full">

    <!-- [+] 附件按钮 -->
    <button type="button" tabIndex="-1"
            aria-label="添加附件"
            class="relative flex items-center justify-center size-[26px] shrink-0
                   after:absolute after:inset-[-12px] after:content-['']"
            onClick → setAddPanelOpen(true)>
      <img src="/icons/plus-button.svg" alt="" width="20" height="20" draggable="false" />
    </button>

    <!-- 模型选择器（占位） -->
    <ModelSelector />

    <!-- ⚡ 技能按钮 -->
    <button type="button" tabIndex="-1"
            aria-label="选择技能"
            class="relative flex items-center justify-center size-[26px] shrink-0
                   after:absolute after:inset-[-9px] after:content-['']"
            onClick → toggle panelOpen>
      <ZapIcon class="size-[20px]" strokeWidth="1.5" />
    </button>

    <!-- 右侧按钮组容器（ml-auto 推到最右） -->
    <div class="ml-auto relative h-[26px] shrink-0"
         style="width:{hasContent ? '68px' : '26px'};
                transition:width 220ms ease;">

      <!-- [🎤] 语音按钮 -->
      <button type="button" tabIndex={-1}
              aria-label="语音输入"
              class="absolute top-1/2 flex items-center justify-center size-[26px] shrink-0
                     after:absolute after:inset-[-9px] after:content-['']"
              style="right:{hasContent ? '42px' : '0px'};
                     transform:translateY(-50%);
                     transition:right 220ms ease;"
              onPointerDown={有内容时不响应}>
        <img src="/icons/mic-button.svg" alt="" width="20" height="20" draggable="false" />
      </button>

      <!-- 发送按钮（条件渲染/动画） -->
      <GreenSendButton hasContent={hasComposerContent} />  <!-- 详见 A.8 -->
    </div>
  </div>

  <!-- 录音态（条件替换整个工具栏） -->
  <!-- voice.recording = true 时显示 <VoiceRecorder />，2.8-2.15 延期 -->
</div>
```

#### A.5.4 Expanded Compact 视觉参数汇总

**外层容器内边距**：

| 属性 | 值 |
|------|-----|
| compactContentRef padding | `10px`（四边统一，`p-[10px]`） |

**内容包裹层**：

| 属性 | 值 |
|------|-----|
| 左右 padding | `4px`（`px-[4px]`） |
| 上下 padding | `1px`（`py-px` = 1px） |

**Chip 标签**：

| 属性 | 值 |
|------|-----|
| 背景色 | `#E7EFF4` |
| 圆角 | `100px`（完全胶囊） |
| 内边距 | `6px 10px 6px 8px`（上右下左） |
| 内部元素间距 | `6px`（gap） |
| 下边距 | `4px`（`mb-[4px]`） |
| 对齐 | `self-start`（左对齐） |
| Chip 图标宽高 | `15px × 15px` |
| Chip 图标颜色 | `#030303` |
| Chip 图标描边 | `strokeWidth: 1.5` |
| Chip 图标与文字间距 | `3px` |
| Chip 文字字号 | `12px` |
| Chip 文字行高 | `16px` |
| Chip 文字颜色 | `#030303` |
| X 关闭图标宽高 | `10px × 10px` |
| X 关闭图标透明度 | `0.4` |

**Textarea 行**：

| 属性 | 值 |
|------|-----|
| textarea 与展开手柄间距 | `4px`（`gap-[4px]`） |
| textarea 字号 | `14px` |
| textarea 行高 | `20px` |
| textarea 最大高度（compact） | `200px` → 超出后 overflow: auto |
| textarea placeholder 颜色 | `rgba(0,0,0,0.3)` |
| textarea 背景 | transparent |
| textarea 轮廓 | none |
| textarea resize | none |
| textarea flex | `min-w-0 flex-1` |

**展开手柄**：

| 属性 | 值 |
|------|-----|
| 按钮尺寸 | `26px × 26px` |
| 图标尺寸 | `26px × 26px` |
| 点击区域扩展 | `after: inset: -9px` |
| 可见条件 | `lineCount >= 4` |
| 隐藏时 opacity | `0` |
| 隐藏时 pointerEvents | `none` |

**工具栏**：

| 属性 | 值 |
|------|-----|
| 工具栏元素间距 | `16px`（`gap-[16px]`） |
| [+] 按钮尺寸 | `26px × 26px` |
| [+] 图标尺寸 | `20px × 20px` |
| [+] 点击区域扩展 | `after: inset: -12px` |
| ⚡ 按钮尺寸 | `26px × 26px` |
| ⚡ 图标尺寸 | `20px × 20px`，`strokeWidth: 1.5` |
| ⚡ 点击区域扩展 | `after: inset: -9px` |
| 右侧按钮组高度 | `26px` |
| 右侧按钮组宽度（无内容） | `26px` |
| 右侧按钮组宽度（有内容） | `68px` |
| 右侧按钮组过渡 | `width 220ms ease` |
| [🎤] 按钮尺寸 | `26px × 26px` |
| [🎤] 图标尺寸 | `20px × 20px` |
| [🎤] 定位 | `absolute, top: 50%, transform: translateY(-50%)` |
| [🎤] right（无内容） | `0px` |
| [🎤] right（有内容） | `42px` |
| [🎤] 位移过渡 | `right 220ms ease` |

---

### A.6 状态 3：FullScreen（全屏态）

#### A.6.1 渲染条件

```
core.expanded = true
core.fullScreen = true
```

#### A.6.2 主容器变化

```yaml
# 相比 Expanded Compact 态的变化
高度: "calc(100dvh - var(--virtual-keyboard-panel-height, 0px) - env(safe-area-inset-top))"
宽度: "calc(100% + 52px)"
外边距: marginInline: "-26px"
圆角: "24px 24px 0 0"  # 顶部保持圆角，底部拉直
# 背景、阴影不变
```

#### A.6.3 内部结构

```html
<div class="relative flex h-full w-full flex-col px-[20px] pt-[10px] pb-[20px]">

  <!-- 顶部工具栏 -->
  <div class="flex w-full items-center justify-between pb-[4px]">
    <!-- "清空" 按钮 -->
    <button type="button" tabIndex="-1"
            class="text-[14px] leading-[24px] text-black/40"
            onPointerDown → preventDefault, clearComposer()>
      清空
    </button>

    <!-- 缩小按钮 -->
    <button type="button" tabIndex="-1"
            aria-label="缩小输入框"
            class="relative flex size-[26px] items-center justify-center
                   after:absolute after:inset-[-9px] after:content-['']"
            onPointerDown → preventDefault, exitFullScreen()>
      <img src="/icons/composer-collapse-v2.svg" alt="" width="26" height="26" />
    </button>
  </div>

  <!-- 正文区域 -->
  <div class="flex-1 overflow-hidden pt-[4px]">
    <textarea
      class="chatboxgreenTextarea h-full w-full resize-none bg-transparent outline-none
             placeholder:text-black/30 overflow-y-auto"
      style="fontSize:14px; lineHeight:24px; transform:none; paddingInline:0;"
      placeholder="安排任务，WorkBuddy 帮你完成"
      inputMode="none"
      rows=1 />
  </div>

  <!-- 发送按钮（绝对定位，右下角） -->
  <div class="pointer-events-none absolute right-[20px] bottom-[20px]">
    <div class="pointer-events-auto relative h-[26px] w-[26px] shrink-0">
      <GreenSendButton hasContent={hasComposerContent} ... />
    </div>
  </div>
</div>
```

#### A.6.4 FullScreen 视觉参数汇总

**内部容器**：

| 属性 | 值 |
|------|-----|
| 上内边距 | `10px`（`pt-[10px]`） |
| 下内边距 | `20px`（`pb-[20px]`） |
| 左右内边距 | `20px`（`px-[20px]`） |

**顶部工具栏**：

| 属性 | 值 |
|------|-----|
| 下边距 | `4px`（`pb-[4px]`） |
| "清空" 字号 | `14px` |
| "清空" 行高 | `24px` |
| "清空" 颜色 | `rgba(0,0,0,0.4)` |
| 缩小按钮尺寸 | `26px × 26px` |
| 缩小图标尺寸 | `26px × 26px` |
| 缩小按钮点击区域 | `after: inset: -9px` |

**正文区域**：

| 属性 | 值 |
|------|-----|
| 上边距 | `4px`（`pt-[4px]`） |
| 高度 | `flex-1`（撑满剩余空间） |
| textarea 字号 | `14px` |
| textarea 行高 | `24px` |
| textarea padding | `0`（`paddingInline: 0`） |
| textarea 高度 | `100%`（CSS） |

**发送按钮容器**：

| 属性 | 值 |
|------|-----|
| 定位 | `absolute` |
| 距右 | `20px` |
| 距底 | `20px` |
| 内部容器尺寸 | `26px × 26px` |

---

### A.7 状态 4：全屏蒙层

#### A.7.1 渲染条件

```
始终存在于 DOM（非条件渲染），由 opacity 控制显隐
```

#### A.7.2 视觉参数

```yaml
定位: fixed, inset-x-0, top-0
z-index: 0（在主容器之下）
pointer-events: none（不阻挡交互）
背景: "black"（纯黑）
高度: "500px"
透明度（非全屏）: 0
透明度（全屏）: 0.3
过渡: "opacity 300ms ease-out"
```

---

### A.8 GreenSendButton（发送按钮）

#### A.8.1 渲染位置

- Expanded Compact: 工具栏右侧按钮组内
- FullScreen: 右下角绝对定位
- Collapsed + voiceMode（隐藏 textarea）: 1px 占位容器内

#### A.8.2 视觉参数

```yaml
定位: absolute, top: 50%, right: 0
尺寸（无内容）:
  width: "0px"
  height: "26px"
  opacity: 0
  overflow: hidden
尺寸（有内容）:
  width: "26px"
  height: "26px"
  opacity: 1
垂直居中: transform: "translateY(-50%)"
过渡: "width 220ms ease, opacity 220ms ease"
点击区域扩展: after:absolute after:inset-[-9px]
图标尺寸: 26px × 26px
图标来源: /icons/send-button.svg
```

---

### A.9 建议列表（Chip Suggestions / Image Suggestions）

#### A.9.1 渲染条件

```
Chip 建议: core.expanded && core.hasRecommendations（chip 存在且有 suggestions）
图片建议: core.expanded && showImageSuggestions && !core.hasRecommendations
```

#### A.9.2 容器

```yaml
定位: absolute
位置: inset-x: 26px  # 左右各缩进 26px
       bottom: 100%  # 紧贴主容器上方
z-index: 50
下内边距: 8px（pb-2）
```

#### A.9.3 每个建议项

```yaml
布局: flex, items-center
内边距: 上下 6px（py-1.5）, 左右 8px（px-2）
元素间距: 12px（gap-3）
圆角: 12px（rounded-xl）
文字颜色: rgba(0,0,0,0.75)（text-foreground/75）
hover 颜色: rgba(0,0,0,1)（text-foreground）
active 背景: rgba(0,0,0,0.05)（bg-black/5）
过渡: transition-colors
宽度: 100%
文字对齐: left
入场动画:
  animation: "suggestionSlideUp 0.25s ease both"
  animationDelay: "(length - 1 - i) * 35ms"  # 从底部开始 stagger
```

#### A.9.4 建议项左侧图标

```yaml
图标: ArrowUpIcon（lucide-react）
旋转: 45度（rotate-45）
尺寸: 14px × 14px（w-3.5 h-3.5）
透明度: 0.6
颜色: rgba(0,0,0,0.5)（text-muted-foreground）
```

#### A.9.5 建议项文字

```yaml
字号: 14px（text-sm）
行高: 20px（默认）
```

#### A.9.6 suggestionSlideUp keyframes

```css
@keyframes suggestionSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

> 实际 keyframes 定义在 React 版全局 CSS 中，上述为根据 `0.25s ease` + stagger delay 推断的标准实现。

---

### A.10 VoiceModeToolbar（折叠语音态）

> ⚠️ 2.8-2.15 延期，此处仅记录供后续参考。

#### A.10.1 渲染条件

```
core.expanded = false
core.voiceMode = true
```

#### A.10.2 内部结构

```html
<div class="flex h-full items-center">
  <!-- [+] 按钮 → 点击展开输入 -->
  <button type="button" tabIndex="-1"
          class="flex h-12 w-12 items-center justify-center shrink-0"
          aria-label="添加"
          onPointerDown → preventDefault, onExpandInput()>
    <img src="/icons/plus-button.svg" alt="" width="20" height="20" draggable="false" />
  </button>

  <!-- 按住说话区域 -->
  <button type="button" tabIndex="-1"
          class="flex min-w-0 flex-1 items-center justify-center select-none"
          style="padding:6px 10px; WebkitUserSelect:none; WebkitTouchCallout:none;
                 userSelect:none; touchAction:none;"
          aria-label="按住说话"
          onContextMenu → preventDefault
          onPointerDown → preventDefault, onHoldPointerDown(e)>
    <span class="select-none text-center" style="fontSize:15px; lineHeight:22px;">
      按住说话
    </span>
  </button>

  <!-- 键盘切换按钮 -->
  <button type="button" tabIndex="-1"
          class="flex items-center justify-center shrink-0"
          aria-label="切换键盘输入"
          onPointerDown → preventDefault, onExitVoiceMode()>
    <img src="/icons/keyboard-button.svg" alt="" width="48" height="48" aria-hidden draggable="false" />
  </button>
</div>
```

#### A.10.3 视觉参数

| 属性 | 值 |
|------|-----|
| [+] 按钮容器 | `48px × 48px`（`h-12 w-12`） |
| [+] 图标 | `20px × 20px` |
| "按住说话" 字号 | `15px` |
| "按住说话" 行高 | `22px` |
| "按住说话" 内边距 | `6px 10px` |
| "按住说话" 文字颜色 | `#1c1c1e`（text-foreground） |
| 键盘按钮图标 | `48px × 48px` |

---

### A.11 语音光晕覆盖层（VoiceHoldOverlay）

> ⚠️ 2.8-2.15 延期，此处仅记录供后续参考。

#### A.11.1 玻璃按钮样式（glassButtonStyle）

```yaml
尺寸: 70px × 70px（默认）
形状: 圆形（borderRadius: 50%）
非激活态:
  background: rgba(255,255,255,0.3)
  backdropFilter: blur(12px)
激活态:
  background: #ffffff
  backdropFilter: none
过渡: "background 0.15s ease, transform 0.15s ease"
激活态缩放: scale(1.1)
```

#### A.11.2 光晕区域布局

```yaml
定位: absolute, bottom: 0
左右偏移: left: -16px, right: -16px
高度（语音态）: 280px
高度（编辑态）: calc(100dvh - 100px - bottomInset)
底部按钮组:
  距底: calc(18px + env(safe-area-inset-bottom))
  左右内边距: 50px（VOICE_SIDE_INSET_PX）
  按钮间距: 40px
  按钮组元素间距: 16px
```

#### A.11.3 编辑态文本区

```yaml
字体: "PingFang SC, system-ui, sans-serif"
字号: 17px
行高: 24px
边框: none
最大高度（编辑态）: calc(100dvh - 228px - bottomInset)
最大高度（语音态）: 72px
```

#### A.11.4 状态标签文字

```yaml
字号: 10px
颜色: rgba(0,0,0,0.5)
标签容器高度: 24px
标签下边距: 10px
```

---

## 附录 B：DOM 树完整结构

```
ComposerPrimitive.Root（relative w-full px-[26px] z-50）
├── 全屏蒙层（fixed, 始终存在, opacity 控制）
├── Chip 建议列表（absolute, 条件渲染）
├── 图片建议列表（absolute, 条件渲染）
├── VoiceHoldOverlay（条件渲染, 2.8-2.15 延期）
├── motion.div（主容器, 背景/圆角/阴影/高度过渡）
│   ├── [expanded=true, fullScreen=true]
│   │   └── FullScreen 内部结构
│   ├── [expanded=true, fullScreen=false]
│   │   └── Expanded Compact 内部结构
│   ├── [expanded=false, voiceMode=true]
│   │   └── VoiceModeToolbar（2.8-2.15 延期）
│   └── [expanded=false, voiceMode=false]
│       └── Collapsed 内部结构
├── 隐藏 ComposerPrimitive.Input（1px, 条件渲染）
├── VirtualKeyboardPanel
├── SlashSkillsPanel
└── AddPanel
```

---

## 附录 C：React 版使用的图标资源（完整清单）

| 文件 | 尺寸 | 用途 | 本次是否引入 |
|------|------|------|-------------|
| `/icons/plus-button.svg` | 20×20 | Collapsed/Expanded [+] 按钮 | ✅ |
| `/icons/send-button.svg` | 26×26 | 发送按钮 | ✅ |
| `/icons/mic-button.svg` | 20×20 | 麦克风按钮 | ✅ |
| `/icons/composer-expand-v2.svg` | 26×26 | 展开全屏手柄 | ✅ |
| `/icons/composer-collapse-v2.svg` | 26×26 | 全屏缩小按钮 | ✅ |
| `/icons/keyboard-button.svg` | 48×48 | 语音态键盘切换 | ❌ (2.8-2.15) |
| `/icons/voice-hold-delete-icon.svg` | 70×70 | 光晕删除按钮 | ❌ (2.8-2.15) |
| `/icons/voice-hold-send-icon.svg` | 70×70 | 光晕发送按钮 | ❌ (2.8-2.15) |
| `/icons/voice-hold-edit-icon.svg` | — | 光晕编辑按钮 | ❌ (2.8-2.15) |
| `/voice-glow.png` | — | 语音光晕纹理 | ❌ (2.8-2.15) |