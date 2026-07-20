// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// DEVICE ADAPTATION — 设备适配交互设计文档
// ============================================================

export default {
  id: 'device-adaptation',
  type: 'feature',
  label: '设备适配',
  anchors: {},
  get content() {
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>设备适配</h1>
        <p class="fp-subtitle">WorkBuddy 在不同屏幕宽度下的布局策略与产物展示形态</p>
      </header>

      <section data-section="rationale">
        <h2>1. 设计判断</h2>
        <p>两根断点来自同一个算式：</p>
        <table>
          <thead>
            <tr><th>断点</th><th>来源</th><th>含义</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1200px</strong></td>
              <td>1200 − 300（侧边栏）− 300（产物栏）<br>= 600px，触及移动端断点</td>
              <td>三栏 → 双栏，两档自然衔接</td>
            </tr>
            <tr>
              <td><strong>600px</strong></td>
              <td>低于此宽度，300px 侧边栏过度挤压内容栏</td>
              <td>双栏 → 单栏，侧边栏退场</td>
            </tr>
          </tbody>
        </table>
        <p>核心策略：<strong>宽屏常驻、中屏浮层、窄屏 Sheet</strong>。产物展示形式随屏幕空间动态切换，不做多套布局。</p>
      </section>

      <section data-section="layout">
        <h2>2. 适配策略</h2>
        <p>按内容区可用宽度分三档，每档对应一种布局和产物展示形态：</p>
        <table>
          <thead>
            <tr><th>内容区可用宽度</th><th>布局</th><th>侧边栏</th><th>产物形态</th><th>触发方式</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>&gt; 1200px</strong></td>
              <td>三栏</td>
              <td>300px 常驻</td>
              <td>右侧栏 300px</td>
              <td>常驻，无需触发</td>
            </tr>
            <tr>
              <td><strong>600–1200px</strong></td>
              <td>双栏</td>
              <td>300px 常驻</td>
              <td>浮层（覆盖内容区）</td>
              <td>点击触发</td>
            </tr>
            <tr>
              <td><strong>&lt; 600px</strong></td>
              <td>单栏</td>
              <td>隐藏</td>
              <td>底部 Sheet</td>
              <td>点击触发</td>
            </tr>
          </tbody>
        </table>

        <h3>&gt; 1200px · 三栏</h3>
        <p>产物在右侧栏常驻，所见即所得。</p>
        <pre class="fp-diagram"><code>┌──────────┬──────────────────────────┬──────────┐
│  侧边栏   │      内容栏（弹性）      │  产物栏   │
│  300px   │      fill remaining      │  300px   │
└──────────┴──────────────────────────┴──────────┘</code></pre>

        <h3>600–1200px · 双栏 + 浮层</h3>
        <p>产物退为浮层，含背景模糊，视觉悬浮于内容之上。</p>
        <pre class="fp-diagram"><code>┌──────────┬──────────────────────────┐
│  侧边栏   │      内容栏（弹性）      │
│  300px   │      fill remaining      │
└──────────┴──────────────────────────┘
                    ↑
            产物以浮层形式覆盖在内容区上方</code></pre>

        <h3>&lt; 600px · 单栏 + Sheet</h3>
        <p>侧边栏退场，产物转底部 Sheet，从下往上弹出。</p>
        <pre class="fp-diagram"><code>┌──────────────────────┐
│    内容栏（全宽）    │
│                      │
│                      │
└──────────────────────┘
        ↑ 底部 Sheet 从下往上弹出</code></pre>
      </section>

      <section data-section="product">
        <h2>3. 产物展示形态</h2>
        <p>产物（代码块、表格、图表等 agent 输出）的展示形式随屏幕空间变化，但内容本身不变，只变容器：</p>
        <table>
          <thead>
            <tr><th>形态</th><th>出现档位</th><th>特点</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>右侧栏</strong></td>
              <td>&gt; 1200px</td>
              <td>常驻可见，与内容栏并列，用户可同时查看对话和产物</td>
            </tr>
            <tr>
              <td><strong>浮层</strong></td>
              <td>600–1200px</td>
              <td>覆盖在内容区上方，背景模糊，点击外部关闭；适合临时查看</td>
            </tr>
            <tr>
              <td><strong>底部 Sheet</strong></td>
              <td>&lt; 600px</td>
              <td>从下往上弹出，宽度适配可用宽度（非全屏），可上滑展开</td>
            </tr>
          </tbody>
        </table>
        <blockquote>
          <p><strong>核心原则</strong>：产物内容不因屏幕变小而截断或简化。窄屏时产物只是换了个容器展示，内容完整度不变。</p>
        </blockquote>
      </section>

      <section data-section="edge-cases">
        <h2>4. 边界与异常</h2>
        <table>
          <thead>
            <tr><th>场景</th><th>规则</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>iPad 分屏</strong></td>
              <td>按<strong>可用宽度</strong>判断，而非设备物理宽度。分屏后可用宽度跌破 600px → 底部 Sheet；仍大于 600px → 右侧栏。Sheet 宽度适配可用宽度，非全屏宽度。</td>
            </tr>
            <tr>
              <td><strong>窗口 resize</strong></td>
              <td>断点切换时产物形态自动过渡。浮层 / Sheet 处于打开状态时，resize 不自动关闭，由用户手动关闭后下次打开按新形态展示。</td>
            </tr>
            <tr>
              <td><strong>内容区被压缩到极限</strong></td>
              <td>侧边栏 300px 为硬约束，不随内容区进一步缩小而压缩。内容栏在 &lt; 600px 时占满全宽。</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section data-section="principles">
        <h2>5. 设计原理</h2>

        <h3>为什么不做多套布局</h3>
        <p>三档布局共用同一套 DOM 结构，只通过 CSS 媒体查询和 JS 切换产物容器形态。多套布局会增加维护成本和测试面，且不符合"内容优先"的设计原则——布局应该适应内容，而不是内容适应布局。</p>

        <h3>为什么产物形态随空间切换，而不是随设备</h3>
        <p>同一台设备（如 iPad）在不同使用场景下可能有完全不同的可用宽度。按设备判断会导致分屏时体验断裂。按可用宽度判断，用户在任何设备上都能获得一致的体验。</p>

        <h3>为什么 1200px 和 600px 不是对称的</h3>
        <p>1200px 是"内容栏触及移动端断点"，600px 是"侧边栏挤压内容栏到不可用"。两个断点的判断依据不同，所以不对称。如果强行对称，要么在 1200px 以下过早隐藏侧边栏，浪费空间；要么在 600px 以上保留侧边栏，挤压内容。</p>
      </section>
    </article>`;
  },
};
