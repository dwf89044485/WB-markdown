---
name: knot-cli
description: 通过 knot-cli 命令行与 Knot 平台智能体对话。支持直接提问（chat -p）和指定智能体（--agentId）两种模式，可按需切换模型。适用于日常问答、代码分析、自动化脚本，新建智能体对话。
metadata:
  version: "0.2.0"
---

# Knot CLI Skill

Knot 是一个 subagent 平台。当任务需要委派给 subagent 执行时，使用 `knot-cli` 发起调用。

## 1. 必须指定 agent

所有调用都必须显式指定 `--agentId` / `-a`，不得使用未指定 agent 的普通对话。

| 任务类型                            | agentId                            |
| ------------------------------- | ---------------------------------- |
| 代码类任务：代码开发、代码审查、重构、调试、脚本编写、工程分析 | `858c45caf43b4f76b6ce5e8ad5181812` |
| 其他任务：日常问答、文本处理、分析总结、规划、非代码类任务   | `89dd0160eb0c49b4bc58e2259739e775` |

## 2. 必须指定 model

所有调用都必须显式指定 `--model` / `-m`，不得省略模型。

模型选择原则：**任何任务默认优先使用 `glm-5.1`**。只有在任务明确需要长上下文时，才使用 `deepseek-v4-flash`；只有在任务明确需要视觉能力时，才使用 `kimi-k2.6`。

| 模型                  | 能力               | 选择规则                          |
| ------------------- | ---------------- | ----------------------------- |
| `glm-5.1`           | 文本模型，200k 上下文    | 默认首选模型；代码开发、常规文本、日常任务均优先使用    |
| `deepseek-v4-flash` | 文本模型，1M 上下文      | 仅在需要长上下文时使用，代码或日常任务均可         |
| `kimi-k2.6`         | 多模态视觉模型，256k 上下文 | 仅在需要视觉能力时使用，如图片、截图、界面、图表、视觉理解 |

模型选择优先级：

1. 默认使用 `glm-5.1`
2. 任务明确需要长上下文：使用 `deepseek-v4-flash`
3. 任务明确需要视觉能力：使用 `kimi-k2.6`

除上述两类明确需求外，不要切换到其他模型。

## 3. 基本调用格式

```bash
knot-cli chat \
  -a <agent_id> \
  --model "<model_name>" \
  -p "任务描述"
```

默认在当前项目/当前工作区执行。没有明确要求时，不要额外指定 `--workspace` / `-w` 或路径参数；subagent 通常不应执行工作空间以外的任务。

## 4. 代码类任务

代码类任务必须使用代码 agent：

```bash
knot-cli chat \
  -a 858c45caf43b4f76b6ce5e8ad5181812 \
  --model "glm-5.1" \
  -p "帮我实现这个功能，并说明关键改动"
```

## 5. 非代码类任务

非代码类任务必须使用通用 agent：

```bash
knot-cli chat \
  -a 89dd0160eb0c49b4bc58e2259739e775 \
  --model "glm-5.1" \
  -p "请总结下面这段材料的核心观点"
```

## 6. sessionId 复用规则

是否复用 `sessionId` 取决于任务是否需要继承上下文。

- 需要继承前序上下文、继续同一轮委派任务：复用已有 `sessionId`
- 需要隔离上下文、避免历史信息影响判断：不要传 `sessionId`

复用上下文：

```bash
knot-cli chat \
  -a 858c45caf43b4f76b6ce5e8ad5181812 \
  --model "glm-5.1" \
  --sessionId <existing_session_id> \
  -p "继续上一轮分析，补充单元测试方案"
```

隔离上下文：

```bash
knot-cli chat \
  -a 89dd0160eb0c49b4bc58e2259739e775 \
  --model "glm-5.1" \
  -p "请独立分析这个问题，不继承之前上下文"
```

## 7. 禁止用法

禁止省略 `agent` 或 `model`。以下形式都不可使用：

```bash
# 缺少 agent
knot-cli chat --model "glm-5.1" -p "你的问题"

# 缺少 model
knot-cli chat -a 89dd0160eb0c49b4bc58e2259739e775 -p "你的问题"

# agent 和 model 都缺失
knot-cli chat -p "你的问题"
```

## 8. 可选辅助命令

查看可用 agent：

```bash
knot-cli list-agents
```

查看 knot-cli 帮助：

```bash
knot-cli --help
```

## 9. 安装说明

如果环境中没有安装 `knot-cli`，请引导用户自行安装，禁止自动安装。

参考文档：https://iwiki.woa.com/p/4016921090
