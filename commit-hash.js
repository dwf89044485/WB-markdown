// commit-hash.js — 统一读取部署 commit hash
// 场景：
//   · Vercel 部署：meta 标签已被 vercel-build.sh 替换为真实 hash
//   · 本地开发：meta 标签保留占位符 __COMMIT_HASH__，fallback 到 fetch('./COMMIT_HASH')
(function () {
  function setHash(hash) {
    window.COMMIT_HASH = hash;
    // 如果有 DOM 元素 id="ctrlCommitHash"，直接写入
    var el = document.getElementById('ctrlCommitHash');
    if (el) el.textContent = hash;
  }

  var meta = document.querySelector('meta[name="commit-hash"]');
  var metaHash = meta ? meta.getAttribute('content') : '';

  if (metaHash && metaHash !== '__COMMIT_HASH__') {
    setHash(metaHash);
    return;
  }

  // fallback：本地开发时从 COMMIT_HASH 文件读取
  fetch('./COMMIT_HASH')
    .then(function (r) {
      if (!r.ok) throw new Error('fetch failed');
      return r.text();
    })
    .then(function (text) {
      setHash(text.trim());
    })
    .catch(function () {
      setHash('');
    });
})();
