// engine/code-collapse.js
// 代码块过长折叠：渲染后探测 pre.scrollHeight > 280 → 保留折叠态；否则去掉折叠 class 显示完整内容
// 「查看全部」按钮的点击拉起二级 sheet，由 code-fullscreen-sheet.js 接管

const COLLAPSE_THRESHOLD = 280; // px，约屏幕 1/3

function evaluateCollapse(body) {
  if (!body || !body.classList.contains('is-collapsible')) return;
  const pre = body.querySelector('pre');
  if (!pre) return;
  // 临时撤销 max-height 测真实高度
  const wasCollapsed = body.classList.contains('is-collapsed');
  body.classList.remove('is-collapsed');
  const realH = pre.scrollHeight;
  if (realH <= COLLAPSE_THRESHOLD) {
    // 没超长 → 去掉 collapsible，按钮也藏掉
    body.classList.remove('is-collapsible');
    const btn = body.querySelector('.wb-card-expand');
    if (btn) btn.style.display = 'none';
    return;
  }
  // 超长 → 恢复初始折叠态
  if (wasCollapsed) body.classList.add('is-collapsed');
  else body.classList.add('is-collapsed');
}

// 评估页面上所有未处理的代码块卡片
function evaluateAll() {
  document.querySelectorAll('.wb-card-body.is-collapsible').forEach(evaluateCollapse);
}

// 点击切换 — 已移除，由 code-fullscreen-sheet.js 的 capture 监听接管

// 初始：DOM 就绪后扫一次
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', evaluateAll);
} else {
  evaluateAll();
}

// 增量：MutationObserver 监听 #conv 内新增的代码块卡片（剧本 typewriter 流式产出）
const conv = document.getElementById('conv');
if (conv && 'MutationObserver' in window) {
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        // 自身或子树里新增的 .wb-card-body.is-collapsible
        const bodies = node.matches && node.matches('.wb-card-body.is-collapsible')
          ? [node]
          : (node.querySelectorAll ? node.querySelectorAll('.wb-card-body.is-collapsible') : []);
        bodies.forEach(b => {
          // 等下一帧让 typewriter 把内容全部塞完再测
          requestAnimationFrame(() => requestAnimationFrame(() => evaluateCollapse(b)));
        });
      });
    }
  });
  mo.observe(conv, { childList: true, subtree: true });
}

// 暴露给 showcase / 全屏 sheet 在渲染完后手动触发
window.__wbEvalCodeCollapse = evaluateAll;