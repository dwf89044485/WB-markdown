---
name: feature-panel-visual-language
description: 右侧交互设计说明文档的视觉设计语言。只规范说明文档如何呈现，不规范 Agent 产品本身。
status: draft
updated: 2026-07-28
colors:
  ink-primary: '#111114'
  ink-body: '#1a1a1c'
  ink-secondary: '#6e6e73'
  ink-muted: '#8a8a8f'
  surface-document: '#ffffff'
  surface-soft: '#f9f8f6'
  surface-inverse: '#1a1a1c'
  inverse-text: '#f0f0f0'
  border-subtle: '#0000000a'
  border-default: '#0000001f'
dark-colors:
  ink-primary: '#f2f2f4'
  ink-body: '#dedee2'
  ink-secondary: '#a8a8ae'
  ink-muted: '#85858c'
  surface-document: '#18181b'
  surface-soft: '#202024'
  surface-inverse: '#252529'
  inverse-text: '#ededf0'
  border-subtle: '#ffffff14'
  border-default: '#ffffff24'
typography:
  title-serif:
    fontFamily: "Georgia, 'Noto Serif SC', 'Songti SC', serif"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: '-0.015em'
  body-sans:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.65
  body-serif-emphasis:
    fontFamily: "Georgia, 'Noto Serif SC', 'Songti SC', serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.35
  label:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif"
    fontSize: 11px
    fontWeight: 500
    letterSpacing: '0.06em'
rounded:
  DEFAULT: 0
  full: 9999px
spacing:
  content-left: 64px
  content-right: 32px
  nav-top: 20px
  section-gap: 36px
  block-gap: 16px
components:
  page-title:
    typography: '{typography.title-serif}'
    color: '{colors.ink-primary}'
  body-copy:
    typography: '{typography.body-sans}'
    color: '{colors.ink-body}'
  emphasis-summary:
    typography: '{typography.body-serif-emphasis}'
    background: '{colors.surface-inverse}'
    color: '{colors.inverse-text}'
  compare-value:
    typography: '{typography.body-serif-emphasis}'
  document-card:
    radius: '{rounded.DEFAULT}'
    border: '{colors.border-subtle}'
---

# DESIGN.md: 右侧交互设计说明文档视觉语言

## 0. 边界

这份 DESIGN.md 只规范右侧 Feature Panel 作为“交互设计说明文档”的视觉表达方式。

它不定义 Agent 产品本身的视觉规范。左侧 Demo 中的 Agent 对话流、消息、工具调用节点、权限确认、问答卡片等产品组件，应属于 Agent 产品自身的 design.md。

## 1. Brand & Style

右侧说明区是一套设计说明文档系统。它的气质应接近“可评审的设计论文”和“作品集式案例拆解”，而不是后台控制台或研发文档。

关键词：克制、清晰、留白、结构化、可评审。

视觉目标：

- 让设计判断显得可信，而不是像功能说明堆叠。
- 让读者能快速识别“判断、结构、细节、示例”的层级。
- 让右侧说明区和左侧 Agent 产品 Demo 保持边界。右侧是讲解系统，不模仿左侧产品界面。

## 2. Colors

| Token | 用途 | 不用于 |
|---|---|---|
| `{colors.ink-primary}` | 页面标题、章节标题、关键判断 | 大段弱说明 |
| `{colors.ink-body}` | 正文主文字 | 低优先级标签 |
| `{colors.ink-secondary}` | 副标题、说明文字、次级段落 | 关键结论 |
| `{colors.ink-muted}` | 元信息、表头、label、小标签 | 正文主叙述 |
| `{colors.surface-document}` | 文档主体背景 | 强调块 |
| `{colors.surface-soft}` | 表格隔行、轻量区域背景 | 主容器大面积装饰 |
| `{colors.surface-inverse}` | 原则摘要、强结论块、反向强调 | 普通卡片背景 |
| `{colors.border-subtle}` | 分割线、轻量卡片边界 | 强交互按钮边框 |

色彩不承担装饰任务。它主要服务层级、分组和强调。

### 2.1 暗色模式

暗色模式只替换颜色语义 token，不改变排版、留白和组件层级，也不引入另一套“夜间 App”视觉语言。

- 文档底色使用深炭色而不是纯黑，保留纸张般的柔和层次。
- 标题和正文使用柔和浅灰而不是纯白，避免长时间阅读时产生刺眼反差。
- 分组优先使用轻边界和细微明度差，不用发光描边、重阴影或大面积高对比色块。
- 链接、引用、代码与强调块必须继续使用各自语义 token；禁止在组件内写死只适合亮色的颜色。
- 暗色下仍要保持“可评审的设计论文”气质：克制、清晰、留白，不做成开发者控制台。

## 3. Typography

### 3.1 字体角色

| 角色 | Token | 用法 | 当前实现参考 |
|---|---|---|---|
| 大标题、二级标题 | `{typography.title-serif}` | 页面标题、章节标题、重要判断 | `h1`, `h2`, `.fp-section-label` |
| 正文 | `{typography.body-sans}` | 普通段落、列表、说明文字 | `.fp-root`, `.markdown-body` |
| 强调性短句 | `{typography.body-serif-emphasis}` | 原则摘要、对比卡中的关键值 | `.fp-principle-summary`, `.fp-compare-val` |
| 辅助标签 | `{typography.label}` | tab、button、tag、表头 | `.fp-tab`, `.fp-compare-key`, `.tag` |

### 3.2 使用规则

- 衬线字体用于“判断”和“结论”，不用于大段解释。
- 无衬线字体用于“说明”和“操作”，保证长阅读效率。
- 同一段内容内不要随意混用字体。字体变化必须对应信息角色变化。
- 功能名称可以使用无衬线，强调“可操作”；原则与结论可以使用衬线，强调“设计判断”。

## 4. Layout & Spacing

右侧说明区采用左对齐、宽留白、窄内容栏的阅读姿态。

| Token | 用途 |
|---|---|
| `{spacing.content-left}` | 内容区左侧主对齐线 |
| `{spacing.content-right}` | 内容区右侧安全留白 |
| `{spacing.nav-top}` | 导航与顶部的呼吸空间 |
| `{spacing.section-gap}` | 大章节之间的分隔距离 |
| `{spacing.block-gap}` | 普通内容块之间的距离 |

规则：

- 章节之间可以用大留白和浅分割线区分。
- 组件快照、表格、图示必须和正文对齐，不能形成随机缩进。
- 横向对比内容可以突破普通段落宽度，但需要保持清晰栅格。

## 5. Elevation & Depth

右侧说明区不依赖重阴影建立层级。层级优先来自排版、留白、边线和背景色。

允许：

- 极轻量边框。
- 浅色块分组。
- 组件快照中保留被展示组件自身的阴影。

避免：

- 大面积投影卡片。
- 像 App UI 一样的浮层层级。
- 用阴影替代内容结构。

## 6. Shapes

默认圆角为 `{rounded.DEFAULT}`，也就是 0。

右侧说明区不使用大圆角卡片语言，避免和左侧手机 Demo 的产品界面语言混淆。

圆形只用于编号、状态点等语义明确的小元素。

## 7. Components

| 组件 | 使用场景 | 视觉规则 | 不要这样用 |
|---|---|---|---|
| 页面标题 | 每个 feature 的开头 | 衬线字体，低字重，清晰主题 | 不要写成操作说明 |
| 副标题 | 标题下方一句话解释 | 无衬线正文，次级颜色 | 不要堆多个判断 |
| 引用块 | 设计立场或核心判断 | 轻边线、正文节奏、少装饰 | 不要放列表型规范 |
| 对比卡 | 对比两种模式或设计取舍 | 字段克制，关键值可用衬线 | 不要做成普通信息卡 |
| 原则摘要 | 汇总一组原则 | 深色底、衬线强调、短句 | 不要写成长段说明 |
| 表格 | 层级、状态、规则矩阵 | 表头弱化，隔行轻背景 | 不要把长段落塞进单元格 |
| Mermaid 图 | 流程、层级、状态迁移 | 服务结构关系，不做装饰 | 不要替代所有解释文字 |
| 组件快照 | 展示具体功能点样貌 | 保留真实组件质感，外部说明克制 | 不要只放截图不解释 |
| Do / Don't | 边界和反模式 | 正反并置，结构清楚 | 不要只列抽象口号 |
| 跳转按钮 | 连接右侧说明和左侧 Demo | 小尺寸、明确动作结果 | 不要变成主导航 |

## 8. Do's and Don'ts

| Do | Don't |
|---|---|
| 用视觉层级区分判断、结构、细节、示例 | 所有内容都用同一种正文段落铺开 |
| 用衬线承载标题和结论 | 把衬线用于长篇解释正文 |
| 用表格、流程图、快照帮助理解 | 用纯文字描述复杂状态 |
| 保持右侧说明区的文档气质 | 把右侧做成左侧产品界面的翻版 |
| 用轻边界和留白建立分组 | 用重阴影和大圆角制造 App 卡片感 |
