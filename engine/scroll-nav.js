// ============================================================
// SCROLL NAV — Quick-scroll buttons (↑ ↓) for turn-by-turn navigation
// ============================================================

const SN = {
  turns: [],           // [{ userMsg, agentMsg }]
  nav: null,           // #scrollNav
  upBtn: null,         // #scrollUp
  downBtn: null,       // #scrollDown
  conv: null,          // .conversation
  upState: { lastClickTime: 0, showTooltip: false, tooltipTimer: null },
  downState: { lastClickTime: 0, showTooltip: false, tooltipTimer: null },
  scrollTicking: false,
  isTblFullscreen: false,
};

// ── Turn index ────────────────────────────────────────────

function rebuildTurns() {
  const userMsgs = document.querySelectorAll('.user-msg-wrap:not(.is-hidden)');
  const agentMsgs = document.querySelectorAll('.agent-msg:not(.is-hidden)');
  SN.turns = [];
  // 配对：第 N 个 user-msg 与第 N 个 agent-msg 组成一轮
  const count = Math.min(userMsgs.length, agentMsgs.length);
  for (let i = 0; i < count; i++) {
    SN.turns.push({ userMsg: userMsgs[i], agentMsg: agentMsgs[i] });
  }
}

function getCurrentTurnIndex() {
  if (!SN.turns.length) return -1;
  const scrollTop = SN.conv.scrollTop;
  for (let i = 0; i < SN.turns.length; i++) {
    if (SN.turns[i].userMsg.offsetTop >= scrollTop - 1) return i;
  }
  return SN.turns.length - 1;
}

// ── Visibility ────────────────────────────────────────────

function updateScrollNav() {
  if (SN.isTblFullscreen) {
    SN.nav.classList.add('is-hidden');
    return;
  }

  const t = SN.turns;
  const len = t.length;
  if (len < 1) {
    SN.nav.classList.add('is-hidden');
    return;
  }

  // 显隐判断基于滚动容器的位置，而非轮次索引
  // ↑ 可见：不在最顶部（5px 容差）
  // ↓ 可见：不在最底部（5px 容差）
  const scrollTop = SN.conv.scrollTop;
  const scrollBottom = scrollTop + SN.conv.clientHeight;
  const scrollHeight = SN.conv.scrollHeight;

  const showUp = scrollTop > 5;
  const showDown = scrollBottom < scrollHeight - 5;

  const prevUpHidden = SN.upBtn.classList.contains('is-hidden');
  const prevDownHidden = SN.downBtn.classList.contains('is-hidden');
  const prevHasTwo = SN.nav.classList.contains('has-two');

  // 切换显隐
  SN.upBtn.classList.toggle('is-hidden', !showUp);
  SN.downBtn.classList.toggle('is-hidden', !showDown);

  // 状态不变时无动画
  const nowHasTwo = showUp && showDown;

  if (nowHasTwo !== prevHasTwo) {
    // 从 1→2 或 2→1，触发布局变化过渡
    SN.nav.classList.toggle('has-two', nowHasTwo);
  } else {
    SN.nav.classList.toggle('has-two', nowHasTwo);
  }

  // 入场动画：从隐藏变显示时
  if (showUp && prevUpHidden) {
    SN.upBtn.classList.add('is-entering');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SN.upBtn.classList.remove('is-entering');
      });
    });
  }
  if (showDown && prevDownHidden) {
    SN.downBtn.classList.add('is-entering');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SN.downBtn.classList.remove('is-entering');
      });
    });
  }

  // 整个 nav 容器在无按钮时隐藏
  SN.nav.classList.toggle('is-hidden', !showUp && !showDown);
}

// ── Scroll helpers ────────────────────────────────────────

function scrollToUserMsg(index) {
  if (index < 0 || index >= SN.turns.length) return;
  const top = SN.turns[index].userMsg.offsetTop;
  SN.conv.scrollTop = top;
}

function scrollToTopTurn() {
  if (!SN.turns.length) return;
  const top = SN.turns[0].userMsg.offsetTop;
  SN.conv.scrollTop = top;
}

function scrollToBottomTurn() {
  if (!SN.turns.length) return;
  const idx = SN.turns.length - 1;
  const top = SN.turns[idx].userMsg.offsetTop;
  SN.conv.scrollTop = top;
}

// ── Click logic (single & double) ─────────────────────────

function handleUpClick() {
  if (SN.turns.length < 1) return;
  const now = performance.now();
  const state = SN.upState;
  const elapsed = now - state.lastClickTime;
  state.lastClickTime = now;

  if (elapsed <= 300) {
    // 双击 — 跳顶
    state.showTooltip = false;
    if (state.tooltipTimer) { clearTimeout(state.tooltipTimer); state.tooltipTimer = null; }
    scrollToTopTurn();
    removeTooltip(SN.upBtn);
    return;
  }

  if (elapsed > 700) {
    // 独立单击 — 正常翻页
    state.showTooltip = false;
    doSingleUp();
    return;
  }

  // 300 < elapsed <= 700：学习窗 — 单击 + 延迟弹提示
  doSingleUp();
  state.showTooltip = true;
  removeTooltip(SN.upBtn);

  if (state.tooltipTimer) clearTimeout(state.tooltipTimer);
  state.tooltipTimer = setTimeout(() => {
    if (state.showTooltip && !SN.upBtn.classList.contains('is-hidden')) {
      showTooltip(SN.upBtn, '双击 ↑ 可跳转对话顶部');
    }
    state.showTooltip = false;
    state.tooltipTimer = null;
  }, 700 - elapsed);
}

function handleDownClick() {
  if (SN.turns.length < 1) return;
  const now = performance.now();
  const state = SN.downState;
  const elapsed = now - state.lastClickTime;
  state.lastClickTime = now;

  if (elapsed <= 300) {
    // 双击 — 跳底
    state.showTooltip = false;
    if (state.tooltipTimer) { clearTimeout(state.tooltipTimer); state.tooltipTimer = null; }
    scrollToBottomTurn();
    removeTooltip(SN.downBtn);
    return;
  }

  if (elapsed > 700) {
    // 独立单击
    state.showTooltip = false;
    doSingleDown();
    return;
  }

  // 学习窗
  doSingleDown();
  state.showTooltip = true;
  removeTooltip(SN.downBtn);

  if (state.tooltipTimer) clearTimeout(state.tooltipTimer);
  state.tooltipTimer = setTimeout(() => {
    if (state.showTooltip && !SN.downBtn.classList.contains('is-hidden')) {
      showTooltip(SN.downBtn, '双击 ↓ 可跳转对话底部');
    }
    state.showTooltip = false;
    state.tooltipTimer = null;
  }, 700 - elapsed);
}

function doSingleUp() {
  const idx = getCurrentTurnIndex();
  if (idx < 0) return;

  // 判断上一轮 agent-msg 是否在可视区内
  let prevAgentInView = false;
  if (idx > 0) {
    const agentEl = SN.turns[idx].agentMsg;
    const agentRect = agentEl.getBoundingClientRect();
    const convRect = SN.conv.getBoundingClientRect();
    prevAgentInView = agentRect.top < convRect.bottom && agentRect.bottom > convRect.top;
  }

  const target = prevAgentInView ? idx - 1 : idx;
  if (target >= 0) scrollToUserMsg(target);
}

function doSingleDown() {
  const idx = getCurrentTurnIndex();
  if (idx < 0) return;
  if (idx < SN.turns.length - 1) {
    scrollToUserMsg(idx + 1);
  } else {
    // 已是最后一轮 → 直接滚到底
    SN.conv.scrollTop = SN.conv.scrollHeight;
  }
}

// ── Tooltip ───────────────────────────────────────────────

function showTooltip(btn, text) {
  removeTooltip(btn);
  const tip = document.createElement('div');
  tip.className = 'sn-tooltip';
  tip.textContent = text;
  btn.appendChild(tip);
  // 2.5s 后自动消失
  setTimeout(() => {
    // 如果仍然存在才开始消失动画
    if (tip.parentNode) {
      tip.classList.add('is-leaving');
      setTimeout(() => { if (tip.parentNode) tip.remove(); }, 200);
    }
  }, 2500);
}

function removeTooltip(btn) {
  const existing = btn.querySelector('.sn-tooltip');
  if (existing) {
    existing.remove();
  }
}

// ── Table fullscreen watch ────────────────────────────────

function watchTableFullscreen() {
  const overlay = document.getElementById('tblOverlay');
  if (!overlay) return;
  const obs = new MutationObserver(() => {
    SN.isTblFullscreen = overlay.classList.contains('is-active');
    updateScrollNav();
  });
  obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
}

// ── Public init ───────────────────────────────────────────

export function rebuildScrollNav() {
  rebuildTurns();
  updateScrollNav();
}

export function initScrollNav() {
  SN.nav = document.getElementById('scrollNav');
  SN.upBtn = document.getElementById('scrollUp');
  SN.downBtn = document.getElementById('scrollDown');
  SN.conv = document.querySelector('.conversation');

  if (!SN.nav || !SN.upBtn || !SN.downBtn || !SN.conv) return;

  // Reset state
  SN.upState = { lastClickTime: 0, showTooltip: false, tooltipTimer: null };
  SN.downState = { lastClickTime: 0, showTooltip: false, tooltipTimer: null };
  SN.isTblFullscreen = false;
  SN.nav.classList.remove('has-two', 'is-hidden');
  SN.upBtn.classList.remove('is-hidden', 'is-entering');
  SN.downBtn.classList.remove('is-hidden', 'is-entering');

  // Remove old scroll listener if re-initializing
  if (SN._onScroll) {
    SN.conv.removeEventListener('scroll', SN._onScroll);
    SN._onScroll = null;
  }

  rebuildTurns();

  // Bind click
  SN.upBtn.onclick = handleUpClick;
  SN.downBtn.onclick = handleDownClick;

  // Bind scroll (throttled)
  const onScroll = () => {
    if (!SN.scrollTicking) {
      SN.scrollTicking = true;
      requestAnimationFrame(() => {
        updateScrollNav();
        SN.scrollTicking = false;
      });
    }
  };
  SN.conv.addEventListener('scroll', onScroll);
  SN._onScroll = onScroll;

  // Watch table fullscreen
  watchTableFullscreen();

  // Initial sync
  updateScrollNav();
}
