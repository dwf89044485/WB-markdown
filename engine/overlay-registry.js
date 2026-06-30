// ============================================================
// OVERLAY REGISTRY — 覆层面板注册表
// ============================================================
// 各面板模块在初始化时自注册清理函数到注册表，所有需要清理覆层面板
// 的路径统一调 hideAllOverlays() 即可覆盖所有面板类型。
//
// 新增面板类型 → 在面板模块中 registerOverlayCleanup(hideXxx)
// 无需在 feature-panel.js / feature-jump.js / player.js 等处追加调用。
// ============================================================

const cleanupFns = [];

export function registerOverlayCleanup(fn) {
  if (typeof fn === 'function') {
    cleanupFns.push(fn);
  }
}

export function hideAllOverlays(immediate) {
  // immediate=true（默认）: 跳过出场动画，瞬间隐藏
  // immediate=false: 播出场动画再隐藏（用户主动关闭时使用）
  cleanupFns.forEach(fn => fn(immediate));
}
