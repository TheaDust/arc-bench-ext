# 八题需求与测试逐场景审查

本目录保存 2026-11-07 对八道应用题的子智能体审查记录。输入来自 `E:\my-works\coding\arc-bench-modified` 的 `2026-11-06-isolated-scenarios` 版本，原目录和既有实验产物保持独立。本轮在当前目录修订需求和测试，不修改生成应用或 ShallowCode 控制器。

每题分别读取需求树的继承合同、叶需求、场景及测试。逐场景矩阵记录 Given/When/Then 与断言对应关系；问题清单同时记录假阴性、漏断言、初态、对象归属和不确定解释。`PROTOCOL.md` 规定审查边界。子智能体继承本会话上下文，因此这属于模型辅助审查，不声称双盲审查或人工标注。

具体题目报告和机器可读矩阵：

| 题目 | 原子需求 | 场景 | 报告 | 矩阵 |
| --- | ---: | ---: | --- | --- |
| 12306 | 93 | 142 | [12306.md](12306.md) | [12306.json](12306.json) |
| BookStack | 24 | 35 | [bookstack.md](bookstack.md) | [bookstack.json](bookstack.json) |
| Ctrip | 97 | 152 | [ctrip.md](ctrip.md) | [ctrip.json](ctrip.json) |
| GitHub | 47 | 100 | [github.md](github.md) | [github.json](github.json) |
| Keep | 16 | 33 | [keep.md](keep.md) | [keep.json](keep.json) |
| PrestaShop | 55 | 86 | [prestashop.md](prestashop.md) | [prestashop.json](prestashop.json) |
| Sheet | 24 | 100 | [sheet.md](sheet.md) | [sheet.json](sheet.json) |
| StackOverflow | 52 | 66 | [stackoverflow.md](stackoverflow.md) | [stackoverflow.json](stackoverflow.json) |
| 合计 | 408 | 714 | | |

共登记 112 项审查发现：91 项完成定向修订，其余 21 项分别保留为部分覆盖、明确范围或观察边界，不能全部解释成已确认的测试缺陷。

| 题目 | 已修订 | 其余发现 | 需求有澄清 |
| --- | ---: | ---: | --- |
| 12306 | 12 | 3 | 否 |
| BookStack | 9 | 2 | 否 |
| Ctrip | 11 | 1 | 是 |
| GitHub | 14 | 4 | 是 |
| Keep | 10 | 3 | 否 |
| PrestaShop | 15 | 2 | 是 |
| Sheet | 12 | 2 | 是 |
| StackOverflow | 8 | 4 | 否 |

全部发现可按 `summary.json` 或 `findings.csv` 查阅。未决项包括部分描述级成功/取消与权限分支未被独立场景覆盖、个别父入口或文本序列化的歧义、图像内容和私有持久化不可由现有公开观察完全证明等。不会把这些限制登记为通过。

## 验证和证据边界

审查前既有 73 条浏览器合同检查全部通过，记录在 `baseline-contracts.json`。本轮新增正反例位于 `validation/`，检查合法公开呈现可通过、错误值/身份/状态仍失败。最终结果登记在根目录 `validation.json`。运行入口：

```powershell
node node_modules/typescript/bin/tsc --project outputs/arc-bench-reviewed-20261107/audit/tsconfig.json
node node_modules/@playwright/test/cli.js test --config outputs/arc-bench-reviewed-20261107/audit/validation/playwright.config.ts
node outputs/arc-bench-reviewed-20261107/audit/check-review.mjs
node outputs/arc-bench-reviewed-20261107/validation/collect.mjs
```

以上命令从 ShallowCode 根目录执行。审查矩阵的身份与数量检查只证明记录完整；语义审查和合成 DOM 正反例仍不足以量化所有真实应用的误判率。本轮没有对全部 714 个业务场景运行独立参考应用，也不把未决项视为已解决。

最终合同证据为 **175 个不同用例通过**，原有 **73 条回归通过**。先完整执行 174 条，随后 StackOverflow 的分页修订只补跑该题 25 条：其余七题 150 条合同及 helper 摘要未变；旧的 24 条 StackOverflow 证据由新执行替换。`contract-results.json` 明确标注组合证据，原始两次报告保存在 `contract-runs/`，不是一次全新 175 条执行。最后两处 Sheet 正式场景补断言只影响类型/收集检查；没有冒充完整应用运行。

`review.patch` 包含题内需求/测试与新增定向合同的补丁；完整冻结版本还包括本目录的来源、矩阵与清单，运行时应使用整个目录。

需求发生实质澄清时应对所有方法提供同版输入并重新生成。仅校正测试且需求未变时可统一重评旧应用，但必须重新执行受共享 helper 或断言变更影响的场景，保留原分数；本轮不迁移先前 PrestaShop r2 分数。论文应披露派生基准、模型辅助审查、补丁与未决限制。

本轮期间工作区另有费用汇总修改，涉及 `src/experiments/protocol.ts`。收集与计分等前部函数及 CSV 后部函数逐字核对未变，新增内容为统计/报告和格式化导入；实际八题入口收集亦已通过。新清单冻结当前摘要，保留父摘要与对应源码，详见 `controller-review.json`。其余已声明执行文件仍须匹配父版；本轮没有修改控制器源码。
