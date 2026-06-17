// ============================================================
// FEATURES INDEX — 注册中心
// ============================================================
// 此文件是导航的唯一真相源。
// 加新 feature：建 features/<id>.js，在此 import 并加进 list 数组。
// 数组顺序 = 下拉菜单顺序（overview 必须在第一位）。
// ============================================================

import principles from './principles.js';
import infoArch from './info-arch.js';
import askQuestion from './ask-question.js';
import scrollNav from './scroll-nav.js';
import toolCallNode from './tool-call-node.js';

export const featureList = [
  principles,
  infoArch,
  askQuestion,
  toolCallNode,
  scrollNav,
];

// 按 id 快速查表
export const featureMap = Object.fromEntries(
  featureList.map((f) => [f.id, f])
);

export function getFeature(id) {
  return featureMap[id] || null;
}
