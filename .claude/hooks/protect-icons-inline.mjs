#!/usr/bin/env node
// PreToolUse hook：保护 icons-inline.js 不被手动修改
// 该文件是自动生成的 SVG 内联仓库（约 28KB），任何手动编辑都会在下次重新生成时被覆盖。
// 触发工具：Edit / Write / MultiEdit
// 命中规则：目标文件路径以 icons-inline.js 结尾时，拦截（exit code 2）。

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw || '{}');
  } catch (e) {
    // 解析失败时不阻断正常流程，放行
    process.exit(0);
  }

  const toolInput = input.tool_input || {};
  // 不同工具的路径字段可能是 file_path，MultiEdit 也用 file_path
  const filePath = toolInput.file_path || toolInput.path || '';

  if (typeof filePath === 'string' && /(^|\/)icons-inline\.js$/.test(filePath)) {
    console.error(
      '⛔ 已拦截：icons-inline.js 是自动生成的图标仓库，禁止手动修改。\n' +
      '   任何手改都会在下次重新生成时被覆盖。\n' +
      '   如需增删图标，请修改图标的“源头”而非这个内联产物。'
    );
    process.exit(2); // exit 2 = 阻断该工具调用，并把 stderr 反馈给模型
  }

  process.exit(0);
});
