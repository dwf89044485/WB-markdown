// ============================================================
// TYPEWRITER — Token streaming output engine
// ============================================================

import { sleep, sleepDelay, fastRender, currentTokensPerSecond, scrollToBottom } from './core.js';
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
    scrollToBottom();
    return;
  }
  const chunkSize = optimalChunkSize();
  target.parentElement && target.parentElement.classList.add('typing-active');
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize);
    const interval = typeIntervalForChunk(chunkSize);
    target.textContent += chunk;
    scrollToBottom();
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
      scrollToBottom();
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
  for (const child of Array.from(temp.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = document.createTextNode('');
      container.appendChild(t);
      await typeText(t, child.textContent);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const c = cloneEmptyNode(child);
      c.classList.add('typing-block-enter');
      container.appendChild(c);
      scrollToBottom();
      await typeClone(child, c);
      c.classList.remove('typing-block-enter');
    }
  }
  await sleepDelay('stepDelay', 470);
}

export async function appendHTML(row, html, container) {
  const target = container || row;
  await appendHTMLTypedTo(target, html);
}

export async function appendMarkdown(row, markdown) {
  await appendHTML(row, markdownToHtml(markdown));
}
