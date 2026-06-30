// ============================================================
// OVERVIEW — 设计思考（v1 占位）
// ============================================================
// type:    'overview'
// id:      'overview'
// label:   下拉菜单显示名
// anchors: 总览页无锚点（不挂跳转）
// content: HTML 模板字符串（直接渲染到右侧栏）
// ============================================================

export default {
  id: 'overview',
  type: 'overview',
  label: '设计思考（总览）',
  anchors: {},
  content: `
    <div class="fp-overview">
      <h1>设计思考</h1>
      <p class="fp-lead">这里将放置项目级的设计思考——为什么做这个 demo、设计立场、节奏判断。</p>
      <div class="fp-placeholder-block">
        <p class="fp-placeholder-label">（占位内容，待补充）</p>
        <p>正式版本撰写中。当前以 AskQuestion 作为完整范例先跑通整套链路，待框架稳定后再回填总览的正式内容。</p>
      </div>
      <h2>本系统是什么</h2>
      <p>这是一份"带交互演示的设计交付物"。同一个链接，不同设备自动适配：</p>
      <ul>
        <li><strong>手机打开</strong>：纯 demo 全屏，可直接体验</li>
        <li><strong>电脑打开</strong>：左 demo + 右说明，可一边操作一边阅读</li>
      </ul>
      <p>右侧的功能 tab 会逐步补全。当前可点上方下拉菜单切到 <strong>AskQuestion</strong> 查看完整范例。</p>
    </div>
  `,
};
