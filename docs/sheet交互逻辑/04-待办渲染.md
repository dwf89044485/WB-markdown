# 待办渲染

## 一、数据结构

**基准数据**：`scenario.todosBaseline` — 字符串数组，定义所有待办项文本。

**帧覆盖**：帧对象中的 `todoOverrides: [{index, status}]`，记录某个 index 的状态变更。
帧对象中的 `todos: [{text, status}]`（旧格式），完整替换。

| 字段 | 值 | 含义 |
|------|-----|------|
| `status: 'todo'` | 空心圆 ○ | 未开始 |
| `status: 'active'` | 旋转图标 | 执行中 |
| `status: 'done'` | 勾选图标 ✓ | 已完成 |

---

## 二、阶段控制

使用 `frame.title` 判断是否为待办阶段：

```js
const isTodoPhase = frame.title === '创建待办' || frame.title === '更新待办';
```

| 阶段 title | 待办行为 |
|-----------|---------|
| `创建待办` | 首次遇到时渲染骨架（所有条目一次性列出，全 `todo` 状态），再应用当前覆盖 |
| `更新待办` | 更新已有待办 DOM 元素状态 |
| 其他 title | 跳过 `todoOverrides`，不渲染/更新 |

---

## 三、骨架渲染

`renderTodoSkeleton(frames, baseline)` 内部调用 `computeTodoSnapshot` 获取完整列表，然后将所有条目重置为 `todo` 状态渲染。

**首次渲染的防闪处理**：骨架渲染 + 当前帧的 `todoOverrides` 在同一 JS tick 内完成。
**延迟**：渲染后 sleep(`frameDelay × 0.4`)。

---

## 四、DOM 级状态更新

`applyTodoOverridesToDom(overrides, todoElements)`：

- **不重新渲染**整行
- 直接修改已有 DOM：
  - `.s-sub-ico` 的 `innerHTML`：切换 icon
  - `.s-sub-txt` 的 `className`：切换 active 状态
- 如果 overrides 包含多条（如 `[{index:0,done},{index:1,active}]`），全部同时生效

---

## 五、延迟参数

| 场景 | 公式 | 默认 |
|------|------|------|
| 首次渲染后 | `frameDelay × 0.4` | ~208ms |
| 后续更新后 | `frameDelay × 0.4` | ~208ms |
