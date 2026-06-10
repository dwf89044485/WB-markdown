# 内容渲染（流式引擎）

核心函数：`streamSheetContent(frames, baseline)`（`engine/sheet.js`）

---

## 一、帧遍历

遍历所有帧，每帧处理顺序：

```
for each frame:
  ① 渲染新增事件行（去重）
  ② 渲染事件 outputs（搜索结果逐条）
  ③ 渲染/更新待办列表
  ④ 帧间间隔 sleep(frameDelay)
```

---

## 二、去重机制

使用 `Set<string>`，key = `icon|text|dim`。同一 key 只渲染第一次出现。

```
F1.a: [☐|创建待办|任务理解…]  → 渲染
F1.b: [☐|创建待办|任务理解…]  → 跳过（相同 key）
F1.c: [🔍|搜索网页|正在搜索…] → 渲染（不同 key）
```

---

## 三、事件行插入顺序

```
待办渲染前：    appendChild（从上往下排列）
待办渲染后：    insertBefore(firstTodo)（锚定在待办上方）
```

最终渲染顺序：

```
事件行（思考 → 创建待办 → 搜索 → 更新待办…）
输出行（搜索结果）
───────────
待办列表（始终在底部）
```

---

## 四、Outputs（搜索结果逐条追加）

事件带有 `ev.outputs` 时，在事件行出现后逐条追加输出行：

```
for each output:
  insert(renderOutput(output))
  scrollSheetBody()
  await sleep(frameDelay × 0.25)
```

条间默认间隔：`520 × 0.25 ≈ 130ms`（受速度控制缩放）。

---

## 五、思考过程打字机

侦测条件：`icon === '🧠'` 或 `text === '思考过程'`

1. 渲染事件行，`card.body` 设为空
2. 通过 `typeCardBody()` 将正文逐字写入

速度跟随 `tokensPerSecond`，使用 `playback('chunkSize', 1)` 分块。
每次 chunk 写入后调用 `scrollSheetBody()`。

---

## 六、旧格式兼容

帧级别的 `searchItems`（非事件内的 outputs）：

```js
if (f.searchItems && !f.events?.some(ev => ev.outputs))
  f.searchItems.forEach(item => insert(renderSearchItem(item)))
```

此时也会触发 `scrollSheetBody()` 和溢出检查。
