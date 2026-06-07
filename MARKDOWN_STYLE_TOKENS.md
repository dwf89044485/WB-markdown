# WorkBuddy 移动端 Markdown 样式规范 v7

## 设计目标

节点内 Markdown 和最终汇报 Markdown 使用同一套 `.md` 阅读系统；节点内只通过 `.md-node` 做容器缩进和轻量字号收敛，不维护第二套样式。内容源保留为 Markdown 字符串，由原生轻量 parser 转成 HTML，再通过 typewriter 逐 token 输出，便于后续直接替换文案。

## 技术决策

- 不引入 `marked.js` / `github-markdown-css` / `highlight.js`：这是纯演示 demo，当前文案只需要标题、段落、strong、列表、表格、链接、分割线、blockquote、inline code，原生 parser 足够，且无网络依赖。
- 接受第三方建议里的两点：使用 token streaming 模拟输出；提供下方参数控制 `tokensPerSecond`，默认 `200 tokens/s`，number input 步进为 `20 tokens/s`；刷新重放通过播放器内部 restart 完成，不触发整页 reload。
- 不采用 GitHub 默认样式：GitHub Markdown 面向桌面文档，移动端聊天报告需要更大的行高、更紧的标题层级、更强的链接 CTA 和横向滚动表格。

## Design Tokens

### Typography

| Token | Value | 用途 |
| --- | --- | --- |
| `--md-font-family` | Inter + Apple/PingFang system stack | 中英文混排稳定性 |
| `--md-font-body` | `15.5px` | 最终汇报正文 |
| `--md-font-li` | `15px` | 列表项正文 |
| `--md-font-h2` | `20px` | 汇报主章节 |
| `--md-font-h3` | `16px` | 汇报小章节 |
| `.md-node` | `14.5px / 1.62` | 节点内 Markdown，继承同一套 token |
| `--md-line-body` | `1.68` | 移动端长文阅读行高 |
| `--md-line-li` | `1.58` | 列表紧凑阅读行高 |
| `--md-line-heading` | `1.24` | 标题紧凑行高 |

### Color

| Token | Value | 用途 |
| --- | --- | --- |
| `--md-text-primary` | `#1c1c1e` | 正文 |
| `--md-text-secondary` | `#3c3c43` | 节点内正文 / 说明 |
| `--md-text-muted` | `#6e6e73` | 表头 / 辅助信息 |
| `--md-heading` | `#111114` | 标题 / strong |
| `--md-accent` | `#007AFF` | 链接 / CTA |
| `--md-purple` | `#5e5ce6` | 列表 bullet / 代码强调 |
| `--md-warning` | `#ff9f0a` | 能力说明 blockquote |
| `--md-border` | `#e5e5ea` | 分割线 / 表格边框 |

### Space / Shape / Elevation

| Token | Value | 用途 |
| --- | --- | --- |
| `--md-space-2~10` | `4px~20px` | 垂直节奏 |
| `--md-radius-md` | `13px` | 表格容器 |
| `--md-radius-lg` | `14px` | 文档链接卡片 |
| `--md-node-indent` | `30px` | 节点内 Markdown 左缩进 |
| `--md-shadow-card` | `0 8px 22px rgba(0,0,0,.035)` | 表格轻阴影 |
| `--md-shadow-link` | `0 6px 18px rgba(0,122,255,.07)` | 成果链接卡片 |

## Component Rules

- `h2`：主要章节标题；节点内 `h2` 降一档尺寸，但沿用同色、字重和节奏。
- `h3`：汇报小节标题，保持轻量，不做卡片化，避免报告拥挤。
- `p`：正文 15.5px / 1.68；节点内 14.5px / 1.62。
- `ul/li`：禁用浏览器默认 bullet，使用 token 化紫色圆点。
- `table`：外层 `.tbl-wrap` 负责圆角、边框、阴影和横向滚动；移动端不压缩列宽。
- `a.doc-link-card`：最终成果链接自动渲染为卡片 CTA，而不是普通蓝色链接。
- `blockquote`：用于能力说明，黄色左边线 + 柔和底色，提醒但不刺眼。
- `code`：用于命令/异常字符，紫色浅底强调。
- Typewriter：所有 Markdown 经 `markdownToHtml()` 转换后进入 `appendHTMLTypedTo()`，结构先成型，文本逐 token 填充。
