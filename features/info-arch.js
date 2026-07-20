// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// INFO-ARCH — 信息架构
// ============================================================
// 内容来源：docs/交互设计说明/02-信息架构-v2.md
// ============================================================

export default {
  id: 'info-arch',
  type: 'feature',
  label: '信息架构',
  anchors: {},
  content: `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>信息架构</h1>
        <p class="fp-subtitle">对话流的信息层级结构</p>
      </header>

      <section>
        <h2>四层信息层级</h2>
        <p>从用户视角看，对话流的信息按四层组织，从浅到深逐级下钻：</p>

        <table>
          <thead>
            <tr>
              <th>层级</th>
              <th>面向用户</th>
              <th>用户关注点</th>
              <th>语言风格</th>
              <th>位置</th>
              <th>查看示例</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>L1 结果层</strong></td>
              <td>结果型用户</td>
              <td><strong>任务完成了吗？结果是什么？接下来该做什么？</strong></td>
              <td>产品化结论</td>
              <td>主对话流，默认可见</td>
              <td><button class="dc-btn" data-action="infoarch-l1" type="button">查看示例<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td>
            </tr>
            <tr>
              <td><strong>L2 执行过程层</strong></td>
              <td>审核型用户</td>
              <td><strong>AI 是怎么做到的？每个步骤的结果是否可信？有没有出问题？</strong></td>
              <td>任务语言</td>
              <td>展开执行过程后可见</td>
              <td><button class="dc-btn" data-action="infoarch-l2" type="button">查看示例<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td>
            </tr>
            <tr>
              <td><strong>L3 浮层详情层</strong></td>
              <td>审核型用户</td>
              <td><strong>这个操作具体做了什么？查到的信息是什么？为什么得出这个结论？</strong></td>
              <td>结构化摘要</td>
              <td>点击某条状态行后弹出 Sheet</td>
              <td><button class="dc-btn" data-action="infoarch-l3" type="button">查看示例<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td>
            </tr>
            <tr>
              <td><strong>L4 原始细节层</strong></td>
              <td>较真型 / Debug 用户</td>
              <td><strong>到底报了什么错？输入参数对不对？能不能排查到根本原因？</strong></td>
              <td>原始细节</td>
              <td>在 L3 Sheet 内进一步点击展开</td>
              <td><button class="dc-btn" data-action="infoarch-l4" type="button">查看示例<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>对话流信息层级结构</h2>

        <div class="mermaid">
flowchart TD
    CF["Conversation Flow 对话流
    ─────────────────────
    User Message 用户输入
    Agent Message Agent 回复"]

    CF --> R1["L1 结果层（默认可见）
    ──────────
    总结 / 交付物 / 完成状态 / 下一步"]

    CF --> E1["L2 执行过程（展开后可见）
    ──────────
    Agent 思考、决策、执行工具的完整过程"]

    E1 --> ND["节点（Steps）
    · 按 Node 索引排列"]

    ND --> TK["Thinking
    思考过程（内部推理）
    · 点击展开帧快照"]
    ND --> MD["Markdown
    节点内正文（AI 话术）"]
    ND --> ST["Status Line
    状态行·任务语言"]
    ND --> AU["askUser
    问卷/确认等"]

    ST --> |点击| D1["L3 浮层详情
    Sheet 承载工具调用细节"]
    D1 --> |点击展开| O1["L4 原始细节
    命令输入/输出、API 响应"]

    style CF fill:#f0f4ff,stroke:#6b7fff
    style R1 fill:#e0f2fe,stroke:#38bdf8
    style E1 fill:#f0fdf4,stroke:#4ade80
    style ND fill:#f0fdf4,stroke:#4ade80
    style TK fill:#f5f0ff,stroke:#a78bfa
    style MD fill:#fafafa,stroke:#d1d5db
    style ST fill:#fff7ed,stroke:#fb923c
    style AU fill:#fafafa,stroke:#d1d5db
    style D1 fill:#fef3c7,stroke:#f59e0b
    style O1 fill:#fce7f3,stroke:#ec4899</div>
      </section>

      <section>
        <h2>两阶段视图切换</h2>
        <p>同一个 Agent Run，在不同时态下主角不同：</p>

        <pre>执行过程态（运行时）          结果交付态（完成后）
─────────────────            ─────────────────
主角：过程信息               主角：结果信息
可见：L2 执行过程层           可见：L1 结果层
折叠：结果（尚未产出）        折叠：L2 执行过程（降级为追溯入口）</pre>

        <div class="fp-note">
          <strong>运行中过程浮在前面，完成后结果浮在前面，L2 降级为追溯入口。</strong>
        </div>
      </section>
    </article>`,
};