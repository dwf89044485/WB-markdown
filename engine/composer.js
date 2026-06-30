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
// 导出：initComposer / destroy / setComposerChip / setComposerMoreButtonState / setComposerText
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

// textarea 自适应高度 + 行数计算：height:auto 撑到 scrollHeight，但夹在 compact 态上限 200 内
// （超过 200 后 textarea 内部滚动）。返回行数 = scrollHeight / 行高(20)。
const COMPACT_TEXTAREA_MAX = 200;
function autoGrowAndCount(textarea) {
  if (!textarea) return 1;
  const lh = 20;
  textarea.style.height = 'auto';
  const sh = textarea.scrollHeight;
  textarea.style.height = Math.min(sh, COMPACT_TEXTAREA_MAX) + 'px';
  return Math.max(1, Math.round(sh / lh));
}

// 同步 has-content：文字非空
function syncHasContent() {
  const ta = els.textarea;
  const has = !!(ta && ta.value.trim().length > 0);
  state.hasContent = has;
  els.shell.classList.toggle('has-content', has);
}

// 同步 lineCount → has-expand-handle（>=4 可见，可进全屏）；同时让 textarea 自适应高度
function syncLineCount() {
  const ta = els.textarea;
  if (!ta) return;
  state.lineCount = autoGrowAndCount(ta);
  els.shell.classList.toggle('has-expand-handle', state.lineCount >= 4);
}

function syncMoreButtonState() {
  const btn = els.moreBtn;
  if (!btn) return;

  // data-model-icon 存路径如 "./icons/more.svg"，取文件名作为 icons-inline.js 的 key
  const raw = (btn.dataset.modelIcon || '').trim() || './icons/more.svg';
  const key = raw.split('/').pop();

  const ICONS = window.WORKBUDDY_INLINE_ICONS || {};
  const svgStr = ICONS[key];
  if (!svgStr) return;

  // .cp-wb-icon 已被 initComposerIcons 替换为 inline SVG，每次重新查找
  const current = btn.querySelector('.cp-wb-icon');
  if (!current) return;

  const t = document.createElement('div');
  t.innerHTML = svgStr;
  const svg = t.firstChild;
  if (svg) {
    svg.setAttribute('class', 'cp-wb-icon');
    svg.setAttribute('aria-hidden', 'true');
    current.replaceWith(svg);
  }
}

// 测量激活态高度 → --cp-height。激活态 shell = .cp-body(含 textarea) + .cp-bar。
// 累加两者自然高度（不设 shell height:auto，避免打断 CSS transition）。
function measureHeight() {
  if (!state.expanded || state.fullScreen) return;
  const bodyH = els.body ? els.body.getBoundingClientRect().height : 0;
  const barH = els.bar ? els.bar.getBoundingClientRect().height : 0;
  const h = Math.max(110, Math.ceil(bodyH + barH));
  els.shell.style.setProperty('--cp-height', h + 'px');
}

// ── 状态切换 ──────────────────────────────────────────────

let _expandAt = 0;  // 展开时间戳，blur 保护用

// ── FLIP 动画：多行态 ↔ 全屏态的平滑过渡 ──────────────────
// 全屏态用 position:absolute 脱离文档流，CSS 无法过渡 position 属性，
// 用 FLIP（First-Last-Invert-Play）补上这段过渡：
// 1. 记录切换前位置/尺寸 (First)
// 2. 瞬间应用状态变更 (Last)
// 3. 用 transform 反向偏移让元素视觉回到原位 (Invert)
// 4. 下一帧释放 transform，带 transition 过渡到新位 (Play)
let _flipToken = 0;

function flipTransition(enter) {
  const el = els.shell;
  if (!el) return;
  const token = ++_flipToken;

  // FIRST: 记录当前位置/尺寸
  const firstRect = el.getBoundingClientRect();

  // 禁用 transition，让状态变更瞬间生效
  el.style.transition = 'none';

  // LAST: 应用状态变更
  if (enter) {
    state.fullScreen = true;
    el.classList.add('is-fullscreen');
    if (els.composer) els.composer.classList.add('cp-is-fullscreen');
    if (els.textarea) els.textarea.style.height = '';
  } else {
    state.fullScreen = false;
    el.classList.remove('is-fullscreen');
    if (els.composer) els.composer.classList.remove('cp-is-fullscreen');
    syncLineCount();
    measureHeight();
  }

  // 强制 reflow，让浏览器计算新布局
  void el.offsetHeight;

  const lastRect = el.getBoundingClientRect();

  // INVERT: 计算偏移量，用 transform 让元素视觉回到 First 位置
  const deltaX = firstRect.left - lastRect.left;
  const deltaY = firstRect.top - lastRect.top;
  const scaleX = lastRect.width > 0 ? firstRect.width / lastRect.width : 1;
  const scaleY = lastRect.height > 0 ? firstRect.height / lastRect.height : 1;

  // 变化太小则跳过动画
  if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1 &&
      Math.abs(scaleX - 1) < 0.01 && Math.abs(scaleY - 1) < 0.01) {
    el.style.transition = '';
    el.style.transformOrigin = '';
    return;
  }

  el.style.transformOrigin = 'top left';
  el.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;

  // 强制 reflow，提交 transform
  void el.offsetHeight;

  // PLAY: 启用 transition，释放 transform
  el.style.transition = 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1), border-radius 320ms cubic-bezier(0.22, 1, 0.36, 1)';
  el.style.transform = '';

  // 清理：transition 结束后还原 inline style（token 防并发冲突）
  const onEnd = (e) => {
    if (token !== _flipToken) return;
    if (e.propertyName !== 'transform') return;
    el.style.transition = '';
    el.style.transformOrigin = '';
    el.removeEventListener('transitionend', onEnd);
    // 退出全屏后重新测量高度，确保 --cp-height 准确
    if (!enter) {
      requestAnimationFrame(() => {
        syncLineCount();
        measureHeight();
      });
    }
  };
  el.addEventListener('transitionend', onEnd);

  // 兜底：420ms 后强制清理
  setTimeout(() => {
    if (token !== _flipToken) return;
    el.style.transition = '';
    el.style.transformOrigin = '';
    el.removeEventListener('transitionend', onEnd);
    if (!enter) {
      requestAnimationFrame(() => {
        syncLineCount();
        measureHeight();
      });
    }
  }, 420);
}

function expand() {
  if (state.expanded) return;
  _expandAt = Date.now();
  // 生成态（播放中）也允许展开：用户可在生成中输入内容，不打断后台生成。
  state.expanded = true;
  els.shell.classList.add('is-expanded');
  observeHeight();
  // 同步 focus textarea，确保 iOS 能正确拉起键盘
  if (els.textarea) els.textarea.focus();
  requestAnimationFrame(() => {
    measureHeight();
    // 等 click 序列完成后重申 focus（防 pointer 默认行为"纠正" focus）
    if (els.textarea) els.textarea.focus();
  });
}

function collapse() {
  if (!state.expanded) return;
  state.expanded = false;
  state.fullScreen = false;
  els.shell.classList.remove('is-expanded', 'is-fullscreen');
  if (els.composer) els.composer.classList.remove('cp-is-fullscreen');
  els.shell.style.removeProperty('--cp-fs-height');
  unobserveHeight();
}

function enterFullScreen() {
  if (!state.expanded || state.lineCount < 4 || state.voiceMode) return;
  state.fullScreen = true;
  els.shell.classList.add('is-fullscreen');
  if (els.composer) els.composer.classList.add('cp-is-fullscreen');
  requestAnimationFrame(() => { if (els.textarea) els.textarea.focus(); });
}

function exitFullScreen() {
  if (!state.fullScreen) return;
  state.fullScreen = false;
  els.shell.classList.remove('is-fullscreen');
  if (els.composer) els.composer.classList.remove('cp-is-fullscreen');
  requestAnimationFrame(() => {
    measureHeight();
    if (els.textarea) els.textarea.focus();
  });
}

// ── ResizeObserver 生命周期 ──────────────────────────────
function observeHeight() {
  if (resizeObserver || !els.textarea) return;
  resizeObserver = new ResizeObserver(() => {
    // ResizeObserver 回调中不直接触发同步布局（getBoundingClientRect），
    // 推迟到下一帧避免 "ResizeObserver loop completed with undelivered notifications" 警告。
    requestAnimationFrame(measureHeight);
  });
  resizeObserver.observe(els.textarea);
}
function unobserveHeight() {
  if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
}

// ── 事件绑定 ──────────────────────────────────────────────
function bindEvents() {
  // 单行态点击 shell（占位文字/空白区）→ 展开。点按钮（+/麦克风/停止/发送）不触发展开。
  if (els.shell) {
    els.shell.addEventListener('pointerdown', (e) => {
      if (state.expanded) return;
      // 点击按钮不触发展开（按钮各自处理）
      if (e.target.closest('button')) return;
      // 点击已激活的 textarea 不重复展开
      if (e.target.closest('.cp-body')) return;
      // 阻止默认行为，避免后续 click 序列干扰人工 focus
      e.preventDefault();
      expand();
    });
  }
  // 单行态点占位文字也展开（占位文字 pointer-events:none，事件落在 bar 上，已覆盖）

  // textarea：输入时同步 content + lineCount + 高度
  const ta = els.textarea;
  if (ta) {
    ta.addEventListener('input', () => {
      syncHasContent();
      syncLineCount();
      measureHeight();
    });
    // 失焦自动收起（空且无内容）—— 用户已确认保留
    ta.addEventListener('blur', () => {
      setTimeout(() => {
        if (state.fullScreen) return;
        // 展开后 300ms 内不自动收起：防 pointer 事件序列导致的瞬时 blur
        if (Date.now() - _expandAt < 300) return;
        if (!ta.value.trim()) collapse();
      }, 120);
    });
  }

  // 展开手柄 → 进全屏
  const handle = $('.cp-expand-handle', els.shell);
  if (handle) {
    handle.addEventListener('pointerdown', (e) => { e.preventDefault(); enterFullScreen(); });
  }

  // 全屏：缩小 → 退出全屏
  const fsCollapse = $('.cp-fs-collapse', els.shell);
  if (fsCollapse) {
    fsCollapse.addEventListener('pointerdown', (e) => { e.preventDefault(); exitFullScreen(); });
  }

  // 全屏：清空
  const fsClear = $('.cp-fs-clear', els.shell);
  if (fsClear) {
    fsClear.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (els.textarea) els.textarea.value = '';
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
    composer: shell.closest('.composer'),
    body: $('.cp-body', shell),
    bar: $('.cp-bar', shell),
    textarea: $('.cp-textarea', shell),
    chipMount: $('.cp-chip-mount', shell),
    moreBtn: $('.cp-wb-more-btn', shell),
  };
  initComposerIcons(shell);
  syncMoreButtonState();
  bindEvents();
}

// 把 composer 里的 <img> 替换成 icons-inline.js 管理的 inline SVG
function initComposerIcons(shell) {
  const ICONS = window.WORKBUDDY_INLINE_ICONS || {};
  const mapping = [
    ['.cp-fs-collapse', 'wb-minimize.svg'],
    ['.cp-expand-handle', 'wb-maximize.svg'],
    ['.cp-voice-btn', 'voice.svg'],
    ['.cp-wb-icon', 'more.svg'],
    ['.cp-wb-indicator', 'wb-more-indicator.svg'],
  ];
  for (const [sel, key] of mapping) {
    const btn = $(sel, shell);
    if (!btn) continue;
    const img = btn.querySelector('img');
    if (!img) continue;
    const svgStr = ICONS[key];
    if (!svgStr) continue;
    const t = document.createElement('div');
    t.innerHTML = svgStr;
    const svg = t.firstChild;
    if (svg) {
      svg.setAttribute('class', img.getAttribute('class') || '');
      svg.setAttribute('aria-hidden', 'true');
      img.replaceWith(svg);
    }
  }
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
  if (chip.placeholder && els.textarea) {
    els.textarea.placeholder = chip.placeholder;
  }
  measureHeight();
}

// 设置 wb-more 按钮主图标（Figma 10:4074 设计，静态指示器图标不再动态更换）
export function setComposerMoreButtonState({ modelIcon } = {}) {
  if (!els.moreBtn) return;

  if (typeof modelIcon === 'string') {
    els.moreBtn.dataset.modelIcon = modelIcon;
  }

  syncMoreButtonState();
}

// 设置 textarea 文字
export function setComposerText(text) {
  if (els.textarea) els.textarea.value = text || '';
  syncHasContent();
  syncLineCount();
  measureHeight();
}