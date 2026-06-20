// 集成检查脚本：验证 player.js 拆分后所有 import 能正确解析
// 只做静态 import 验证，不运行实际逻辑

import { openSheet, closeSheet, maybeClose, goBackInSheet } from './sheet.js';
import {
  scenario, state, panelRoots,
  toDoneLabel, setComposerGenerating,
} from './player-state.js';
import {
  showUserMessage, showAgentShell, showThinkingLoading,
  runStatusGroup, runFlatAction, runThinkingStatus,
  resetPlaybackDom, renderStaticPreChat,
  toggleStep, toggleExec, toggleSteps,
  setupNavMeta,
} from './player-dom.js';
import { renderFinal } from './player-final.js';
import {
  setupDemoControls, syncToolCallStyleUI, toggleToolCallStyle,
} from './player-ui.js';

// 验证所有函数/变量存在
const checks = [
  ['openSheet', typeof openSheet === 'function'],
  ['closeSheet', typeof closeSheet === 'function'],
  ['maybeClose', typeof maybeClose === 'function'],
  ['goBackInSheet', typeof goBackInSheet === 'function'],
  ['scenario', scenario !== undefined],
  ['state', state !== undefined],
  ['panelRoots', panelRoots !== undefined],
  ['toDoneLabel', typeof toDoneLabel === 'function'],
  ['setComposerGenerating', typeof setComposerGenerating === 'function'],
  ['showUserMessage', typeof showUserMessage === 'function'],
  ['showAgentShell', typeof showAgentShell === 'function'],
  ['showThinkingLoading', typeof showThinkingLoading === 'function'],
  ['runStatusGroup', typeof runStatusGroup === 'function'],
  ['runFlatAction', typeof runFlatAction === 'function'],
  ['runThinkingStatus', typeof runThinkingStatus === 'function'],
  ['resetPlaybackDom', typeof resetPlaybackDom === 'function'],
  ['renderStaticPreChat', typeof renderStaticPreChat === 'function'],
  ['toggleStep', typeof toggleStep === 'function'],
  ['toggleExec', typeof toggleExec === 'function'],
  ['toggleSteps', typeof toggleSteps === 'function'],
  ['setupNavMeta', typeof setupNavMeta === 'function'],
  ['renderFinal', typeof renderFinal === 'function'],
  ['setupDemoControls', typeof setupDemoControls === 'function'],
  ['syncToolCallStyleUI', typeof syncToolCallStyleUI === 'function'],
  ['toggleToolCallStyle', typeof toggleToolCallStyle === 'function'],
];

let allPass = true;
for (const [name, ok] of checks) {
  if (ok) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}`);
    allPass = false;
  }
}

console.log(`\n${allPass ? '✅ 全部通过' : '❌ 存在失败项'}`);
process.exit(allPass ? 0 : 1);
