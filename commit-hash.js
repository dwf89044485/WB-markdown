// commit-hash.js — 统一获取并展示部署 commit hash
//
// 优先级（按顺序，第一个成功为准）：
//   1. <meta name="commit-hash"> 不是占位符  → 线上（Vercel 构建注入）
//   2. fetch('.git/HEAD' → 解析 ref → 读对应 loose ref 文件)  → 本地 server 常态
//   3. fetch('.git/packed-refs' 解析)                          → 本地 git gc 后场景
//   4. 失败 → 显示 "dev"
//
// 设计要点：
//   · 全部 fetch 加 cache: 'no-store'，避免浏览器缓存旧值
//   · 始终截取前 8 位（与 vercel-build.sh 的 cut -c1-8、AGENTS.md 报告口径完全一致）
//   · 暴露 window.commitHashReady (Promise) 供其他模块统一消费
//   · 自动写入 window.COMMIT_HASH + #ctrlCommitHash 元素

(function () {
  const SHORT = 8;
  const FALLBACK = 'dev';

  function shorten(sha) {
    return (sha || '').trim().slice(0, SHORT);
  }

  async function fetchText(url) {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  }

  async function readMeta() {
    const meta = document.querySelector('meta[name="commit-hash"]');
    const v = meta && meta.getAttribute('content');
    if (v && v !== '__COMMIT_HASH__') return shorten(v);
    return null;
  }

  async function readLooseRef() {
    const head = await fetchText('.git/HEAD');
    const m = head.match(/^ref:\s*(\S+)/);
    if (!m) {
      // 分离 HEAD 状态：HEAD 文件本身就是一个 SHA
      const sha = shorten(head);
      if (/^[0-9a-f]{8}/i.test(sha)) return sha;
      return null;
    }
    const ref = m[1];
    const sha = await fetchText('.git/' + ref);
    return shorten(sha);
  }

  async function readPackedRef() {
    // 当 loose ref 被 git gc 打包到 packed-refs 时
    const head = await fetchText('.git/HEAD');
    const m = head.match(/^ref:\s*(\S+)/);
    if (!m) return null;
    const ref = m[1];
    const packed = await fetchText('.git/packed-refs');
    // packed-refs 行格式：<sha> <ref>
    const lineRe = new RegExp('^([0-9a-f]{40})\\s+' + ref.replace(/[/.]/g, '\\$&') + '$', 'm');
    const match = packed.match(lineRe);
    return match ? shorten(match[1]) : null;
  }

  async function resolveHash() {
    try {
      const m = await readMeta();
      if (m) return m;
    } catch (_) { /* ignore */ }
    try {
      const h = await readLooseRef();
      if (h) return h;
    } catch (_) { /* ignore */ }
    try {
      const h = await readPackedRef();
      if (h) return h;
    } catch (_) { /* ignore */ }
    return FALLBACK;
  }

  function applyHash(hash) {
    window.COMMIT_HASH = hash;
    const el = document.getElementById('ctrlCommitHash');
    if (!el) return;
    const valueEl = el.querySelector('.dc-hash-value');
    if (valueEl) valueEl.textContent = hash;
    else el.textContent = hash;
  }

  // 暴露给其他模块复用，避免重复 fetch
  window.commitHashReady = resolveHash().then((hash) => {
    applyHash(hash);
    return hash;
  });
})();
