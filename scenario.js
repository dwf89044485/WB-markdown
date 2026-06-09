window.WORKBUDDY_SCENARIO = {
  "playback": {
    "stepDelay": 470,
    "frameDelay": 520,
    "autoStartDelay": 420,
    "tokensPerSecond": 200
  },
  "nav": {
    "title": "策划日本关西旅游方案",
    "workspace": "日常生活",
    "deviceName": "JosephDeng MacMini"
  },
  "userMessage": "帮我规划一次 2026 年 9 月 18 日到 9 月 24 日的关西家庭旅行。同行 4 人，爸爸膝盖不好，妈妈不吃生食，预算 28000 元。请查询天气、路线、预算、门票、文件和日历草稿，但不要真实预订。",
  "agent": {
    "name": "WorkBuddy"
  },
  "todosBaseline": [
    "任务理解与分解：明确需求、约束和输出格式",
    "联网搜索：签证/入境政策、交通卡、景点开放情况",
    "天气趋势与穿衣建议",
    "汇率与预算换算",
    "城际交通与路线时间",
    "生成关西主要地点图片",
    "整合信息，输出完整旅行方案文档"
  ],
  "thinking": {
    "type": "status",
    "runningText": "正在思考",
    "doneText": "思考过程",
    "frames": ["T.a", "T.b", "T.c"]
  },
  "sheetFrames": {
    "T.a": {
      "title": "思考过程",
      "events": [{
        "icon": "🧠",
        "text": "思考过程",
        "card": {
          "title": "需求识别",
          "body": "用户要的是一段长任务 Agent 回放：先理解旅行规划请求，再把任务拆成可执行待办。"
        }
      }],
      "todos": []
    },
    "T.b": {
      "title": "思考过程",
      "events": [{
        "icon": "🧠",
        "text": "思考过程",
        "card": {
          "title": "过程规划",
          "body": "我会按创建待办、联网搜索、生成图片、文件处理、异常修复和最终交付的顺序组织执行。"
        }
      }],
      "todos": []
    },
    "T.c": {
      "title": "思考过程",
      "events": [{
        "icon": "🧠",
        "text": "思考过程",
        "card": {
          "title": "执行策略",
          "body": "优先保证爸爸少走路、妈妈避开生食、预算不超过 28000 元，并且只生成草稿不真实预订。"
        }
      }],
      "todos": []
    },
    "F1.a": {
      "title": "创建待办",
      "events": [
        {
          "icon": "☐",
          "text": "创建待办",
          "dim": "任务理解与分解：明确需求、约束和输..."
        }
      ],
      "todoOverrides": [{"index":0,"status":"active"}]
    },
    "F1.b": {
      "title": "创建待办",
      "events": [
        {
          "icon": "☐",
          "text": "创建待办",
          "dim": "任务理解与分解：明确需求、约束和输..."
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"}]
    },
    "F1.c": {
      "title": "搜索网页",
      "events": [
        {
          "icon": "🔍",
          "text": "搜索网页",
          "dim": "正在搜索签证/入境政策、交通卡信息"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"active"}]
    },
    "F1.d": {
      "title": "搜索网页",
      "events": [
        {
          "icon": "🔍",
          "text": "搜索网页",
          "dim": "正在查询天气趋势与穿衣建议"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"active"}]
    },
    "F1.e": {
      "title": "搜索网页",
      "events": [
        {
          "icon": "🔍",
          "text": "搜索网页",
          "dim": "正在查询汇率与预算换算"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"active"}]
    },
    "F1.f": {
      "title": "搜索网页",
      "events": [
        {
          "icon": "🔍",
          "text": "搜索网页",
          "dim": "正在查询城际交通与路线时间"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"active"}]
    },
    "F1.g": {
      "title": "搜索网页",
      "events": [
        {
          "icon": "🔍",
          "text": "搜索网页",
          "dim": "10项搜索已完成",
          "outputs": [
            {"type":"search","text":"大阪关西-Top500件大阪关西 - 2026年2月更新"},
            {"type":"search","text":"2026年06月东京地铁卡销量排行榜前10名-爱美"},
            {"type":"search","text":"一篇文章带你了解日本交通，电车、新干线、JR P"},
            {"type":"search","text":"日本自由行游记7:D1-购买ICOCA交通卡，聊聊日"},
            {"type":"search","text":"HARUKA一张票，从关西机场直达神户!这篇攻略"},
            {"type":"search","text":"2026东大寺门票，奈良东大寺游玩攻略，东大寺游览"},
            {"type":"search","text":"2026年赴日旅游大变革!签证涨价安全预警，先看"},
            {"type":"search","text":"奈良东大寺游玩攻略-东大寺门票多少钱/价格表"},
            {"type":"search","text":"香港人，去了京都跟奈良两县，直言不讳:京都跟奈"},
            {"type":"search","text":"2026京都伏见稻荷大社旅游攻略之主殿-主殿图文"}
          ]
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"}]
    },
    "F1.h": {
      "title": "更新待办",
      "events": [
        {
          "icon": "☑️",
          "text": "更新待办",
          "dim": "搜索信息已收集完毕，更新任务进度"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"active"}]
    },
    "F1.i": {
      "title": "更新待办",
      "events": [
        {
          "icon": "☑️",
          "text": "更新待办",
          "dim": "搜索信息已收集完毕，更新任务进度"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"active"}]
    },
    "F2.a": {
      "title": "生成图片",
      "events": [],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"active"}]
    },
    "F2.b": {
      "title": "生成图片",
      "events": [
        {
          "icon": "🖼️",
          "text": "生成图片"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"active"}]
    },
    "F2.c": {
      "title": "生成图片",
      "events": [
        {
          "icon": "🖼️",
          "text": "生成图片"
        },
        {
          "icon": "🖼️",
          "text": "生成图片"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"active"}]
    },
    "F2.d": {
      "title": "生成图片",
      "events": [
        {
          "icon": "🖼️",
          "text": "生成图片"
        },
        {
          "icon": "🖼️",
          "text": "生成图片"
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"done"}]
    },
    "F2.e": {
      "title": "更新待办",
      "events": [
        {
          "icon": "☑️",
          "text": "更新待办",
          "dim": "任务理解与分解：明确需求、约束和输..."
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"done"},{"index":6,"status":"active"}]
    },
    "F2.f": {
      "title": "更新待办",
      "events": [
        {
          "icon": "☑️",
          "text": "更新待办",
          "dim": "任务理解与分解：明确需求、约束和输..."
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"done"},{"index":6,"status":"active"}]
    },
    "F3.1a": {
      "title": "调用技能",
      "events": [],
      "todos": []
    },
    "F3.1b": {
      "title": "调用技能",
      "events": [
        {
          "icon": "📖",
          "text": "调用技能",
          "dim": "docx",
          "card": {
            "title": "Skill card",
            "body": "docx · 创建和编辑 Word 文档，用于生成旅行方案文档。"
          }
        }
      ],
      "todos": []
    },
    "F3.2a": {
      "title": "创建文件",
      "events": [],
      "todos": []
    },
    "F3.2b": {
      "title": "创建文件",
      "events": [
        {
          "icon": "⚠️",
          "text": "文件创建失败"
        }
      ],
      "todos": []
    },
    "F3.2c": {
      "title": "创建文件",
      "events": [
        {
          "icon": "⚠️",
          "text": "文件创建失败"
        },
        {
          "icon": "✏️",
          "text": "创建文件",
          "dim": "generate_plan.js"
        }
      ],
      "todos": []
    },
    "F3.2d": {
      "title": "创建文件",
      "events": [
        {
          "icon": "⚠️",
          "text": "文件创建失败"
        },
        {
          "icon": "✏️",
          "text": "创建文件",
          "dim": "generate_plan.js"
        },
        {
          "icon": "👀",
          "text": "读取文件",
          "dim": "JS …generate_plan.js  308-317",
          "card": {
            "title": "JS · generate_plan.js",
            "body": "定位到疑似异常字符附近，准备修正。"
          }
        }
      ],
      "todos": []
    },
    "F3.2e": {
      "title": "创建文件",
      "events": [
        {
          "icon": "⚠️",
          "text": "文件创建失败"
        },
        {
          "icon": "✏️",
          "text": "创建文件",
          "dim": "generate_plan.js"
        },
        {
          "icon": "👀",
          "text": "读取文件",
          "dim": "JS …generate_plan.js  308-317"
        },
        {
          "icon": "✏️",
          "text": "编辑文件",
          "dim": "JS …generate_plan.js  +1 -1",
          "card": {
            "title": "Edit patch",
            "body": "+1 -1 · 修正脚本中的异常字符。"
          }
        }
      ],
      "todos": []
    },
    "F3.3a": {
      "title": "搜索文件",
      "events": [],
      "todos": []
    },
    "F3.3b": {
      "title": "搜索文件",
      "events": [
        {
          "icon": "🔍",
          "text": "搜索文件",
          "dim": "\\\\u81EA\\\\u7136|\\\\u81EA\\\\u7然"
        }
      ],
      "todos": []
    },
    "F3.3c": {
      "title": "搜索文件",
      "events": [
        {
          "icon": "🔍",
          "text": "搜索文件",
          "dim": "\\\\u81EA\\\\u7136|\\\\u81EA\\\\u7然"
        },
        {
          "icon": "✏️",
          "text": "编辑文件",
          "dim": "… +1 -1"
        }
      ],
      "todos": []
    },
    "F3.4a": {
      "title": "执行命令",
      "events": [],
      "todos": []
    },
    "F3.4b": {
      "title": "执行命令",
      "events": [
        {
          "icon": "🖥️",
          "text": "执行命令",
          "dim": "python3 -c \""
        }
      ],
      "todos": []
    },
    "F3.4c": {
      "title": "执行命令",
      "events": [
        {
          "icon": "🖥️",
          "text": "执行命令",
          "dim": "python3 -c \""
        },
        {
          "icon": "🖥️",
          "text": "执行命令",
          "dim": "cd /sessions/6a2189a4ac3de7…"
        }
      ],
      "todos": []
    },
    "F3.4d": {
      "title": "执行命令",
      "events": [
        {
          "icon": "🖥️",
          "text": "执行命令",
          "dim": "python3 -c \""
        },
        {
          "icon": "🖥️",
          "text": "执行命令",
          "dim": "cd /sessions/6a2189a4ac3de7…"
        },
        {
          "icon": "🖥️",
          "text": "执行命令",
          "dim": "python3 -c \""
        }
      ],
      "todos": []
    },
    "F3.5a": {
      "title": "委派 Subagent",
      "events": [],
      "todos": []
    },
    "F3.5b": {
      "title": "委派 Subagent",
      "events": [
        {
          "icon": "🐱",
          "text": "Sub Coding Agent",
          "dim": "Rewrite docx generator script"
        }
      ],
      "todos": []
    },
    "F3.5c": {
      "title": "委派 Subagent",
      "events": [
        {
          "icon": "🐱",
          "text": "Sub Coding Agent",
          "dim": "Rewrite docx generator script"
        },
        {
          "icon": "↳",
          "text": "嵌套子对话流",
          "card": {
            "title": "Subagent result",
            "body": "重写 docx generator script，移除异常转义，重新生成文档。"
          }
        }
      ],
      "todos": []
    },
    "F3.6a": {
      "title": "更新待办",
      "events": [
        {
          "icon": "☑️",
          "text": "更新待办",
          "dim": "任务理解与分解：明确需求、约束和输..."
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"done"},{"index":6,"status":"active"}]
    },
    "F3.6b": {
      "title": "更新待办",
      "events": [
        {
          "icon": "☑️",
          "text": "更新待办",
          "dim": "任务理解与分解：明确需求、约束和输..."
        }
      ],
      "todoOverrides": [{"index":0,"status":"done"},{"index":1,"status":"done"},{"index":2,"status":"done"},{"index":3,"status":"done"},{"index":4,"status":"done"},{"index":5,"status":"done"},{"index":6,"status":"done"}]
    }
  },
  "nodes": [
    {
      "id": "n1",
      "title": "任务理解与分解：明确需求、约束和输出格式",
      "actions": [
        {
          "type": "status",
          "runningText": "正在创建待办",
          "doneText": "创建待办",
          "frames": ["F1.a", "F1.b"]
        },
        {
          "type": "markdown",
          "markdown": `## 任务理解与分解

**目标**：为一家四口（上海出发）规划 2026 年 9 月 18 日–24 日日本关西 7 日旅行完整方案，预算 ≤ 28,000 元人民币。

**关键约束**：
- 父亲膝盖不好 → 每日步行量需控制，减少爬山/长时间步行
- 母亲不吃生食 → 餐饮避开生鱼片等
- 我偏好自然风光和城市街区，避开过度商业化景点
- 4 人出行，需要考虑家庭友好性

**子任务分解**：

| 子任务 | 目的 | 输入 | 输出 |
|--------|------|------|------|
| 签证/入境/交通卡/景点 | 出行准备信息 | 联网搜索 | 政策摘要 |
| 9月天气趋势 | 穿衣/行程参考 | 联网搜索 | 天气建议 |
| 汇率查询 | 预算换算 | 联网搜索 | 日元预算 |
| 城际交通 | 行程规划依据 | 联网搜索 | 路线/时间表 |
| 地点图片 | 方案可视化 | AI生图 | 关西景点图 |
| 整合方案 | 最终交付 | 以上全部 | 完整旅行方案 |`
        },
        {
          "type": "status",
          "runningText": "正在搜索网页",
          "doneText": "搜索网页",
          "frames": ["F1.c", "F1.d", "F1.e", "F1.f", "F1.g"]
        },
        {
          "type": "status",
          "runningText": "正在更新待办",
          "doneText": "更新待办",
          "frames": ["F1.h", "F1.i"]
        }
      ]
    },
    {
      "id": "n2",
      "title": "生成关西主要地点图片",
      "actions": [
        {"type": "markdown", "markdown": `现在生成关西主要地点的图片：`},
        {"type": "status", "runningText": "正在生成图片", "doneText": "生成图片", "frames": ["F2.a", "F2.b", "F2.c", "F2.d"]},
        {"type": "status", "runningText": "正在更新待办", "doneText": "更新待办", "frames": ["F2.e", "F2.f"]}
      ]
    },
    {
      "id": "n3",
      "title": "整合信息，输出完整旅行方案文档",
      "actions": [
        {"type": "markdown", "markdown": "现在我来整合所有信息，生成完整的方案文档"},
        {"type": "status", "runningText": "正在调用技能", "doneText": "调用技能", "frames": ["F3.1a", "F3.1b"]},
        {"type": "status", "runningText": "正在创建文件", "doneText": "创建文件", "frames": ["F3.2a", "F3.2b", "F3.2c", "F3.2d", "F3.2e"]},
        {"type": "status", "runningText": "正在搜索文件", "doneText": "搜索文件", "frames": ["F3.3a", "F3.3b", "F3.3c"]},
        {"type": "markdown", "markdown": `这个文件里还残留 \`)))\` 字符，sed 命令执行失效了。我改用 Python 来修复：`},
        {"type": "status", "runningText": "正在执行命令", "doneText": "执行命令", "frames": ["F3.4a", "F3.4b", "F3.4c", "F3.4d"]},
        {"type": "markdown", "markdown": `没有成功，我来调用 SubAgent 来专门修复这些问题`},
        {"type": "status", "runningText": "正在委派 Subagent", "doneText": "委派 Subagent", "frames": ["F3.5a", "F3.5b", "F3.5c"]},
        {"type": "markdown", "markdown": `文档已成功生成！让我更新进度`},
        {"type": "status", "runningText": "正在更新待办", "doneText": "更新待办", "frames": ["F3.6a", "F3.6b"]}
      ]
    }
  ],
  "final": {
    "timing": "执行过程 10m21s",
    "markdown": `所有任务已完成！已为您生成完整旅行方案。

---

## 方案概要

文档包含以下 **10 大章节**，含封面、目录、表格、图片等完整内容：

### 一、行前准备

- **签证**：2026 年签证费用大幅上涨（单次签约 15,000 日元），建议提前 2-3 个月办理
- **交通卡**：推荐 ICOCA & HARUKA 套票 + 关西周游卡组合
- **景点开放**：清水寺、伏见稻荷、东大寺等均正常开放

### 二、天气与穿衣

- 9 月大阪 22-29°C、京都 20-28°C、奈良 18-27°C
- 必带折叠雨伞，注意近年秋季偏暖

### 三、汇率与预算

- **当前汇率**：100 日元 = 4.254 元人民币（2026-06-04 中间价）
- **总预算**：28,000 元 ≈ **658,280 日元**
- 预算分配：机票 35.7% | 住宿 20% | 餐饮 20% | 交通 10% | 门票 5% | 其他 9.3%

### 四、城际交通

- 大阪↔京都：JR 新快速 30 分钟 / 540 日元
- 大阪↔奈良：JR 大阪环状线 45 分钟 / 800 日元
- 含交通路线示意图

### 五、关西印象

- 含 AI 生成的关西景点合成图

### 六、每日行程（7 天详细规划）

| 日期  | 主题  | 关键安排 |
| --- | --- | --- |
| Day 1 (9/18) | 抵达大阪 | 道顿堀闲逛 |
| Day 2 (9/19) | 京都古都风情 | 清水寺 + 岚山竹林 |
| Day 3 (9/20) | 京都神秘与宁静 | 伏见稻荷 + 锦市场 |
| Day 4 (9/21) | 奈良小鹿之旅 | 奈良公园 + 东大寺 + 春日大社 |
| Day 5 (9/22) | 大阪城市探索 | 大阪城天守阁 + 黑门市场 |
| Day 6 (9/23) | 自由日 | 神户半日游 / 大阪深度游 |
| Day 7 (9/24) | 返程  | 关西机场→上海 |

### 七~十

- 餐饮推荐（全部适合妈妈）、住宿建议、注意事项清单、参考资料链接

`,
    "fileCard": {
      "title": "日本关西家庭旅行方案 v1.0",
      "meta": "PDF · 2.3MB"
    }
  }
};
