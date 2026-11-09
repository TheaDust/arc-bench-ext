# Sheet 需求打磨：第一轮

选择 Sheet：当前 26 条原子需求、104 个场景。它的工作区、公式、范围操作、结构、校验与汇总有明确的依赖关系，功能面集中，适合中等规模的实验。复杂度来自共享状态下的行为一致性。当前没有 Sheet 的 OpenCode 实验结果，因此“可能区分单会话实现”是待检验假设；支持的库或实现方式不受额外限制。

## 本轮范围

只修改需求正文与五个已有场景的步骤表述，保留所有需求、场景、步骤、标题、图片与引用身份，保持 26/104。测试和生成应用不变。本轮未调用模型或运行测试。原文存于 `validation/history/2026-11-09-keep-bookstack-observation-fixes/sheet-requirements.yaml`。

## 已明确的规则

- **ROOT**：Define stored input, calculated output, successful state and persistence before cross-feature behavior is implemented.
  原文依据：REQ-1.1.1, REQ-3.1.1, REQ-3.1.3, REQ-3.2.2, REQ-4.2.2, REQ-6.1。
- **REQ-2.2.1**：Distinguish insertion above from insertion below and use the existing stable invalid-reference error.
  原文依据：SCN-REQ-2.2.1-01, SCN-REQ-2.2.1-03, SCN-REQ-2.2.1-04, REQ-4.2.2。
- **REQ-2.2.2**：Distinguish inserting left from inserting right so the target position is deterministic.
  原文依据：SCN-REQ-2.2.2-01, SCN-REQ-2.2.2-03, SCN-REQ-2.2.2-04。
- **REQ-3.2.1**：Resolve the conflict between preserving unrelated cells and rewriting formulas outside the moved rectangle; state cut atomicity without prescribing intermediate UI writes.
  原文依据：REQ-6.1, REQ-6.2, SCN-REQ-3.2.1-03, SCN-REQ-6.1-02, SCN-REQ-6.2-01。
- **REQ-3.2.2**：Make history transaction boundaries consistent with the existing cut guards and separate data mutations from navigation.
  原文依据：SCN-REQ-3.2.2-02, SCN-REQ-3.2.2-04, SCN-REQ-3.2.2-06, SCN-REQ-3.2.2-07, SCN-REQ-6.1-01。
- **REQ-4.2.1**：Separate recalculation of values from operations that also rewrite stored references.
  原文依据：SCN-REQ-4.2.1-01, SCN-REQ-4.2.1-03, SCN-REQ-2.2.1-04, SCN-REQ-6.1-02。
- **REQ-5.1.1**：Define full-range sorting under a filter and its relation to later filter clearing without inventing a mixed-type ordering policy.
  原文依据：SCN-REQ-5.1.1-03, SCN-REQ-5.1.1-04, SCN-REQ-5.1.1-05。
- **REQ-5.1.2**：Resolve the original-order wording against the existing sort-while-filtered scenario.
  原文依据：SCN-REQ-5.1.1-04, SCN-REQ-5.1.2-01, SCN-REQ-5.1.2-03。
- **REQ-5.3.1**：Distinguish tentative editor choices from the last applied pivot definition and distinguish explicit refresh from live formula recalculation.
  原文依据：SCN-REQ-5.3.1-02, SCN-REQ-5.3.1-05, SCN-REQ-5.3.1-07, SCN-REQ-5.3.1-08。

## 场景自包含

- SCN-REQ-1.3.1-01：以完整输入的解码单元格和明确坐标描述结果，不再引用隐藏测试中“被断言的位置”。
- SCN-REQ-3.1.1-03：明确五个输入的坐标、公式和点击另一单元格提交 B1 的动作。
- SCN-REQ-4.1.1-02：补齐 B2:B10 的九个初始单元格，包括空白 B10，并明确五个输出公式位置。
- SCN-REQ-5.3.1-03：明确整张 4×4 COUNT 结果表，包含列总计 3/1 和最终总计 4。
- SCN-REQ-5.3.1-09：明确两列结果、组顺序与已被父需求要求的 Grand Total=4。

这些表述以输入和已有业务规则确定预期。现有测试仅用于识别其当前执行与遗漏范围，没有根据生成应用反推预期。测试尚未逐子句补齐，不能将旧成绩转移到本修订。

## 留待下一轮决定的输入域和边界

1. 混合类型排序的类型优先级、空值位置和文本大小写规则。当前数据集主要使用同类型键；本轮不擅自增加一种总排序。
2. 数字文本的完整转换规则、空集合的 MIN/MAX/AVERAGE 行为、多个错误输入的传播优先级。保留当前明确的数字/空白/非数字样例，不宣称完整电子表格兼容。
3. 非规则 TSV 行宽和 CSV 最后一行空字段、公式样式字段在导入后的解释，以及导出 used range 的边界。现有 CSV 特例输入不能代替这些产品规则。
4. 不同校验规则的重叠与替换、把现有无效内容纳入新规则时的处理，以及剪贴板是否转移规则定义。当前明确的目标校验和结构移动行为继续有效。
5. 插入恰好位于范围端点时的扩张、删除范围最后一行/列、删除后重建同名 pivot 字段的身份。当前明确的内部插入、列位移、字段删除场景继续有效。
6. 仍然缺少公开触发条件的基础设施失败分支，保持条件式要求，不伪造失败准备或声称已有测试覆盖。

这些问题需要在需求层先选定有界规则，再编写相应验收；本轮不把未定规则填成测试默认行为。

## 后续验收重点

按六条机制链核对：编辑→计算；复制/剪切→引用映射；结构变化→规则和 pivot 引用；拒绝→Undo/Redo；排序→过滤→导出/汇总；持久化→身份/选区恢复。测试既要接受合法呈现，也要拒绝错误值、错误对象、局部提交和过期计算。不得通过固定实现细节或预设 baseline 失败来构造区分度。

## 静态验证

YAML 唯一键解析、全部身份与标题/图片/引用结构保留、26/104 数量、每条场景完整 GWT、测试文件字节不变和其余七题需求字节不变。本轮属于需求内容修改，不运行代码或浏览器测试；测试对齐与运行可行性尚待后续工作。
