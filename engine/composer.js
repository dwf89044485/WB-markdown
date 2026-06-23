// ============================================================
// COMPOSER — 输入框状态机 + 事件绑定
// ============================================================
// 职责：只做三件事 —— ① toggle .composer-shell 上的状态 class
//      ② 写 CSS 变量（--cp-height）③ 绑定事件监听。
// 不写 inline style（颜色/尺寸全归 styles/composer.css）。
//
// 状态 class（挂在 .composer-shell）：
//   is-expanded    展开 compact 态
//   is-fullscreen  全屏态
//   has-content    textarea 有文字（驱动发送/语音按钮切换）
//   has-expand-handle  lineCount>=4（展开手柄可见 → 可进全屏）
//   is-generating  播放引擎控制（本文件不碰）
//   is-fading-out  语音淡出（后续阶段，本文件预留不接）
//
// 交互逻辑核对自 _ref-chatbox/use-composer-core.ts：
//   activateComposerInput → setExpanded(true)            (:点击折叠态展开)
//   handleTextareaBlur    → 空且无附件 setExpanded(false) (:308 失焦自动收起)
//   hasComposerContent    → text.trim().length>0          (:附件功能本期未做)
//   showExpandHandle      → lineCount>=4                   (:472)
//   enterFullScreen       → expanded && lineCount>=4 && !voiceMode (:247-256)
//   lineCount             → textarea scrollHeight 推算     (:140-156)
//   compactHeightPx       → ResizeObserver 测 .cp-expanded (:53-61, min 72)
//   建议项点击用 pointerdown（防 blur 先触发收起）          (:186)
//
// 导出：initComposer / destroy / setComposerChip / setComposerText
// ============================================================

const $ = (sel, root = document) => root.querySelector(sel);

// ── 内部状态（DOM 是真相源，state 仅缓存计算值）────────────
const state = {
  expanded: false,
  fullScreen: false,
  hasContent: false,
  lineCount: 1,
  voiceMode: false,   // 后续阶段接入，本期恒 false
  recording: false,   // 后续阶段接入
  chip: null,         // { label, placeholder } 由 setComposerChip 注入
};

let els = {};
let resizeObserver = null;

// ── 计算与同步 ────────────────────────────────────────────

// textarea 自适应高度 + 行数计算：height:auto 撑到 scrollHeight（compact 态 CSS max 200），
// 返回行数 = scrollHeight / 行高(20)。让 textarea 真正撑高，.cp-expanded 才能被测到正确高度。
function autoGrowAndCount(textarea) {
  if (!textarea) return 1;
  const lh = 20;
  textarea.style.height = 'auto';
  const sh = textarea.scrollHeight;
  textarea.style.height = sh + 'px';
  return Math.max(1, Math.round(sh / lh));
}

// 同步 has-content：文字非空
function syncHasContent() {
  const ta = els.expandedTextarea;
  const has = !!(ta && ta.value.trim().length > 0);
  state.hasContent = has;
  els.shell.classList.toggle('has-content', has);
}

// 同步 lineCount → has-expand-handle（>=4 可见，可进全屏）；同时让 textarea 自适应高度
function syncLineCount() {
  const ta = els.expandedTextarea;
  if (!ta) return;
  state.lineCount = autoGrowAndCount(ta);
  els.shell.classList.toggle('has-expand-handle', state.lineCount >= 4);
}

// 测量 compact 态内容高度 → --cp-height（min 72）
// 用 scrollHeight：.cp-expanded 被 shell 的固定高度框住，getBoundingClientRect 会恒等于
// shell 高度形成死循环；scrollHeight 反映不受限的真实内容高度。
function measureHeight() {
  if (!state.expanded || state.fullScreen) return;
  const content = els.expanded;
  if (!content) return;
  const h = Math.max(72, Math.ceil(content.scrollHeight));
  els.shell.style.setProperty('--cp-height', h + 'px');
}

// ── 状态切换 ──────────────────────────────────────────────

function expand() {
  if (state.expanded) return;
  // 生成态（播放中）也允许展开：用户可在生成中输入内容，不打断后台生成。
  state.expanded = true;
  els.shell.classList.add('is-expanded');
  observeHeight();
  requestAnimationFrame(() => {
    measureHeight();
    if (els.expandedTextarea) els.expandedTextarea.focus();
  });
}

function collapse() {
  if (!state.expanded) return;
  state.expanded = false;
  state.fullScreen = false;
  els.shell.classList.remove('is-expanded', 'is-fullscreen');
  unobserveHeight();
}

function enterFullScreen() {
  if (!state.expanded || state.lineCount < 4 || state.voiceMode) return;
  state.fullScreen = true;
  els.shell.classList.add('is-fullscreen');
  // 同步文字到全屏 textarea
  if (els.fsTextarea && els.expandedTextarea) {
    els.fsTextarea.value = els.expandedTextarea.value;
  }
  requestAnimationFrame(() => { if (els.fsTextarea) els.fsTextarea.focus(); });
}

function exitFullScreen() {
  if (!state.fullScreen) return;
  state.fullScreen = false;
  els.shell.classList.remove('is-fullscreen');
  // 全屏文字同步回 compact
  if (els.fsTextarea && els.expandedTextarea) {
    els.expandedTextarea.value = els.fsTextarea.value;
    syncHasContent();
    syncLineCount();
  }
  requestAnimationFrame(() => {
    measureHeight();
    if (els.expandedTextarea) els.expandedTextarea.focus();
  });
}

// ── ResizeObserver 生命周期 ──────────────────────────────
function observeHeight() {
  if (resizeObserver || !els.expanded) return;
  resizeObserver = new ResizeObserver(measureHeight);
  resizeObserver.observe(els.expanded);
}
function unobserveHeight() {
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
}

// ── 事件绑定 ──────────────────────────────────────────────
function bindEvents() {
  // 折叠态点击左侧区域 → 展开
  const collapsedArea = $('.cp-collapsed', els.shell);
  if (collapsedArea) {
    collapsedArea.addEventListener('pointerdown', (e) => {
      // mic 按钮单独处理（后续接语音），本期点 mic 也先展开
      if (e.target.closest('.composer-stop-btn')) return; // 生成态停止按钮不展开
      expand();
    });
  }

  // compact textarea：输入时同步 content + lineCount + 高度
  const ta = els.expandedTextarea;
  if (ta) {
    ta.addEventListener('input', () => {
      syncHasContent();
      syncLineCount();
      measureHeight();
    });
    // 失焦自动收起（空且无附件）—— 用户已确认保留此交互
    ta.addEventListener('blur', () => {
      // 延一帧，避免点击工具栏按钮时先触发 blur 收起
      setTimeout(() => {
        if (state.fullScreen) return;
        if (!ta.value.trim()) collapse();
      }, 120);
    });
  }

  // 展开手柄 → 进全屏（pointerdown 防 blur 先收起）
  const handle = $('.cp-expand-handle', els.shell);
  if (handle) {
    handle.addEventListener('pointerdown', (e) => { e.preventDefault(); enterFullScreen(); });
  }

  // 全屏：缩小按钮 → 退出全屏
  const fsCollapse = $('.cp-fs-collapse', els.shell);
  if (fsCollapse) {
    fsCollapse.addEventListener('pointerdown', (e) => { e.preventDefault(); exitFullScreen(); });
  }

  // 全屏：清空
  const fsClear = $('.cp-fs-clear', els.shell);
  if (fsClear) {
    fsClear.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (els.fsTextarea) els.fsTextarea.value = '';
      if (els.expandedTextarea) els.expandedTextarea.value = '';
      syncHasContent();
    });
  }

  // 全屏 textarea 输入 → 同步 content
  if (els.fsTextarea) {
    els.fsTextarea.addEventListener('input', () => {
      if (els.expandedTextarea) els.expandedTextarea.value = els.fsTextarea.value;
      syncHasContent();
    });
  }
}

// ── 公共 API ──────────────────────────────────────────────

export function initComposer() {
  const shell = $('#composerShell');
  if (!shell) return;
  els = {
    shell,
    collapsed: $('.cp-collapsed', shell),
    expanded: $('.cp-expanded', shell),
    expandedTextarea: $('.cp-textarea', shell),
    fullscreen: $('.cp-fullscreen', shell),
    fsTextarea: $('.cp-fs-textarea', shell),
    chipMount: $('.cp-chip-mount', shell),
  };
  bindEvents();
}

export function destroy() {
  unobserveHeight();
  els = {};
}

// 注入 chip 标签（{ label, placeholder }）；传 null 清除
export function setComposerChip(chip) {
  state.chip = chip;
  if (!els.chipMount) return;
  if (!chip) { els.chipMount.innerHTML = ''; return; }
  els.chipMount.innerHTML = `
    <button class="cp-chip" type="button" tabindex="-1" aria-label="移除标签">
      <span class="cp-chip-label"><span class="cp-chip-text">${chip.label}</span></span>
      <svg class="cp-chip-close" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L9 9M9 1L1 9" stroke="#030303" stroke-width="1.5" stroke-linecap="round"/></svg>
    </button>`;
  const btn = $('.cp-chip', els.chipMount);
  if (btn) btn.addEventListener('pointerdown', (e) => { e.preventDefault(); setComposerChip(null); });
  if (chip.placeholder && els.expandedTextarea) {
    els.expandedTextarea.placeholder = chip.placeholder;
  }
  measureHeight();
}

// 设置 textarea 文字
export function setComposerText(text) {
  if (els.expandedTextarea) els.expandedTextarea.value = text || '';
  if (els.fsTextarea) els.fsTextarea.value = text || '';
  syncHasContent();
  syncLineCount();
  measureHeight();
}
