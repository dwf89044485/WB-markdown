// ============================================================
// PLAYER UI — tool call style · panel controls · phone drawer
// ============================================================

import { setStatusLineLabels, statusStackHTML } from './icons.js';
import {
  scenario, $, state, panelRoots
} from './player-state.js';
import { collapseToStack } from './player-dom.js';

// ── Tool call style UI sync ───────────────────────────────
export function syncToolCallStyleUI() {
  const shell = document.querySelector('.phone-shell');
  if (!shell) return;
  shell.classList.toggle('tool-call-card', state.toolCallStyle === 'card');
  shell.classList.toggle('tool-call-flat', state.toolCallStyle === 'flat');
  shell.classList.toggle('tool-call-stack', state.toolCallStyle === 'stack');
  panelRoots().forEach(root => {
    const btnCard = root.querySelector('#ctrlToolCard');
    const btnFlat = root.querySelector('#ctrlToolFlat');
    const btnStack = root.querySelector('#ctrlToolStack');
    if (btnCard) btnCard.className = 'dc-seg-btn' + (state.toolCallStyle === 'card' ? ' is-active' : '');
    if (btnFlat) btnFlat.className = 'dc-seg-btn' + (state.toolCallStyle === 'flat' ? ' is-active' : '');
    if (btnStack) btnStack.className = 'dc-seg-btn' + (state.toolCallStyle === 'stack' ? ' is-active' : '');
  });
}

// ── Tool call style toggle ────────────────────────────────
export function toggleToolCallStyle(mode) {
  state.toolCallStyle = mode;
  syncToolCallStyleUI();

  // 重渲染所有已有 status line
  document.querySelectorAll('.step-detail-link[data-labels]').forEach(link => {
    let labels;
    try { labels = JSON.parse(link.dataset.labels || '[]'); } catch (_) { labels = []; }
    const isRunning = link.classList.contains('is-running');

    if (!isRunning && state.toolCallStyle === 'stack') {
      collapseToStack(link, labels);
    } else {
      setStatusLineLabels(link, labels);
      if (isRunning) link.classList.add('is-running');
    }
  });
}

// ── Panel controls binding（回调模式，避免循环依赖）───────
export function bindPanelControls(root, { onPrev, onNext, onAuto, onToolStyle, onReload } = {}) {
  const $r = (sel) => root.querySelector(sel);
  const speedSlider = $r('#ctrlSpeedSlider');
  const speedTrack = speedSlider ? speedSlider.closest('.dc-speed-track') : null;
  const prev = $r('#ctrlPrevStep');
  const auto = $r('#ctrlAutoStep');
  const next = $r('#ctrlNextStep');
  if (!speedSlider) return;

  const syncSpeed = () => {
    const value = Math.round(Number(speedSlider.value));
    const min = Number(speedSlider.min) || 0;
    const max = Number(speedSlider.max) || 100;
    const clamped = Math.min(max, Math.max(min, value));
    const percent = max === min ? 0 : ((clamped - min) / (max - min)) * 100;
    const trackWidth = speedTrack && speedTrack.offsetWidth > 0 ? speedTrack.offsetWidth : 200;
    const minPercent = Math.min(100, (23 / trackWidth) * 100);
    const visualPercent = Math.max(minPercent, percent);
    const progress = `${visualPercent}%`;
    let mappedValue;
    if (percent <= 60) {
      mappedValue = Math.round(5 + (percent / 60) * 195);
    } else {
      mappedValue = Math.round(200 + ((percent - 60) / 40) * 1300);
    }
    scenario.playback.tokensPerSecond = mappedValue;
    speedSlider.style.setProperty('--speed-progress', progress);
    if (speedTrack) speedTrack.style.setProperty('--speed-progress', progress);
    // 更新桌面只读显示
    const ro = document.getElementById('dcSpeedRoValue');
    if (ro) ro.textContent = mappedValue;
  };
  speedSlider.addEventListener('input', syncSpeed);

  if (prev && onPrev) prev.onclick = onPrev;
  if (next && onNext) next.onclick = onNext;
  if (auto && onAuto) auto.onclick = onAuto;

  const toolCard = $r('#ctrlToolCard');
  const toolFlat = $r('#ctrlToolFlat');
  const toolStack = $r('#ctrlToolStack');
  if (toolCard && onToolStyle) toolCard.onclick = () => onToolStyle('card');
  if (toolFlat && onToolStyle) toolFlat.onclick = () => onToolStyle('flat');
  if (toolStack && onToolStyle) toolStack.onclick = () => onToolStyle('stack');

  const tweakReload = $r('#ctrlTweakReload');
  if (tweakReload && onReload) tweakReload.onclick = onReload;
}

// ── 回调存储（供手机抽屉复用）─────────────────────────────
let _dcCallbacks = {};

// ── Demo controls setup（回调模式）─────────────────────────
export function setupDemoControls({ onPrev, onNext, onAuto, onReload, onStop, onToolStyle, onUpdateControls } = {}) {
  _dcCallbacks = { onPrev, onNext, onAuto, onReload, onStop, onToolStyle, onUpdateControls };
  bindPanelControls(document, { onPrev, onNext, onAuto, onToolStyle, onReload });

  // 初始滑杆位置设为 60%
  const initSlider = document.querySelector('#ctrlSpeedSlider');
  if (initSlider) {
    const imin = Number(initSlider.min) || 20;
    const imax = Number(initSlider.max) || 1000;
    initSlider.value = Math.round(imin + (imax - imin) * 0.6);
    initSlider.dispatchEvent(new Event('input', { bubbles: true }));
  }
  syncToolCallStyleUI();

  // Tweak reload button
  const tweakReload = document.getElementById('ctrlTweakReload');
  if (tweakReload && onReload) tweakReload.onclick = onReload;

  // 停止生成按钮
  const stopBtn = document.getElementById('composerStopBtn');
  if (stopBtn && onStop) stopBtn.addEventListener('click', onStop);

  // Phone drawer wiring
  const navCenter = document.querySelector('.nav-center');
  if (navCenter) {
    navCenter.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePhoneControls();
    });
  }

  // Swipe up to close (via document to avoid pointer-events: none issues)
  let swipeY = 0, startY = 0, swiping = false;
  document.addEventListener('touchstart', (e) => {
    const panel = document.getElementById('phoneControls');
    const pcPanel = panel?.querySelector('.pc-panel');
    if (!pcPanel || !panel.classList.contains('is-open')) return;
    if (!pcPanel.contains(e.target)) return;
    if (['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
    startY = e.touches[0].clientY;
    swiping = true;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const panel = document.getElementById('phoneControls');
    const pcPanel = panel?.querySelector('.pc-panel');
    if (!pcPanel) return;
    const delta = e.touches[0].clientY - startY;
    if (delta < 0) {
      e.preventDefault();
      swipeY = delta;
      pcPanel.style.transition = 'none';
      pcPanel.style.transform = `translateY(${delta}px)`;
    }
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (!swiping) return;
    swiping = false;
    const panel = document.getElementById('phoneControls');
    const pcPanel = panel?.querySelector('.pc-panel');
    if (!pcPanel) return;
    pcPanel.style.transition = '';
    if (swipeY < -60) {
      closePhoneControls();
    } else {
      pcPanel.style.transform = '';
    }
  });
}

// ── Phone drawer ──────────────────────────────────────────
function openPhoneControls() {
  const phonePanel = document.getElementById('phoneControls');
  const pcBody = document.getElementById('pcBody');
  const source = document.querySelector('.demo-controls');
  if (!phonePanel || !pcBody || !source) return;

  // Reset any inline transform left from previous swipe
  const pcPanel = phonePanel.querySelector('.pc-panel');
  if (pcPanel) {
    pcPanel.style.transform = '';
    pcPanel.style.transition = '';
  }

  pcBody.innerHTML = '';
  const dcMain = source.querySelector('.dc-main');
  if (dcMain) pcBody.appendChild(dcMain.cloneNode(true));

  // Sync speed slider value to phone clone before bindPanelControls,
  // so syncSpeed() reads the correct value on first call
  const srcSpeed = source.querySelector('#ctrlSpeedSlider');
  const phoneSpeed = phonePanel.querySelector('#ctrlSpeedSlider');
  if (srcSpeed && phoneSpeed) {
    phoneSpeed.value = srcSpeed.value;
  }

  // Re-bind on phone panel clone
  bindPanelControls(phonePanel, _dcCallbacks);

  // Also sync progress visual
  if (srcSpeed && phoneSpeed) {
    const progress = srcSpeed.style.getPropertyValue('--speed-progress');
    if (progress) {
      phoneSpeed.style.setProperty('--speed-progress', progress);
      const phoneTrack = phoneSpeed.closest('.dc-speed-track');
      if (phoneTrack) phoneTrack.style.setProperty('--speed-progress', progress);
    }
  }

  syncToolCallStyleUI();
  if (_dcCallbacks.onUpdateControls) _dcCallbacks.onUpdateControls();
  phonePanel.classList.add('is-open');

  // Click handle to close
  const handle = phonePanel.querySelector('.pc-handle');
  if (handle) {
    handle.onclick = (e) => {
      e.stopPropagation();
      closePhoneControls();
    };
  }
}

function closePhoneControls() {
  const phonePanel = document.getElementById('phoneControls');
  if (!phonePanel) return;
  const pcPanel = phonePanel.querySelector('.pc-panel');
  if (pcPanel) {
    pcPanel.style.transform = '';
    pcPanel.style.transition = '';
  }
  phonePanel.classList.remove('is-open');
  setTimeout(() => {
    const pcBody = document.getElementById('pcBody');
    if (pcBody) pcBody.innerHTML = '';
  }, 350);
}

export function togglePhoneControls() {
  const phonePanel = document.getElementById('phoneControls');
  if (!phonePanel) return;
  phonePanel.classList.contains('is-open') ? closePhoneControls() : openPhoneControls();
}

// ── Re-export for player.js bootstrap ─────────────────────
export { openPhoneControls, closePhoneControls };
