// ============================================================
// FEATURES INDEX — 注册中心
// ============================================================
// 此文件是导航的唯一真相源。
// 加新 feature：建 features/<id>.js，在此 import 并加进 list 数组。
// 数组顺序 = 下拉菜单顺序（overview 必须在第一位）。
// ============================================================

import askQuestion from './ask-question.js';
import principles from './principles.js';

export const featureList = [
  askQuestion,
  principles,
];

// 按 id 快速查表
export const featureMap = Object.fromEntries(
  featureList.map((f) => [f.id, f])
);

export function getFeature(id) {
  return featureMap[id] || null;
}
