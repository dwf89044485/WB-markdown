# 事件行类型参考

事件行由 `renderEvent(event)` 创建（`engine/sheet.js`），使用 `inferToolIconKey(event)` 推断 toolKey，决定 icon 和样式。

---

## 一、完整类型列表

| 类型 | 识别条件 | icon | 特征 |
|------|---------|------|------|
| 思考过程 | `icon === '🧠'` / `text === '思考过程'` | 🧠 | 卡片 body 打字机输出 |
| 创建待办 | `text === '创建待办'` | ☐ | 待办阶段，触发骨架 |
| 更新待办 | `text === '更新待办'` | ☑️ | 待办阶段，更新状态 |
| 搜索网页 | `text === '搜索网页'` | 🔍 | dim 逐帧变化，可带 outputs |
| 搜索文件 | `text === '搜索文件'` | 🔍 | dim 显示搜索关键词 |
| 生成图片 | `text === '生成图片'` | 🖼 | 多帧中事件数量递增 |
| 调用技能 | `text === '调用技能'` | 📖 | 可带 Skill card |
| 创建文件 | `text === '创建文件'` | ✏ | dim 显示文件名 |
| 读取文件 | `text === '读取文件'` | 👀 | dim 显示文件位置 |
| 编辑文件 | `text === '编辑文件'` | ✏ | 可带 Edit patch card |
| 文件创建失败 | `text === '文件创建失败'` | ⚠ | warning 样式 |
| 执行命令 | `text === '执行命令'` | 🖥 | 行尾带 `›` chevron |
| 委派 Subagent | `text === 'Sub Coding Agent'` | 🐱 | 带 card |
| 嵌套子对话流 | `text === '嵌套子对话流'` | ↳ | 带 Subagent result card |

---

## 二、事件行构成

```
s-row (class: tool-{toolKey})
├── s-ico
│   └── s-ico-img → renderToolIcon(event)
├── s-content
│   ├── s-line
│   │   ├── s-text          → event.text（主标题）
│   │   ├── s-text.dim       → event.dim（副文本，可选）
│   │   └── s-row-chevron    → `›`（仅执行命令显示）
│   └── event-card           → event.card（可选）
│       ├── event-card-title → 隐藏（display:none）
│       └── event-card-body  → 卡片正文
```

---

## 三、卡片类型

| 卡片类型 | 数据字段 | 例子 |
|---------|---------|------|
| 思考卡片 | `card.title`, `card.body` | 需求识别：用户要的是一段… |
| Skill card | `card.title="Skill card"` | docx · 创建和编辑… |
| Edit patch | `card.title="Edit patch"` | +1 -1 · 修正脚本… |
| Subagent result | `card.title="Subagent result"` | 重写 docx… |

---

## 四、ToolKey 推断逻辑（`icons.js` `inferToolIconKey`）

优先级顺序匹配（第一个匹配返回）：

| 顺序 | 匹配 | 返回 key |
|------|------|---------|
| 1 | `🧠/思考/Subagent/agent` | `agent` |
| 2 | `🖼/图片/image` | `image` |
| 3 | `📖/技能/skill/docx` | `skill` |
| 4 | `⚠/失败/异常/debug/排查` | `debug` |
| 5 | `✏/编辑/创建文件/patch/改写/rewrite` | `edit` |
| 6 | `👀/读取/查看/view/read` | `view` |
| 7 | `🖥/执行命令/terminal/python` | `terminal` |
| 8 | `☐/☑/待办/计划/todo` | `plan` |
| 9 | `网页/网站/联网/入境/交通卡/天气/汇率/路线` | `website` |
| 10 | `🔍/搜索/search` | `search` |
| 11 | 兜底 | `tools` |

---

## 五、特殊渲染逻辑

### 5.1 Chevron

`/执行命令/.test(event.text)` 为 true 时显示 `›`

### 5.2 Warning

`isWarningEvent(event)` 检测到警告时 class 变为 `tool-warning`，icon 区域顶部对齐。

### 5.3 Outputs

事件中的 `outputs` 数组（如搜索结果）在事件行渲染后逐条追加。

| output.type | 渲染函数 | 样式 |
|-----------|---------|------|
| `search` | `renderSearchItem(text)` | 网站 SVG icon + 文本 |
| 其他 | 空 div |  |
