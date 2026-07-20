// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// PLAYER FINAL — final render · response actions · source sheet
// ============================================================

import { sleepDelay, scrollToBottom } from './core.js';
import { markdownToHtml } from './markdown.js';
import { appendHTMLTypedTo } from './typewriter.js';
import { openSheet, renderSearchItem, renderFileCard } from './sheet.js';
import { openProductsSheet } from './code-fullscreen-sheet.js';
import {
  scenario, $, state,
  RESPONSE_SVGS, collapseProcessIntoTiming, setComposerGenerating
} from './player-state.js';

// ── Timing bar ────────────────────────────────────────────
function renderTiming() {
  $('#timingMount').innerHTML = `
    <div class="timing-bar timing-enter" onclick="toggleExec()" role="button" tabindex="0" aria-label="折叠/展开执行过程">
      <span class="timing-text">${scenario.final.timing}</span>
      <span class="timing-arrow" id="timingArrow">›</span>
    </div>`;
}

// ── Final response actions (interactive) ──────────────────
function renderFinalActions({ onRegenerate } = {}) {
  const actionsMount = $('#mainActions');
  if (!actionsMount || actionsMount.querySelector('.response-actions')) return;
  const wrap = document.createElement('div');
  wrap.className = 'response-actions message-enter';
  const buttons = [
    ['copy', '复制', RESPONSE_SVGS.copy],
    ['regenerate', '重新生成', RESPONSE_SVGS.refresh],
    ['share', '分享', RESPONSE_SVGS.share],
    ['more', '更多', RESPONSE_SVGS.more]
  ];
  const showSource = !!(scenario.final && scenario.final.fileCard);
  wrap.innerHTML = `
    <div class="response-action-left" style="position:relative">
      ${buttons.map(([key, label, svg]) => `<button class="response-action-btn response-action-${key}" type="button" aria-label="${label}">${svg}<span>${label}</span></button>`).join('')}
      <div class="response-cost" aria-label="已消耗 120 积分"><span>已消耗</span>${RESPONSE_SVGS.cost}<strong>120</strong></div>
    </div>
    ${showSource ? `<div class="response-action-right"><button class="response-action-source" type="button" aria-label="10来源"><span class="source-avatars"><span class="source-avatar"><img src="icons/source-weibo.svg" alt=""></span><span class="source-avatar"><img src="icons/source-amazon.svg" alt=""></span><span class="source-avatar"><img src="icons/source-dribbble.svg" alt=""></span></span><span class="source-label">10来源</span></button></div>` : ''}`;
  actionsMount.appendChild(wrap);

  // More popover
  const moreBtn = wrap.querySelector('.response-action-more');
  const popover = document.createElement('div');
  popover.className = 'response-more-popover';
  popover.innerHTML = `
    <button class="more-menu-item" type="button" aria-label="很有帮助">${RESPONSE_SVGS.like}<span>很有帮助</span></button>
    <button class="more-menu-item" type="button" aria-label="没有帮助">${RESPONSE_SVGS.dislike}<span>没有帮助</span></button>
    <button class="more-menu-item" type="button" aria-label="复制请求ID">${RESPONSE_SVGS.copy}<span>复制请求ID</span></button>
    <button class="more-menu-item" type="button" aria-label="提交反馈">${RESPONSE_SVGS.ask}<span>提交反馈</span></button>`;
  const leftGroup = wrap.querySelector('.response-action-left');
  leftGroup.appendChild(popover);

  moreBtn.onclick = (e) => {
    e.stopPropagation();
    popover.classList.toggle('is-open');
  };

  document.addEventListener('click', function closePopover(e) {
    if (!popover.contains(e.target) && e.target !== moreBtn && !moreBtn.contains(e.target)) {
      popover.classList.remove('is-open');
    }
  });

  // 复制按钮
  const copyBtn = wrap.querySelector('.response-action-copy');
  if (copyBtn) {
    let copyTimer = null;
    copyBtn.onclick = async () => {
      const text = scenario.final && scenario.final.markdown
        ? scenario.final.markdown
        : (scenario.final && scenario.final.html ? scenario.final.html : actionsMount.textContent || '');
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      if (copyTimer) clearTimeout(copyTimer);
      copyBtn.classList.add('is-copied');
      copyBtn.innerHTML = RESPONSE_SVGS.done + '<span>已复制</span>';
      copyTimer = setTimeout(() => {
        copyBtn.classList.remove('is-copied');
        copyBtn.innerHTML = RESPONSE_SVGS.copy + '<span>复制</span>';
        copyTimer = null;
      }, 3000);
    };
  }

  // 分享按钮
  const shareBtn = wrap.querySelector('.response-action-share');
  if (shareBtn) {
    shareBtn.onclick = async () => {
      const text = scenario.final && scenario.final.markdown
        ? scenario.final.markdown
        : (scenario.final && scenario.final.html ? scenario.final.html : actionsMount.textContent || '');
      const title = 'WorkBuddy';
      try {
        if (navigator.share) {
          await navigator.share({ title, text });
        } else {
          await navigator.clipboard.writeText(text);
          shareBtn.classList.add('is-copied');
          shareBtn.innerHTML = RESPONSE_SVGS.done + '<span>已复制</span>';
          setTimeout(() => {
            shareBtn.classList.remove('is-copied');
            shareBtn.innerHTML = RESPONSE_SVGS.share + '<span>分享</span>';
          }, 3000);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('分享失败:', e);
        }
      }
    };
  }

  // 重新生成按钮 → 回调给 player.js 处理
  const regenerateBtn = wrap.querySelector('.response-action-regenerate');
  if (regenerateBtn && onRegenerate) regenerateBtn.onclick = onRegenerate;
}

// ── 来源 Sheet ────────────────────────────────────────────
function openSourceSheet() {
  const items = [];
  for (const key in scenario.sheetFrames) {
    const f = scenario.sheetFrames[key];
    if (f.events) {
      for (const ev of f.events) {
        if (ev.outputs) {
          for (const out of ev.outputs) {
            if (out.type === 'search') items.push(out.text);
          }
        }
      }
    }
    if (f.searchItems) {
      f.searchItems.forEach(t => items.push(t));
    }
  }
  if (!items.length) return;
  const unique = [...new Set(items)];

  openSheet(null, null, {
    customRenderer(body) {
      const title = document.createElement('div');
      title.className = 'sheet-source-title';
      title.textContent = `搜索来源（${unique.length} 项）`;
      body.appendChild(title);
      unique.forEach(text => body.appendChild(renderSearchItem(text)));
    }
  });
}

function bindSourceButton() {
  const sourceBtn = document.querySelector('#mainActions .response-action-source');
  if (sourceBtn) sourceBtn.onclick = openSourceSheet;
}

// ── Final render（由 player.js 导演调用）─────────────────
export async function renderFinal({ onRegenerate } = {}) {
  renderTiming();
  collapseProcessIntoTiming();
  await sleepDelay('stepDelay', 470);
  const main = $('#mainMd');
  const mainBiz = $('#mainBiz');
  await appendHTMLTypedTo(main, scenario.final.markdown ? markdownToHtml(scenario.final.markdown) : scenario.final.html);
  if (scenario.final && Array.isArray(scenario.final.fileCards)) {
    for (const card of scenario.final.fileCards) {
      await appendHTMLTypedTo(mainBiz, renderFileCard(card));
    }
    // 查看全部产物链接
    const count = scenario.final.fileCards.length;
    const linkWrap = document.createElement('div');
    linkWrap.className = 'products-view-all';
    linkWrap.innerHTML = `<span class="products-view-all-link">查看全部产物(${count}) ›</span>`;
    linkWrap.addEventListener('click', () => openProductsSheet(scenario.final.fileCards));
    mainBiz.appendChild(linkWrap);
    // 导航栏"文件"按钮 → 拉起产物 sheet
    const fileBtn = document.querySelector('.capsule-btn[aria-label="文件"]');
    if (fileBtn) {
      fileBtn.addEventListener('click', () => openProductsSheet(scenario.final.fileCards));
    }
  }
  renderFinalActions({ onRegenerate });
  bindSourceButton();
  scrollToBottom();
  setComposerGenerating(false);
}