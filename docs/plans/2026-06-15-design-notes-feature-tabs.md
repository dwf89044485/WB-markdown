# 右侧交互说明 - 功能 Tab 设计

> 状态：设计中 | 最后更新：2026-06-15

## 核心决策

| 决策项 | 结论 |
|--------|------|
| 联动方式 | B（弱联动）。右侧独立 tab，按钮触发左侧跳转。左侧始终保留播放控制权 |
| Tab 内容格式 | Markdown 文件，每功能一个 `.md`，放 `features/` 目录 |
| 组件状态展示 | 不在右侧渲染组件。用文字 + 表格说明交互规则和边界情况 |
| 触发方式 | 命名跳转（nodeId + actionType），不用数字索引 |
| 文案与配置分离 | 文案在 md 文件，trigger 映射在 `tabs-config.json` |
| URL 参数 | `?tab=xxx` 控制初始打开的 tab |
| 移动端 | 右侧面板不显示 |

---

## 交互说明 Tab 列表（8 个）

| # | tab 名称 | 触发 | 跳转目标 | 说明内容要点 |
|---|---------|------|---------|------------|
| 1 | 工具调用 | 有 | node1 搜索网页 | 状态行渲染、浮层打开/关闭、搜索项交互 |
| 2 | 待办清单 | 有 | node1 更新待办 | todo 创建、状态变更、浮层渲染、勾选交互 |
| 3 | 生成图片 | 有 | node2 生成图片 | 图片卡片渲染、多图布局 |
| 4 | 技能调用 | 有 | node3 调用技能 | 技能出现时机、浮层信息结构、与 subagent 区别 |
| 5 | Subagent 调用 | 有 | node3 委派 subagent | subagent 委派流程、状态行标识 |
| 6 | AskQuestion | 有 | node3 askUser | 单选/多选/排序的交互规则、边界情况 |
| 7 | 导航按钮 | 无 | — | composer 上翻下翻按钮的用途和交互 |
| 8 | 最终输出 | 有 | final 阶段 | 表格交互、文件卡片、response actions |

---

## 文件结构

```
features/
├── tool-call.md          # 工具调用交互说明
├── todo.md               # 待办清单交互说明
├── image-gen.md          # 生成图片交互说明
├── skill.md              # 技能调用交互说明
├── subagent.md           # Subagent 调用交互说明
├── ask-question.md       # AskQuestion 交互说明
├── nav-buttons.md        # 导航按钮交互说明
└── final-output.md       # 最终输出交互说明

tabs-config.json          # tab 列表 + trigger 映射（开发维护）

engine/design-tabs.js     # tab 切换 + md 加载 + 渲染 + trigger 执行
styles/design-tabs.css    # tab 导航 + 内容卡片样式

engine/player.js          # 暴露 jumpToTrigger() 供右侧调用
design-notes.js           # 保留不动（旧联动逻辑）
```

---

## 数据流

```
页面加载
  │
  ├─ 读取 ?tab=xxx → 切换到对应 tab
  ├─ 加载 tabs-config.json → 知道有哪些 tab、各自的 trigger
  ├─ 选中 tab → 加载对应 features/xxx.md → 渲染到右侧面板
  │
  └─ 用户点 [ 查看示例 ] → 读取当前 tab 的 trigger 配置
       → 调用 player.jumpToTrigger({ nodeId, actionType })
       → 左侧 demo 跳到目标画面
```

## 待完成

- [ ] 每个 tab 的具体说明文案（用户写）
- [ ] tabs-config.json 中精确的 trigger 映射
- [ ] tab 导航 UI 样式
- [ ] 内容卡片样式（markdown 在右侧面板中的渲染效果）
- [ ] 实现 jumpToTrigger（命名跳转）
