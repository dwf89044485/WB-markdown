# 架构与数据流

---

## 一、Frame 系统

Frame 是 sheet 内容的最小数据单元。每个 frame 对象存储在 `scenario.sheetFrames` 中。

### 1.1 Frame 结构

```typescript
interface Frame {
  title: string;               // 阶段名称（创建待办/搜索网页/更新待办…）
  events?: Event[];            // 事件列表
  todoOverrides?: Override[];  // 待办状态增量变更
  todos?: Todo[];              // （旧格式）完整待办替换
  searchItems?: string[];      // （旧格式）搜索结果文本
}

interface Event {
  icon: string;                // 图标 emoji
  text: string;                // 事件文本
  dim?: string;                // 副文本
  card?: { title: string; body: string };  // 卡片
  outputs?: Output[];          // 输出结果
}

interface Override {
  index: number;
  status: 'todo' | 'active' | 'done';
}
```

### 1.2 帧的累积方式

在 `player.js` 的 `runStatusGroup` 中：

```
for each action:
  for each frameId in action.frames:
    dataset.frames = completedFinalFrames + frameId  // 当前帧
    await sleep(frameDelay)

  completedFinalFrames.push(...frameId)  // 所有帧
  dataset.frames = completedFinalFrames.join(',')
```

每次 action 完成后，其所有帧 ID 追加到 `completedFinalFrames` 数组。

---

## 二、数据流

```
scenario.js
│
├── sheetFrames: { id: Frame }
├── todosBaseline: string[]
└── nodes[].actions: Action[]
                │
                ▼
         player.js (runStatusGroup)
                │
                ├── 遍历 action.frames
                ├── dataset.frames ← 累积帧 ID
                └── 状态栏按钮 onclick → openSheet()
                              │
                              ▼
                      sheet.js (getFrames)
                              │
                              ├── refs.split(',') → frame IDs
                              └── scenario.sheetFrames[id] → Frame[]
                              │
                              ▼
                      streamSheetContent
                              │
                              ├── 遍历 frames
                              ├── renderEvent(ev) → 事件行
                              ├── renderOutput(out) → 输出行
                              └── renderTodo → 待办行
```

---

## 三、事件类型在帧间的累积规律

| 模式 | 例子 | 渲染处理 |
|------|------|---------|
| 同一 event 跨多帧，dim 逐帧变化 | 搜索网页 5 帧 | 不同 key（dim 不同），每帧新行 |
| event 个数递增 | 生成图片：0→1→2→2 | 新 event 才渲染，重复跳过 |
| event 跨 action 不累积 | F1.b→F1.c 事件类型不同 | key 不同，仍渲染 |
| todo 跨帧变更 | todoOverrides 逐个 index 变更 | 骨架一次性渲染，逐帧更新 DOM |

---

## 四、速度控制

所有延迟统一从 `playbackDelay('frameDelay', 520)` 派生，受 `tokensPerSecond` 缩放。

| 延迟用途 | 公式 | 默认 (200 tps) |
|---------|------|----------------|
| 帧间间隔 | `playbackDelay('frameDelay', 520)` | 520ms |
| 搜索结果条间 | `frameDelay × 0.25` | 130ms |
| 待办更新停顿 | `frameDelay × 0.4` | 208ms |
| 打字机间隔 | `(1000 × chunkSize) / tps` | 5ms/chunk |

**缩放逻辑**（`core.js` `playbackDelay`）：

```
base × (200 / tps)
```

- 100 tps → 延迟 × 2（慢一倍）
- 500 tps → 延迟 × 0.4（快一倍多）
- 800 tps → 延迟 × 0.25（快四倍）

---

## 五、Fast Render 模式

当 `fastRender = true`（跳转/重放时）：
- `sleep()` 立即返回（无延迟）
- `typeCardBody` 直接设置全文（无打字机效果）
- 所有内容瞬间渲染完毕

---

## 六、取消保护

`sleep()` 内捕获 `activePlayId`，`playbackDelay` 完成后用该令牌验证播放是否已被取消。取消时 reject `CANCELLED`，流式循环自然中断。
