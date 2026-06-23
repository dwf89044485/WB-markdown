/* === scroll-nav.js 架构注释 ===
 * initScrollNav / rebuildScrollNav 由 player.js import 调用。
 * 内含 isTblFullscreen 状态感知，全屏时禁用滚动按钮。
 */

// ============================================================
// SCROLL NAV — Quick-scroll buttons (↑ ↓) for turn-by-turn navigation
// ============================================================

const SN = {
  turns: [],           // [{ userMsg, agentMsg }]
  nav: null,           // #scrollNav
  upBtn: null,         // #scrollUp
  downBtn: null,       // #scrollDown
  conv: null,          // .conversation
  upState: { lastClickTime: 0, tooltipTimer: null, dblclickGraduated: false, rapidStreak: 0 },
  downState: { lastClickTime: 0, tooltipTimer: null, dblclickGraduated: false, rapidStreak: 0 },
  scrollTicking: false,
  isTblFullscreen: false,
  isComposerActive: false,
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

function syncVisibility(scrollTop, skipEntrance) {
  // skipEntrance: 预判模式下不触发入场动画（按钮已经显示了就不需要再生效一次）
  const t = SN.turns;
  const len = t.length;
  if (len < 1) {
    SN.nav.classList.add('is-hidden');
    return;
  }

  // 显隐判断基于滚动容器的位置
  const scrollBottom = scrollTop + SN.conv.clientHeight;
  const scrollHeight = SN.conv.scrollHeight;

  const showUp = scrollTop > 5;
  const showDown = scrollBottom < scrollHeight - 5;

  const prevUpHidden = SN.upBtn.classList.contains('is-hidden');
  const prevDownHidden = SN.downBtn.classList.contains('is-hidden');

  // 切换显隐
  SN.upBtn.classList.toggle('is-hidden', !showUp);
  SN.downBtn.classList.toggle('is-hidden', !showDown);

  SN.nav.classList.toggle('is-hidden', !showUp && !showDown);

  // 入场动画——从隐藏变显示时
  if (showUp && prevUpHidden && !skipEntrance) {
    SN.upBtn.classList.add('is-appearing');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SN.upBtn.classList.remove('is-appearing');
      });
    });
  }
  if (showDown && prevDownHidden && !skipEntrance) {
    SN.downBtn.classList.add('is-appearing');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        SN.downBtn.classList.remove('is-appearing');
      });
    });
  }
}

function updateScrollNav() {
  // 表格全屏 或 输入框激活/全屏态 时禁用滚动按钮
  if (SN.isTblFullscreen || SN.isComposerActive) {
    SN.nav.classList.add('is-hidden');
    return;
  }
  syncVisibility(SN.conv.scrollTop);
}

// ── Scroll helpers ────────────────────────────────────────

/** nav-bar 覆盖在 conversation 顶部的高度 + 额外间距，确保用户消息不被 nav-bar 遮住 */
function navBarOverlap() {
  const bar = document.querySelector('.nav-bar');
  const conv = document.querySelector('.conversation');
  if (!bar || !conv) return 0;
  const barRect = bar.getBoundingClientRect();
  const convRect = conv.getBoundingClientRect();
  const extra = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--scroll-nav-overlap-extra')) || 40;
  return Math.max(0, barRect.bottom - convRect.top) + extra;
}

function smoothScrollTo(y) {
  // 预判目标位置的按钮状态——提前瞬间到位，不播放入场动画，
  // 这样滚动结束时按钮已经完全可见
  const targetBottom = y + SN.conv.clientHeight;
  const scrollHeight = SN.conv.scrollHeight;
  const willShowUp = y > 5;
  const willShowDown = targetBottom < scrollHeight - 5;

  const prevUpHidden = SN.upBtn.classList.contains('is-hidden');
  const prevDownHidden = SN.downBtn.classList.contains('is-hidden');

  if (willShowUp && prevUpHidden) {
    SN.upBtn.classList.remove('is-hidden');
    // 无入场动画：按钮直接完全可见
  }
  if (willShowDown && prevDownHidden) {
    SN.downBtn.classList.remove('is-hidden');
    // 无入场动画
  }
  // 需要消失的按钮瞬间隐藏
  if (!willShowUp && !prevUpHidden) {
    SN.upBtn.classList.add('is-hidden');
  }
  if (!willShowDown && !prevDownHidden) {
    SN.downBtn.classList.add('is-hidden');
  }
  SN.nav.classList.remove('is-hidden');

  // 标记用户主动滚动中，阻止流式输出的 scrollToBottom 打断
  document.body.dataset.snNavigating = 'true';
  // 清除上一次的追踪（防多次快速点击冲突）
  if (SN._clearNavTimer) clearTimeout(SN._clearNavTimer);
  if (SN._clearNavFn) SN.conv.removeEventListener('scrollend', SN._clearNavFn);

  if ('scrollBehavior' in document.documentElement.style) {
    SN.conv.scrollTo({ top: y, behavior: 'smooth' });
  } else {
    SN.conv.scrollTop = y;
  }

  // 清除标记：scrollend 事件或超时兜底（500ms）
  SN._clearNavFn = () => { document.body.dataset.snNavigating = 'false'; SN._clearNavFn = null; };
  SN.conv.addEventListener('scrollend', SN._clearNavFn, { once: true });
  SN._clearNavTimer = setTimeout(() => {
    if (SN._clearNavFn) {
      SN.conv.removeEventListener('scrollend', SN._clearNavFn);
      SN._clearNavFn();
    }
  }, 500);
}

function scrollToUserMsg(index) {
  if (index < 0 || index >= SN.turns.length) return;
  const top = Math.max(0, SN.turns[index].userMsg.offsetTop - navBarOverlap());
  smoothScrollTo(top);
}

function scrollToTopTurn() {
  if (!SN.turns.length) return;
  smoothScrollTo(0);
}

function scrollToBottomTurn() {
  if (!SN.turns.length) return;
  const idx = SN.turns.length - 1;
  const top = Math.max(0, SN.turns[idx].userMsg.offsetTop - navBarOverlap());
  smoothScrollTo(top);
}

// ── Click logic (single & double) ─────────────────────────

function handleUpClick() {
  if (SN.turns.length < 1) return;
  const now = performance.now();
  const state = SN.upState;
  const elapsed = now - state.lastClickTime;
  state.lastClickTime = now;

  // 连续快速点击追踪：间隔 >500ms 说明在阅读，重置计数
  if (elapsed > 500) {
    state.rapidStreak = 0;
  }
  state.rapidStreak++;

  if (elapsed <= 300) {
    // 双击 — 跳顶
    if (state.tooltipTimer) { clearTimeout(state.tooltipTimer); state.tooltipTimer = null; }
    removeTooltip(SN.upBtn);
    scrollToTopTurn();
    // 首次双击：提示并毕业；后续双击：静默
    if (!state.dblclickGraduated) {
      state.dblclickGraduated = true;
      showTooltip(SN.upBtn, '双击 ↑ 可跳转对话顶部');
    }
    return;
  }

  // 单击 — 正常翻页
  doSingleUp();

  // 连续快速点击 ≥3 次（无阅读停顿）且未毕业双击 → 提示用户双击存在
  if (state.rapidStreak >= 3 && !state.dblclickGraduated) {
    removeTooltip(SN.upBtn);
    if (state.tooltipTimer) clearTimeout(state.tooltipTimer);
    state.tooltipTimer = setTimeout(() => {
      if (!SN.upBtn.classList.contains('is-hidden')) {
        showTooltip(SN.upBtn, '双击 ↑ 可跳转对话顶部');
      }
      state.tooltipTimer = null;
    }, 100);
  }
}

function handleDownClick() {
  if (SN.turns.length < 1) return;
  const now = performance.now();
  const state = SN.downState;
  const elapsed = now - state.lastClickTime;
  state.lastClickTime = now;

  // 连续快速点击追踪：间隔 >500ms 说明在阅读，重置计数
  if (elapsed > 500) {
    state.rapidStreak = 0;
  }
  state.rapidStreak++;

  if (elapsed <= 300) {
    // 双击 — 跳底
    if (state.tooltipTimer) { clearTimeout(state.tooltipTimer); state.tooltipTimer = null; }
    removeTooltip(SN.downBtn);
    scrollToBottomTurn();
    // 首次双击：提示并毕业；后续双击：静默
    if (!state.dblclickGraduated) {
      state.dblclickGraduated = true;
      showTooltip(SN.downBtn, '双击 ↓ 可跳转对话底部');
    }
    return;
  }

  // 单击 — 正常翻页
  doSingleDown();

  // 连续快速点击 ≥3 次（无阅读停顿）且未毕业双击 → 提示用户双击存在
  if (state.rapidStreak >= 3 && !state.dblclickGraduated) {
    removeTooltip(SN.downBtn);
    if (state.tooltipTimer) clearTimeout(state.tooltipTimer);
    state.tooltipTimer = setTimeout(() => {
      if (!SN.downBtn.classList.contains('is-hidden')) {
        showTooltip(SN.downBtn, '双击 ↓ 可跳转对话底部');
      }
      state.tooltipTimer = null;
    }, 100);
  }
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
    smoothScrollTo(SN.conv.scrollHeight);
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

// 输入框激活/全屏态时禁用滚动按钮（与表格全屏同机制）
function watchComposerActive() {
  const shell = document.getElementById('composerShell');
  if (!shell) return;
  const sync = () => {
    SN.isComposerActive = shell.classList.contains('is-expanded') || shell.classList.contains('is-fullscreen');
    updateScrollNav();
  };
  const obs = new MutationObserver(sync);
  obs.observe(shell, { attributes: true, attributeFilter: ['class'] });
  sync();
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
  SN.upState = { lastClickTime: 0, tooltipTimer: null, dblclickGraduated: false, rapidStreak: 0 };
  SN.downState = { lastClickTime: 0, tooltipTimer: null, dblclickGraduated: false, rapidStreak: 0 };
  SN.isTblFullscreen = false;
  SN.nav.classList.remove('is-hidden');
  SN.upBtn.classList.remove('is-hidden', 'is-appearing');
  SN.downBtn.classList.remove('is-hidden', 'is-appearing');

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
  // Watch composer 激活/全屏态
  watchComposerActive();

  // Initial sync
  updateScrollNav();
}
