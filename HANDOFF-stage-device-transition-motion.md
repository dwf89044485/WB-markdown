# Handoff：左侧 Demo 设备切换动效

## 当前状态

- 分支：`feat/dark-mode-refresh`
- 用户已明确验收：**静态舞台没有问题，可以继续做动效**。
- 已完成阶段：纯几何模型、静态舞台架构、Table/Mermaid 全屏生命周期。
- 待完成：阶段四“可打断的设备切换动效”。
- 不要合入 `main`；完成后先让 Joseph 可视化验收。

已完成的相关提交：

- `1166cab0` `test(engine/stage-layout): 新增舞台纯几何模型与设备矩阵测试`
- `748e41ba` `refactor(ui/stage): 以单向几何模型替换舞台测量回写`
- `30e4eb49` `refactor(engine/fullscreen): 接入统一舞台方向与重置生命周期`

当前工作区还有 Joseph/其他任务的未提交暗色主题改动：

- `engine/theme.js`
- `index.html`
- `styles/base.css`

**禁止覆盖、恢复或夹带这些改动。提交时只暂存本任务文件。** 另有多份未跟踪文档和素材，与本任务无关。

## 已确立的架构

唯一数据方向：

```text
设备/方向/视口状态
  → computeStageGeometry() 预计算终态
  → stage-controller 一次应用布局
  → 网格只消费 geometry 渲染
```

禁止重新引入以下旧机制：

- 动效中读取 `getBoundingClientRect()` 后再修正布局；
- `buildGrid → fitShellScale → ResizeObserver` 多轮收敛；
- 网格写回 `--tbl-grid-cell` 决定左栏宽度；
- `.phone-landscape` / `.tbl-landscape` / `body:has()` 各自计算尺寸。

核心文件：

- `engine/stage-layout.js`：纯几何、整数网格、`buildGridModel()`。
- `engine/stage-controller.js`：设备状态、控件事件、CSS 变量和 SVG 渲染。
- `styles/base.css`：`.stage-root`、`.shell-frame`、`.phone-shell` 几何消费。
- `styles/demo-controls.css`：paper、grid、corner、控制台。
- `engine/table-fullscreen.js`：通过 transient owner 临时请求横屏。

## 不可改变的几何规则

1. 网格按 **Demo 最终显示尺寸** 计算，不按逻辑尺寸或动画中间 DOM 反推。
2. 宽高必须分别被整数列/行完整切分。
3. 格子在约 68px 密度附近，以接近正方形为第一优先。
4. Demo 四边必须与网格线重合。
5. 左侧区域宽度严格等于：

```text
Demo 最终显示宽度 + 2 × cellW
```

也就是 Demo 左右各一格。
6. 左栏右边、纸纹分界、右侧说明区起点必须始终是同一位置。
7. 动效开始前已经算好终态几何；新网格晚出现只是渲染选择，不参与布局计算。

## 待实现的视觉表现

完整流程：

```text
完整网格 → 测量骨架 → 几何变形 → 终态新网格建立
```

推荐节奏：

1. **切换开始**：内部完整网格快速退出；保留 Demo 四边延伸线和四角 10×10 方框。
2. **0–320ms**：Demo、左栏、paper 分界和右侧说明起点同步变到预计算终态。
3. **320–440ms**：终态完整网格约 120ms 建立；测量骨架同步退出。
4. 曲线沿用项目几何变形：`cubic-bezier(.22, 1, .36, 1)`，不要加回弹。

这不是简单淡入淡出。语义是：

> 完整设计稿 → 正在重新测量画板 → 新设计稿落定

## 实现要求

### 1. 状态机

建议在 `engine/stage-controller.js` 维护：

```js
{
  phase: 'idle' | 'morphing' | 'settling',
  runId,
  presentationGeometry,
  targetGeometry,
  rafId,
  settleTimer
}
```

- 每次新目标 `runId++`，旧 rAF/timer 自动失效。
- 连续点击不排队、不先完成旧动画。
- 从数学采样出的当前 presentation value 转向新目标，不读取 DOM 作为动画状态。

### 2. 动画帧职责

动效前：

- 读取一次稳定环境输入；
- 调用 `computeStageGeometry()` 得到完整目标；
- 预先生成最终网格 model。

动效帧内只允许：

- 插值 geometry；
- 写必要 CSS 变量；
- 更新测量骨架 SVG。

动效帧内禁止：

- `getBoundingClientRect` / `offsetWidth` / `clientWidth`；
- 再次搜索网格行列；
- 重建完整网格 SVG；
- 中途重新决定控制台是否自动收起。

### 3. 测量骨架

新增独立 SVG 层，例如 `.stage-measurement`：

- Demo 左右边向舞台上下延伸；
- Demo 上下边向左栏两侧延伸；
- 四角方框始终贴合 Demo；
- 沿用当前 `--color-grid-line`、`--color-grid-tile` 和 `8 8` 虚线；
- 主题切换时立即读取现有 token 换色。

### 4. Reduced Motion

`prefers-reduced-motion: reduce`：

- 取消正在运行的 rAF/timer；
- 直接提交终态 geometry；
- 不播放大范围尺寸运动；
- 直接显示终态完整网格，不残留测量骨架。

### 5. Resize 和 fullscreen

- Window resize：合并到一个 rAF 后直接应用稳定终态，不连续播放设备切换动效。
- Table/Mermaid fullscreen 使用现有 `enterStageTransient/exitStageTransient`；不要破坏用户选中的方向。
- 600–900px 的 viewport fullscreen 不应修改舞台方向。

## 测试与验收

先运行：

```bash
node --test tests/stage-layout.test.mjs tests/table-fullscreen-view.test.mjs
node --check engine/stage-controller.js
node --check engine/table-fullscreen.js
git diff --check
```

现有基线：27/27 测试通过。Node 会提示仓库没有 `type: module`，这是非阻塞 warning，不要为此改项目配置。

必须做浏览器录屏/截图，自查后再交 Joseph：

1. Phone portrait → iPad Air landscape。
2. iPad Air → Android Expanded / Surface Pro。
3. Phone/Pad/方向/分辨率连续快速点击。
4. 动画中途反向切换。
5. 控制台展开、手动收起、自动收起。
6. 599/600/899/900/901px。
7. 页面横向滚动后网格、角框、分界仍同步。
8. Table/Mermaid fullscreen 打开、关闭、跨 900px、播放重置。
9. Light/Dark 和 `prefers-reduced-motion`。

验收标准：

- 动效期间只有测量骨架，不出现网格线数量跳变。
- 四边延伸线、角框与 Demo 误差不超过 1px。
- Demo、左栏、paper 分界、说明区起点同一拍停止。
- 最终网格四边重合，左右各一格。
- 连点不回跳、不闪回旧网格、不残留 rAF/timer。

## 当前已验证基线

静态阶段已验证：

- Phone + 5 种 Pad × 两个方向，几何误差 `<0.02px`。
- 断点 599/600/899/900/901。
- Body 横滚 500px 后，网格和 Demo 对齐误差约 `0.005px`。
- Light/Dark。
- Desktop fullscreen open/close。
- Mobile fullscreen 挂到 body，reset 后归还 shell。
- Fullscreen 跨 900px 再关闭，无残留。
- 最终审查无 Critical/Important 问题。

## 协作约束

- Joseph 已明确：长篇汇报看不下去。默认一句结论 + 3–5 个关键点。
- 动效必须截图/录屏自查，不能只报尺寸断言通过。
- 如果实现与本 handoff 冲突，先重新读取当前代码并以代码为准；handoff 只是线索，不要盲信行号或历史判断。
- 完成后不要自动合入 `main`，先等待 Joseph 验收。
