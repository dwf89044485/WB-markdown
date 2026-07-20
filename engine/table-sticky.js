// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// engine/table-sticky.js
// 工具卡片吸顶：所有 .tbl-outer (.wb-card) 容器在滚到视口上方时
//   - 表格 → toolbar + thead 两行吸顶
//   - 代码块/HTML/JSON/Mermaid → toolbar 一行吸顶
// 落点：navbar 80% 高度位置（让 ghost 圆角自然盖住 navbar 底部渐变）

const conv = document.getElementById('conv');
const navBar = document.querySelector('.nav-bar');
if (!conv) { console.warn('[table-sticky] #conv 不存在'); }

let activeSticky = null; // { card, ghost, scrollHandler, hasThead }

function getStickyTop() {
  if (!navBar) return 0;
  const rect = navBar.getBoundingClientRect();
  return rect.top + rect.height * 0.8;
}

// 探测卡片是否含表格（决定是否克隆 thead）
function getThead(card) {
  return card.querySelector('.tbl thead');
}

function createStickyGhost(card) {
  const toolbar = card.querySelector('.tbl-toolbar');
  if (!toolbar) return null;

  const ghost = document.createElement('div');
  ghost.className = 'md tbl-sticky-ghost';

  const inner = document.createElement('div');
  inner.className = 'tbl-outer tbl-sticky-inner';

  // 克隆 toolbar
  const toolbarClone = toolbar.cloneNode(true);
  inner.appendChild(toolbarClone);

  // 表格类卡片 → 额外克隆 thead 行
  const thead = getThead(card);
  if (thead) {
    const wrapClone = document.createElement('div');
    wrapClone.className = 'tbl-wrap tbl-sticky-thead-wrap';
    const tableClone = document.createElement('table');
    tableClone.className = 'tbl';
    const theadClone = thead.cloneNode(true);
    tableClone.appendChild(theadClone);
    wrapClone.appendChild(tableClone);
    inner.appendChild(wrapClone);
  }

  ghost.appendChild(inner);

  // 把 ghost 内按钮的点击转发到原始卡片对应位置的按钮
  // —— ghost 是只读副本，自身不应承担行为；同时点全屏后我们要销毁 ghost
  const originBtns = toolbar.querySelectorAll('.tbl-btn, .wb-card-btn-primary');
  const ghostBtns = toolbarClone.querySelectorAll('.tbl-btn, .wb-card-btn-primary');
  ghostBtns.forEach((gb, i) => {
    gb.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 全屏按钮：先销毁 ghost，再触发原按钮（避免 ghost 覆盖在全屏 overlay 上）
      const isMaximize = gb.classList.contains('tbl-maximize');
      if (isMaximize) destroySticky();
      const target = originBtns[i];
      if (target) target.click();
    });
  });

  return ghost;
}

function syncColWidths(card, ghost) {
  const origThs = card.querySelectorAll('.tbl thead th');
  const cloneThs = ghost.querySelectorAll('.tbl-sticky-thead-wrap th');
  if (!origThs.length || origThs.length !== cloneThs.length) return;
  for (let i = 0; i < origThs.length; i++) {
    const w = origThs[i].getBoundingClientRect().width;
    cloneThs[i].style.width = w + 'px';
    cloneThs[i].style.minWidth = w + 'px';
  }
}

function syncScrollLeft(card, ghost) {
  const origWrap = card.querySelector('.tbl-wrap');
  const theadWrap = ghost.querySelector('.tbl-sticky-thead-wrap');
  if (origWrap && theadWrap) {
    theadWrap.scrollLeft = origWrap.scrollLeft;
  }
}

function updateStickyPosition() {
  if (!activeSticky) return;
  const { card, ghost } = activeSticky;

  const stickyTop = getStickyTop();
  const cardRect = card.getBoundingClientRect();

  // 卡片顶部还在 stickyTop 以下 → 隐藏
  if (cardRect.top >= stickyTop) {
    ghost.classList.remove('is-visible');
    return;
  }

  // 卡片底部快到 stickyTop → 隐藏（push out）
  const ghostH = ghost.offsetHeight || 50;
  if (cardRect.bottom <= stickyTop + ghostH) {
    ghost.classList.remove('is-visible');
    return;
  }

  // 显示吸顶
  ghost.classList.add('is-visible');
  ghost.style.top = stickyTop + 'px';
  ghost.style.left = cardRect.left + 'px';
  ghost.style.width = cardRect.width + 'px';

  if (activeSticky.hasThead) {
    syncColWidths(card, ghost);
    syncScrollLeft(card, ghost);
  }
}

function destroySticky() {
  if (!activeSticky) return;
  const { ghost, scrollHandler, card } = activeSticky;
  ghost.remove();
  const origWrap = card.querySelector('.tbl-wrap');
  if (origWrap && scrollHandler) {
    origWrap.removeEventListener('scroll', scrollHandler);
  }
  activeSticky = null;
}

function onScroll() {
  const stickyTop = getStickyTop();

  if (!activeSticky) {
    const cards = conv.querySelectorAll('.tbl-outer');
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      if (rect.top < stickyTop && rect.bottom > stickyTop + 40) {
        const ghost = createStickyGhost(card);
        if (!ghost) continue;
        document.body.appendChild(ghost);

        const hasThead = !!getThead(card);
        const scrollHandler = () => {
          if (activeSticky && activeSticky.card === card && activeSticky.hasThead) {
            syncScrollLeft(card, ghost);
          }
        };
        if (hasThead) {
          const origWrap = card.querySelector('.tbl-wrap');
          if (origWrap) origWrap.addEventListener('scroll', scrollHandler, { passive: true });
        }

        activeSticky = { card, ghost, scrollHandler, hasThead };
        break;
      }
    }
  }

  if (activeSticky) {
    const { card } = activeSticky;
    const rect = card.getBoundingClientRect();

    if (rect.bottom <= stickyTop || rect.top >= stickyTop) {
      destroySticky();
      onScroll();
      return;
    }

    updateStickyPosition();
  }
}

if (conv) {
  conv.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (activeSticky) updateStickyPosition();
  });
  // 任何「全屏」按钮被点（包括其他卡片的原生按钮）→ 先销毁当前 ghost
  // 避免：A 卡片处于吸顶状态时点 B 卡片全屏，A 的 ghost 残留在 overlay 上方
  // 用 capture 阶段保证在全屏脚本之前执行
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tbl-btn.tbl-maximize')) destroySticky();
  }, true);
}
