// ============================================================
// APPROVE-PERMISSION — 批准权限交互设计文档
// ============================================================
// 快照：由 engine/approve-permission.js 的 renderStaticApprovePermission() 实时渲染
//       改左边组件样式 → 右边文档自动同步
// ============================================================

import { renderStaticApprovePermission } from '../engine/approve-permission.js';

// ── 样例数据（与 scenario.js 中 approvePermission data 一致）──
const SAMPLE_DATA = {
  title: '确认需要删除文件？',
  warning: '高风险操作，涉及文件删除',
  description: '检测到 generate_plan.js 文件存在编码异常，需要删除后重新创建。确认后，我将执行 rm 命令删除该文件。',
  options: ['允许', '本次会话内始终允许该类命令', '拒绝，保持在沙箱内'],
  selectedIndex: null,
};

// ── 预渲染快照（lazy）─────────────────────────
const snapCache = {};
function snap(key, data) {
  if (!snapCache[key]) snapCache[key] = renderStaticApprovePermission(data);
  return snapCache[key];
}

function getSnapshots() {
  return {
    anatomy: snap('anatomy', SAMPLE_DATA),
  };
}

// 实际 node 索引
const STEP_APPROVE = 2;   // n3
const APPROVE_ACTION_OFFSET = 9;  // approvePermission action 在 n3 中的 normalized 索引

export default {
  id: 'approve-permission',
  type: 'feature',
  label: '批准权限',
  anchors: {
    'show-card': {
      nodeIndex: STEP_APPROVE,
      actionOffset: APPROVE_ACTION_OFFSET,
      until: () => {
        const card = document.querySelector('.ap-card');
        return !!card;
      },
      label: '看权限批准卡片',
    },
  },
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>批准权限</h1>
        <p class="fp-subtitle">高风险操作时，agent 向用户请求批准的交互组件</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>批准权限是 agent 在执行高风险操作（如文件删除、命令执行）前，<strong>暂停输出并向用户请求批准</strong>的对话内嵌组件。</p>
        <h3>使用场景</h3>
        <ul>
          <li>agent 需要执行涉及文件删除/修改的高风险操作</li>
          <li>系统权限不足，需要用户显式授权</li>
          <li>跨沙箱操作，需用户确认</li>
        </ul>
        <h3>设计目标</h3>
        <p>让高风险操作前的"审批"环节轻量透明——用户点任意选项即刻放行，不打断持续流。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 卡片构成</h2>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">完整卡片</span>
            <div class="fp-snapshot">${s.anatomy}</div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>批准权限卡片自上而下三层结构：</p>
            <p><strong>① 标题</strong> — 描述需要批准的操作</p>
            <p><strong>② 警告区</strong> — 红色风险等级 + 灰色操作详情</p>
            <p><strong>③ 选项列表</strong> — 3 个单选路径，点击任一即放行</p>
          </div>
        </div>
        <blockquote>
          <p>点击任意选项 → 直接 resolve 并继续。选项无选中态停留，卡片在点击后随即消失。无二次确认，无取消。</p>
        </blockquote>
      </section>

      <section data-section="rationale">
        <h2>3. 设计原理</h2>
        <h3>为什么点任意选项都放行</h3>
        <p>三个选项本质上是"风险感知梯度"：从完全放行到拒绝，覆盖用户对风险的不同接受程度。无论选哪个，系统都完成了一次授权决策——不需要再用二次确认加重用户负担。</p>
        <h3>为什么没有"提交"按钮</h3>
        <p>选项本身就是决策。单选一选即达明确意图，额外按钮只会增加一个点击步骤。点击即决议，符合"轻量审批"的设计目标。</p>
      </section>

      <section data-section="edge-cases">
        <h2>4. 边界与异常</h2>
        <ul>
          <li><strong>快速双击选项</strong>：第一次点击已 resolve，第二次点击时卡片已隐藏，无副作用</li>
          <li><strong>同时打开多个审批</strong>：同一时间只有一个 approval 卡片可见，先到先得</li>
        </ul>
      </section>

      <section data-section="demo-cta">
        <button class="dc-btn" data-anchor="show-card">在左侧Demo查看示例<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </section>
    </article>`;
  },
};
