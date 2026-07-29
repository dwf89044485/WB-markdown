// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// 全站主题运行时：html[data-theme] 是唯一当前主题状态源。

const STORAGE_KEY = 'workbuddy.theme';
const THEMES = new Set(['light', 'dark']);
const THEME_COLORS = Object.freeze({ light: '#fafafa', dark: '#17181b' });
const root = document.documentElement;
const systemThemeQuery = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

let manualTheme = readStoredTheme();

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

function toggleTheme() {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark');
}

function handleSystemThemeChange() {
  if (manualTheme === null) applyTheme(systemTheme());
}

function handleStorage(event) {
  if (event.key !== STORAGE_KEY) return;
  if (event.newValue === null) {
    manualTheme = null;
    applyTheme(systemTheme());
    return;
  }
  if (!isTheme(event.newValue)) return;
  manualTheme = event.newValue;
  applyTheme(manualTheme);
}

const themeButton = document.getElementById('ctrlTheme');
if (themeButton) themeButton.addEventListener('click', toggleTheme);

if (systemThemeQuery) {
  if (typeof systemThemeQuery.addEventListener === 'function') {
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);
  } else if (typeof systemThemeQuery.addListener === 'function') {
    systemThemeQuery.addListener(handleSystemThemeChange);
  }
}

if (typeof window.addEventListener === 'function') {
  window.addEventListener('storage', handleStorage);
}

applyTheme(manualTheme || getTheme());
