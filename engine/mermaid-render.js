// engine/mermaid-render.js
// 把代码块里的 ```mermaid 源码用 vendor/mermaid.min.js 渲染成 SVG
// 入口：监听 .wb-card-mermaid 卡片出现 → 渲染；同时 highlight.js 跳过它们
// 复用：showcase / 全屏 sheet 里的 mermaid 也走这条路径

let initialized = false;

function ensureInit() {
  if (initialized || !window.mermaid) return;
  try {
    window.mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
      fontFamily: 'Inter, "PingFang SC", -apple-system, sans-serif'
    });
    initialized = true;
  } catch (e) {
    console.warn('[mermaid-render] init failed', e);
  }
}

let renderSeq = 0;

async function renderOne(codeEl) {
  if (!window.mermaid || !codeEl) return;
  ensureInit();
  if (codeEl.dataset.mermaidRendered === '1') return;
  const src = codeEl.textContent;
  if (!src.trim()) return;

  // 标记跳过 highlight
  codeEl.dataset.highlighted = 'skip';
  codeEl.dataset.mermaidRendered = '1';
  // 把原始源码暂存，复制按钮用
  codeEl.dataset.mermaidSource = src;

  const id = `mermaid-${Date.now()}-${++renderSeq}`;
  try {
    const { svg } = await window.mermaid.render(id, src);
    // 替换 pre > code 为渲染好的 SVG
    const pre = codeEl.closest('pre');
    if (!pre) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'wb-mermaid-svg';
    wrapper.innerHTML = svg;
    // 把原始源码也保留一份隐藏的，用于复制
    const srcKeep = document.createElement('script');
    srcKeep.type = 'text/x-mermaid-source';
    srcKeep.textContent = src;
    wrapper.appendChild(srcKeep);
    pre.replaceWith(wrapper);

    // mermaid 卡片不折叠：把外层 .wb-card-body 的 collapsible 标记去掉
    const body = wrapper.closest('.wb-card-body');
    if (body) {
      body.classList.remove('is-collapsible', 'is-collapsed');
      const expandBtn = body.querySelector('.wb-card-expand');
      if (expandBtn) expandBtn.style.display = 'none';
    }
  } catch (e) {
    console.warn('[mermaid-render] render failed', e);
  }
}

function renderAllUnder(root) {
  if (!root) return;
  const codes = root.querySelectorAll('pre code.lang-mermaid');
  codes.forEach(renderOne);
}

// 初始：DOM 就绪后扫一次
function init() {
  ensureInit();
  renderAllUnder(document);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 增量：监听 #conv 内新增的 mermaid 代码块（typewriter 流式产出）
const conv = document.getElementById('conv');
if (conv && 'MutationObserver' in window) {
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        const codes = node.matches && node.matches('pre code.lang-mermaid')
          ? [node]
          : (node.querySelectorAll ? node.querySelectorAll('pre code.lang-mermaid') : []);
        if (!codes.length) return;
        // 等下一帧让 typewriter 把内容塞完再渲染
        requestAnimationFrame(() => requestAnimationFrame(() => {
          codes.forEach(renderOne);
        }));
      });
    }
  });
  mo.observe(conv, { childList: true, subtree: true });
}

// 暴露给 showcase / 全屏 sheet 在渲染完后手动触发
window.__wbRenderMermaid = (root) => renderAllUnder(root || document);
