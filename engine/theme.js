// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// 全站主题运行时：html[data-theme] 是唯一当前主题状态源。

const STORAGE_KEY = 'workbuddy.theme';
const THEMES = new Set(['light', 'dark']);
const THEME_COLORS = Object.freeze({ light: '#fafafa', dark: '#17181b' });
const REVEAL_CLASS = 'is-theme-revealing';
const REVEAL_DURATION_MS = 1200;
const REVEAL_EASING = 'cubic-bezier(.77,0,.175,1)';
const root = document.documentElement;
const systemThemeQuery = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;
const reducedMotionQuery = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

let manualTheme = readStoredTheme();
let activeThemeReveal = null;

function isTheme(value) {
  return THEMES.has(value);
}

function systemTheme() {
  return systemThemeQuery?.matches ? 'dark' : 'light';
}

function readStoredTheme() {
  try {
    const value = window.localStorage?.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch (error) {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    window.localStorage?.setItem(STORAGE_KEY, theme);
  } catch (error) {
    // 存储不可用时仍保留本标签页的手动选择。
  }
}

function syncHighlightTheme(theme) {
  const isDark = theme === 'dark';
  const lightStylesheet = document.getElementById('hljs-theme-light');
  const darkStylesheet = document.getElementById('hljs-theme-dark');
  if (lightStylesheet) lightStylesheet.disabled = isDark;
  if (darkStylesheet) darkStylesheet.disabled = !isDark;
}

function syncThemeButton(theme) {
  const button = document.getElementById('ctrlTheme');
  if (!button) return;

  const isDark = theme === 'dark';
  const label = button.querySelector('span');
  if (label) label.textContent = isDark ? '亮' : '暗';
  button.setAttribute('aria-label', isDark ? '切换为亮色模式' : '切换为暗色模式');
  button.setAttribute('aria-pressed', String(isDark));
}

function clearThemeReveal(reveal) {
  if (activeThemeReveal !== reveal) return;
  activeThemeReveal = null;
  root.classList.remove(REVEAL_CLASS);

  const button = document.getElementById('ctrlTheme');
  if (button) button.removeAttribute('aria-disabled');
}

function interruptThemeReveal(commitTheme) {
  const reveal = activeThemeReveal;
  if (!reveal) return;

  // View Transition 的照片撤掉后，底下必须已经是真实的最终主题。
  if (typeof commitTheme === 'function') {
    commitTheme();
    reveal.committed = true;
  } else if (!reveal.committed) {
    setTheme(reveal.targetTheme);
    reveal.committed = true;
  }

  try {
    reveal.transition?.skipTransition();
  } catch (error) {
    // transition 已结束或浏览器拒绝跳过时，清理临时状态即可。
  }
  clearThemeReveal(reveal);
}

function applyExternalTheme(theme) {
  if (activeThemeReveal) {
    interruptThemeReveal(() => applyTheme(theme));
    return;
  }
  applyTheme(theme);
}

function canRevealTheme() {
  return typeof document.startViewTransition === 'function' && !reducedMotionQuery?.matches;
}

function measureRevealOrigin(button) {
  const rect = button.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  // 圆是画在当前可视区域快照上的；浏览器缩放 / 视口偏移时必须按 visualViewport 换算。
  const visualViewport = window.visualViewport;
  const viewportWidth = visualViewport?.width || document.documentElement.clientWidth;
  const viewportHeight = visualViewport?.height || document.documentElement.clientHeight;
  if (!viewportWidth || !viewportHeight) return null;

  const viewportOffsetX = visualViewport?.offsetLeft || 0;
  const viewportOffsetY = visualViewport?.offsetTop || 0;
  const x = rect.left + rect.width / 2 - viewportOffsetX;
  const y = rect.top + rect.height / 2 - viewportOffsetY;
  const radius = Math.ceil(Math.hypot(
    Math.max(x, viewportWidth - x),
    Math.max(y, viewportHeight - y)
  )) + 2;
  const normalizedDiagonal = Math.hypot(viewportWidth, viewportHeight) / Math.SQRT2;

  return {
    centerXPercent: x / viewportWidth * 100,
    centerYPercent: y / viewportHeight * 100,
    radiusPercent: radius / normalizedDiagonal * 100
  };
}

export function getTheme() {
  return isTheme(root.dataset.theme) ? root.dataset.theme : systemTheme();
}

export function applyTheme(theme, { notify = true } = {}) {
  const resolvedTheme = isTheme(theme) ? theme : systemTheme();

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  syncHighlightTheme(resolvedTheme);

  const themeColor = document.getElementById('themeColorMeta');
  if (themeColor) themeColor.content = THEME_COLORS[resolvedTheme];
  syncThemeButton(resolvedTheme);

  if (notify) {
    window.dispatchEvent(new CustomEvent('wb:themechange', {
      detail: { theme: resolvedTheme }
    }));
  }

  return resolvedTheme;
}

export function setTheme(theme, { persist = true } = {}) {
  if (!isTheme(theme)) return getTheme();
  manualTheme = theme;
  if (persist) writeStoredTheme(theme);
  return applyTheme(theme);
}

function revealTheme() {
  const button = document.getElementById('ctrlTheme');
  if (!button || activeThemeReveal) return;

  const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
  const origin = measureRevealOrigin(button);
  if (!origin || !canRevealTheme()) {
    setTheme(nextTheme);
    return;
  }

  root.classList.add(REVEAL_CLASS);
  // 保持快照中的按钮外观不变；交互由 activeThemeReveal 锁定，ARIA 告知不可重复触发。
  button.setAttribute('aria-disabled', 'true');

  const reveal = { transition: null, targetTheme: nextTheme, committed: false };
  activeThemeReveal = reveal;

  try {
    const transition = document.startViewTransition(() => {
      if (!reveal.committed) {
        setTheme(reveal.targetTheme);
        reveal.committed = true;
      }
    });
    reveal.transition = transition;
    transition.ready.then(() => {
      if (activeThemeReveal !== reveal) return;
      reveal.animation = root.animate(
        {
          clipPath: [
            `circle(0% at ${origin.centerXPercent}% ${origin.centerYPercent}%)`,
            `circle(${origin.radiusPercent}% at ${origin.centerXPercent}% ${origin.centerYPercent}%)`
          ]
        },
        {
          duration: REVEAL_DURATION_MS,
          easing: REVEAL_EASING,
          fill: 'both',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    }).catch(() => {
      if (activeThemeReveal === reveal) interruptThemeReveal();
    });
    transition.finished.catch(() => {}).finally(() => clearThemeReveal(reveal));
  } catch (error) {
    clearThemeReveal(reveal);
    setTheme(nextTheme);
  }
}

function handleSystemThemeChange() {
  if (manualTheme === null) applyExternalTheme(systemTheme());
}

function handleStorage(event) {
  if (event.key !== STORAGE_KEY) return;
  if (event.newValue === null) {
    manualTheme = null;
    applyExternalTheme(systemTheme());
    return;
  }
  if (!isTheme(event.newValue)) return;
  manualTheme = event.newValue;
  applyExternalTheme(manualTheme);
}

function handleViewportChange() {
  // 尺寸变化会使原圆心 / 半径失效；撤照片，直接露出已提交的真实主题。
  interruptThemeReveal();
}

function handleReducedMotionChange(event) {
  if (event.matches) interruptThemeReveal();
}

const themeButton = document.getElementById('ctrlTheme');
if (themeButton) themeButton.addEventListener('click', revealTheme);

if (systemThemeQuery) {
  if (typeof systemThemeQuery.addEventListener === 'function') {
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);
  } else if (typeof systemThemeQuery.addListener === 'function') {
    systemThemeQuery.addListener(handleSystemThemeChange);
  }
}

if (reducedMotionQuery) {
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(handleReducedMotionChange);
  }
}

if (typeof window.addEventListener === 'function') {
  window.addEventListener('storage', handleStorage);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);
}

applyTheme(manualTheme || getTheme());
