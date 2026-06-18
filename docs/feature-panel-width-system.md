# Feature Panel 内容宽度自适应系统

## 解决的问题

右侧交互说明区（Feature Panel）在大屏上内容被拉得太宽。需要一种自适应机制：有 `.fp-snapshot-row`（快照卡片行）时按卡片的自然排布宽度约束内容区，没有时也有一个合理的默认宽度下限。

## 架构

### DOM 结构

```
.fp-scroll.markdown-body (滚动容器, overflow-y: auto, 含 padding)
  └── .fp-scroll-inner (内层容器, max-width 受约束)
      ├── 标题 / 正文 / 引用块
      ├── .fp-snapshot-row (flex-wrap: wrap)
      │   ├── .fp-snapshot-wrap (flex-shrink: 0, min-width: 280px)
      │   └── .fp-snapshot-wrap
      └── ...
```

关键设计：`max-width` 约束加在 **内层 `.fp-scroll-inner`** 而非外层 `.fp-scroll`。因为滚动条在外层容器上，如果约束加在外层，滚动条会吃掉可用宽度，导致卡片意外折行。内层容器不受滚动条影响。

### 控制链

```
CSS:  --fp-min-content-width: 1000   (feature-panel.css .fp-root)
       ↓
JS:   Math.max(maxNatural, minW)      (engine/feature-panel.js)
       ↓
CSS:  --fp-max-content-width: 1490px  (feature-panel.js 设内联变量)
       ↓
CSS:  max-width: var(--fp-max-content-width)  (feature-panel.css .fp-scroll-inner)
```

## JS 测量逻辑

`engine/feature-panel.js` 的 `constrainContentWidth(scrollEl, inner)`：

1. **强制重排**：`scrollEl.offsetHeight`，确保子元素布局已计算
2. **遍历所有 `.fp-snapshot-row`**（跳过 `flex-direction: column` 的行，如 `.fp-tcn-modes`）
3. **对每行 ≥ 2 张卡的**，用 `getBoundingClientRect().width` 测量每张卡的渲染宽度，累加后再加 `gap`
4. **取所有行的最大值** + 2px 余量（防子像素舍入）
5. **取 `max(自然宽度, 默认下限)`**（默认下限 = `--fp-min-content-width`），设 `--fp-max-content-width`

## 各场景行为

| 场景 | 计算结果 | 效果 |
|------|----------|------|
| 无 `.fp-snapshot-row` | `max(0, 1000) = 1000` | 约束到 1000px |
| 有行且自然宽度 ≤ 1000 | `max(730, 1000) = 1000` | 约束到 1000px |
| 有行且自然宽度 > 1000 | `max(1490, 1000) = 1490` | 约束到自然宽度 |
| 屏幕小于约束宽度 | — | 约束不起效，内容随屏幕宽度 |

## 调整方式

**改默认下限**：修改 `feature-panel.css` 中 `.fp-root` 的 `--fp-min-content-width` 值。无需改 JS。

**追查折行原因**：打开 DevTools → Console，查看 `[约束]` 开头的日志，确认测量值和下限值是否正确。
