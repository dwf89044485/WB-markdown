// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// CLICK-INDICATOR — 视觉锚点指示器
// 自包含: CSS 运行时注入一次
//
// 设计规范（Design Spec）:
//   - 缓动: ease-out，无起步加速，全程纯减速
//   - 时长: 1.2s
//   - 默认方向: from 'right'（从右屏幕外贴边飞入）
//   - 起点 Y: 比终止位置低 200px（dot 自带下探感）
//   - 可选 from 'left': 从左屏幕外贴边飞入，Y 同低 200px
// ============================================================

let _cssInjected = false;

function injectCSS() {
  if (_cssInjected) return;
  const style = document.createElement('style');
  style.textContent = `
.click-indicator-dot {
  position: absolute;
  width: 40px; height: 40px;
  border-radius: 50%;
  background: var(--color-border-weak);
  pointer-events: none;
  z-index: 100;
  opacity: 0;
  --ci-dx: 0px;
  --ci-dy: 0px;
}
.click-indicator-dot.animate {
  animation: ciEntrance 1.2s ease-out both;
}
@keyframes ciEntrance {
  0%   { opacity: 0; transform: translate(var(--ci-dx), var(--ci-dy)) scale(0.5); }
  20%  { opacity: 1; transform: translate(var(--ci-dx), var(--ci-dy)) scale(1); }
  38%  { transform: translate(0, 0) scale(1); }
  58%  { background: var(--color-bg-control); transform: scale(0.88); }
  75%  { background: var(--color-border-weak); transform: scale(1); }
  88%  { opacity: 1; }
  100% { opacity: 0; transform: scale(0.8); }
}`;
  document.head.appendChild(style);
  _cssInjected = true;
}

/**
 * 展示点击指示点动画——dot 从屏幕外贴边飞入，减速落点，按压后淡出。
 *
 * 设计规范: 起点统一用 opts.from 选择方向（'left'/'right'），
 * dot 自动贴 container 外边缘。不接受除 'left'/'right' 之外的 from 值。
 *
 * @param {Element} target    - 动画终点 DOM 元素
 * @param {Object}  [opts]
 * @param {string}  [opts.from]       - 'left' | 'right'（默认 'right'）
 * @param {number}  [opts.endOffsetX] - 终点 X 微调（相对 target 中心），默认 0
 * @param {number}  [opts.endOffsetY] - 终点 Y 微调（相对 target 中心），默认 0
 * @param {Element} [opts.container]  - 定位容器，默认 .phone-shell
 * @returns {Promise<void>}
 */
export async function showClickIndicator(target, opts = {}) {
  injectCSS();

  const container = opts.container || document.querySelector('.phone-shell');
  if (!target || !container) return;

  const existing = container.querySelector('.click-indicator-dot');
  if (existing) existing.remove();

  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const tb = target.getBoundingClientRect();
      const pc = container.getBoundingClientRect();

      // 终点（dot 左上角，target 中心 + 微调偏移）
      const endX = tb.left - pc.left + tb.width / 2 - 20 + (opts.endOffsetX ?? 0);
      const endY = tb.top  - pc.top  + tb.height / 2 - 20 + (opts.endOffsetY ?? 0);

      let startX, startY;

      if (opts.from === 'left') {
        startX = -42;
        startY = endY + 200;
      } else {
        // 默认 from 'right'
        startX = pc.width + 2;
        startY = endY + 200;
      }

      const dot = document.createElement('div');
      dot.className = 'click-indicator-dot';
      dot.style.left = endX + 'px';
      dot.style.top  = endY + 'px';
      dot.style.setProperty('--ci-dx', (startX - endX) + 'px');
      dot.style.setProperty('--ci-dy', (startY - endY) + 'px');

      container.appendChild(dot);
      dot.offsetHeight;
      dot.classList.add('animate');

      dot.addEventListener('animationend', () => {
        dot.remove();
        resolve();
      }, { once: true });
    });
  });
}
