// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// FEATURE ROUTER — URL 解析、构建、popstate 监听
// ============================================================
// URL 形态（spec 第五节）：
//   /                            → 默认进总览
//   /?view=overview              → 总览
//   /?view=feature&id=<id>       → 功能详解
//
// 暴露给外界的 API：
//   parseURL()           → { view: 'overview' | 'feature', id: string | null }
//   buildURL(view, id)   → 'string'（用于地址栏）
//   pushRoute(view, id)  → 推一条新历史 + 触发 onChange
//   onChange(callback)   → 注册监听器，popstate / pushRoute 时回调
// ============================================================

const listeners = new Set();

export function parseURL() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view') || 'overview';
  const id = params.get('id') || null;

  // 边界规则（spec 第五节 2）：未知 view 一律回退 overview
  if (view !== 'overview' && view !== 'feature') {
    return { view: 'overview', id: null };
  }
  // feature 必须带 id；缺 id 则回退 overview
  if (view === 'feature' && !id) {
    return { view: 'overview', id: null };
  }

  return { view, id };
}

export function buildURL(view, id) {
  if (view === 'overview') return '?view=overview';
  if (view === 'feature' && id) return `?view=feature&id=${encodeURIComponent(id)}`;
  return '?view=overview';
}

export function pushRoute(view, id) {
  const url = buildURL(view, id);
  window.history.pushState({ view, id }, '', url);
  notify();
}

export function onChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify() {
  const route = parseURL();
  listeners.forEach((cb) => {
    try { cb(route); } catch (err) { console.error('[feature-router]', err); }
  });
}

// 监听浏览器后退/前进
window.addEventListener('popstate', notify);
