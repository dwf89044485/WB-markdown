// ============================================================
// PRINCIPLES — 原则指南
// ============================================================
// 内容来源：docs/交互设计说明/01-原则指南.md
// 视觉组件见 styles/feature-panel.css 的 fp-principle-* 系列
// ============================================================

export default {
  id: 'principles',
  type: 'feature',
  label: '原则指南',
  anchors: {},
  content: `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>原则指南</h1>
        <p class="fp-subtitle">Agent 对话流不是普通聊天界面——设计原则决定了产品的体验基线</p>
      </header>

      <blockquote class="fp-lead-quote">
        <p>Chat 是"一问一答"的序列，Agent 是"目标导向的协作进程"。</p>
        <p>Agent 对话流的设计重心需要从<strong>回复质量</strong>转向<strong>进程的可理解性与可控性</strong>。</p>
      </blockquote>

      <div class="fp-compare-row">
        <div class="fp-compare-card">
          <div class="fp-compare-side">Chat 对话</div>
          <div class="fp-compare-key">目标</div>
          <div class="fp-compare-val">获取答案</div>
          <div class="fp-compare-key">用户关注</div>
          <div class="fp-compare-val">最新回复</div>
        </div>
        <div class="fp-compare-vs">VS</div>
        <div class="fp-compare-card fp-compare-card--agent">
          <div class="fp-compare-side">Agent</div>
          <div class="fp-compare-key">目标</div>
          <div class="fp-compare-val">完成任务</div>
          <div class="fp-compare-key">用户关注</div>
          <div class="fp-compare-val">过程可信可控</div>
        </div>
      </div>

      <section>
        <h2>总原则</h2>
        <div class="fp-principle-summary">
          结果优先，过程可查，风险可控，失败可见，细节下钻，交付可验收。
        </div>
      </section>

      <section>
        <h2>四条设计原则</h2>

        <div class="fp-principle-card">
          <div class="fp-principle-number">1</div>
          <div class="fp-principle-body">
            <div class="fp-hdr-row">
              <h2>结果优先，过程可追溯</h2>
              <div class="dc-btn-group">
                <button class="dc-btn" data-action="running-state">
                  查看运行态
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <button class="dc-btn" data-action="completed-state">
                  查看完成态
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
            <p>对话流默认服务结果交付；执行过程折叠为追溯入口，用户需要时可逐层还原完整执行链路。</p>
            <ul>
              <li>默认展示结果（状态、总结、交付物、下一步），不是内部细节</li>
              <li>运行中过程在前，完成后结果在前，过程折叠为证据</li>
              <li>透明是可追溯能力，不是默认展示量</li>
            </ul>
          </div>
        </div>

        <div class="fp-principle-card">
          <div class="fp-principle-number">2</div>
          <div class="fp-principle-body">
            <div class="fp-hdr-row">
              <h2>渐进式披露</h2>
              <div class="dc-btn-group">
                <button class="dc-btn" data-action="disclosure-1">第一层披露<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <button class="dc-btn" data-action="disclosure-2">第二层披露<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <button class="dc-btn" data-action="disclosure-3">第三层披露<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                <button class="dc-btn" data-action="disclosure-4">第四层披露<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              </div>
            </div>
            <p>结果、过程、原始信息不在信息流中混排避免信息过载；用不同的容器收纳不同深度信息，用户按需追溯下钻。</p>
            <ul>
              <li>思考、执行、结果三者分层收纳，不混排</li>
              <li>越上层越产品化易读，越下层越原始化真实</li>
              <li>错误也分层：结果层看影响，概览层看位置，节点层看是否恢复</li>
            </ul>
          </div>
        </div>

        <div class="fp-principle-card">
          <div class="fp-principle-number">3</div>
          <div class="fp-principle-body">
            <h2>任务语言优先</h2>
            <p>外层用任务语义表达，里层呈现原始细节；用户首先看到做了什么任务，追溯下去能看到调用了什么接口。</p>
            <ul>
              <li>节点用"理解任务""搜索信息""生成图片"等语义命名，而非 tool_call_1、web_search</li>
              <li>工具调用作为下钻信息，不是默认主线</li>
            </ul>
          </div>
        </div>

        <div class="fp-principle-card">
          <div class="fp-principle-number">4</div>
          <div class="fp-principle-body">
            <div class="fp-hdr-row">
              <h2>主动对齐，人在回路</h2>
              <div class="dc-btn-group">
                <button class="dc-btn" data-action="ask-user">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.3"/><path d="M6.5 6a1.5 1.5 0 113 0c0 1-1.5 1.5-1.5 2.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="8" cy="11" r=".6" fill="currentColor"/></svg>
                  询问用户
                </button>
                <button class="dc-btn" data-action="request-permission">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5.5 7V4.5a2.5 2.5 0 015 0V7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
                  请求权限
                </button>
              </div>
            </div>
            <p>Agent 在关键节点主动暂停并向用户确认，而非自作主张执行到底；用户始终保有介入、修改、终止的控制权。</p>
            <ul>
              <li>信息型结果优先，行动型/高风险确认优先</li>
              <li>运行可暂停，失败可重试，确认可允许/拒绝</li>
              <li>长任务保持推进感知，不显示空洞的"正在处理"</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>核心反模式</h2>
        <table>
          <thead>
            <tr>
              <th>反模式</th>
              <th>问题</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>过程污染结果</td><td>工具调用、错误、日志直接堆在主对话流里，用户找不到结果</td></tr>
            <tr><td>完全黑盒</td><td>只显示"正在处理"，最后直接给结果，过程不可信</td></tr>
            <tr><td>假透明</td><td>展示看似过程的信息，但无法下钻到真实过程，高级用户不信任</td></tr>
            <tr><td>工具名主导叙事</td><td>用户任务拆成一堆 API 名称，产品像开发者工具</td></tr>
            <tr><td>思考/执行/结果混排</td><td>三类信息混在同一信息流，用户分不清哪些是结论、哪些是行动、哪些是内部分析</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>一句话结论</h2>
        <blockquote class="fp-conclusion-quote">
          结果在前，过程在后；摘要在前，原始在后；用户语言在前，工具细节在后；关键节点主动确认；失败过程保留追溯；最终交付能够验收。
        </blockquote>
      </section>
    </article>`,
};
