# Sheet 交互逻辑文档

> 基于 `engine/sheet.js` + `styles/sheet.css` + `engine/player.js` 当前实现梳理
> 最后更新：2026-06-10 | commit: `a651bb11`

---

## 一、Sheet 是什么

Sheet 是点击状态栏按钮后展开的**底部浮层**，展示某个状态下所有已执行工具事件、输出结果和待办列表。内容通过 **流式渲染** 逐帧展示。

---

## 二、触发方式

触发入口在 `player.js` 的 `createStatusLineIn`：状态栏按钮的 `onclick` 调用 `openSheet(btn.dataset.frames, btn.dataset.sheetTitle)`。

| 触发点 | 调用方 | frames 数据来源 |
|-------|-------|---------------|
| 用户点击状态栏按钮 | `openSheet(frameRefs, title)` | `btn.dataset.frames`（逗号分隔的帧 ID 列表） |
| 思考过程状态栏 | 同上 | `scenario.thinking.frames` 经过 `runThinkingStatus` 存入 |
| 普通 status 按钮 | 同上 | `runStatusGroup` 累积 `completedFinalFrames` 存入 |

---

## 三、打开流程

### 3.1 `openSheet(frameRefs)`

```
1. 解析帧      → getFrames(frameRefs) 从 scenario.sheetFrames 查找
2. 清空 body   → body.innerHTML = ''
3. 空状态检测   → 既无 events 又无 todos 则显示占位文案
4. 复位高度    → resetSheetHeight() 回到 40%
5. 显示遮罩    → overlay 添加 vis → rAF → show class（opacity 过渡）
6. 流式渲染    → 调用 streamSheetContent(frames, baseline)
```

**关键参数**：

| 参数 | 说明 |
|------|------|
| `frames` | Frame 对象数组，按帧 ID 排序 |
| `baseline` | `scenario.todosBaseline`，待办文本基准列表 |

### 3.2 空状态

当 frames 中没有 events 且没有 todo 数据时，显示占位一行："当前状态暂无新增事件。"

---

## 四、流式渲染引擎 `streamSheetContent`

### 4.1 帧遍历

遍历所有帧，每帧处理：

```
for each frame:
  ① 渲染新增事件行（icon+text+dim 三元组去重，只渲染未出现过的行）
  ② 如果事件有 outputs（搜索结果），逐条追加，条间 frameDelay × 0.25
  ③ 如果含有待办待办数据且是待办阶段 → 渲染或更新待办列表
  ④ 帧间间隔 sleep(frameDelay)
```

### 4.2 去重机制

使用 `Set<string>`，key = `icon|text|dim`。同一 key 只渲染第一次出现，后续跳过。
效果：F1.a 和 F1.b 都包含"创建待办"事件时，只有 F1.a 渲染该行。

### 4.3 待办阶段控制

用 `frame.title` 判断是否为待办阶段：

```js
const isTodoPhase = frame.title === '创建待办' || frame.title === '更新待办';
```

| 阶段 title | 待办行为 |
|-----------|---------|
| `创建待办` | 首次遇到时渲染待办骨架（所有条目一次性列出，全为 todo 状态），并应用当前帧的覆盖 |
| `更新待办` | 更新已有待办 DOM 元素的状态 |
| `搜索网页`、`生成图片`、`调用技能` 等 | 跳过 todoOverrides，不渲染/更新待办 |
| 不带 todoOverrides 的帧 | 不处理 |

**首次渲染时的防闪处理**：骨架渲染和一帧的 `todoOverrides` 在同一 JS tick 内完成。
**延迟**：首次渲染或更新后 sleep(`frameDelay × 0.4`)。

### 4.4 思考过程打字机

当事件为思考过程（`icon === '🧠'` 或 `text === '思考过程'`）且含有 `card.body` 时：
- 先渲染带空 body 的卡片行
- 再通过 `typeCardBody` 逐字写入 body
- 速度跟随 `tokensPerSecond`，使用 `playback('chunkSize', 1)` 分块

### 4.5 事件行插入顺序

```
待办首次渲染前：appendChild（事件从上往下排列）
待办渲染后：     insertBefore(firstTodo)（事件行插在待办列表上方）
```

因此最终顺序为：
```
事件行（思考 → 创建待办 → 搜索 → 更新待办…）
输出行（搜索结果）
─────────── 分割线 ───────────
待办列表（锚定底部）
```

---

## 五、关闭方式

| 方式 | 代码 | 触发条件 |
|------|------|---------|
| 点击遮罩背景 | `maybeClose(event)` | `event.target === overlay` |
| 关闭按钮 | `closeSheet()` | 右上角 glass 按钮 `onclick` |
| 下拉关闭（40% 状态） | `closeSheet()` | 下拖距离超过 40px |

**关闭流程**：
```
closeSheet():
  ① resetSheetHeight() → 移除 inline height 和 expanded class
  ② overlay.className = 'sheet-overlay vis'（移除 show，触发 opacity 过渡）
  ③ transitionend 后：overlay.className = 'sheet-overlay'（全隐藏）
```

---

## 六、尺寸与高度管理

### 6.1 两种高度状态

| 状态 | CSS | 百分比 | 含义 |
|------|-----|--------|------|
| **折叠态** | `height: 40%` | 占容器 40% | 默认展开大小 |
| **展开态** | `height: 80%` + `class="expanded"` | 占容器 80% | 手动或自动展开 |

`expanded` class 同时控制 `.sheet-body` 的滚动行为：80% 时 body 可滚动 (`overflow-y: auto`)，40% 时禁止 (`overflow-y: hidden`)。

### 6.2 自动展开 `checkSheetOverflow`

在每次追加内容后的 `scrollSheetBody()` 中调用，延迟到 `requestAnimationFrame` 执行：

```
body.scrollHeight / containerH × 100
  │
  ├─ ≤42% → 不动（内容在 40% 内，含 2% 缓冲）
  ├─ >42% 且 <80% → 展开到 contentPct + 3%（上限 80%）
  └─ ≥80% → 不动（已达上限，body 切换 overflow-y: auto）
```

展开后重置 `body.scrollTop = body.scrollHeight`，防止浏览器扩展 clientHeight 时滚动位漂移。

### 6.3 高度过渡

- **CSS 默认**：`transition: transform 0.36s...` 仅作用于滑入动画，**不包含 height**。
- **流式展开**：直接设 `sheet.style.height`，无高度过渡动画。靠帧间间隔自然产生渐进感。
- **拖拽吸附**：onEnd 临时加 `transition: height 0.32s...`，transitionend 后清除。

---

## 七、拖拽交互 `initSheetDrag`

### 7.1 状态机

```
                    onStart                    onMove
40% ──────────→  拦截整个面板   ────→  dy > 0: 展开 (resize up)
                                       dy < -40: 关闭 (closeSheet)

80% + scrollTop=0 ─→ 记录但不拦截 ─→  首次 dy < 0: 转为折叠模式
                                       首次 dy ≥ 0: 释放（走滚动）

80% + scrollTop>0 ─→ 直接 return（不拦截，走原生滚动）
```

### 7.2 关键参数

| 参数 | 值 | 含义 |
|------|-----|------|
| `dy = startY - currentY` | >0 上拖，<0 下拖 | 拖拽方向 |
| 关闭阈值 | `dy < -40` | 下拖超过 40px 关闭 sheet |
| expanded 切换 | `pct >= 70` | 拖拽过程中实时切换 |
| 吸附阈值 | `pct > 58` → 吸附到 80%，否则吸附到 40% | 松手时决定最终高度 |

### 7.3 行为矩阵

| 当前状态 | 手势 | 结果 |
|---------|------|------|
| 40% | 上拖 | 面板展开，高度跟随手指 |
| 40% | 下拖 > 40px | 关闭 sheet |
| 40% | 点/短拖 | 不下垂面板，保留在 40%（松手吸附修正） |
| 80% + 内容在顶部 | 下拖 | 面板折叠，高度跟随手指 |
| 80% + 内容在顶部 | 上拖 | 释放拖拽，内容正常向上滚动 |
| 80% + 内容不在顶部 | 任何方向 | 不拦截，内容正常滚动 |

---

## 八、事件行内容类型

| 类型 | 识别条件 | 渲染特征 |
|------|---------|---------|
| 思考过程 | `icon === '🧠'` | 卡片 body 使用打字机逐字输出 |
| 创建待办 | `text === '创建待办'` | 待办阶段，触发骨架首次渲染 |
| 搜索网页 | `text === '搜索网页'` | 可带 outputs（搜索结果），逐条追加 |
| 更新待办 | `text === '更新待办'` | 待办阶段，更新已有待办状态 |
| 生成图片 | `text === '生成图片'` | 无 dim，多帧中事件数量递增 |
| 调用技能 | `text === '调用技能'` | 可带 Skill card |
| 文件创建失败 | `text === '文件创建失败'` | warning 样式（⚠） |
| 创建文件 | `text === '创建文件'` | dim 显示文件名 |
| 读取文件 | `text === '读取文件'` | dim 显示文件位置 |
| 编辑文件 | `text === '编辑文件'` | 可带 Edit patch 卡片 |
| 搜索文件 | `text === '搜索文件'` | dim 显示搜索关键词 |
| 执行命令 | `text === '执行命令'` | 行尾带 `›` chevron |
| 委派 Subagent | `text === 'Sub Coding Agent'` | 🐱 icon；嵌套结果用 ↳ icon |
| 嵌套子对话流 | `text === '嵌套子对话流'` | 带 Subagent result 卡片 |

---

## 九、速度控制

所有延迟依赖 `playbackDelay('frameDelay', 520)`，受 `tokensPerSecond` (UI 四档：100/200/500/800) 统一缩放。

| 延迟用途 | 公式 | 默认值 (200 tps) |
|---------|------|----------------|
| 帧间间隔 | `playbackDelay('frameDelay', 520)` | 520ms |
| 搜索结果条间 | `frameDelay × 0.25` | 130ms |
| 待办状态更新停顿 | `frameDelay × 0.4` | 208ms |
| 打字机间隔 | `(1000 × chunkSize) / tps` | 5ms/chunk |

---

## 十、遮罩关闭事件冒泡

遮罩使用 `onclick="maybeClose(event)"`，检查 `event.target === overlay`。因此点击 overlay 背景关闭 sheet，点击 overlay 内部的 sheet 或 close button 不关闭。

---

## 十一、HTML 结构

```html
<div class="sheet-overlay" id="overlay" onclick="maybeClose(event)">
  <div class="bottom-sheet" id="sheet">
    <div class="sheet-handle"></div>             <!-- 拖拽横条 -->
    <button class="glass-btn sheet-close-btn">   <!-- 关闭按钮（右上角） -->
      <span class="glass-layer ..."></span>...
      <svg>...</svg>
    </button>
    <div class="sheet-body" id="sheetBody"></div> <!-- 内容区 -->
  </div>
</div>
```

- `#overlay`：半透明遮罩，z-index 200，flex 布局 `align-items: flex-end`
- `#sheet`：白色面板，position relative（关闭按钮定位锚点）
- `#sheetBody`：flex:1 填充剩余高度，overflow 由 expanded class 控制

---

## 十二、关键 CSS 变量

| 变量 | 默认值 | 用途 |
|------|--------|------|
| `--sheet-radius` | 34px | Sheet 圆角 |
| `--sheet-side-padding` | 20px | Sheet 左右边距 |
| `--sheet-body-left` | 20px | Body 左侧内边距 |
| `--sheet-stack-gap` | 12px | Body 内各条目间距 |
| `--sheet-row-gap` | 16px | 事件行 icon 与内容间距 |
| `--sheet-sub-padding-left` | 36px | 待办行/结果行左侧缩进 |
