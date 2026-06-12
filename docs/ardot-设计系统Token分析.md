# Ardot 设计系统 Token 体系分析

> 来源：Ardot 设计文件 `WorkBuddy 桌面客户端` — Design Tokens（画布节点 `16143:603`）
> 变量集合：`wb/color/*`（WorkBuddy 桌面客户端）
> 模式：light
> 日期：2026-06-12

---

## 目录

1. [品牌色阶 Brand Palette](#1-品牌色阶-brand-palette)
2. [灰色色阶 Gray Scale](#2-灰色色阶-gray-scale)
3. [描边 Border / Stroke](#3-描边-border--stroke)
4. [投影 Elevation / Shadow](#4-投影-elevation--shadow)
5. [语义化映射 Semantic Aliases](#5-语义化映射-semantic-aliases)
6. [字体色 Text Color](#6-字体色-text-color)
7. [状态色阶 Status Colors](#7-状态色阶-status-colors)
8. [空间间距 Space](#8-空间间距-space)
9. [圆角 Border Radius](#9-圆角-border-radius)
10. [遮罩 Mask](#10-遮罩-mask)
11. [全局变量清单](#11-全局变量清单)

---

## 1. 品牌色阶 Brand Palette

品牌色以 `#00C29A` 为核心（brand/8），向两端扩展 9 个色阶，用于按钮、链接、聚焦边框、品牌强调。

| Token 名 | hex | RGB | 用途 |
|----------|-----|-----|------|
| brand/1 | `#DFF7F2` | rgb(223,247,242) | 最浅品牌背景 |
| brand/2 | `#BFF0E6` | rgb(191,240,230) | 浅品牌背景 |
| brand/3 | `#9FE8D9` | rgb(159,232,217) | 禁用态用色 |
| brand/4 | `#80E1CD` | rgb(128,225,205) | 品牌辅助 |
| brand/5 | `#60D9C0` | rgb(96,217,192) | focus 态引用 |
| brand/7 | `#40D1B3` | rgb(64,209,179) | hover 态引用 |
| **brand/8** | **`#00C29A`** | **rgb(0,194,154)** | **品牌主色 — 基准色** |
| brand/9 | `#009273` | rgb(0,146,115) | active 态 |
| brand/10 | `#00614D` | rgb(0,97,77) | 最深品牌色 |

> 注：变量中不存在 brand/6，从 brand/5 直接跳到 brand/7。色相稳定（绿色系），亮度逐步递减。

---

## 2. 灰色色阶 Gray Scale

5 级中性灰，用于背景、容器填充和区分层级。

| Token 名 | hex | RGB | Canvas 展示 |
|----------|-----|-----|-------------|
| gray/01 | `#FAFAFA` | rgb(250,250,250) | 有边框 #EBEBEB |
| gray/02 | `#F7F7F7` | rgb(247,247,247) | 有边框 #EBEBEB |
| gray/03 | `#F2F2F2` | rgb(242,242,242) | 有边框 #EBEBEB |
| gray/04 | `#EBEBEB` | rgb(235,235,235) | 无边框 |
| gray/05 | `#E6E6E6` | rgb(230,230,230) | 无边框 |

> 全暖灰，RGB 值均匀递减（间隔约 5）。gray/01~03 在 canvas 上带有 #EBEBEB 描边以便视觉区分。

---

## 3. 描边 Border / Stroke

统一 1px Inside 描边，灰色系描边用于区分层级和容器边界。

| Token 名 | 色值 | 描边规格 | 引用变量 | 用途 |
|----------|------|----------|---------|------|
| border/primary | `#EBEBEB` | 1px · Inside | → gray/04 | 弹窗边框、对话框边框、分割线 |
| border/secondary | `#F2F2F2` | 1px · Inside | → gray/03 | 侧边栏内容区分隔、次级边框 |
| border/focus | `#00C29A` | 1px · Inside | → brand/8（品牌色） | 输入框 Focus 描边 |
| border/tertiary | `#F2F2F2` | — | → gray/03 | 三级边框（变量中存在） |

---

## 4. 投影 Elevation / Shadow

双层叠加投影体系，柔和的浮起效果。额外包含 Focus Ring 和背景模糊效果。

### elevation/popup

```
Layer 1: offset 0, 4 / blur 12 / spread 0 / rgba(0,0,0,4%)
Layer 2: offset 0, 3 / blur 6  / spread 0 / rgba(0,0,0,4%)
```

用途：菜单、弹窗、对话框、下拉面板

### focus-ring

```
offset: 0, 0 / blur: 0 / spread: 2 / color: #E6F6F7（品牌辅助色）
```

用途：输入框聚焦时的外发光环

### backdrop/blur

```
Background Blur: 40px
Fill: rgba(255,255,255,40%)
```

用途：弹窗背景遮罩层毛玻璃

---

## 5. 语义化映射 Semantic Aliases

> 语义化 token 引用灰度/品牌色阶，形成统一的设计语义层。

### 背景（Background）

| Token 名 | 引用值 | 实际色值 | 用途 |
|----------|--------|----------|------|
| bg/primary/default | → white/100 | `#FFFFFF` | 卡片/面板默认背景 |
| bg/primary/hover | → gray/04 | `#EBEBEB` | 列表项 Hover 态 |
| bg/primary/active | → gray/03 | `#F2F2F2` | 列表项选中/激活态 |
| bg/secondary/default | → white/100 | `#FFFFFF` | 次级面板默认背景 |
| bg/secondary/hover&active | → gray/02 | `#F7F7F7` | 次级面板 Hover 态 |

### 描边（Border）

| Token 名 | 引用值 | 实际色值 |
|----------|--------|----------|
| border/primary | → gray/04 | `#EBEBEB` |
| border/secondary | → gray/03 | `#F2F2F2` |
| border/tertiary | → gray/03 | `#F2F2F2` |
| border/focus | → brand/8 | `#00C29A` |

---

## 6. 字体色 Text Color

> 基于 black 透明度阶的品牌+状态语义。

### 中性文本

| Token 名 | 引用值 | 实际色值 |
|----------|--------|----------|
| text/solid | → black/100 | `#000000` |
| text/primary | → black/90 | `rgba(0,0,0,0.9)` |
| text/secondary | → black/70 | `rgba(0,0,0,0.7)` |
| text/tertiary | → black/50 | `rgba(0,0,0,0.5)` |
| text/disabled | → black/30 | `rgba(0,0,0,0.3)` |

### 品牌文本

| Token 名 | 引用值 | 实际色值 |
|----------|--------|----------|
| text/brand/default | → brand/8 | `#00C29A` |
| text/brand/hover | → brand/7 | `#40D1B3` |
| text/brand/active | → brand/9 | `#009273` |
| text/brand/disabled | → brand/3 | `#9FE8D9` |
| text/brand/focus | → brand/5 | `#60D9C0` |

---

## 7. 状态色阶 Status Colors

### Red 色阶（错误/危险 — 10 级）

| Token | 色值 |
|-------|------|
| red/1 | `#FCE8E8` |
| red/2 | `#F9D1D1` |
| red/3 | `#F5B9B9` |
| red/4 | `#F2A2A2` |
| red/5 | `#EF8B8B` |
| red/6 | `#EC7474` |
| red/7 | `#E85C5C` |
| red/8 | `#F64041` |
| red/9 | `#B42C3F` |
| red/10 | `#821238` |

语义引用：
- text/error/default → red/8
- text/error/hover → red/7
- text/error/active → red/9
- text/error/focus → red/5
- text/error/disabled → red/3

### Orange 色阶（警告 — 10 级）

| Token | 色值 |
|-------|------|
| orange/1 | `#FFEDDF` |
| orange/2 | `#FFDCBF` |
| orange/3 | `#FFCA9F` |
| orange/4 | `#FFB980` |
| orange/5 | `#FFA760` |
| orange/6 | `#FF9540` |
| orange/7 | `#FF8420` |
| orange/8 | `#FF7800` |
| orange/9 | `#C04100` |
| orange/10 | `#800F00` |

语义引用：
- text/warning/default → orange/8
- text/warning/hover → orange/7

### Green 色阶（成功 — 9 级）

| Token | 色值 |
|-------|------|
| green/1 | `#E7F8F0` |
| green/2 | `#C2EFD6` |
| green/3 | `#A3E7C2` |
| green/4 | `#85DFAE` |
| green/5 | `#66D799` |
| green/6 | `#47CF85` |
| green/7 | `#29C770` |
| green/8 | `#0CBF5B` |
| green/9 | `#088F50` |

语义引用：
- text/success/default → green/8
- text/success/hover → green/7
- text/success/active → green/9
- text/success/focus → green/5
- text/success/disabled → green/3

---

## 8. 空间间距 Space

以 100 = 4px 为步进单位的线性系统：

| Token | px |
|-------|-----|
| space/0 | 0 |
| space/100 | 4 |
| space/200 | 8 |
| space/300 | 12 |
| space/400 | 16 |
| space/500 | 20 |
| space/600 | 24 |
| space/700 | 28 |
| space/800 | 32 |
| space/900 | 36 |
| space/1000 | 40 |

---

## 9. 圆角 Border Radius

| Token | px |
|-------|-----|
| radius/0 | 0 |
| radius/50 | 2 |
| radius/100 | 4 |
| radius/150 | 6 |
| radius/200 | 8 |
| radius/250 | 16 |
| radius/300 | 24 |

---

## 10. 遮罩 Mask

| Token | 引用值 | 实际色值 |
|-------|--------|----------|
| mask/color | → white/40 | `rgba(255,255,255,0.4)` |

---

## 11. 全局变量清单

### White / Black 透明度阶

| 变量名 | 色值 |
|--------|------|
| white/100 | `#FFFFFF` |
| white/90 | `rgba(255,255,255,0.9)` |
| white/80 | `rgba(255,255,255,0.8)` |
| white/70 | `rgba(255,255,255,0.7)` |
| white/60 | `rgba(255,255,255,0.6)` |
| white/50 | `rgba(255,255,255,0.5)` |
| white/40 | `rgba(255,255,255,0.4)` |
| white/30 | `rgba(255,255,255,0.3)` |
| white/20 | `rgba(255,255,255,0.2)` |
| white/10 | `rgba(255,255,255,0.1)` |

| 变量名 | 色值 |
|--------|------|
| black/100 | `#000000` |
| black/90 | `rgba(0,0,0,0.9)` |
| black/75 | `rgba(0,0,0,0.75)` |
| black/70 | `rgba(0,0,0,0.7)` |
| black/60 | `rgba(0,0,0,0.6)` |
| black/50 | `rgba(0,0,0,0.5)` |
| black/40 | `rgba(0,0,0,0.4)` |
| black/30 | `rgba(0,0,0,0.3)` |
| black/20 | `rgba(0,0,0,0.2)` |
| black/10 | `rgba(0,0,0,0.1)` |

---

## 与现有 CSS 的对比发现

当前 CSS 项目（`styles/*.css`）中存在大量硬编码色值，与 Ardot 设计系统的对应关系如下：

| 硬编码色值 | 出现文件 | 应映射到 |
|-----------|---------|---------|
| `#fafafa` | base.css（10+次） | `gray/01` |
| `#1c1c1e` | base.css / conversation.css | `text/primary`（black/90） |
| `#8e8e93` / `#999` | 多处 | `text/tertiary`（black/50）或 `text/disabled`（black/30） |
| `#e9e9eb` | conversation.css | `gray/04` |
| `#ebebef` | conversation.css | 近似 `gray/04` |
| `#5e5ce6`（紫色） | conversation.css / markdown.css | 不存在于当前 Ardot 体系中 |
| `#007AFF`（蓝色） | markdown.css | 不存在于当前 Ardot 体系中 |
| `#00C29A`（品牌绿） | markdown.css scopes | 已有 `brand/8` 变量 |

### 项目暂无的 token

以下当前 Ardot 设计系统中**不存在**，但在 CSS 中使用的色值：
- 紫色 `#5e5ce6` — markdown 列表 bullet、代码强调
- 蓝色 `#007AFF` — markdown 链接
- 橙色（非品牌） `#ff9f0a` — blockquote 边线

这些可能是历史遗留，或需要补充进设计系统。
