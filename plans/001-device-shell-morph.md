# 001 — 设备壳切换 morph（手机/Pad/横竖屏/分辨率）

- **Status**: HOLD（2026-07-30 系统性审查后冻结。v1 于 2026-07-29 验收未过、改动被 `git restore` 丢弃；v2 虽修网格数量跳变，但仍建立在不成立的前提上：把正常文档流的左右布局、视口固定的装饰层、以及依赖实时测量的缩放/网格同时过渡。未先拆开这三套坐标系，禁止实施。）
- **Commit**: 6a8cdba2（行号基准）；v2 修订时工作区与 HEAD 一致
- **Severity**: MEDIUM
- **Category**: Missed opportunities（§8）— 防止生硬跳变 / spatial consistency
- **Estimated scope**: 3 个文件（`index.html` 内联脚本、`styles/base.css`、`styles/demo-controls.css`），约 90 行新增、10 行修改

## Problem

演示控制台的三类设备切换全部瞬跳，没有任何过渡：

1. **手机 ↔ Pad**：`index.html:673` `setDeviceMode()` 切换 `<html>` 的 `device-pad` class，`--layout-shell-w/h` 从 393×852 跳到 840×1190，手机壳尺寸瞬间突变。
2. **横竖屏**：`index.html:724` 切换 `.phone-landscape`，`styles/base.css:309` 交换宽高，瞬跳。
3. **Pad 分辨率**：`index.html:640` `setPadResolution()` 直接写 CSS 变量，瞬跳。

连带瞬跳的还有：左栏宽（`--layout-left-area-w`，base.css:248/314）、paper 分隔线（`left: var(--layout-left-area-w)`，demo-controls.css:23）、`fitShellScale()` 写入的 `transform: scale(...)`（index.html:772）、以及 `buildGrid()` 重建的测量网格和四角方框（index.html:499）。

当前 `.phone-shell` 只有 `will-change: transform`，没有任何 transition（base.css:298-307）：

```css
/* styles/base.css:298 — current */
.phone-shell{
  width:var(--layout-shell-w);height:var(--layout-shell-h);background:var(--color-bg-canvas);border-radius:0;
  box-shadow:none;
  border:1px solid rgba(0,0,0,0.08);
  display:flex;flex-direction:column;overflow:hidden;position:relative;
  isolation:isolate;
  flex-shrink:0;
  transform-origin:center center;
  will-change:transform;
}
```

**为什么重要**：设备切换是这个 demo 的核心演示动作——向评审者展示"同一套对话 UI 如何适配不同终端"。瞬跳让适配过程不可见，morph 让布局重排本身成为演示内容。

**关于"只动 transform/opacity"规则的刻意偏离**：AUDIT.md §5 要求避免 width/height 过渡（触发 layout）。此处是有意例外——morph 的目的就是展示响应式重排（文字重折行、布局自适应），若改用 scale 模拟会把内容拉伸变形，违背演示意图。单元素、偶发触发、demo 场景，layout 成本可接受。

## Risks（2026-07-30 风险评审，v1 验收失败复盘）

v1 只解决了"壳子瞬跳"，没处理陪跑元素，以下风险按严重度排序。**R1/R2 是 v1 验收未过的最可能败因，v2 必须修复；R3 由验收环节兜底；R4–R7 接受或转为演示纪律。**

- **R1 · 网格线数量在 morph 中途跳变（HIGH）**：`buildGrid` 每帧用实时宽度算列数 `COLS = Math.round(pw / 68)`（`index.html:547`）。手机→Pad 横屏列数 6→18，中途跨 12 次阈值，每次一条竖线凭空出现/消失（约每 37ms 一次），视觉像"洗牌"。**修复**：morph 期间 COLS/ROWS 锁定终态值，每帧只更新线位置（间距平滑缩放、数量不变）。见 Step 4。
- **R2 · 左栏宽两拍落地（HIGH，R1 的姐妹问题）**：横屏时左栏宽 = 壳高 + 2 × `--tbl-grid-cell`（`styles/base.css:578`），而该变量由 `buildGrid` 用**实时**宽度每帧重写（`index.html:555`）。左栏过渡的目标值每帧在变 → 不停重定向 → 壳子到位后左栏还要追约 0.5s。**修复**：与 R1 同点——`--tbl-grid-cell` 在 morph 全程写终态值，左栏目标从第一帧就固定，一拍到位。见 Step 4/5。
- **R3 · 每帧重建 SVG 网格的性能（MEDIUM）**：`buildGrid` 每帧拼 SVG 字符串 + encodeURIComponent + 重设 background-image（含 corner-boxes），并强制 `getBoundingClientRect` 触发布局，叠加宽高过渡的逐帧重排，低端机可能掉帧。**对策**：验收必须在目标演示机器实测；若掉帧，降级为 morph 期间 `.grid-overlay`/`.corner-boxes` 淡出（opacity .15s）、到位后淡入，停止逐帧重建。降级补丁见 Verification。
- **R4 · 控制面板自动收起与 morph 叠加（LOW）**：切 Pad 空间不足时 `fitShellScale(allowCollapse=true)` 自动收起面板（0.36s 动画），与 0.45s morph 并发，壳子边变形边漂移。两股都是连续运动，可接受；验收重点看，嫌乱再把 morph 期间的自动收起改为瞬时。
- **R5 · 打字机播放中切换（演示纪律，不改代码）**：逐字输出 + 全壳逐帧重排 + 逐帧重建网格三份开销叠加。演示时把设备切换放在两个场景之间，避开打字高潮。
- **R6 · 表格全屏浮层开着时切换（接受）**：浮层钉在壳内绝对定位，对齐不丢，但内容瞬时重排。极少这么操作。
- **R7 · 切 Pad 时横向滚动条第一帧弹出（接受）**：`--layout-min-w` 瞬变是预存在行为，morph 让它更显眼而已。

## Target

所有切换共享一个门控 class `html.is-morphing`、同一条曲线、同一个时长。曲线沿用项目已有的 drawer 曲线 `cubic-bezier(.32,.72,0,1)`（demo-controls.css:94、641 同款），时长 `.45s`（落在 drawer 200–500ms 预算内）。

```css
/* styles/base.css — target，追加在 .phone-shell 规则块之后 */
/* ── 设备切换 morph：仅编程切换时由 JS 加 .is-morphing 门控 ── */
@media (prefers-reduced-motion: no-preference) {
  html.is-morphing .phone-shell{
    transition:width .45s cubic-bezier(.32,.72,0,1),
               height .45s cubic-bezier(.32,.72,0,1),
               transform .45s cubic-bezier(.32,.72,0,1);
  }
  html.is-morphing .left-area{
    transition:flex-basis .45s cubic-bezier(.32,.72,0,1),
               width .45s cubic-bezier(.32,.72,0,1);
  }
  html.is-morphing .paper-bg::before{
    transition:left .45s cubic-bezier(.32,.72,0,1);
  }
}
```

```css
/* styles/demo-controls.css — target，追加在 .dc-orientation-btn svg 规则（:536）之后 */
.dc-orientation-btn svg{
  transition:transform .45s cubic-bezier(.32,.72,0,1);
  transform-box:fill-box;
  transform-origin:center;
}
html:has(.phone-shell.phone-landscape) .dc-orientation-btn svg{
  transform:rotate(90deg);
}
@media (prefers-reduced-motion: reduce) {
  .dc-orientation-btn svg{ transition:none; }
}
```

JS 侧新增 `morphShell(applyChanges)` 包装器，三个切换入口（`setDeviceMode`、`setPadResolution` 的调用点、orientation click handler）改为经它执行。`fitShellScale` 增加可选 `dims` 参数。

**关键机制**（执行者必须理解，不要改动顺序）：

1. CSS 自定义属性本身不参与过渡，但**消费它们的属性**（width/flex-basis/left）会因其计算值变化而触发 transition——所以先加 `.is-morphing` 再改 class/变量，过渡自然发生。
2. 加 `.is-morphing` 后必须 `void shell.offsetHeight` 强制 reflow，把 transition 属性提交进当前样式，否则同帧内的属性变更不会过渡。
3. `fitShellScale` 需要**终态**尺寸计算 scale，但过渡中 `offsetWidth` 读到的是插值。利用机制 1 的反面：CSS 变量瞬间到终态，所以从 `getComputedStyle(root)` 读 `--layout-shell-w/h`（横屏时交换）即得终态宽高，通过 `dims` 参数传入。
4. morph 期间用 rAF 逐帧调 `buildGrid()`——它读 `phone.getBoundingClientRect()`（index.html:517），能拿到过渡中的实时位置，网格实线/虚线/四角方框会贴着手机边缘走。
5. morph 期间 window resize / ResizeObserver 触发的 `fitShellScale()` 会清掉进行中的 transform 过渡，必须跳过；morph 结束后再统一 settle。
6. **实施时补充**：左栏宽同样在过渡中，`fitShellScale` 若直接量 `.shell-viewport.clientWidth` 会读到旧窄值，导致 scale 被低估、`scale < 0.85` 误触发控制面板自动收起。因此 `morphShell` 用一个探针元素（`width: var(--layout-left-area-w)`，offsetWidth 会计算 calc）解析左栏终态宽度，经 `dims.leftW` 传入 `fitShellScale` 作为 availW 基准。
7. **v2 新增（修 R1/R2）**：`buildGrid` 增加可选 `fixedDims` 参数。morph 期间每帧调 `buildGrid(finalGridDims)`——**列数/行数/`--tbl-grid-cell` 用终态尺寸算（全程不变），线的位置仍用实时 rect 算（贴着壳边走）**。`finalGridDims` = 终态宽高 × 终态 scale（`fitShellScale` 需 `return scale`），保证 morph 期间的列数与 settle 后的列数一致，连"最后一帧修正"都不发生。
8. **v2 新增**：`morphSeq` 序号防重入——morph 中途再点切换，旧 rAF 循环和旧 settle 定时器自动失效，由新一轮接管，不会双循环重建网格。

## Repo conventions to follow

- 曲线与时长：项目抽屉/面板统一用 `cubic-bezier(.32,.72,0,1)` + `.36s~.45s`，范例 `styles/demo-controls.css:94`（`.demo-controls` 的 max-height 过渡）和 `:641`（`.pc-panel` 滑入）。本方案沿用曲线，时长取 `.45s`（壳体位移量更大）。
- 门控 class 加在 `<html>` 上：与 `device-pad`（base.css:140）、`force-standalone`（base.css:151）同款模式。
- `:has()` 选择器：项目已用 `body:has(.phone-shell.phone-landscape)`（base.css:312），orientation 图标规则用同样思路。
- 脚本结构：设备切换逻辑全部在 `index.html` 底部内联 `<script>` 的 IIFE 内（:499-806），新代码放同一作用域。

## Steps

### 1. `styles/base.css` — 追加 morph 过渡规则

在 `.phone-shell` 规则块（:298-307）与横屏规则（:309）之后、`body:has(...)` 规则（:312）之前，插入「Target」中的 base.css 代码块。

### 2. `styles/demo-controls.css` — orientation 图标旋转

在 `.dc-orientation-btn svg`（:536-541）之后插入「Target」中的 demo-controls.css 代码块。

### 3. `index.html` — `fitShellScale` 增加 `dims` 参数

将 `fitShellScale` 函数（:737-780）开头改为：

```js
  function fitShellScale(allowCollapse, dims) {
    // 手机端/standalone 模式：禁止缩放，手机壳就是视口本身
    var root = document.documentElement;
    var isStandalone = root.classList.contains('force-standalone') ||
      (!root.classList.contains('force-desktop') && window.innerWidth <= 900);
    if (isStandalone) return;

    var shell = document.querySelector('.phone-shell');
    if (!shell) return;
    var viewport = document.querySelector('.shell-viewport');
    if (!viewport) return;
    var controls = document.querySelector('.demo-controls');

    var shellW, shellH, availWOverride;
    if (dims) {
      shellW = dims.w;
      shellH = dims.h;
      if (dims.leftW) availWOverride = dims.leftW;
    } else {
      shell.style.transform = '';
      shellW = shell.offsetWidth;
      shellH = shell.offsetHeight;
    }

    var availW = (availWOverride || viewport.clientWidth) - 48;
    var availH = viewport.clientHeight - 24;
    var scale = Math.min(1, availW / shellW, availH / shellH);
```

（其后 collapse 逻辑与 transform 写入逻辑保持不变：:758-779 原样保留。）

**v2 补充**：函数末尾两个分支（`scale < 1` 与 `else`）之后统一 `return scale;`——`morphShell` 需要终态 scale 来算网格的 `fixedDims`（机制 7）。standalone 提前 return 的分支返回 `undefined`，调用方（resize 等）忽略返回值，无影响。

### 4. `index.html` — `buildGrid` 增加 `fixedDims` 参数（v2，修 R1/R2）

只动列数/行数/格子尺寸的**数据源**，线与方框的坐标绘制算法一行不动。将 `buildGrid`（:499-526 及 :547-555）改为：

```js
  function buildGrid(fixedDims){
    var phone  = document.querySelector('.phone-shell');
    var overlay = document.querySelector('.grid-overlay');
    if(!phone || !overlay) return;
    /* …standalone 判断等前段保持不变… */

    // 手机在正常文档流中，直接读实际位置
    var pR = phone.getBoundingClientRect();
    var pw = pR.width;
    var ph = pR.height;

    // v2：morph 期间列数/行数锁终态——数量不变，只有间距随实时尺寸平滑缩放
    var cw = fixedDims ? fixedDims.w : pw;
    var ch = fixedDims ? fixedDims.h : ph;
    COLS = Math.max(1, Math.round(cw / TARGET_CELL));
    ROWS = Math.max(1, Math.round(ch / TARGET_CELL));

    // 线间距仍用实时尺寸：过渡中每帧平滑重分布
    var colStep = pw / COLS;
    var rowStep = ph / ROWS;

    // v2：--tbl-grid-cell 喂给左栏宽 calc（base.css:578），morph 期间必须写终态值，
    // 否则左栏过渡追移动目标、两拍落地（R2）
    var cellForLayout = fixedDims ? (fixedDims.w / COLS) : colStep;
    document.documentElement.style.setProperty('--tbl-grid-cell', r(cellForLayout) + 'px');
```

（其后画线、corner-boxes 代码原样保留。resize / settle 等无参调用 `buildGrid()` 行为与今天完全一致。）

### 5. `index.html` — 新增 `morphShell` 包装器

在 `setDeviceMode` 函数定义（:673）之前插入：

```js
  /* ── 设备切换 morph 门控 ────────────────────────── */
  var MORPH_MS = 500; /* .45s 过渡 + 50ms 余量 */
  var morphTimer = null;
  var morphSeq = 0; /* v2：防重入，旧循环/旧 settle 自动失效 */

  function morphShell(applyChanges, allowCollapse) {
    var root = document.documentElement;
    var shell = document.querySelector('.phone-shell');
    var isStandalone = root.classList.contains('force-standalone') ||
      (!root.classList.contains('force-desktop') && window.innerWidth <= 900);
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!shell || isStandalone || reduceMotion) {
      applyChanges();
      buildGrid();
      fitShellScale(allowCollapse);
      return;
    }

    if (morphTimer) { clearTimeout(morphTimer); morphTimer = null; }
    var seq = ++morphSeq;

    root.classList.add('is-morphing');
    void shell.offsetHeight; /* 提交 transition 属性，后续变更才会过渡 */
    applyChanges();

    /* CSS 变量瞬间到终态：从变量读终态宽高（横屏交换）算终态 scale */
    var cs = getComputedStyle(root);
    var vw = parseFloat(cs.getPropertyValue('--layout-shell-w'));
    var vh = parseFloat(cs.getPropertyValue('--layout-shell-h'));
    var landscape = shell.classList.contains('phone-landscape');
    /* 左栏宽也在过渡中：用探针元素解析 --layout-left-area-w 的终态值（可算 calc） */
    var probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;width:var(--layout-left-area-w);height:0';
    document.body.appendChild(probe);
    var finalLeftW = probe.offsetWidth;
    probe.remove();
    var finalDims = landscape ? { w: vh, h: vw } : { w: vw, h: vh };
    finalDims.leftW = finalLeftW;
    var finalScale = fitShellScale(allowCollapse, finalDims) || 1;

    /* v2：网格 fixedDims = 终态尺寸 × 终态 scale，与 settle 后列数一致（机制 7） */
    var gridDims = { w: finalDims.w * finalScale, h: finalDims.h * finalScale };

    /* morph 期间逐帧重建网格：线位置贴实时边缘，列数/格子尺寸锁终态（R1/R2） */
    var start = performance.now();
    (function tick(now) {
      if (seq !== morphSeq) return; /* 新一轮 morph 已接管 */
      buildGrid(gridDims);
      if (now - start < MORPH_MS) requestAnimationFrame(tick);
    })(start);

    morphTimer = setTimeout(function() {
      if (seq !== morphSeq) return;
      root.classList.remove('is-morphing');
      morphTimer = null;
      buildGrid();
      fitShellScale(allowCollapse);
    }, MORPH_MS);
  }
```

### 6. `index.html` — 三个切换入口改走 `morphShell`

**6a. orientation click handler（:724-731）** — 把函数体包进 morphShell：

```js
    orientationBtn.addEventListener('click', function() {
      var btn = this;
      morphShell(function() {
        var shell = document.querySelector('.phone-shell');
        var isLandscape = shell.classList.toggle('phone-landscape');
        btn.querySelector('span').textContent = isLandscape ? '竖屏' : '横屏';
        btn.setAttribute('aria-label', isLandscape ? '切换为竖屏' : '切换为横屏');
      });
    });
```

（原函数体内的 `buildGrid(); fitShellScale();` 删除——已由 morphShell 统一调度。）

**6b. `setDeviceMode`（:673-707）** — 函数体末尾的 `buildGrid(); fitShellScale(true);` 两行删除；两个调用点（:709-710）改为：

```js
  document.getElementById('ctrlDevicePhone').addEventListener('click', function(){ morphShell(function(){ setDeviceMode('phone'); }, true); });
  document.getElementById('ctrlDevicePad').addEventListener('click', function(){ morphShell(function(){ setDeviceMode('pad'); }, true); });
```

**6c. Pad 分辨率下拉（:713-719）** — change handler 改为：

```js
    padResSelect.addEventListener('change', function() {
      var val = this.value;
      if (document.documentElement.classList.contains('device-pad')) {
        morphShell(function() { setPadResolution(val); }, true);
      }
    });
```

同时删除 `setPadResolution` 函数体内（:661-662）的 `buildGrid(); fitShellScale(true);` 两行。

### 7. `index.html` — resize 期间跳过 fitShellScale

把 resize listener（:786）和 ResizeObserver 回调（:787-789）改为 morph 期间只重建网格：

```js
  window.addEventListener('resize', function() {
    buildGrid();
    if (!document.documentElement.classList.contains('is-morphing')) fitShellScale();
  });
  var ro = new ResizeObserver(function() {
    requestAnimationFrame(function() {
      buildGrid();
      if (!document.documentElement.classList.contains('is-morphing')) fitShellScale();
    });
  });
```

## Boundaries

- 只动这 3 个文件：`index.html`、`styles/base.css`、`styles/demo-controls.css`。
- 不改 `PAD_RESOLUTIONS` 数据、不改 `setPadResolution`/`setDeviceMode` 的横竖屏联动逻辑。
- `buildGrid` 只按 Step 4 改列数/行数/格子尺寸的**数据源**（新增 `fixedDims` 参数），线与四角方框的坐标绘制算法一行不动。
- 不新增任何依赖、不引入动画库。
- 不动播放引擎（`engine/*`）、Sheet 浮层、对话区样式——本次只管舞台层。
- 步骤中的行号以 commit `6a8cdba2` 为准；若代码已漂移导致对不上，STOP 并报告，不要即兴发挥。

## Verification

- **Mechanical**：`python3 -m http.server 8080` 起本地服务，桌面 Chrome 打开 `http://localhost:8080`，控制台无报错；连续点击 手机→Pad→横屏→切换 Pad 分辨率，功能结果与改动前一致（终态尺寸、scale、按钮文字）。
- **Feel check**：
  - 点「Pad」：手机壳从 393×852 平滑生长到 pad 尺寸，左栏和 paper 分隔线同步滑动，网格虚线全程贴着手机边缘走，无瞬跳。
  - 点「横屏」：宽高互换是连续的"翻个儿"过程，orientation 图标旋转 90°。
  - **R1 验证**：DevTools Animations 面板 10% 慢放，数网格竖线——morph 全程数量不变，只有间距平滑缩放；settle 帧也不能有数量修正。
  - **R2 验证**：壳子、左栏、纸纹分隔线**同一拍落地**（0.45s 同时停），左栏无"追半步"的滞后再停。
  - **R3 验证**：在实际演示用的机器上连点 手机→Pad→横屏 三个来回，肉眼无掉帧。若掉帧，应用下方降级补丁。
  - 切换中途连点另一个按钮：过渡从当前位置重定向，不从零重播；网格重建循环不叠加（DevTools Performance 面板每帧 buildGrid 只出现一次）。
  - Rendering 面板勾选 `prefers-reduced-motion: reduce`：切换瞬时完成（无 morph），功能正常。
  - morph 进行中拖动窗口缩放：壳体过渡不被打断，结束后 settle 到正确 scale。
  - **R4 验证**：窗口高度压到触发面板自动收起的档位，再切 Pad——面板收起与 morph 并发时观感可接受；若嫌乱，把 morph 期间的自动收起改为瞬时（`fitShellScale` 内 `dims` 分支跳过 collapse 类名切换、直接瞬时收起）。
- **R3 降级补丁（仅在实测掉帧时应用）**：morph 开始给 `.grid-overlay` 和 `.corner-boxes` 加 `transition: opacity .15s ease; opacity: 0`，跳过逐帧 `buildGrid`；settle 时无参 `buildGrid()` 重建后恢复 `opacity: 1`。牺牲网格跟踪，保壳体流畅。
- **Done when**：三类切换 + 分辨率切换全部有连续 morph，网格全程贴合且**线数量恒定**，左栏一拍落地，reduced-motion 下退化为瞬时切换，控制台零报错。
