# 05 · beats 清单（附录 C）

> 完整 63 个 beats 顺序表，scenario JSON 的 `beats[]` 1:1 对照本表。
> 每个 beat 都对应到 [02-节点剧本.md](./02-节点剧本.md) 第八/九/十/十一节的小数序号。
> 
> 相邻文件：[← 04 内容标准库](./04-内容标准库.md) · [00 索引 →](./00-索引.md)

---

## 附录 C · 完整 beats 清单（scenario 编排参考）

> 全 demo 共 **63 个最小子事件 = 63 个 beats**。每个 beat 一行 rail。

```
b00  user-bubble                       用户气泡

b01  agent-enter                       agent-header 出现
b02  think-start                       「正在思考 ›」+ 扫光开
b03  think-md-1                        浮层思考 markdown 第 1 段打字机
b04  think-md-2                        浮层思考 markdown 第 2 段打字机
b05  think-done                        「思考过程 ›」 + 扫光关

b06  step1-enter                       节点1 头出现（spinner）
b07  step1-todo-start                  「正在创建待办 ›」+ 扫光开 + 待办①🔄
b08  step1-todo-done                   「创建待办 ›」 + 扫光关 + 待办①✅
b09  step1-md-h2                       节点内 md：h2「任务理解与分解」
b10  step1-md-goal                     节点内 md：目标段
b11  step1-md-cons                     节点内 md：关键约束 + 列表
b12  step1-md-tbl                      节点内 md：子任务分解 + 表格
b13  step1-search-start                「正在搜索网页 ›」+ 扫光开 + 待办②🔄
b14  step1-search-2done                浮层切帧：②✅ ③🔄
b15  step1-search-3done                浮层切帧：③✅ ④🔄
b16  step1-search-4done                浮层切帧：④✅ ⑤🔄
b17  step1-search-5done                浮层切帧：⑤✅
b18  step1-search-end                  「搜索网页 ›」 + 扫光关
b19  step1-collapse                    节点1 自动塌缩

b20  step2-enter                       节点2 头出现（spinner）
b21  step2-md                          节点内 md：「现在生成关西主要地点的图片：」
b22  step2-img-start                   「正在生成图片 ›」+ 扫光开 + 待办⑥🔄
b23  step2-img-1                       浮层切帧：+ 🖼️ 生成图片
b24  step2-img-2                       浮层切帧：+ 🖼️ 生成图片
b25  step2-img-end                     「生成图片 ›」 + 扫光关 + 待办⑥✅
b26  step2-update-start                「正在更新待办 ›」+ 扫光开 + 待办⑦🔄 + ☑️ 更新待办事件块
b27  step2-update-end                  「更新待办 ›」 + 扫光关
b28  step2-collapse                    节点2 自动塌缩

b29  step3-enter                       节点3 头出现（spinner）

b30  step3-skill-start                 「正在调用技能 ›」+ 扫光开
b31  step3-skill-show                  浮层切帧：📖 调用技能 docx + 描述卡片
b32  step3-skill-end                   「调用技能 ›」 + 扫光关

b33  step3-file-start                  「正在创建文件 ›」+ 扫光开
b34  step3-file-fail                   浮层切帧：⚠️ 文件创建失败
b35  step3-file-create                 浮层切帧：+ ✏️ 创建文件
b36  step3-file-read                   浮层切帧：+ 👀 读取文件
b37  step3-file-edit                   浮层切帧：+ ✏️ 编辑文件
b38  step3-file-end                    「创建文件 ›」 + 扫光关

b39  step3-search-start                「正在搜索文件 ›」+ 扫光开
b40  step3-search-do                   浮层切帧：🔍 搜索文件 \\u81EA\\u7136…
b41  step3-search-edit                 浮层切帧：+ ✏️ 编辑文件
b42  step3-search-end                  「搜索文件 ›」 + 扫光关
b43  step3-md-1                        节点内 md：「这个文件里还残留 ))) 字符…」

b44  step3-cmd-start                   「正在执行命令 ›」+ 扫光开
b45  step3-cmd-1                       浮层切帧：🖥️ 执行命令 python3 -c "
b46  step3-cmd-2                       浮层切帧：+ 🖥️ 执行命令 cd /sessions/…
b47  step3-cmd-3                       浮层切帧：+ 🖥️ 执行命令 python3 -c "
b48  step3-cmd-end                     「执行命令 ›」 + 扫光关
b49  step3-md-2                        节点内 md：「没有成功……」

b50  step3-sub-start                   「正在委派 Subagent ›」+ 扫光开
b51  step3-sub-card                    浮层切帧：🐱 Sub Coding Agent 卡片
b52  step3-sub-nest                    浮层切帧：嵌套子对话流整体出现
b53  step3-sub-end                     「委派 Subagent ›」 + 扫光关
b54  step3-md-3                        节点内 md：「文档已成功生成！让我更新进度」

b55  step3-update-start                「正在更新待办 ›」+ 扫光开 + ☑️ 更新待办事件块
b56  step3-update-allcheck             浮层切帧：待办⑦ ✅（全部 ✅）
b57  step3-update-end                  「更新待办 ›」 + 扫光关

b58  step3-collapse                    节点3 自动塌缩

b59  timing-bar                        timing-bar 出现「任务耗时 19m 40s」
b60  summary-h2                        外层正文 md：h2「总结」
b61  summary-p                         外层正文 md：「所有任务已完成！…」
b62  summary-link                      链接卡片：「查看日本关西家庭旅行方案 v1.0」
```

> 总计 63 个 beats（含 b00 用户气泡 + b62 链接卡片）。
> 每个 beat 都对应到 [02-节点剧本.md](./02-节点剧本.md) 第八/九/十/十一节的小数序号。
> Scenario JSON 的 `beats[]` 长度 = 63，每条 beat 含 `id` / `mount` / `tpl` / `data` / `anim` / `sheetSnapshot`（可选）/ `todoState`（可选）字段。

---

## beat → 章节 / 浮层模板速查

| beats 区间  | 章节                                                      | 涉及浮层模板                                                                                                                                                                                                                                                  |
| --------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| b00       | —                                                       | —                                                                                                                                                                                                                                                       |
| b01 ~ b05 | [§ 七 思考过程](./01-基础规则.md#七思考过程详解独立大段不属于任何节点)             | [A.1](./04-内容标准库.md#a1--思考过程浮层)                                                                                                                                                                                                                         |
| b06 ~ b19 | [§ 八 节点1](./02-节点剧本.md#八节点1--任务理解与分解--完整最小子事件序列)        | [A.2](./04-内容标准库.md#a2--创建待办浮层) / [A.3](./04-内容标准库.md#a3--搜索网页浮层)                                                                                                                                                                                       |
| b20 ~ b28 | [§ 九 节点2](./02-节点剧本.md#九节点2--生成关西主要地点图片--完整最小子事件序列)     | [A.4](./04-内容标准库.md#a4--生成图片浮层) / [A.5.1](./04-内容标准库.md#a5--更新待办浮层节点2-末--节点3-末复用同一标题但事件块和待办状态不同)                                                                                                                                                        |
| b29 ~ b58 | [§ 十 节点3](./02-节点剧本.md#十节点3--整合信息输出完整旅行方案文档--完整最小子事件序列) | [A.6](./04-内容标准库.md#a6--调用技能浮层) / [A.7](./04-内容标准库.md#a7--创建文件浮层含异常处理) / [A.8](./04-内容标准库.md#a8--搜索文件浮层) / [A.9](./04-内容标准库.md#a9--执行命令浮层) / [A.10](./04-内容标准库.md#a10--委派-subagent-浮层) / [A.5.2](./04-内容标准库.md#a5--更新待办浮层节点2-末--节点3-末复用同一标题但事件块和待办状态不同) |
| b59 ~ b62 | [§ 十一 收尾段](./02-节点剧本.md#十一收尾段)                          | —                                                                                                                                                                                                                                                       |

---

> 回到 [00 索引](./00-索引.md)
