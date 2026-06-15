# 预对话轮次（preChat）静态渲染方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有"一条用户消息 → AI 执行"的流程前，增加 3 轮纯对话（无工具调用），静态渲染，作为页面背景。第 4 轮用户消息"可以，帮我策划吧"触发现有动画播放器。

**Architecture:** 数据全部放在 `scenario.js` 中（新增 `preChat` 数组），`engine/player.js` 在初始化时读取 `preChat` 并一次性渲染为静态 DOM（无 typewriter、无 stepDelay、无 sheetFrame），渲染到 `#userMsgWrap` 之前。`resetPlaybackDom()` 不清除这些静态元素——它们不属于播放器 timeline，属于页面背景。`initializePlayback()` 中加判断，仅在首次加载时渲染 preChat，重启播放时跳过。

**Tech Stack:** Vanilla JS (ES modules), no frameworks.

---

### Task 1: 修改 `scenario.js`——数据层

**Files:**
- Modify: `scenario.js:13` — 修改 `userMessage`
- Modify: `scenario.js` — 在 `userMessage` 与 `agent` 之间新增 `preChat` 数组

**Step 1.1: 修改第 13 行的 userMessage**

当前内容：
```js
"userMessage": "帮我规划一次 2026 年 9 月 18 日到 9 月 24 日的关西家庭旅行。同行 4 人，爸爸膝盖不好，妈妈不吃生食，预算 28000 元。请查询天气、路线、预算、门票、文件和日历草稿，但不要真实预订。",
```

改为：
```js
"userMessage": "你来作为导游，我需要你帮我规划一次 2026 年 9 月 18 日到 9 月 24 日的日本关西家庭旅行。去日本关西有什么需要注意的吗？",
```

**Step 1.2: 在 `userMessage` 之后新增 `preChat` 数组（注意 JSON 逗号）**

在第 13 行末尾添加逗号，然后追加以下数组：

```js
"preChat": [
  {
    "agent": "好的！关西地区确实有些行前准备值得留意。签证方面，2026年赴日签证费用有所上涨，建议至少提前1-2个月办妥；交通上，关西机场到大阪市区推荐HARUKA特急列车或机场大巴，市内用ICOCA交通卡很方便；天气上，9月大阪京都一带仍在20-30度之间，但属于台风季，务必带好折叠雨伞。另外关西整体物价偏高，建议提前换好一定日元现金会比较稳妥。\n\n在开始具体规划之前，我想先了解几个关键信息——这次旅行一共有几个人同行？从哪个城市出发？整体的预算范围大概是多少？这样我能更好地帮你定制每天的行程安排。",
    "user": "4个人，从上海出发，预算大概28000元左右。"
  },
  {
    "agent": "嗯，4个人从上海出发，28000元预算，我记下了。关西7日游这个预算还是比较充裕的，我会在机票、住宿、交通和餐饮上帮你合理分配。\n\n因为是一家人的出行，我再多了解几个细节——随行的家人有没有身体状况需要特别留意的？比如长辈的膝盖、腰腿之类的，这样我在安排每天景点时可以提前规划好步行量，尽量选择有代步工具或路况平缓的路线。另外饮食方面有没有什么忌口？比如有没有不吃的东西，这样餐饮推荐可以提前过滤掉不合适的选项。",
    "user": "爸爸膝盖不好，走不了太多路；妈妈不吃生食，喜欢吃熟食。我们比较喜欢自然风光和城市街区，不太喜欢那种过度商业化的景点。"
  },
  {
    "agent": "好的，这些我都会重点考虑进去。父亲膝盖的问题不用太担心，关西很多景点都有替代方案——比如去清水寺可以打车到山门入口、岚山可以坐小火车游览竹林而不用全程步行、伏见稻荷大社走主干道前半段就好。妈妈不吃生食也没问题，关西美食熟食选择非常丰富，大阪烧、章鱼烧、汤豆腐、烤鳗鱼、神户牛这些都是全熟的美食，完全不用担心。\n\n偏好自然风光和城市街区的话，正好可以安排岚山竹林、奈良公园、大阪城天守阁这些自然与人文兼具的景点。信息已经很充足了，随时可以开始出方案。要我现在开始策划吗？",
    "user": "可以，帮我策划吧"
  }
],
```

注意：第 14 行原本是 `"agent": {`，上面新增的 `preChat` 数组末尾要有逗号，原有的 `"agent": {` 保持不变。

**Step 1.3: 验证 JSON 格式正确**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('scenario.js'.replace(/^window\.WORKBUDDY_SCENARIO\s*=\s*/, '').replace(/;\s*$/, '')))"
```

实际上 `scenario.js` 不是纯 JSON（有模板字符串 `` ` `` 和 `window.WORKBUDDY_SCENARIO =`），所以用浏览器验证或者肉眼检查结构。重点检查：
- `preChat` 前面一行有没有逗号
- `preChat` 数组结尾的逗号
- 第 14 行 `agent` 没有被影响

---

### Task 2: 在 `player.js` 中添加头像 SVG 常量

**Files:**
- Modify: `engine/player.js:18-20` — 在常量区新增 `AGENT_AVATAR_SVG`

**Step 2.1: 在第 20 行之后添加常量**

```js
// AI 头像 SVG（从 index.html:87 复制）
const AGENT_AVATAR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">'
  + '<circle fill="#000" fill-opacity="0.7" cx="12" cy="12" r="12"/>'
  + '<clipPath id="clip_0"><circle cx="12" cy="12" r="12"/></clipPath>'
  + '<g clip-path="url(#clip_0)">'
  + '<path fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 -0.803674 14.0118)" d="M3.3094 0.8611C3.486 0.3278 3.6141 0.12 3.8253 0.0334C3.9535 -0.0185 4.2513 0.023 4.5733 0.1373C5.3802 0.4317 6.9108 1.4705 8.5072 2.8106L8.6734 2.9492L9.2863 2.8245C10.3044 2.6167 10.945 2.5405 12.067 2.5025C13.2375 2.4609 14.4633 2.5786 15.7584 2.8591L16.174 2.9492L16.6588 2.5544C18.4006 1.1312 19.8827 0.1962 20.6446 0.0404C20.9077 -0.0151 20.9216 -0.0151 21.0532 0.0507C21.2679 0.1546 21.3995 0.3624 21.5518 0.8403C21.9085 1.9553 22.144 3.9603 22.1024 5.5325L22.0851 6.1419L22.3379 6.5229C22.5803 6.8934 22.937 7.5721 23.0617 7.8976C23.1171 8.0465 23.1309 8.0569 23.266 8.0777C23.8754 8.1712 24.4399 8.8395 24.7204 9.8057C24.9732 10.6749 24.9801 11.9146 24.7411 12.808C24.6996 12.95 24.5853 13.2408 24.4849 13.4486C24.1282 14.1758 23.5811 14.6052 23.0028 14.6087C22.885 14.6087 22.8712 14.6191 22.7465 14.8407C22.1613 15.9003 21.2748 16.7834 20.1182 17.476C18.8162 18.2516 16.9912 18.778 14.8027 19.0031C13.6253 19.1277 11.0039 19.1381 9.8854 19.0273C7.2086 18.7572 5.2936 18.1408 3.9188 17.1054C3.0981 16.489 2.2982 15.5679 1.9381 14.8269C1.8446 14.6295 1.8238 14.6087 1.6853 14.574C0.9477 14.3905 0.3348 13.5387 0.082 12.3509C-0.0184 11.8765 -0.0288 10.848 0.0612 10.3528C0.2759 9.1962 0.8438 8.3686 1.5953 8.1123C1.7892 8.0465 1.7961 8.0431 1.9 7.8041C2.0697 7.4128 2.364 6.8588 2.5856 6.5194L2.7899 6.2008L2.8003 5.0477C2.8211 3.2539 2.9943 1.8376 3.3094 0.8611Z"/>'
  + '<path fill="#FFF" transform="matrix(0.866025 -0.5 0.5 0.866025 -0.803674 14.0118)" d="M4.012 9.5945C3.9259 10.0251 3.9259 10.5458 3.9259 11.5872C3.9259 12.6285 3.9259 13.1492 4.012 13.5799C4.3612 15.3257 5.7365 16.701 7.4823 17.0502C7.913 17.1363 8.4337 17.1363 9.475 17.1363L15.4571 17.1363C16.4985 17.1363 17.0192 17.1363 17.4498 17.0502C19.1956 16.701 20.5709 15.3257 20.9202 13.5799C21.0063 13.1492 21.0063 12.6285 21.0063 11.5872C21.0063 10.5458 21.0063 10.0251 20.9202 9.5945C20.571 7.8487 19.1956 6.4734 17.4498 6.1242C17.0192 6.0381 16.4985 6.0381 15.4571 6.0381L9.475 6.0381C8.4337 6.0381 7.913 6.0381 7.4823 6.1242C5.7365 6.4734 4.3612 7.8487 4.012 9.5945Z"/>'
  + '</g></svg>';
```

注意：以上 SVG 字符串需要从 `index.html` 第 87 行**完整复制**，上面只是示意。实际编码时直接复制 `index.html` 中 `<svg>...</svg>` 的全部内容，压缩为一行并赋给 `AGENT_AVATAR_SVG`。

---

### Task 3: 添加 `renderStaticPreChat()` 函数

**Files:**
- Modify: `engine/player.js` — 在 `showUserMessage` 函数之前添加新函数

**Step 3.1: 在 `showUserMessage()` 函数之前（约第 435 行），插入 `renderStaticPreChat()`：**

```js
// ── Static pre-chat rounds ──────────────────────────────
function renderStaticPreChat() {
  const preChat = scenario.preChat;
  if (!preChat || !preChat.length) return;
  // 防止重复渲染（重启播放时跳过）
  if (document.querySelector('.prechat-static')) return;

  const conv = $('#conv');
  const ref = document.getElementById('userMsgWrap'); // 插入到这个前面

  for (let i = 0; i < preChat.length; i++) {
    const round = preChat[i];

    // 用户气泡（第一轮 userMessage 已由 HTML 处理，preChat 中不再重复）
    // 但 preChat 的 agent 回复需要渲染

    // Agent 回复
    const agentDiv = document.createElement('div');
    agentDiv.className = 'agent-msg prechat-static';
    agentDiv.innerHTML = '<div class="agent-header">'
      + '<div class="agent-avatar">' + AGENT_AVATAR_SVG + '</div>'
      + '<span class="agent-name">' + scenario.agent.name + '</span>'
      + '</div>'
      + '<div class="md md-node">' + markdownToHtml(round.agent) + '</div>';
    conv.insertBefore(agentDiv, ref);

    // 用户回复气泡
    const userWrap = document.createElement('div');
    userWrap.className = 'user-msg-wrap prechat-static';
    userWrap.innerHTML = '<div class="user-bubble">' + escapeHtml(round.user) + '</div>';
    conv.insertBefore(userWrap, ref);
  }

  // 最后一条 preChat 的用户消息是"可以，帮我策划吧"
  // 设置 #userBubble 的内容为它，供 showUserMessage() 使用
  const last = preChat[preChat.length - 1];
  if (last && last.user) {
    document.getElementById('userBubble').textContent = last.user;
  }
}
```

关键细节：
- 使用 `.prechat-static` class 标记静态元素，供后续识别（重置时不清除，但重启时不再重复创建）
- AI 回复用 `markdownToHtml()` 渲染（与动画阶段一致）
- 用户回复用 `escapeHtml()` 纯文本
- 最后把 `#userBubble` 的内容设为"可以，帮我策划吧"
- 第一行检查 `.prechat-static` 是否存在，防止 `restartPlayback()` 时重复渲染

---

### Task 4: 修改 `initializePlayback()` 函数

**Files:**
- Modify: `engine/player.js:1024-1037` — 在 `initializePlayback()` 函数开头插入

**Step 4.1: 在第 1031 行（`setupNavMeta()`）之前插入：**

```js
function initializePlayback() {
  autoPlaying = false;
  pauseRequested = false;
  directorBusy = false;
  setFastRender(false);
  currentDirectorIndex = -1;
  directorRuntime = { rows: [] };
  renderStaticPreChat();  // ← 新增：渲染静态预对话
  setupNavMeta();
  resetPlaybackDom();
  renderDesignNotes(currentDirectorIndex);
  directorTimeline = buildDirectorTimeline();
  updateDirectorControls();
  initScrollNav();
}
```

注意 `renderStaticPreChat()` 在 `resetPlaybackDom()` 之前调用：先渲染静态 preChat，然后重置播放器状态（resetPlaybackDom 不会清除 preChat，因为 preChat 元素有 `.prechat-static` class，resetPlaybackDom 只操作 id 选择器获取的元素）。

---

### Task 5: 修改 `showUserMessage()` 以适配新的 userMessage

**Files:**
- Modify: `engine/player.js:436-444`

**Step 5.1: 检查 `showUserMessage()` 是否需要修改**

现有代码：
```js
async function showUserMessage() {
  $('#userBubble').textContent = scenario.userMessage;
  const wrap = $('#userMsgWrap');
  wrap.classList.remove('is-hidden');
  wrap.classList.add('message-enter');
  scrollToBottom();
  rebuildScrollNav();
  await sleepDelay('userMessageDelay', 720);
}
```

注意 Task 3 中已经将 `#userBubble.textContent` 设为 `preChat[2].user`（"可以，帮我策划吧"）。但 `showUserMessage()` 第一行又会把它设为 `scenario.userMessage`（第一轮用户的消息）。这是冲突的。

**解决方案：** `showUserMessage()` 不再读取 `scenario.userMessage`，改为读取 preChat 最后一条用户消息。

修改第 437 行：
```js
// 使用 preChat 最后一条用户消息作为触发消息
const lastChat = scenario.preChat && scenario.preChat.length
  ? scenario.preChat[scenario.preChat.length - 1].user
  : scenario.userMessage;
$('#userBubble').textContent = lastChat;
```

这样 `showUserMessage()` 展示的是"可以，帮我策划吧"，与 preChat 的最后一轮对话衔接。

但注意，Task 3 的 `renderStaticPreChat()` 已经设置了 `#userBubble.textContent`，而 `showUserMessage()` 又设置一次。这不冲突——`renderStaticPreChat()` 是在初始化时设置的，`showUserMessage()` 在动画播放时才执行。时序列：
1. 页面加载 → `initializePlayback()` → `renderStaticPreChat()` 设置 `#userBubble` 内容
2. 用户点播放 → `startDirectorAuto()` → 执行 timeline 步骤
3. 第 0 步 `showUserMessage()` → 再次设置 `#userBubble` 内容（确保正确）+ 显示动画

所以两者都可以保留，`showUserMessage()` 覆盖设置也没问题。但为了统一，建议 `renderStaticPreChat()` 不再设置 `#userBubble`，由 `showUserMessage()` 统一处理。

**Task 3 修改：移除 `renderStaticPreChat()` 末尾设置 `#userBubble` 的代码。**

**Task 5 修改：`showUserMessage()` 读取 preChat 最后一条用户消息。**

---

### Task 6: 本地验证

**Step 6.1: 启动 HTTP 服务**

```bash
python3 -m http.server 8080
```

**Step 6.2: 浏览器打开 http://localhost:8080**

**验证清单：**
1. 页面加载后：能看到前三轮静态对话（用户气泡 + AI 回复头像），不需要点播放就可见
2. 点播放：从"可以，帮我策划吧"开始动画播放
3. 观察前三轮对话的 markdown 渲染是否正常（换行、加粗等）
4. 上一步/下一步：前三轮始终在画面上，不会闪烁或消失
5. 重新加载：前三轮仍然在，播放器重新开始播放
6. 滚动：对话区可以正常滚动，前三轮在顶部

---

### Task 7: Commit

```bash
git add scenario.js engine/player.js
git commit -m "feat(ui/prechat): 新增前三轮静态预对话，用户确认后触发动画播放"
```

注意按项目规范修改 `.status-version-dot` 颜色。
