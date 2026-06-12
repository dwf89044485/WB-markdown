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
  "userMessage": "你来作为导游，我需要你帮我规划一次 2026 年 9 月 18 日到 9 月 24 日的日本关西家庭旅行。去日本关西有什么需要注意的吗？",
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
      "user": "可以，帮我策划吧\n\n具体需求再梳理一下：\n· 2026年9月18日到24日，关西7日\n· 4人从上海出发，预算28,000元\n· 爸爸膝盖不好，需要低步行量方案\n· 妈妈不吃生食，偏好熟食\n· 喜欢自然风光和城市街区"
    }
  ],
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
          "body": "收到一个旅行规划请求。用户需要为一家四口（上海出发，2026年9月18日-24日）设计关西7日行程。初步分析，这是典型的家庭旅行规划任务，涉及签证政策查询、交通方案设计、景点筛选、天气评估、预算核算等多个维度。任务复杂度中等偏高，需要依赖联网搜索获取实时信息，再用文档生成技能输出结构化方案。关键约束已明确：父亲膝盖问题要求每日步行量必须控制；母亲不吃生食意味着餐饮推荐需要过滤掉生鱼片、寿司等类目；用户偏好自然风光和城市街区，应避开过度商业化景点。预算上限28,000元人民币，四口人7天，日均每人约250元，必须严格控制。"
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
          "body": "基于需求分析，我将执行流程规划为七个阶段。第一阶段：创建待办清单，把复杂需求拆分为可追踪的任务项，方便后续逐项推进。第二阶段：联网搜索签证政策、入境要求、交通卡信息、景点开放情况，确保行前准备信息齐全。第三阶段：查询9月关西地区的天气趋势，为穿衣建议和行程节奏提供数据依据。第四阶段：查询当前汇率并换算预算，确认28,000元人民币在日本的购买力能否覆盖全部开销。第五阶段：查询大阪-京都-奈良之间的城际交通路线和时刻表，为每日移动规划提供数据支持。第六阶段：使用AI生图工具生成关西主要地点的图片，为最终方案增加可视化参考。第七阶段：调用文档生成技能，将所有信息整合为一份结构化的旅行方案文档，含封面、目录、每日行程表和预算明细。"
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
          "body": "每个环节都需要具体落地家庭约束。交通信息搜索时优先标注步行距离，为父亲筛选低步行的景点组合（清水寺可打车到山门、岚山可坐小火车代替全程步行）。餐饮搜索时必须过滤生食类目，侧重熟食、火锅、拉面等适合妈妈的选择。汇率换算留出10%的弹性空间应对波动。景点筛选结合自然风光偏好，侧重岚山竹林、伏见稻荷大社、奈良公园等自然与人文兼具的地点。天气数据用于调整每日户外行程的强度，避免暴晒或雨天长途步行。所有价格和时间信息仅做参考和草稿，不进行真实预订。最终交付物为包含完整旅行方案的PDF文档。"
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
          "type": "markdown",
          "markdown": "为一家四口规划 2026 年 9 月关西 7 日旅行，预算 ≤ 28K。约束：父亲膝盖不好、母亲不吃生食、偏好自然风光。拆为签证信息、天气、汇率、城际交通、地点图片、整合方案共 6 个子任务，前 4 项需联网搜索。"
        },
        {
          "type": "status",
          "runningText": "正在创建待办",
          "doneText": "创建待办",
          "frames": ["F1.a", "F1.b"]
        },
        {
          "type": "markdown",
          "markdown": "现在开始执行：先联网搜索签证/入境政策、交通卡和景点开放情况。"
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
        {"type": "status", "runningText": "正在更新待办", "doneText": "更新待办", "frames": ["F3.6a", "F3.6b"]},
        {
          "type": "askUser",
          "questions": [
            { "id": "q1", "type": "single", "question": "你希望住宿偏向哪种风格？", "options": ["商务酒店", "日式旅馆", "民宿", "青旅"] },
            { "id": "q2", "type": "multiple", "question": "你希望行程包含哪些类型？", "options": ["寺庙神社", "自然风光", "购物美食", "文化体验"] },
            { "id": "q3", "type": "sort", "question": "请按优先级排列你的出行考量", "options": ["性价比", "舒适度", "特色体验", "交通便利"] },
            { "id": "q4", "type": "single", "question": "行程节奏你更偏好哪种？", "options": ["紧凑高效", "适中均衡", "悠闲随性"] }
          ]
        }
      ]
    }
  ],
  "final": {
    "timing": "执行过程 10m21s",
    "markdown": `---



所有任务已完成！已为您生成完整旅行方案。

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

| 日期  | 主题  | 关键安排 | 特色美食 | 住宿 |
| --- | --- | --- | --- | --- |
| Day 1 (9/18) | 抵达大阪 | 道顿堀闲逛 | 蟹道乐会席（全熟食，妈妈放心）、章鱼烧 | 大阪难波假日酒店（电梯直达，近地铁） |
| Day 2 (9/19) | 京都古都风情 | 清水寺 + 岚山竹林 | 岚山汤豆腐定食、抹茶蕨饼 | 京都祇园旅馆（日式榻榻米，进出平坦） |
| Day 3 (9/20) | 京都神秘与宁静 | 伏见稻荷 + 锦市场 | 锦市场烤鳗鱼、串炸、玉子烧、豆皮寿司 | 京都祇园旅馆（连住，免搬行李） |
| Day 4 (9/21) | 奈良小鹿之旅 | 奈良公园 + 东大寺 + 春日大社 | 奈良釜饭、三轮素面（清淡熟食） | 大阪难波假日酒店（回大阪，方便次日） |
| Day 5 (9/22) | 大阪城市探索 | 大阪城天守阁 + 黑门市场 | 黑门市场烤扇贝/烤蟹腿、大阪烧（避开生食） | 大阪难波假日酒店（连住） |
| Day 6 (9/23) | 自由日 | 神户半日游 / 大阪深度游 | 神户牛铁板烧（选神户线）或 大阪烧（市区线） | 大阪难波假日酒店（连住） |
| Day 7 (9/24) | 返程  | 关西机场→上海 | 机场免税店伴手礼、机上餐食 | — |

### 七~十

- 餐饮推荐（全部适合妈妈）、住宿建议、注意事项清单、参考资料链接

`,
    "fileCard": {
      "title": "日本关西家庭旅行方案 v1.0",
      "meta": "PDF · 2.3MB"
    }
  }
};
