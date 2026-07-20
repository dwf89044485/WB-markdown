// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// TYPEWRITER — Token streaming output engine
// ============================================================

import { sleep, sleepDelay, fastRender, currentTokensPerSecond, scrollIfFull } from './core.js';
import { markdownToHtml } from './markdown.js';

const $ = (sel, root = document) => root.querySelector(sel);

export function optimalChunkSize() {
  return Math.max(1, Math.ceil(currentTokensPerSecond() / 250));
}

export function typeIntervalForChunk(chunkSize) {
  return (1000 * chunkSize) / currentTokensPerSecond();
}

export async function typeText(target, text) {
  if (!text) return;
  if (fastRender) {
    target.textContent += text;
    scrollIfFull();
    return;
  }
  const chunkSize = optimalChunkSize();
  target.parentElement && target.parentElement.classList.add('typing-active');
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    const interval = typeIntervalForChunk(chunkSize);
    target.textContent += chunk;
    scrollIfFull();
    await sleep(chunk.trim() ? interval : Math.max(1, interval * 0.35));
  }
  target.parentElement && target.parentElement.classList.remove('typing-active');
}

export async function typeClone(source, target) {
  for (const child of Array.from(source.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = document.createTextNode('');
      target.appendChild(t);
      await typeText(t, child.textContent);
      continue;
    }
    if (child.nodeType === Node.ELEMENT_NODE) {
      const c = cloneEmptyNode(child);
      target.appendChild(c);
      scrollIfFull();
      await typeClone(child, c);
    }
  }
}

function cloneEmptyNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode('');
  if (node.nodeType !== Node.ELEMENT_NODE) return node.cloneNode(false);
  return node.cloneNode(false);
}

export async function appendHTMLTypedTo(container, html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const startMark = document.createComment('typed-start');
  container.appendChild(startMark);
  for (const child of Array.from(temp.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = document.createTextNode('');
      container.appendChild(t);
      await typeText(t, child.textContent);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const c = cloneEmptyNode(child);
      c.classList.add('typing-block-enter');
      container.appendChild(c);
      scrollIfFull();
      await typeClone(child, c);
      c.classList.remove('typing-block-enter');
    }
  }
  // 敲完后对本批新增内容里的代码块统一做语法高亮
  highlightCodeBlocksAfter(startMark);
  startMark.remove();
  await sleepDelay('stepDelay', 470);
}

function highlightCodeBlocksAfter(marker) {
  if (!window.hljs) return;
  let node = marker.nextSibling;
  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const blocks = node.matches && node.matches('pre code')
        ? [node]
        : (node.querySelectorAll ? node.querySelectorAll('pre code') : []);
      blocks.forEach(el => {
        if (el.dataset.highlighted) return;
        // mermaid 不交给 highlight.js，留给 mermaid-render.js 渲染成 SVG
        if (el.classList.contains('lang-mermaid')) return;
        try {
          window.hljs.highlightElement(el);
        } catch (e) { /* ignore */ }
      });
    }
    node = node.nextSibling;
  }
}

export async function appendHTML(row, html, container) {
  const target = container || row;
  await appendHTMLTypedTo(target, html);
}

export async function appendMarkdown(row, markdown) {
  await appendHTML(row, markdownToHtml(markdown));
}
