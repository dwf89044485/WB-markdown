// ============================================================
// PRINCIPLES — Agent 对话流设计原则
// ============================================================
// 来源：docs/交互设计说明/01-原则指南.md
// type:    'overview'（占第一位，无锚点跳转）
// ============================================================

export default {
  id: 'principles',
  type: 'overview',
  label: 'Agent 对话流设计原则',
  anchors: {},
  content: `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>Agent 对话流设计原则</h1>
        <p class="fp-subtitle">原则指南 · 本 demo 所有交互设计的基础立场</p>
      </header>

      <section>
        <blockquote class="fp-lead-quote">
          Agent 对话流不是普通聊天界面。普通 Chatbot 的核心是"用户提问，AI 回答"；Agent 产品的核心是"用户委托目标，Agent 理解、拆解、执行、交付"。对话流设计的本质不是如何展示一段回复，而是如何让用户在复杂、异步、可能失败的执行过程中，始终知道结果是什么、过程是否可信、风险是否可控。
        </blockquote>
      </section>

      <section data-section="summary">
        <h2>总原则</h2>
        <div class="fp-principle-summary">
          <strong>结果优先，过程可查，风险可控，失败可见，细节下钻，交付可验收。</strong>
        </div>
      </section>

      <section data-section="principles">
        <h2>四条设计原则</h2>

        <div class="fp-principle-card">
          <div class="fp-principle-number">1</div>
          <div class="fp-principle-body">
            <h3>结果优先，过程可追溯</h3>
            <p>对话流默认服务结果交付；执行过程折叠为追溯入口，用户需要时可逐层还原完整执行链路。</p>
            <div class="fp-do-dont">
              <div class="fp-do">
                <span class="fp-do-dont-label">默认展示</span>
                <ul>
                  <li>任务完成状态</li>
                  <li>最终总结、关键结论</li>
                  <li>交付物、下一步操作</li>
                  <li>需要确认的事项</li>
                </ul>
              </div>
              <div class="fp-dont">
                <span class="fp-do-dont-label">默认不展示</span>
                <ul>
                  <li>全量工具日志</li>
                  <li>原始命令执行过程</li>
                  <li>原始模型思考</li>
                  <li>内部修复细节</li>
                </ul>
              </div>
            </div>
            <p class="fp-note">运行中，过程浮在前面；完成后，结果浮在前面，过程折叠为证据。<br>
            透明是一种可追溯能力，不是默认展示量——用户需要时能查到足够真实的信息，才是真透明。</p>
          </div>
        </div>

        <div class="fp-principle-card">
          <div class="fp-principle-number">2</div>
          <div class="fp-principle-body">
            <h3>渐进式披露</h3>
            <p>结果、过程、原始信息不在信息流中混排避免信息过载；用不同的容器收纳不同深度信息，用户按需追溯下钻。</p>
            <ul>
              <li>思考是理解过程，执行是行动过程，结果是交付内容，三者不能混在一起</li>
              <li>越靠上越产品化，越靠下越原始化——上层易读，下层真实</li>
              <li>不同深度的信息给不同意图的用户：结果型用户只看结果层，审核型用户看过程概览和节点摘要，较真型用户追溯原始记录</li>
              <li>错误不隐藏，但分层展示——结果层只说是否影响结果，概览层说哪个阶段有异常，节点层说是否已恢复，原始层展示错误原文和修复过程</li>
            </ul>
          </div>
        </div>

        <div class="fp-principle-card">
          <div class="fp-principle-number">3</div>
          <div class="fp-principle-body">
            <h3>任务语言优先</h3>
            <p>外层用任务语义表达，里层呈现原始细节；用户首先看到做了什么任务，追溯下去能看到调用了什么接口。</p>
            <div class="fp-example-compare">
              <div class="fp-example-good">
                <span class="fp-example-label fp-label-good">好的节点命名</span>
                <ul>
                  <li>理解任务与约束</li>
                  <li>补充搜索旅行信息</li>
                  <li>生成地点图片</li>
                  <li>整合信息并输出方案</li>
                </ul>
              </div>
              <div class="fp-example-bad">
                <span class="fp-example-label fp-label-bad">不好的节点命名</span>
                <ul>
                  <li>web_search</li>
                  <li>tool_call_1</li>
                  <li>run_command</li>
                  <li>file_write</li>
                </ul>
              </div>
            </div>
            <p class="fp-note">工具调用可以存在，但应作为下钻信息，而不是默认主线。</p>
          </div>
        </div>

        <div class="fp-principle-card">
          <div class="fp-principle-number">4</div>
          <div class="fp-principle-body">
            <h3>主动对齐，人在回路</h3>
            <p>Agent 在关键节点主动暂停并向用户确认，而非自作主张执行到底；用户始终保有介入、修改、终止的控制权。</p>
            <ul>
              <li>信息型任务可以结果优先；行动型任务、高风险操作必须确认优先</li>
              <li>控制权按场景出现：运行中可停止/暂停，失败时可重试/跳过，需确认时可允许/拒绝，完成后可修改/下载</li>
              <li>等待时保持推进感知——长任务必须让用户知道当前在做什么、做到第几步，而不是只显示空洞的"正在处理"</li>
            </ul>
          </div>
        </div>
      </section>

      <section data-section="antipatterns">
        <h2>核心反模式</h2>
        <table>
          <thead>
            <tr>
              <th>反模式</th>
              <th>问题</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>过程污染结果</strong></td>
              <td>工具调用、错误、日志直接堆在主对话流里，用户找不到结果</td>
            </tr>
            <tr>
              <td><strong>完全黑盒</strong></td>
              <td>只显示"正在处理"，最后直接给结果，过程不可信</td>
            </tr>
            <tr>
              <td><strong>假透明</strong></td>
              <td>展示看似过程的信息，但无法下钻到真实过程，高级用户不信任</td>
            </tr>
            <tr>
              <td><strong>过度包装错误</strong></td>
              <td>真实错误全部改写成模糊提示，失败原因不可追溯</td>
            </tr>
            <tr>
              <td><strong>工具名主导叙事</strong></td>
              <td>用户任务拆成一堆 API 名称，产品像开发者工具</td>
            </tr>
            <tr>
              <td><strong>完成态太弱</strong></td>
              <td>复杂任务完成后只给一句"完成了"，无法验收</td>
            </tr>
            <tr>
              <td><strong>思考/执行/结果混排</strong></td>
              <td>三类信息混在同一信息流，用户分不清哪些是结论、哪些是行动、哪些是内部分析</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section data-section="conclusion">
        <h2>一句话结论</h2>
        <blockquote class="fp-conclusion-quote">
          结果在前，过程在后；摘要在前，原始在后；用户语言在前，工具细节在后；关键节点主动确认；失败过程保留追溯；最终交付能够验收。
        </blockquote>
      </section>
    </article>
  `,
};
