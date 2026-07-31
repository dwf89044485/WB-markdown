---
name: dark-mode-design-tokens
description: 暗色模式完整设计 Token 模板——全局基准色板、明度阶梯、文字层级、玻璃/投影体系
status: stable
updated: 2026-07-31
design-framework:
  base: neutral-near-black
  surfaces: desaturated-cool-gray-ladder
  elevation: lighter-surfaces-with-hairlines
  glass: matte-flat-no-specular-highlights
  accents: apple-dark-pairs-desaturated
  text: neutral-white-opacity-derived
---

# 暗色模式设计 Token 模板

基于 Linear / Raycast / GitHub Dark 公认暗色最佳实践，适配 WorkBuddy「舞台 + 手机 Demo + 右栏文档」三区同屏的特殊构图。

---

## 明度阶梯

```
舞台环境底（最暗）:  #0F1113━ish  ← stage-paper-overlay
 └ 手机屏幕面:       #16181B      ← canvas
    └ 卡片 / 输入框: #1C1F23      ← surface
       └ 浮层 / Sheet: #24282E    ← elevated
          └ 用户气泡:  #2B3036    ← soft
             └ 控制台 / 右栏: #1C1D20━ish  ← 面板
```

原则：环境后退（最暗）→ 设备面 → 内容卡片 → 浮层前进（最亮），每层 Δ 5~8 L*。

---

## 背景（Surfaces）

| Token | 暗色值 | 用途 |
|-------|--------|------|
| `--color-bg-canvas` | `#16181B` | 手机壳内部、对话区、全局底 |
| `--color-bg-surface` | `#1C1F23` | 卡片、composer 壳、表格 |
| `--color-bg-elevated` | `#24282E` | 浮层（sheet、弹窗） |
| `--color-bg-sheet` | `#24282E` | Bottom sheet 专用 |
| `--color-bg-soft` | `#2B3036` | 用户消息气泡 |
| `--color-bg-control` | `#2B3036` | 控制台按钮 / 表单控件 |
| `--color-bg-control-hover` | `#373D44` | 控件悬停 |
| `--color-bg-control-active` | `#424952` | 控件按下 |
| `--color-bg-active` | `#4A5058` | 选中态（胶囊 / 分段控件） |
| `--color-bg-emphasis` | `#353A41` | 高亮块（Agent 卡片、总原则长条） |
| `--color-bg-snapshot` | `#131518` | 右栏快照区（比 canvas 深） |

`--color-bg-canvas` 不要低于 `#0F1113`（不用纯黑）。

---

## 文字（Text）

暖白基底统一渐变派生，保证对比度 ≥4.5:1（正文字号 ≥15px），小字目标 ≥7:1。

| Token | 暗色值 | 用途 |
|-------|--------|------|
| `--color-text-primary` | `#F2F4F6` | 正文 |
| `--color-text-strong` | `#FFFFFF` | 最强文字（标题、状态栏时间） |
| `--color-text-body` | `#E4E7EB` | 段落正文 |
| `--color-text-document` | `#DDE1E6` | 文档正文 |
| `--color-text-secondary` | `rgba(232,236,241,0.60)` | 次要文字（Apple 60% 标准） |
| `--color-text-muted` | `rgba(232,236,241,0.72)` | 中性灰文字 |
| `--color-text-faint` | `rgba(232,236,241,0.42)` | 最浅文字 |
| `--color-text-dim` | `rgba(232,236,241,0.75)` | 暗化文字 |
| `--color-text-placeholder` | `rgba(232,236,241,0.35)` | 占位符 |
| `--color-text-disabled` | `rgba(232,236,241,0.26)` | 禁用态 |
| `--color-heading` | `#FFFFFF` | 标题 |
| `--color-text-on-emphasis` | `#FFFFFF` | 强调块上的文字 |
| `--color-text-process-muted` | `rgba(232,236,241,0.38)` | 过程态文字 |
| `--color-text-subtle` | `rgba(232,236,241,0.45)` | 弱化文字 |
| `--color-text-title` | `rgba(255,255,255,0.94)` | 标题文字 |
| `--color-text-document-secondary` | `rgba(232,236,241,0.68)` | 文档次要文字 |
| `--color-text-caption` | `rgba(232,236,241,0.55)` | 说明文字 |
| `--color-text-inverse-muted` | `#63676D` | 反色弱化文字 |

透明度派生规则：主文字 92%+ → 次要 60% → 弱化 42% → 禁用 26%。不在亮色平移后直接改暗度；每个 token 对照 canvas 重新算对比度。

---

## 边框（Borders）

亮色用黑 rgba，暗色用白 rgba，按透明度分层：

| Token | 暗色值 | 用途 |
|-------|--------|------|
| `--color-border-subtle` | `rgba(232,236,241,0.06)` | 最弱分隔 |
| `--color-border-softest` | `rgba(232,236,241,0.08)` | 微分隔 |
| `--color-border-default` | `rgba(232,236,241,0.11)` | 默认边框 |
| `--color-border-control` | `rgba(232,236,241,0.14)` | 控件边框 |
| `--color-border-hover` | `rgba(232,236,241,0.22)` | 悬停边框 |
| `--color-border-strong` | `rgba(232,236,241,0.30)` | 强边框 |
| `--color-border` | `#2E3238` | 实色边框 |
| `--color-border-weak` | `#34383F` | 弱实色边框 |
| `--color-divider` | `rgba(232,236,241,0.14)` | 分割线 |

---

## Accent（强调色）

使用 Apple 暗色对偶（亮色系统色的暗色变体），降饱和、提明度。不在大面积上使用高饱和色。

| Token | 暗色值 | 亮色对偶 | 用途 |
|-------|--------|----------|------|
| `--color-accent-blue` | `#0A84FF` | `#007AFF` | 链接、选中态 |
| `--color-accent-purple` | `#7D7AFF` | `#5e5ce6` | 加载、spinner |
| `--color-accent-green` | `#4FDBC0` | `#00C29A` | Todo 进行中 |
| `--color-success` | `#30D158` | `#34C759` | 成功 |
| `--color-accent-orange` | `#FFB340` | `#F2991C` | 警告 |
| `--color-accent-red` | `#FF6961` | `#c62828` | 错误 |
| `--color-error-plain` | `#FF6961` | `#ff0000` | 纯错误色 |

---

## 玻璃体系（Glass）——哑光

**关键原则**：深色上不用拟物高光。四边统一细边 + 平面半透明 + 背景模糊 = 哑光玻璃。所有 `layer*` 高光和辉光层归零。

| Token | 暗色值 | 说明 |
|-------|--------|------|
| `--color-glass-border` | `rgba(255,255,255,0.10)` | 四边统一细边 |
| `--color-glass-border-top` | `rgba(255,255,255,0.10)` | 顶边同色 |
| `--color-bg-glass` | `rgba(30,33,37,0.72)` | 玻璃底 |
| `--color-bg-glass-strong` | `rgba(38,41,46,0.78)` | 强玻璃底 |
| `--color-glass-layer1-top` | `rgba(255,255,255,0)` | 关闭高光层 |
| `--color-glass-layer2-glow` | `rgba(255,255,255,0)` | 关闭辉光 |
| `--color-glass-layer3-highlight` | `rgba(255,255,255,0)` | 关闭内高光 |
| `--color-glass-shadow-inner-top` | `rgba(255,255,255,0)` | 关闭内顶高光 |

菜单按钮（`.nav-menu-btn`）在暗色下专门补 `border: 1px solid var(--color-glass-border)`——亮色靠投影描边，深底上投影看不见。

---

## 投影（Shadows）

深底上黑色投影会被放大，全部收敛到 ~0.28 alpha、减小扩散：

| Token | 暗色值 |
|-------|--------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.32)` |
| `--shadow-lg` | `0 12px 32px rgba(0,0,0,0.38)` |
| `--shadow-glass` | `0 2px 10px rgba(0,0,0,0.28)` |
| `--shadow-nav-glass` | `0 5px 20px rgba(0,0,0,0.28)` |
| `--shadow-sheet` | `0 4px 24px rgba(0,0,0,0.38), 0 30px 64px rgba(0,0,0,0.44), 0 4px 14px rgba(0,0,0,0.3)` |

---

## 舞台 / 三区结构

三个区域的暗度通过纸纹理 `#F6F5F2` + 不同透明度深色罩层合成：

| 区 | 罩层 | 合成色 | 角色 |
|----|------|--------|------|
| 舞台环境 | `rgba(8,9,11,0.95)` | `~#0F1113` | 全场最暗环境底 |
| 手机屏幕 | 直接 canvas | `#16181B` | 设备微发光 |
| 控制台面板 | `rgba(12,13,16,0.93)` | `~#1C1D20` | 工具面板 |
| 右栏文档 | `rgba(18,19,22,0.88)` | `~#2D2E30` | 阅读文档面 |

深暗关系：舞台 < 手机 < 卡片 < 浮层 < 面板。

网格线 `#454B54`（不亮于 `#50` 段，避免抢戏）。

---

## Mermaid 图表

| Token | 暗色值 |
|-------|--------|
| `--mermaid-background` | `#1C1F23` |
| `--mermaid-primary-color` | `#232C40` |
| `--mermaid-primary-text-color` | `#F2F4F6` |
| `--mermaid-primary-border-color` | `#5E84D6` |
| `--mermaid-secondary-color` | `#1E2E28` |
| `--mermaid-tertiary-color` | `#33291C` |
| `--mermaid-line-color` | `#8A9098` |
| `--mermaid-cluster-bg` | `#1A1D20` |
| `--mermaid-cluster-border` | `#4A4F57` |
| `--mermaid-edge-label-bg` | `#1C1F23` |
| `--mermaid-note-bg` | `#33291B` |
| `--mermaid-note-border` | `#8A7A42` |
| `--mermaid-note-text` | `#F2F4F6` |

---

## 约束（Dos & Don'ts）

- **基底不用纯黑** `#000`——会放大光晕、加速 OLED 灼屏
- **不在大面积上铺暖灰**——深色暖灰 = 脏/浊
- **不高光玻璃**——拟物高光在深底上是油腻感，不是通透感
- **不依赖阴影做层级**——深色投影对比弱，用表面亮度阶梯 + 发丝边框
- **accent 保持 Apple 暗色对偶**——不对亮色 accent 做机械反色
- **文字用透明度派生**——主 92% / 次 60% / 弱 42% / 残 26%，对比度 ≥4.5:1

---

> 此模板为暗色模式唯一真相源。所有暗色 Token 定义位于 `styles/base.css` 的 `[data-theme="dark"]` 块；markdown / github-markdown / feature-panel 暗色覆盖跟随此体系。修改暗色必须从本模板出发，不走硬编码。
