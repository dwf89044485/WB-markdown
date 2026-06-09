# Sheet 内容类型清单

> 基于 `scenario.js` 数据和 `engine/sheet.js` 渲染逻辑梳理
> 日期：2026-06-09

---

## 一、事件行（Event Row）—— `.s-row`

| # | 类型名称 | 判定关键字 | 典型 icon | 特征 | 数据样例 |
|---|---------|-----------|-----------|------|---------|
| E1 | 思考过程 | `🧠` / `思考` / `agent` | 🧠 | 带 card，card 显示思考内容标题和正文 | `T.a` (需求识别 → 正文), `T.b` (过程规划 → 正文) |
| E2 | 创建待办 | `☐` / `待办` / `计划` / `todo` | ☐ | dim 行显示任务摘要 | `F1.a`: icon="☐" text="创建待办" dim="任务理解与分解…" |
| E3 | 搜索网页 | `网页` / `联网` / `入境` / `交通卡` 等 | 🔍 | dim 显示搜索内容，最终帧可带 outputs（搜索结果列表） | `F1.c`-`F1.g`: 逐帧 dim 变化 → 最后有 outputs 数组 |
| E4 | 更新待办 | `☑️` / `更新待办` / `todo` | ☑️ | dim 显示被更新任务摘要 | `F1.h`-`F1.i`, `F2.e`-`F2.f`, `F3.6a`-`F3.6b` |
| E5 | 生成图片 | `🖼` / `图片` / `image` | 🖼 | 无 dim，多帧累积 event 数量递增 | `F2.b` (1个)、`F2.c` (2个)、`F2.d` (2个) |
| E6 | 调用技能 | `📖` / `技能` / `skill` / `docx` | 📖 | 带 card（Skill card：title + body） | `F3.1b`: card={title:"Skill card", body:"docx · 创建和编辑…"} |
| E7 | 文件创建失败 | `⚠` / `失败` / `异常` / `debug` / `排查` | ⚠ | isWarning=true，icon 变警告样式 | `F3.2b`-`F3.2e` |
| E8 | 创建文件 | `✏` / `编辑` / `创建文件` / `patch` / `rewrite` | ✏ | dim 显示文件名 | `F3.2c`-`F3.2e` |
| E9 | 读取文件 | `👀` / `读取` / `查看` / `view` / `read` | 👀 | dim 显示文件位置 | `F3.2d`-`F3.2e` |
| E10 | 编辑文件 | `✏` / `编辑` / `patch` / `改写` / `rewrite` | ✏ | 可能带 card（Edit patch 卡片） | `F3.2e`: card={title:"Edit patch", body:"+1 -1 · 修正…"} |
| E11 | 搜索文件 | `🔍` / `搜索` / `search` | 🔍 | dim 显示搜索关键词 | `F3.3b`-`F3.3c` |
| E12 | 执行命令 | `🖥` / `执行命令` / `terminal` / `python` | 🖥 | 带 chevron（`showChevron` 由 `/执行命令/` 触发），dim 显示命令 | `F3.4b`-`F3.4d` |
| E13 | 委派 Subagent | `Sub Coding Agent` / `嵌套子对话` / `Subagent` | 🐱 / ↳ | 第二个 event 是子结果（↳ icon + card） | `F3.5b` (Sub Coding Agent), `F3.5c` (↳ 嵌套子对话流 + card) |

---

## 二、搜索结果输出（Search Output）—— `.s-sub`

| # | 类型名称 | 判定 | 特征 | 数据样例 |
|---|---------|------|------|---------|
| O1 | 搜索结果条目 | `output.type === 'search'` | 网站 SVG icon + 标题文本（一行） | `F1.g` 的 outputs: 10 条 search 结果 |

---

## 三、待办事项（Todo Item）—— `.s-sub`

| # | 类型名称 | 判定 | 特征 | 数据样例 |
|---|---------|------|------|---------|
| T1 | 待办-未开始 | `status === 'todo'` | 空心圆 icon (`todoEmpty`) | `todosBaseline` 中初始状态 |
| T2 | 待办-执行中 | `status === 'active'` | 旋转动画 icon (`todoSpin`)，文本加粗 (`active` class) | `F1.a` 对 index:0 设为 active |
| T3 | 待办-已完成 | `status === 'done'` | 勾选 icon (`todoOk`) | `F1.b` 对 index:0 设为 done |

---

## 四、子卡片（Event Card）—— `.event-card`

| # | 类型名称 | 特征 | 数据样例 |
|---|---------|------|---------|
| C1 | 思考卡片 | 标题+正文纯文字，隐藏 title | `T.a`-`T.c`: title="需求识别", body="用户要的是一段…" |
| C2 | Skill card | 技能名称+描述 | `F3.1b`: title="Skill card", body="docx · 创建和编辑 Word 文档…" |
| C3 | Edit patch | 文件差异摘要 | `F3.2e`: title="Edit patch", body="+1 -1 · 修正脚本中的异常字符。" |
| C4 | Subagent result | 子任务结果描述 | `F3.5c`: title="Subagent result", body="重写 docx generator script…" |

---

## 五、排他性结构总结

### 目前渲染逻辑（`engine/sheet.js` `renderSheet`）

```
body.innerHTML = ''
for each frame:
  for each event in frame.events:
    appendChild(renderEvent(event))      ← 整行一次性创建
    if event.outputs:
      for each output:
        appendChild(renderOutput(output)) ← 整行一次性创建
  // 旧格式兼容：帧级 searchItems
  if frame.searchItems && no event has outputs:
    for each item:
      appendChild(renderSearchItem(item))

for each todo:
  appendChild(renderTodo(todo))          ← 整行一次性创建，todoSpin 靠 CSS 动画旋转
```

### 关键问题

1. **todo 状态不是逐条动画的**：`computeTodoSnapshot` 取最后一个 override frame，一次性渲染全部 todos 的最终状态。spin icon 虽然 CSS 在转，但"active→done→active→done"的串行动画不存在。

2. **事件行没有出现动画**：所有 event row 同时出现，没有"先 A 出现 → sleep → B 出现"的渐进过程。

3. **搜索结果列表没有逐条出现**：10 条搜索结果瞬间全部展现。

4. **event card 和事件行是一体出现的**：没有等用户看完了事件行再加入 card。

---

## 六、流式方案思考要点

基于上述类型分析，每种内容在"流式"中的表现方式应该不同：

| 类型 | 流式单元 | 建议表现 |
|------|---------|---------|
| 事件行（E1-E13） | **整行**为单位 | 一行内容完整出现（非逐字），但行与行之间有间隔 |
| 搜索结果（O1） | **每条**为单位 | 逐条出现，一条完成后再下一条 |
| 待办列表（T1-T3） | **全部列表先出现**，然后状态变化逐条动画 | 所有条目一次列出，但 animated icon 逐个跑：active(转) → done(勾) → 下一条 active(转) |
| 子卡片（C1-C4） | **事件行出现后追加** | 事件行出现 → sleep → 卡片内容展开/出现 |

### 当前 playback 时间轴参考（`engine/player.js`）

```
每个 status group action 流程：
  for each frameId:
    line.dataset.frames = frameId
    await sleep(520ms)
```

当前这 520ms 只是更新 data 属性，sheet 内容不变。改为流式后，这 520ms 应驱动 sheet 内容的渐进构建。

### 不同类型帧数据的组合规律

- **单个 event 跨多帧**：同 icon+text，dim 逐帧变化（搜索网页从"正在搜索签证…"→"正在查询天气…"→"…已完成"）
- **event 累积**：多帧中 event 个数递增（生成图片：0→1→2→2）
- **todo 跨帧变更**：todoOverrides 中逐个 index 从 active→done
