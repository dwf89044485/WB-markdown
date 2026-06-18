// ── Demo Control Button 辅助函数 ─────────────────────────
// 统一生成控制左侧 Demo 状态的按钮 HTML。
//
// 用法：
//   demoBtn('查看单选',     { anchor: 'single-appear' })   // 锚点跳转
//   demoBtn('查看运行态',   { action: 'running-state' })   // 自定义动作
//   demoBtn('询问用户',     { action: 'ask-user',    icon: iconSvg })  // 带图标
//
// 输出：
//   <button class="dc-btn" data-action="running-state">
//     查看运行态<svg ...>→</svg>
//   </button>
//
// 带图标的按钮，图标在前，不打右箭头：
//   <button class="dc-btn" data-action="ask-user">
//     <svg ...>?</svg>询问用户
//   </button>
// ────────────────────────────────────────────────────────

export const DC_ARROW_SVG =
  '<svg width="12" height="12" viewBox="0 0 16 16" fill="none">'
  + '<path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" '
  + 'stroke-linecap="round" stroke-linejoin="round"/>'
  + '</svg>';

export function demoBtn(label, options = {}) {
  const { anchor, action, icon, extraAttrs } = options;
  const behavior = anchor
    ? `data-anchor="${anchor}"`
    : action
      ? `data-action="${action}"`
      : '';
  const extras = extraAttrs || '';
  const arrowHtml = icon ? '' : DC_ARROW_SVG;

  return `<button class="dc-btn" ${behavior} ${extras}>`
    + `${icon || ''}${label}${arrowHtml}`
    + `</button>`;
}
