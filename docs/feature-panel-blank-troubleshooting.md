# Feature Panel 空白故障排查手册

**症状**：页面加载后，右侧 Feature Panel（交互说明区域）完全空白（白屏），不显示任何 feature 内容。

**本文目标**：按优先级排列的排查清单，下次出现空白时，按清单顺序检查，快速定位根因。

---

## 排查清单（按优先级）

### 1. 浏览器 Console 是否有 JS 错误

**操作**：打开 http://localhost:8080 → F12 → Console 标签页

**常见错误与对应根因**：

| Console 错误信息 | 根因 | 修复方向 |
|----------------|-------|----------|
| `Failed to load module script: Expected a JavaScript module script` + 404 | 某个 `engine/*.js` 或 `features/*.js` 文件路径错误，或文件不存在 | 检查 `index.html` 和 `features/index.js` 中的 import 路径 |
| `SyntaxError: Unexpected token` / `Unexpected end of input` | 某个 JS 文件有语法错误（少了 `}`、`)`、`}` 等） | 用 `node --check <file>` 逐个检查近期改动过的 JS 文件 |
| `ReferenceError: XXX is not defined` | 某个全局变量/函数未定义 | 检查是否漏 import，或函数名拼写错误 |
| 无任何错误，但面板仍空白 | 逻辑错误（如本文遇到的 if/else if 链断裂） | 见下方「逻辑层排查」 |

---

### 2. `renderRoute()` 的 if/else if 链是否完整

**根因背景**：`engine/feature-panel.js` 的 `renderRoute(route)` 函数使用 if/else if 链来分发不同 feature 的渲染逻辑。如果任何一个分支的 `else if` 守卫被意外删除或提前闭合，后续所有分支都会变成死代码。

**本文案例（2026-06-28）**：
```
// 修复前（错误）：scroll-nav 分支后多了一个 `}`，且 code-block 分支的 else if 被删
} else if (f.id === 'scroll-nav') {
  // ... scroll-nav 逻辑
  }
}                    // ← 这行是多余的，提前闭合了 renderRoute 函数
  // 左侧 Demo 渲染代码块 showcase...  ← 这行变成了全局代码，不是任何分支
  renderShowcase();                         // 永远不会执行
```

**排查步骤**：

1. 打开 `engine/feature-panel.js`
2. 搜索 `async function renderRoute`
3. 检查从 `if (f.type === 'overview')` 开始，到函数结束，每个 feature 分支是否都有正确的 `else if (f.id === 'xxx')` 守卫
4. 重点检查近期改动过的区域——是否多/少了 `{` 或 `}`

**快速验证**：在 `renderRoute()` 函数结尾（最后一个 `}` 前）加一行 `console.log('renderRoute end, f.id:', f.id)`，加载页面，看 Console 是否打印。如果不打印，说明函数在某个分支提前 return 或异常退出。

---

### 3. `features/index.js` 的导入是否全部成功

**根因背景**：`features/index.js` 使用 ES Module `import` 静态导入所有 feature 模块。如果任何一个被导入的模块有语法错误，整个 `featureList` 数组无法创建，导致面板空白。

**排查步骤**：

```bash
# 检查所有 feature 模块的语法
for f in features/*.js; do
  node --check "$f" 2>&1 | sed "s/^/$f: /"
done
```

如果有输出，说明对应文件有语法错误。

**常见错误**：
- 文件末尾少了 `};`（module.exports 对象没闭合）
- 对象属性之间少了 `,`
- 字符串没闭合（少了 `"` 或 `'`）
- 注释掉的代码里含有 `` ``` ``（Markdown 代码块标记），如果被 JS 引擎解析会报错

---

### 4. `initFeaturePanel()` 是否被调用

**根因背景**：`index.html` 中通过 `<script type="module">` 导入并调用 `initFeaturePanel()`。如果这个调用失败，面板不会初始化。

**排查步骤**：

1. 打开 `index.html`
2. 搜索 `initFeaturePanel`
3. 确认有类似以下代码：
   ```html
   <script type="module">
     import { initFeaturePanel } from './engine/feature-panel.js';
     initFeaturePanel();
   </script>
   ```
4. 在 `initFeaturePanel()` 函数开头加 `console.log('initFeaturePanel called')`，刷新页面，看 Console 是否打印

---

### 5. URL 路由是否正确

**根因背景**：`engine/feature-panel.js` 通过 URL 路由决定渲染哪个 feature（`?feature=xxx`）。如果 URL 中没有 `?feature=` 参数，可能默认渲染 overview，但如果 overview 分支也有问题，就会空白。

**排查步骤**：

1. 检查 URL 是否包含 `?feature=xxx` 参数
2. 如果没有，手动加上 `?feature=overview` 或 `?feature=ask-question`，看面板是否渲染
3. 打开 `engine/feature-router.js`，检查 `parseURL()` 函数是否正常工作

---

### 6. `design-notes-inner` 元素是否存在

**根因背景**：`engine/feature-panel.js` 通过 `document.getElementById('design-notes-inner')` 获取右侧面板的容器元素。如果 `index.html` 中这个元素被意外删除或 ID 改了，内容无法挂载。

**排查步骤**：

1. F12 → Elements 标签页
2. 搜索 `design-notes-inner`
3. 确认元素存在且没有被 `display: none` 隐藏

---

## 本次故障完整复盘（2026-06-28）

### 故障现象
右侧 Feature Panel 完全空白，不显示任何 feature 内容。

### 根因
`commit b475970d`（「fix(engine/feature-panel): 修复 renderRoute 中 scroll-nav 分支重复及异步错误」）在修复 scroll-nav 分支重复问题时，**误删了 `else if (f.id === 'code-block') {` 这一行**，同时在 scroll-nav 分支末尾多了一个 `}`。

这导致 `renderRoute()` 的 if/else if 链在 scroll-nav 分支后提前闭合，code-block 及后续所有 feature 分支变成死代码。

### 修复
```diff
@@ -511,7 +511,7 @@ async function renderRoute(route) {
       await jumpToAnchor(anchor);
       if (token !== loadToken) hideOverlays();
     }
-      }
+  } else if (f.id === 'code-block') {
     // 左侧 Demo 渲染代码块 showcase...
```

### 教训
1. **修改 if/else if 链时，必须同时检查 `{` 和 `}` 的匹配**——删了一行 `else if`，但没删对应的 `}`，或删了 `}` 但没删对应的 `else if`，都会破坏结构
2. **用 `node --check` 做语法检查还不够**——它能发现语法错误，但发现不了逻辑错误（如 if/else if 链断裂）
3. **下次再遇到面板空白，第一步就是检查 `renderRoute()` 的 if/else if 链是否完整**

---

## 快速诊断脚本（TODO）

未来可以写一个自动化诊断脚本，自动检查以上所有项目，输出诊断报告。

**构思**：
```bash
# 伪代码
check_feature_panel() {
  echo "=== Feature Panel 空白诊断 ==="
  echo "1. 检查所有 JS 文件语法..."
  # for f in engine/*.js features/*.js; do node --check $f; done

  echo "2. 检查 renderRoute() if/else if 链..."
  # 解析 feature-panel.js，检查每个 feature id 是否都有对应的 else if 分支

  echo "3. 检查 features/index.js 导入..."
  # 解析 index.js，确认每个 import 的文件都存在

  echo "4. 检查 design-notes-inner 元素..."
  # 解析 index.html，确认元素存在
}
```

**优先级**：低（手动排查也不慢，且能发现更多上下文信息）
