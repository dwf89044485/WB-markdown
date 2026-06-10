# Sheet 概述

Sheet 是点击状态栏按钮后展开的**底部浮层**，展示某个状态下所有已执行工具事件、输出结果和待办列表。内容通过 **流式渲染** 逐帧展示。

---

## 触发器

入口在 `engine/player.js` 的 `createStatusLineIn`：状态栏按钮的 `onclick` 调用 `openSheet(btn.dataset.frames, btn.dataset.sheetTitle)`。

| 触发点 | 调用函数 | frames 数据来源 |
|-------|---------|---------------|
| 用户点击状态栏按钮 | `openSheet(frameRefs, title)` | `btn.dataset.frames`（逗号分隔的帧 ID） |
| 思考过程状态栏 | 同上 | `scenario.thinking.frames` → `runThinkingStatus` |
| 普通 status 按钮 | 同上 | `runStatusGroup` 累积的 `completedFinalFrames` |

---

## HTML 结构

```html
<div class="sheet-overlay" id="overlay" onclick="maybeClose(event)">
  <div class="bottom-sheet" id="sheet">
    <div class="sheet-handle"></div>
    <button class="glass-btn sheet-close-btn">×</button>
    <div class="sheet-body" id="sheetBody"></div>
  </div>
</div>
```

- `#overlay`：半透明遮罩，`z-index: 200`，flex 布局 `align-items: flex-end`
- `#sheet`：白色面板，`position: relative`（关闭按钮定位锚点）
- `#sheetBody`：`flex: 1` 填充剩余高度

---

## 相关文件

| 文件 | 职责 |
|------|------|
| `engine/sheet.js` | 所有 sheet 渲染、流式、拖拽逻辑 |
| `engine/player.js` | 状态栏按钮创建、帧累积 |
| `styles/sheet.css` | Sheet 布局、组件样式 |
| `scenario.js` | 帧数据、待办基准数据 |
