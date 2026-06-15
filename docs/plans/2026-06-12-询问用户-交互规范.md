# Ask User Question — 交互规范

> AI 输出过程中遇到不确定时，暂停输出，向用户发起提问。对话流暂停，输入框区域替换为问答卡片。

---

## 一、用户体感层交互逻辑

### 1. 整体流程

```
AI 正在输出 → 遇到不确定 → 输出暂停 → 对话流底部出现问答卡片
  │
  ├─ 逐题作答（左/右箭头切换题目）
  │   ├─ 作答后前进到下一题
  │   └─ 不想答可跳过
  │
  ├─ 最后一题点"提交" → 卡片消失 → AI 继续输出
  └─ 点关闭 → 卡片消失 → AI 继续输出（所有题视为跳过）
```

### 2. 问答卡片结构

从上到下三层：

1. **顶栏**：左箭头 + 步骤指示器（如 "2 / 4"）+ 右箭头 + 关闭按钮
2. **问题区**：题型标签（多选/排序有，单选无）+ 问题文字
3. **选项列表 + 输入栏**：选项行 + 底部输入行

### 3. 三种题型的视觉差异

| | 单选 | 多选 | 排序 |
|---|---|---|---|
| 题型标签 | 无 | 「多选」药丸 | 「排序」药丸 |
| 选项右侧（未选） | 无 | □ 空复选框 | ≡ 拖拽手柄 |
| 选项右侧（已选） | ✓ 图标 | ☑ 实心复选框 | ≡ 拖拽手柄 |
| 输入栏 placeholder | 以上都不是，我来告诉你 | 我来额外补充说明 | 我来额外补充说明 |
| 操作方式 | 点选 | 点选 toggle | 长按拖拽 |

### 4. 选项行视觉状态

#### 单选

| 状态 | 行背景 | 序号字重 | 选项字重 | 右侧 |
|------|--------|---------|---------|------|
| 未选 | `#FAFAFA` | Regular | Regular | 无 |
| 选中 | `#F2F2F2` | Semibold | Semibold | ✓ 图标 |

#### 多选

| 状态 | 行背景 | 序号字重 | 选项字重 | 右侧 |
|------|--------|---------|---------|------|
| 未选 | `#FAFAFA` | Regular | Regular | □（白底，`#D5D5D5` 边框，8px 圆角） |
| 选中 | `#F2F2F2` | Semibold | Semibold | ☑（`#3D3D3D` 填充，白色 ✓） |

#### 排序

| 状态 | 行背景 | 序号 | 选项字重 | 右侧 |
|------|--------|------|---------|------|
| 默认 | `#FAFAFA` | 动态序号（跟随位置） | Regular | ≡ 拖拽手柄 |
| 已排序 | `#F2F2F2` | 动态序号 | Regular | ≡ 拖拽手柄 |

### 5. 单选交互

- **点击选项** → 选中该项，其他选项取消选中，输入框文字清空
- **点击已选中项** → 取消选中，回到未选状态
- **非最后一题**：点击选项后**自动前进**到下一题
- **最后一题**：点击选项后**停留**，按钮变为「提交」
- **在输入框打字** → 已选选项清空（互斥），不自动前进，需手动点按钮

### 6. 多选交互

- **点击选项** → toggle 选中/取消，可多选
- **点击后不自动前进**，需手动点按钮
- **在输入框打字** → 已选选项**不清空**（共存），不自动前进
- **最后一题有任意选中** → 按钮变为「提交」
- **取消所有选项** → 按钮回到「跳过」

### 7. 排序交互

- **长按选项**进入拖拽模式，拖动调整顺序
- **拖拽后不自动前进**，需手动点按钮
- **序号动态跟随位置更新**（拖到第 1 位就显示 1）
- **在输入框打字** → 排序结果不清空（共存），不自动前进
- **排序题始终有"下一步"/"提交"按钮**（不出现"跳过"），因为选项顺序始终存在，不存在"没操作"的状态
  - 非最后一题 = 「下一步」
  - 最后一题 = 「提交」

### 8. 导航

| 操作 | 效果 |
|------|------|
| 左箭头 | 去上一题（边界时不可点） |
| 右箭头 | 去下一题（边界时不可点） |
| 关闭 | 退出问答卡片，所有题视为跳过 |

**切题保留状态**：用箭头切走再切回来，之前的选择/输入/排序全部保留。

### 9. 按钮文案与行为

| 条件 | 按钮文案 | 按钮样式 | 点击行为 |
|------|---------|---------|---------|
| 未答 + 非最后 | 跳过 | 浅灰 `#F4F2F2`，深色字 | 前进到下一题 |
| 未答 + 最后 | 跳过 | 浅灰，深色字 | 提交全部 |
| 已答 + 非最后 | 下一步 | 深色 `#3D3D3D`，白字 | 前进到下一题 |
| 已答 + 最后 | 提交 | 深色，白字 | 提交全部 |
| 排序题 + 非最后 | 下一步 | 深色，白字 | 前进到下一题 |
| 排序题 + 最后 | 提交 | 深色，白字 | 提交全部 |

**"已答"判定**（排序除外）：selected 不为空 或 customInput 不为空

排序题不判断"已答"——按钮始终显示「下一步」/「提交」。

### 10. 输入与选项的关系

| 题型 | 用户输入文字时 | 用户点击选项时 | 提交结果 |
|------|--------------|--------------|---------|
| 单选 | 已选选项清空 | 输入框文字清空 | selected **或** customInput（二选一） |
| 多选 | 已选选项保留 | 输入框文字保留 | selected **和** customInput（共存） |
| 排序 | 排序结果保留 | — | selected（顺序）**和** customInput（共存） |

---

## 二、实现层交互逻辑

### 1. 数据模型

```js
// 问答会话
const askSession = {
  questions: [
    {
      id: 'q1',
      type: 'single',       // 'single' | 'multiple' | 'sort'
      question: '使用哪个框架？',
      options: ['React', 'Vue', 'Angular', 'Svelte'],
    },
    // ...
  ],
  answers: [],               // 见下方结构
  stepIndex: 0,              // 当前题索引
}
```

```js
// 每题的作答状态（按 stepIndex 对应）
const answer = {
  // 单选
  type: 'single',
  selected: null,            // number | null（选项索引）
  customInput: '',           // string

  // 多选
  type: 'multiple',
  selected: [],              // number[]（选项索引数组）
  customInput: '',           // string

  // 排序
  type: 'sort',
  selected: [0, 1, 2, 3],   // number[]（有序数组，初始 = 原始顺序）
  customInput: '',           // string
}
```

### 2. 状态计算

```js
// 判断某题是否"已答"
function isAnswered(question, answer) {
  if (question.type === 'sort') return true  // 排序始终视为已答
  if (question.type === 'single') {
    return answer.selected !== null || answer.customInput.trim() !== ''
  }
  if (question.type === 'multiple') {
    return answer.selected.length > 0 || answer.customInput.trim() !== ''
  }
}

// 按钮文案
function getButtonLabel(stepIndex, totalSteps, question, answer) {
  const isLast = stepIndex === totalSteps - 1
  const answered = isAnswered(question, answer)

  if (question.type === 'sort') {
    return isLast ? '提交' : '下一步'
  }
  if (answered) {
    return isLast ? '提交' : '下一步'
  }
  return '跳过'
}

// 按钮样式
function getButtonStyle(label) {
  return (label === '跳过')
    ? { bg: '#F4F2F2', color: '#3D3D3D' }
    : { bg: '#3D3D3D', color: '#FFFFFF' }
}
```

### 3. 事件处理

```js
// 点击选项
function onOptionClick(stepIndex, optionIndex) {
  const q = questions[stepIndex]
  const a = answers[stepIndex]

  if (q.type === 'single') {
    // 互斥：点选项清输入
    if (a.selected === optionIndex) {
      a.selected = null   // 取消选中
    } else {
      a.selected = optionIndex
      a.customInput = ''  // 清空输入
    }

    // 非最后一题自动前进
    if (a.selected !== null && stepIndex < questions.length - 1) {
      stepIndex++
    }
  }

  if (q.type === 'multiple') {
    // toggle，不清输入
    const idx = a.selected.indexOf(optionIndex)
    if (idx >= 0) a.selected.splice(idx, 1)
    else a.selected.push(optionIndex)
  }
}

// 输入框变化
function onInputChange(stepIndex, text) {
  const q = questions[stepIndex]
  const a = answers[stepIndex]

  a.customInput = text

  if (q.type === 'single') {
    a.selected = null  // 互斥：输入清选项
  }
  // 多选/排序不清 selected
}

// 拖拽排序
function onSortReorder(stepIndex, fromIndex, toIndex) {
  const a = answers[stepIndex]
  const [moved] = a.selected.splice(fromIndex, 1)
  a.selected.splice(toIndex, 0, moved)
}

// 按钮点击
function onButtonClick(stepIndex) {
  const label = getButtonLabel(stepIndex, questions.length, questions[stepIndex], answers[stepIndex])

  if (label === '跳过' || label === '下一步') {
    if (stepIndex === questions.length - 1) {
      submit()
    } else {
      stepIndex++
    }
  } else if (label === '提交') {
    submit()
  }
}

// 关闭
function onClose() {
  // 所有问题视为跳过，提交
  submit()
}
```

### 4. 渲染逻辑

```js
function renderQuestion(stepIndex) {
  const q = questions[stepIndex]
  const a = answers[stepIndex]
  const isLast = stepIndex === questions.length - 1

  // 顶栏
  renderHeader(stepIndex, questions.length)

  // 问题区
  renderQuestionText(q)  // type !== 'single' 时渲染标签药丸

  // 选项列表
  q.options.forEach((opt, i) => {
    const isSelected = q.type === 'single'
      ? a.selected === i
      : q.type === 'multiple'
        ? a.selected.includes(i)
        : true  // 排序始终显示

    renderOptionRow({
      index: q.type === 'sort' ? a.selected.indexOf(i) + 1 : i + 1,
      text: opt,
      type: q.type,
      selected: isSelected,
    })
  })

  // 输入栏
  const placeholder = q.type === 'single'
    ? '以上都不是，我来告诉你'
    : '我来额外补充说明'

  const buttonLabel = getButtonLabel(stepIndex, questions.length, q, a)

  renderInputBar(placeholder, a.customInput, buttonLabel)
}
```

### 5. 提交数据格式

```js
function submit() {
  const result = questions.map((q, i) => {
    const a = answers[i]
    return {
      questionId: q.id,
      type: q.type,
      selected: a.selected,
      customInput: a.customInput.trim() || null,
    }
  })
  // 返回给 AI 继续输出
  return result
}
```

示例输出：

```js
[
  { questionId: 'q1', type: 'single',  selected: 2,        customInput: null },
  { questionId: 'q2', type: 'single',  selected: null,     customInput: '我想用 React' },
  { questionId: 'q3', type: 'multiple', selected: [0, 3],  customInput: '优先考虑性能' },
  { questionId: 'q4', type: 'multiple', selected: [],      customInput: '都不满意' },
  { questionId: 'q5', type: 'sort',    selected: [2,0,1,3], customInput: '第1和第2差距不大' },
  { questionId: 'q6', type: 'single',  selected: null,     customInput: null },  // 被跳过
]
```
