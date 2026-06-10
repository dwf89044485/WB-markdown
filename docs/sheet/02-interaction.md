# Sheet 交互逻辑

## 一、打开流程

`openSheet(frameRefs)` 的执行顺序：

```
① 解析帧     → getFrames(frameRefs) 从 scenario.sheetFrames 查找
② 清空 body  → body.innerHTML = ''
③ 空状态检测   → 既无 events 又无 todos 则显示"当前状态暂无新增事件。"
④ 复位高度    → resetSheetHeight() 回到 40%
⑤ 显示遮罩    → overlay: vis → rAF → show class（opacity 0.28s）
⑥ 流式渲染    → streamSheetContent(frames, baseline)
```

---

## 二、关闭

| 方式 | 触发条件 | 代码路径 |
|------|---------|---------|
| 点击遮罩背景 | `event.target === overlay` | `maybeClose(e)` → `closeSheet()` |
| 关闭按钮 | 右上角 glass 按钮点击 | `closeSheet()` |
| 下拉关闭（40% 状态） | 下拖超过 40px 阈值 | `closeSheet()` |

`closeSheet()` 流程：

```
① resetSheetHeight() → 移除 inline height 和 expanded class
② overlay: 'sheet-overlay vis'（移除 show → 触发 opacity 淡出）
③ transitionend → overlay: 'sheet-overlay'（完全隐藏）
```

---

## 三、尺寸管理

### 3.1 两种高度状态

| 状态 | CSS | 含义 |
|------|-----|------|
| 折叠态 | `height: 40%` | 默认大小 |
| 展开态 | `height: 80%` + `class="expanded"` | 手动拖拽或自动展开后 |

`expanded` class 同时控制 body 的滚动：
- 80% → `overflow-y: auto`（内容可滚动）
- 未到 80% → `overflow-y: hidden`（禁止滚动，靠面板展开展示内容）

### 3.2 自动展开

函数：`checkSheetOverflow()`（`engine/sheet.js`）

在每次追加内容后的 `scrollSheetBody()` 中触发，延迟到 `requestAnimationFrame` 执行：

```
body.scrollHeight / containerH × 100
  │
  ├─ ≤42% → 不动（2% 缓冲）
  ├─ >42% 且 <80% → 展开到 contentPct + 3%（上限 80%）
  └─ ≥80% → 不动，body 切换 overflow-y: auto
```

展开后立即重置 `body.scrollTop = body.scrollHeight`，防止浏览器扩展 clientHeight 时滚动位漂移。

### 3.3 高度过渡策略

| 场景 | 过渡方式 |
|------|---------|
| CSS 默认 | 仅 `transform` 有 transition，height 无 |
| 流式展开 | 直接设 `sheet.style.height`，无动画 |
| 拖拽吸附 | onEnd 临时加 `transition: height 0.32s`，完成后清除 |

---

## 四、拖拽交互

模块：`initSheetDrag()`（`engine/sheet.js`）

### 4.1 状态机

```
                    onStart                    onMove
40% ──────────→  拦截整个面板   ────→  dy > 0: 展开
                                       dy < -40: 关闭

80% + scrollTop=0 ─→ 记录但不拦截 ─→  首次 dy < 0: 转为折叠模式
                                       首次 dy ≥ 0: 释放（走滚动）

80% + scrollTop>0 ─→ 直接 return（不拦截，走原生滚动）
```

### 4.2 关键参数

| 参数 | 值 | 含义 |
|------|-----|------|
| `dy = startY - currentY` | >0 上拖，<0 下拖 | 方向 |
| 关闭阈值 | `dy < -40` | 下拖超过 40px 关闭 |
| expanded 切换 | `pct >= 70` | 拖拽中实时切换 |
| 吸附阈值 | `pct > 58` → 80%，否则 40% | 松手决定最终高度 |

### 4.3 行为矩阵

| 当前状态 | 手势 | 结果 |
|---------|------|------|
| 40% | 上拖 | 面板展开，跟随手指 |
| 40% | 下拖 > 40px | 关闭 sheet |
| 40% | 点/短拖 | 松手吸附到 40% |
| 80% + 内容在顶部 | 下拖 | 面板折叠，跟随手指 |
| 80% + 内容在顶部 | 上拖 | 释放拖拽，内容向上滚动 |
| 80% + 内容不在顶部 | 任何方向 | 不拦截，正常滚动 |

---

## 五、遮罩事件冒泡

遮罩使用 `onclick="maybeClose(event)"`，检查 `event.target === overlay`。
- 点击 overlay 背景 → 关闭
- 点击 sheet 内部或 close button → 不关闭（target 不是 overlay）
