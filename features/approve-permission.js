// © Joseph Deng — WorkBuddy 动态原型 · https://github.com/dwf89044485
// ============================================================
// APPROVE-PERMISSION — 批准权限交互设计文档（图文并茂版）
// ============================================================
// 内容来源：engine/approve-permission.js（交互逻辑）、styles/approve-permission.css（样式）
// 快照：由 engine/approve-permission.js 的 renderStaticApprovePermission() 实时渲染
//       改左边组件样式 → 右边文档自动同步
// ============================================================

import { renderStaticApprovePermission } from '../engine/approve-permission.js';

// ── 样例数据：两种形态 ──────────────────────────
const SAMPLE_HIGH_RISK = {
  title: '确认需要删除文件？',
  warning: '高风险操作，涉及文件删除',
  description: '检测到 generate_plan.js 文件存在编码异常，需要删除后重新创建。确认后，我将执行 rm 命令删除该文件。',
  options: ['允许', '本次会话内始终允许该类命令', '拒绝，保持在沙箱内'],
  selectedIndex: null,
};

const SAMPLE_NORMAL = {
  title: '确认执行命令？',
  warning: '',  // 普通命令执行，无警告行
  description: '需要执行 git push origin main 将当前变更推送到远程仓库。',
  options: ['允许', '本次会话内始终允许该类命令', '拒绝'],
  selectedIndex: null,
};

// ── 选中态样本 ──────────────────────────
const SAMPLE_SELECTED = {
  ...SAMPLE_HIGH_RISK,
  selectedIndex: 0,
};

// ── 边界异常样本数据 ──────────────────────────
const LONG_TITLE = {
  title: '确认需要执行以下高风险的系统级操作命令，该操作可能会影响系统稳定性并需要管理员权限才能继续执行？',
  warning: '高风险操作，涉及系统配置修改',
  description: '执行此操作前请确保已备份重要数据，并确认当前环境允许此类操作。',
  options: ['允许', '拒绝'],
  selectedIndex: null,
};

const LONG_DESC = {
  title: '确认执行命令？',
  warning: '高风险操作',
  description: '检测到当前操作需要修改系统核心配置文件 /etc/hosts 并重启网络服务，此过程可能会导致短暂的网络中断，请确认您当前不处于远程 SSH 会话中，否则可能会导致连接断开。确认后将继续执行后续操作。',
  options: ['允许', '拒绝'],
  selectedIndex: null,
};


// ── 快照缓存 ──────────────────────────
const snapCache = {};
function snap(key, data) {
  if (!snapCache[key]) snapCache[key] = renderStaticApprovePermission(data);
  return snapCache[key];
}

function getSnapshots() {
  return {
    // §2 构成：两种形态的完整卡片
    anatomyHighRisk: snap('anatomyHighRisk', SAMPLE_HIGH_RISK),
    anatomyNormal:   snap('anatomyNormal',   SAMPLE_NORMAL),

    // §3 变体：高风险（+ 警告）vs 普通（无警告）
    // 已在 §2 中覆盖，此处复用

    // §4 交互状态
    defaultState: snap('defaultState', SAMPLE_HIGH_RISK),
    selectedState: snap('selectedState', SAMPLE_SELECTED),

    // §5 动效演示
    motionRiseFall: snap('motionRiseFall', SAMPLE_HIGH_RISK),

    // §6 边界异常
    edgeLongTitle:   snap('edgeLongTitle',   LONG_TITLE),
    edgeLongDesc:    snap('edgeLongDesc',    LONG_DESC),
  };
}

// ── 辅助：带标签的快照块 ──────────────────────────
function labeled(label, html, anchorId, desc) {
  const anchorBtn = anchorId
    ? `<button class="fp-anchor-btn" data-anchor="${anchorId}" style="margin-left:auto;font-size:12px;padding:5px 10px">查看示例</button>`
    : '';
  const descHtml = desc ? `<span style="color:#86868b;font-size:13px">${desc}</span>` : '';
  const rightPart = descHtml + anchorBtn;
  return `<div class="fp-snapshot-wrap"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span class="tag">${label}</span>${rightPart}</div><div class="fp-snapshot">${html}</div></div>`;
}

// 实际 node 索引：nodes[2]（n3，scenario.js 第 591 行，含 approvePermission action）
// nodeIndex 由 feature-jump.js 通过 resolveNodeStep() 换算为 director timeline 索引
// actionOffset=5：approvePermission action 在 n3 中的 normalized 索引（前 5 个 action 为 status/status/status/markdown/status）
const STEP_APPROVE = 2;
const APPROVE_ACTION_OFFSET = 5;

export default {
  id: 'approve-permission',
  type: 'feature',
  label: '批准权限',
  anchors: {
    'show-card': {
      nodeIndex: STEP_APPROVE,
      actionOffset: APPROVE_ACTION_OFFSET,
      isApprovePermission: true,
      until: () => {
        const card = document.querySelector('.ap-card');
        return !!card;
      },
      label: '看权限批准卡片',
    },
  },
  // getter 确保每次读取都重新计算
  get content() {
    const s = getSnapshots();
    return `
    <article class="fp-feature">
      <header class="fp-feature-header">
        <h1>批准权限</h1>
        <p class="fp-subtitle">高风险操作前，agent 向用户请求批准的交互组件</p>
      </header>

      <section data-section="overview">
        <h2>1. 概述</h2>
        <h3>定义</h3>
        <p>批准权限是 agent 在执行高风险操作前，<strong>暂停输出并向用户请求批准</strong>的对话内嵌组件。它替换掉输入栏的位置出现，用户完成批准决策后，agent 继续执行。</p>
        <h3>使用场景</h3>
        <ul>
          <li>agent 需要执行涉及文件删除/修改的高风险操作</li>
          <li>agent 需要执行系统命令，可能存在副作用</li>
          <li>跨沙箱操作，需用户显式授权</li>
        </ul>
        <h3>设计目标</h3>
        <p>审批环节<strong>足够醒目（操作不可逆），又足够轻量</strong>（不是任务目标，只是继续前行的必经步骤）。卡片出现即打断，点击任意选项即刻放行。</p>
      </section>

      <section data-section="anatomy">
        <h2>2. 卡片构成</h2>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <span class="tag">完整卡片（高风险形态）</span>
            <div class="fp-snapshot">${s.anatomyHighRisk}</div>
            <button class="fp-anchor-btn" data-anchor="show-card" style="margin-top:12px">看左侧 Demo 示例</button>
          </div>
          <div class="fp-snapshot-side-desc">
            <h4>① 标题</h4>
            <blockquote>
              <p>用问句描述需要批准的操作，明确告知用户这是一个需要回答的节点。</p>
            </blockquote>

            <h4>② 警告区（仅高风险形态）</h4>
            <blockquote>
              <p>仅高风险形态显示，红色文字标注风险类型。普通命令不显示此行。</p>
            </blockquote>

            <h4>③ 操作描述</h4>
            <blockquote>
              <p>说明 agent 具体要做什么、为什么要这样做。这是用户判断"要不要批准"的主要依据。</p>
            </blockquote>

            <h4>④ 选项列表</h4>
            <blockquote>
              <p>三个选项覆盖"放行 → 永久放行 → 拒绝"的梯度。点击任一即决议，无二次确认，无取消按钮。</p>
            </blockquote>
          </div>
        </div>
      </section>

      <section data-section="variants">
        <h2>3. 两种形态</h2>
        <p>根据操作风险等级，卡片有两种视觉形态。核心差异在警告区：</p>
        <div class="fp-snapshot-row">
          <div class="fp-snapshot-wrap">
            <span class="tag">高风险形态</span>
            <p style="color:#86868b;font-size:12px;margin:0 0 8px">涉及文件删除、系统配置修改等，<strong style="color:#a8071a">标题下方出现红色告警提醒</strong></p>
            <div class="fp-snapshot">${s.anatomyHighRisk}</div>
          </div>
          <div class="fp-snapshot-wrap">
            <span class="tag">普通命令形态</span>
            <p style="color:#86868b;font-size:12px;margin:0 0 8px">git push、npm install 等</p>
            <div class="fp-snapshot">${s.anatomyNormal}</div>
          </div>
        </div>
      </section>

      <section data-section="interaction">
        <h2>4. 交互与状态</h2>
        <p>批准权限的交互极其简洁：用户看到卡片 → 点击一个选项 → 300ms 后卡片消失 → agent 继续执行。没有多步操作，没有翻页，没有取消。</p>

        <h3>4.1 默认态 → 选中态</h3>
        <div class="fp-snapshot-row">
          ${labeled('默认（未选）', s.defaultState)}
          ${labeled('已选（选中第 1 项）', s.selectedState)}
        </div>
        <blockquote>
          <p><strong>交互</strong>：点击选项 → 该选项进入选中态 → <strong style="color:#a8071a">停留 300ms 让用户感知已选</strong> → 卡片向下滑出并消失。</p>
        </blockquote>

      </section>

      <section data-section="motion">
        <h2>5. 动效</h2>
        <div class="fp-snapshot-side">
          <div class="fp-snapshot-wrap">
            <div class="fp-motion-stage" data-motion-loop="rise-fall-ap">
              ${s.motionRiseFall}
            </div>
          </div>
          <div class="fp-snapshot-side-desc">
            <p>卡片从屏幕下缘滑入（300ms），点击选项后向下滑出（250ms）。入场缓动偏弹跳（到来需要存在感），出场缓动平直（用户已决策，越快离开越好）。</p>
            <p style="color:#86868b;font-size:12px">左侧演示按真实参数循环：升起 0.3s → 停留 2s → 落下 0.25s → 间隔 1s。</p>
          </div>
        </div>
      </section>

      <section data-section="edge-cases">
        <h2>6. 边界与异常</h2>
        <p>边界状态的重点是极端内容下卡片仍然可读、可操作。</p>
        <table>
          <thead>
            <tr><th>边界</th><th>体验要求</th></tr>
          </thead>
          <tbody>
            <tr><td>标题文字过长</td><td>自然换行，不压缩下方区域</td></tr>
            <tr><td>描述文字过长</td><td>自然折行，选项列表始终可见</td></tr>
          </tbody>
        </table>
        <div class="fp-snapshot-row edge-scroll">
          ${labeled('标题过长：自然换行', s.edgeLongTitle)}
          ${labeled('描述过长：自然折行', s.edgeLongDesc)}
        </div>
      </section>

      <section data-section="rationale">
        <h2>7. 设计原理</h2>
        <h3>为什么点任意选项都直接放行，没有"提交"按钮</h3>
        <p>三个选项本质上是"风险感知梯度"，不是"多选一后还要确认"。用户选"允许"是放行，选"拒绝"也是完成了一次决策——无论选哪个，系统都完成了一次授权。额外加一个"提交"按钮只会增加一个多余的点击步骤。点击即决议，符合"轻量审批"的设计目标。</p>
        <p><strong>点击即锁定，不可改选</strong>：选中后选项立即锁定（pointer-events:none），300ms 停留是"让你看清选了什么"，不是反悔窗口。这是有意的取舍——审批追求的是轻量果断，用户刚读完选项就点了，误触概率低；为极小概率的误触引入"可改选"会让每次审批都变重。代价是长期授权项（"始终允许"）同样一点就锁，接受这一点是"轻量优先"决策的一部分。</p>

        <h3>为什么没有取消/关闭出口</h3>
        <p>卡片没有 ×、没有取消键、点遮罩也不会消失——<strong>必须选一个，不选就一直挂着</strong>。这不是缺陷，是刻意的阻塞：Agent 正停在原地等答案，"稍后再说"对一个执行到一半的 Agent 没有意义——没有授权它无法安全地前进，挂着不答等于流程停摆。既然停下来等，等待期间唯一有意义的事就是给出答案，所以出口就是选项本身，"拒绝"已经覆盖了"我不想让它做"的意图，不需要第二个否定出口。</p>

        <h3>为什么三个选项的文案要体现梯度</h3>
        <p>"允许 → 本次会话内始终允许 → 拒绝"这个梯度，覆盖了用户对风险的三类典型反应：单次放行、长期信任、拒绝执行。如果只给"允许/拒绝"两个选项，用户无法表达"这个命令我信任，但这类命令以后都别再问了"的意图。多出来的第二个选项，减少的是用户后续被重复询问的打扰。</p>

        <h3>为什么选中后停留 300ms 再消失</h3>
        <p>如果点击后卡片立即消失，用户会产生"我点到没有？"的不确定性。300ms 的停留让用户用余光确认"哦，我选了第一个"，然后卡片才消失。</p>
      </section>

      <section data-section="do-dont">
        <h2>8. Do / Don't</h2>
        <div class="fp-do-dont">
          <div class="fp-do">
            <h3>Do</h3>
            <ul>
              <li>在真正需要用户授权时才使用，不要用于礼貌性确认。</li>
              <li>警告文案要具体（"涉及文件删除"），不要泛写"高风险操作"。</li>
              <li>描述区要说明"为什么要这样做"，让用户有据可依。</li>
              <li>普通命令执行使用无警告形态，不要把所有操作都标成高风险。</li>
            </ul>
          </div>
          <div class="fp-dont">
            <h3>Don't</h3>
            <ul>
              <li>不要嵌套批准权限——一次只问一件事。</li>
              <li>不要给"取消"选项——拒绝就是取消，不需要两个否定出口。</li>
              <li>不要让批准权限成为常规流程的一部分——它应该只在真正需要时出现。</li>
            </ul>
          </div>
        </div>
      </section>

      <section data-section="demo-cta">
        <button class="dc-btn" data-anchor="show-card">在左侧 Demo 查看示例<svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      </section>
    </article>`;
  },
};
