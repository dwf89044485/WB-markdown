# AGENTS.md

本文档为 AI 助手提供项目的上下文与工作约束。**修改前请确认与现有规约不冲突。**

## 项目架构

本项目为 WorkBuddy 动态原型，采用以下文件结构：

| 文件/目录                      | 职责                                                                    |
| -------------------------- | --------------------------------------------------------------------- |
| `index.html`               | 手机壳、导航、输入框、对话容器、底部浮层等视觉骨架                                             |
| `styles/base.css`          | Reset、phone-shell、status-bar、nav-bar、glass 按钮系统、composer              |
| `styles/conversation.css`  | User/agent 消息气泡、timing-bar、exec-area、step-row、status-line、playback 动画 |
| `styles/markdown.css`      | CSS 变量 tokens（设计系统源头）、.md 阅读系统、table、typewriter 动效、response-actions   |
| `styles/sheet.css`         | Bottom sheet、工具事件行（s-row）、todo 列表、sheet CSS 变量                        |
| `styles/demo-controls.css` | 演示控制台（.demo-controls）、media query                                     |
| `scenario.js`              | 剧本数据：playback / nav / nodes / sheetFrames / final / todosBaseline     |
| `engine/core.js`           | 播放状态（activePlayId、fastRender）、sleep、scrollToBottom、playback 参数读取      |
| `engine/markdown.js`       | Markdown parser（escapeHtml、inlineMarkdown、markdownToHtml）             |
| `engine/icons.js`          | 图标系统（SVG 注册表、tool icon 推断、status line 渲染）                             |
| `engine/typewriter.js`     | Token 流式输出（typeText、appendHTMLTypedTo）                                |
| `engine/sheet.js`          | 底部浮层渲染（renderSheet、openSheet、renderEvent、renderTodo）                  |
| `engine/player.js`         | 播放引擎主入口（Director timeline、步进控制、final render、displayMode）              |
| `icons-inline.js`          | **自动生成，SVG 内联数据，禁止手动修改，AI 操作时无需读取**                                   |

> **注意**：`icons-inline.js` 为自动生成文件（SVG 内联，28KB），禁止手动修改，AI 操作时无需读取此文件。

> **本地开发**：使用 `python3 -m http.server 8080` 或 VS Code Live Server，通过 `http://localhost:8080` 访问，不要直接双击 HTML（`engine/` 模块用 ES Module，`file://` 协议不支持）。

**关键设计约束：**

1. 不改视觉体系：沿用现有 class、圆角、字号、间距和组件结构。
2. 不把剧本写死进 HTML：后续改剧本时主要改 `scenario.js`。
3. 浮层不是累积日志：每条状态行绑定自己的最后一帧，点击时展示对应快照。
4. timing-bar 只在全部节点结束后出现。
5. 旧实现里的节点3删除项未迁入：不再出现"原生中文字符重写整个文件"和"已调用工具"。
6. todos 数据：`scenario.js` 里 `todosBaseline` 是文本基准，各 sheetFrame 用 `todoOverrides` 只记录 status 变更，engine/sheet.js 的 `renderSheet` 合并两者渲染完整列表。

## Git 工作流

**每次做完一件事就提交并推送**，不等用户说。提交范围只包含本次任务直接相关的文件。

### 提交前检查

- 运行相关测试，确保通过
- 运行 lint 检查（如项目有配置）
- 确认只提交本次任务直接相关的文件

### 提交信息规范

用中文书写，使用约定式提交格式：

```
<类型>(<范围>): <具体描述>

示例：
feat(auth): 添加用户登录功能
fix(nav): 修复导航栏错位问题
refactor(ui): 重构状态栏样式
docs: 更新 API 文档
```

常用类型：`feat`(新功能)、`fix`(修复)、`refactor`(重构)、`docs`(文档)、`style`(格式)、`test`(测试)

### 提交后的动作

提交完成后在对话中告知用户：

```
已提交：{commit message}
hash：{短 hash（7 位）}
版本链路：{prehash（7 位）} → {currhash（7 位）}
```

其中：

- `prehash` 固定取 `git rev-parse --short=7 HEAD^1`
- `currhash` 固定取 `git rev-parse --short=7 HEAD`

### 推送冲突处理

如果 `push` 失败（远程有更新），先 `pull --rebase` 再推送。

### 例外情况

以下情况先确认再提交：

- 用户明确说「先不提交」「等一下再推」
- 当前改动明显是多步任务的中间状态，后续还有关联改动未完成

## 回复规范

每次回复必须以 `🎯` 作为第一行，正文从第二行开始。