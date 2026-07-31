# Handoff：左侧 Demo 设备切换动效

## 当前状态

- 本文是待实施规格，已进入 `main`，功能尚未开发。
- 静态舞台已验收：纯几何模型、静态舞台架构、Table/Mermaid 全屏生命周期均已完成。
- 待实现：Phone/Pad 切换、横竖屏切换、Pad 分辨率切换的可打断动效。
- 完成实现后先由 Joseph 可视化验收，未经明确批准不得再次合入 `main`。

已完成的底座提交：

- `1166cab0` `test(engine/stage-layout): 新增舞台纯几何模型与设备矩阵测试`
- `748e41ba` `refactor(ui/stage): 以单向几何模型替换舞台测量回写`
- `30e4eb49` `refactor(engine/fullscreen): 接入统一舞台方向与重置生命周期`

## 体验目标

这不是普通的“变宽变高”动画。它表达的是：**正在重新测量画板**。

左侧 Demo 是一个设计工作台。切换设备时，工作台从“当前设备设计稿”进入“重新确定画板尺寸”，最后落到“新设备设计稿”。整体应克制、专业、有设计工具感，不弹跳、不炫技。

接近的体验参照：

- Figma 拖动画板尺寸：画板边缘跟随移动，网格在尺寸落定后重建；
- Keynote 切换幻灯片母版尺寸：变化的是画布本身，不是页面淡入淡出；
- iOS 照片从网格进入单张：对象从原结构中抽出，再落入新结构。

完整语义：

```text
完整设计稿 → 测量骨架 → 画板变形 → 新设计稿落定
```

## 分帧表现

### 帧 1：静止状态

- 舞台显示完整测量网格。
- Demo 四边与网格线重合。
- Demo 左右各留一格空白。
- 纸纹分界线与左栏右边缘、右侧说明区起点重合。

### 帧 2：切换开始（0–80ms）

点击 Phone/Pad、横竖屏或分辨率控件后：

- 旧网格在约 80ms 内快速退出，不是瞬切；
- Demo 四边保留为实线；
- 左右边向舞台上下延伸虚线，上下边向左栏两侧延伸虚线；
- 四角 10×10 方框始终贴在 Demo 四个顶点；
- 纸纹分界线持续可见。

视觉感受：完整设计稿退为可调整的测量框。

### 帧 3：几何变形（0–320ms）

网格退出与几何变形同时开始，不是先后串行：

- Demo 宽高同步变化，内部内容实时重排；
- 左栏宽度随 Demo 和两侧网格单元同步变化；
- 纸纹分界线贴着左栏右边缘移动；
- 右侧说明区跟随分界线移动；
- 四角方框与四条延伸线持续贴合 Demo，误差不超过 1px；
- 80ms 之后直到变形结束，舞台只保留测量骨架，不显示完整网格。

视觉感受：像在设计工具中拖动画板边缘，而不是长方形自行缩放。

### 帧 4：新网格落定（320–440ms）

Demo 到达终态后：

- 新网格以 Demo 四边为基准向舞台外铺开，不从中心放射；
- 新网格出现时，测量骨架同步退出；
- 四角方框始终保留在 Demo 顶点；
- 纸纹分界线、左栏和右侧说明区已同时停在终点。

视觉感受：新的测量基准建立，工作台进入新设备的设计状态。

## 节奏

```text
0ms                          320ms        440ms
│────────────────────────────│────────────│
│  几何变形 0–320ms          │ 新网格建立 │
│  旧网格退出 0–80ms         │ 骨架退出   │
```

- 总时长约 440ms。
- 旧网格退出的 80ms 包含在 0–320ms 的几何变形内，不额外累加。
- 几何变形曲线：`cubic-bezier(.22, 1, .36, 1)`。
- 不加弹性回弹，变形和落定之间不暂停。

全程持续存在：

- Demo 四条实线边；
- 四角方框；
- 纸纹分界线；
- 右侧说明区。

## 连续操作

如果变形或新网格落定阶段再次点击：

- 不排队，不等待上一段动画结束；
- 从当前数学插值位置直接转向最新目标；
- 不回跳旧尺寸，不重播入场；
- 如果正处于 `settling`，立即取消正在出现的新网格，恢复测量骨架并转回 `morphing`；
- 新旧完整网格不能叠加，也不能闪现上一目标的终态；
- 只要尚未完成最后目标，完整网格就保持隐藏；
- 最终只建立最后一次操作对应的新网格。

## 已确立的架构

唯一数据方向：

```text
设备 / 方向 / 视口状态
  → computeStageGeometry() 预计算终态
  → stage-controller 驱动 presentation geometry
  → CSS 变量与 SVG 只消费 geometry
```

禁止重新引入：

- 动效中读取 `getBoundingClientRect()` 后再修正布局；
- `buildGrid → fitShellScale → ResizeObserver` 多轮收敛；
- 网格写回 `--tbl-grid-cell` 决定左栏宽度；
- `.phone-landscape`、`.tbl-landscape`、`body:has()` 各自计算尺寸；
- 用 CSS `width/height transition` 代替统一几何状态。

核心文件：

| 文件 | 职责 |
|---|---|
| `engine/stage-layout.js` | 纯几何、整数网格、`computeStageGeometry()`、`buildGridModel()` |
| `engine/stage-controller.js` | 设备状态、动效状态、控件事件、CSS 变量和 SVG 渲染 |
| `styles/base.css` | `.stage-root`、`.shell-frame`、`.phone-shell` 几何消费 |
| `styles/demo-controls.css` | paper、grid、corner、控制台和测量骨架样式 |
| `engine/table-fullscreen.js` | 通过 transient owner 临时请求方向 |
| `tests/stage-layout.test.mjs` | 纯几何回归测试 |

职责边界：

- 纯几何计算只放在 `stage-layout.js`；
- 动效状态、CSS 变量写入、SVG DOM 操作放在 `stage-controller.js`；
- 主题换色继续使用 `wb:themechange`，不新增颜色逻辑；
- 不重写 Table/Mermaid 全屏生命周期。

## 不可改变的几何规则

1. 网格按 **Demo 最终显示尺寸** 计算，不按逻辑尺寸或动画中间 DOM 反推。
2. 宽高分别由整数列和整数行完整切分。
3. 格子保持约 68px 密度，并优先接近正方形。
4. Demo 四边必须与网格线重合。
5. 左栏宽度严格等于：

```text
Demo 最终显示宽度 + 2 × cellW
```

即 Demo 左右各一格。

6. 左栏右边、纸纹分界、右侧说明区起点始终重合。
7. 动效开始前必须得到完整终态几何；新网格晚出现只是渲染选择，不参与布局计算。

## 实现要求

### 状态机

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

- 每次新目标 `runId++`，旧 rAF/timer 自动失效；
- 从数学采样出的当前 presentation value 转向新目标；
- DOM 不是动画状态源。

### 动画帧职责

动效开始前：

- 读取一次稳定环境输入；
- 调用 `computeStageGeometry()` 得到完整目标；
- 预生成终态网格 model。

动效帧内只允许：

- 插值 geometry；
- 写必要 CSS 变量；
- 更新测量骨架 SVG。

动效帧内禁止：

- `getBoundingClientRect()`、`offsetWidth`、`clientWidth`；
- 再次搜索网格行列；
- 重建完整网格 SVG；
- 中途重新决定控制台是否自动收起。

### 测量骨架与常驻角框

新增独立 SVG 层，例如 `.stage-measurement`，只承载变形期间的延伸线：

- Demo 左右边向舞台上下延伸；
- Demo 上下边向左栏两侧延伸；
- 沿用 `--color-grid-line` 和 `8 8` 虚线；
- 主题切换时立即读取现有 token 换色。

四角方框不属于测量骨架，继续由常驻 `.corner-boxes` 层承载：

- 从 idle、morphing 到 settling 全程存在；
- 每帧消费同一份 presentation geometry，始终贴合 Demo；
- 测量骨架退出时，四角方框不退出；
- 填充和描边继续使用 `--color-grid-tile`、`--color-grid-line`。

### Reduced Motion

`prefers-reduced-motion: reduce` 时：

- 取消正在运行的 rAF/timer；
- 直接提交终态 geometry；
- 不播放大范围尺寸运动；
- 不出现测量骨架；
- 直接显示终态完整网格。

### Resize 与 fullscreen

- Window resize：合并到一个 rAF 后直接应用稳定终态，不播放设备切换动效。
- Table/Mermaid fullscreen 继续使用 `enterStageTransient/exitStageTransient`。
- 不破坏用户选择的方向。
- 600–900px 的 viewport fullscreen 不应修改舞台方向。

## 验证

先运行：

```bash
node --test tests/stage-layout.test.mjs tests/table-fullscreen-view.test.mjs
node --check engine/stage-controller.js
node --check engine/table-fullscreen.js
git diff --check
```

现有基线：27/27 测试通过。Node 的 `type: module` 提示是非阻塞 warning，不为此修改项目配置。

必须录屏自查：

1. Phone portrait → iPad Air landscape；
2. iPad Air → Android Expanded / Surface Pro；
3. Phone portrait → Phone landscape；
4. Pad 分辨率切换；
5. 动画中途快速切换多个目标并反向操作；
6. 控制台展开、手动收起、自动收起；
7. 599/600/899/900/901px；
8. 页面横向滚动后网格、角框、分界同步；
9. Table/Mermaid fullscreen 打开、关闭、跨 900px、播放重置；
10. Light/Dark 和 `prefers-reduced-motion`。

常规动态模式下，每个核心场景至少检查：

- 切换前完整网格；
- 变形中途测量骨架；
- 落定后新完整网格。

Reduced Motion 只检查切换前后两个终态：不要求中间骨架、网格退出或网格铺开过程。

## 产品验收标准

1. **像重新测量画板，而不是长方形变形。**
   - 常规动态模式必须看见测量骨架；只有壳体缩放即为跑偏。
   - `prefers-reduced-motion: reduce` 是明确例外：直接显示终态，不出现测量骨架。
2. **连续点击像“直接听我的”。**
   - 旧动画被立即打断，从当前位置转向新目标；不能回跳或等待。
3. **网格退出和建立有明确方向。**
   - 常规动态模式下，旧网格快速退出；新网格从 Demo 四边向外铺开，不从中心放射。
   - Reduced Motion 直接替换终态网格，不验收退出或铺开方向。
4. **四角方框全程不丢。**
   - 常规动态模式下，从点击前到落定后始终贴着 Demo 四角，误差不超过 1px。
   - Reduced Motion 不检查中间跟随过程，只检查切换前后方框均贴合终态 Demo。
5. **所有空间元素同一拍停止。**
   - Demo、左栏、分界线和说明区不能互相追赶。
6. **最终静态规则不被动效破坏。**
   - Demo 四边与网格重合，左右各一格，横向滚动后仍对齐。

## 当前已验证的静态基线

- Phone + 5 种 Pad × 两个方向，几何误差 `<0.02px`；
- 断点 599/600/899/900/901；
- Body 横滚 500px 后，网格和 Demo 对齐误差约 `0.005px`；
- Light/Dark；
- Desktop fullscreen open/close；
- Mobile fullscreen 挂到 body，reset 后归还 shell；
- Fullscreen 跨 900px 再关闭，无残留；
- 最终审查无 Critical/Important 问题。

## 协作约束

- 默认一句结论 + 3–5 个关键点，不倾倒长篇技术汇报。
- 动效必须截图或录屏自查，不能只报告尺寸断言通过。
- 如果本文与当前代码冲突，以重新验证后的代码为准，不能继承 handoff 的旧判断。
- 功能完成后先交 Joseph 验收；只有明确批准后才能合入 `main`。
