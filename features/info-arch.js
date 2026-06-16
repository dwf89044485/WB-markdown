// ============================================================
// INFO-ARCH — 信息架构
// ============================================================
// 内容来源：docs/交互设计说明/02-信息架构.md
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
        <p class="fp-subtitle">对话流的信息层级结构与追溯路径</p>
      </header>

      <section>
        <h2>对话流信息层级结构</h2>
        <p>对话流从整体到细粒度，信息按以下层级组织：</p>

        <pre>Conversation Flow 对话流
├─ Thinking 思考过程
│   └─ 按 frames 展开 → 浮层快照序列
└─ Execution 执行过程
    └─ Steps 执行步骤（按 Node 索引排列）
        ├─ Markdown 节点内正文
        ├─ Status 状态行（工具栏）
        │   └─ frames → 浮层 Sheet（事件详情 + 原始记录）
        └─ Others 问卷 / 确认 等</pre>

        <p>思考过程的 frames 与执行节点内状态行的 frames，都链接到浮层 Sheet——用统一容器承载事件详情与原始记录。</p>
      </section>

      <section>
        <h2>四层信息层级</h2>
        <p>从用户视角看，对话流的信息按四层组织，从浅到深逐级下钻：</p>

        <table>
          <thead>
            <tr>
              <th>层级</th>
              <th>位置</th>
              <th>内容</th>
              <th>语言风格</th>
              <th>面向用户</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>L0 结果层</strong></td>
              <td>主对话流，默认可见</td>
              <td>总结、交付物、完成状态、下一步</td>
              <td>产品化结论</td>
              <td>结果型用户</td>
            </tr>
            <tr>
              <td><strong>L1 节点层</strong></td>
              <td>展开执行过程后可见</td>
              <td>执行阶段标题列表，各阶段完成状态</td>
              <td>任务语言</td>
              <td>审核型用户</td>
            </tr>
            <tr>
              <td><strong>L2 状态行层</strong></td>
              <td>节点内平铺，可点击</td>
              <td>每个动作的摘要入口，告诉用户发生了什么</td>
              <td>任务语言</td>
              <td>审核型用户</td>
            </tr>
            <tr>
              <td><strong>L3 浮层详情层</strong></td>
              <td>点击状态行后弹出</td>
              <td>工具调用、命令执行、错误原文、原始输出</td>
              <td>原始细节</td>
              <td>较真型 / Debug 用户</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>两阶段视图切换</h2>
        <p>同一个 Agent Run，在不同时态下主角不同：</p>

        <pre>执行过程态（运行时）          结果交付态（完成后）
─────────────────            ─────────────────
主角：过程信息               主角：结果信息
可见：节点 + 状态行          可见：总结 + 交付物
折叠：结果（尚未产出）       折叠：执行过程（降级为追溯入口）</pre>

        <div class="fp-note">
          <strong>核心规则</strong>：运行中，过程浮在前面；完成后，结果浮在前面，执行过程折叠为"执行过程 · 19m40s"入口，用户按需展开追溯。
        </div>
      </section>

      <section>
        <h2>追溯路径</h2>
        <p>用户从结果出发，可逐级下钻到原始记录：</p>

        <pre>L0 结果层（默认可见）
  ↓ 点击「执行过程 · 19m40s」
L1 节点层（执行阶段列表）
  ↓ 节点内直接平铺
L2 状态行层（动作摘要，任务语言）
  ↓ 点击某条状态行
L3 浮层详情层（原始细节，工具名 / 命令 / 错误原文）
  ↓ 关闭浮层
回到对话流原位</pre>

        <div class="fp-note">
          <strong>快照语义</strong>：点击已完成的状态行，浮层展示的是该动作完成时刻的信息切片，不累积其他状态行的内容。
        </div>
      </section>
    </article>`,
};
