# Sheet 与 GitHub 组合约束扩展

修订：`2026-11-08-sheet-github-transaction-guards`。保留上一版的题面场景、ID 和测试标题。新增 4 条原子需求、8 个场景；场景之间不共享变更。

| 场景 | 对应测试 | 初态、操作和结果断言 |
| --- | --- | --- |
| Sheet SCN-REQ-6.1-01 | [REQ-6.1 第 1 个测试](../arc-bench/sheet/tests/REQ-6.1.spec.ts) | 核对 8 格、2 个依赖公式及其结果；两次拒绝前后分别核对 Undo 与 Redo；重载后再次用 101 验证 E2 规则，检查全套值和公式。 |
| Sheet SCN-REQ-6.1-02 | [REQ-6.1 第 2 个测试](../arc-bench/sheet/tests/REQ-6.1.spec.ts) | 检查合法初值，核对源区清空、目标区和下游公式重写；Undo、Redo、重载后比对整套格子及公式，最后验证 E2 仍拒绝 101。 |
| Sheet SCN-REQ-6.2-01 | [REQ-6.2 第 1 个测试](../arc-bench/sheet/tests/REQ-6.2.spec.ts) | 确认重叠区初态；逐格验证移入和清除、固定引用与移动的绝对引用、两级依赖；逐次比对 Undo、Redo 和重载结果。 |
| Sheet SCN-REQ-6.2-02 | [REQ-6.2 第 2 个测试](../arc-bench/sheet/tests/REQ-6.2.spec.ts) | 公式算到 21 导致整笔拒绝；改源值后算到 19 并通过；Undo 只撤销剪切，保留改过的源值；重载后直接输入 21 仍被拒绝，原公式和结果不变。 |
| GitHub SCN-REQ-7.1-01 | [REQ-7.1 第 1 个测试](../arc-bench/github/tests/REQ-7.1.spec.ts) | 验证旧提交的审批、评论和成功检查；旧确认拒绝后分别核对分支、PR、评论原位置及检查所绑定的提交；新审批单独不放行；新检查成功后核对唯一合并提交、双亲、文件和合并人。 |
| GitHub SCN-REQ-7.1-02 | [REQ-7.1 第 2 个测试](../arc-bench/github/tests/REQ-7.1.spec.ts) | 旧审查提交被拒后、补跑检查前，就验证没有多出审查记录且两条分支未变；新检查单独不放行；新审批有独立记录并使合并可用，复核分支仍不变。 |
| GitHub SCN-REQ-7.2-01 | [REQ-7.2 第 1 个测试](../arc-bench/github/tests/REQ-7.2.spec.ts) | 对比同一团队和两名直接授权用户在变更前及重载后的角色；旧确认被拒，保留读取、审批和检查；两个分支不变，独立维护者仍可打开确认。 |
| GitHub SCN-REQ-7.2-02 | [REQ-7.2 第 2 个测试](../arc-bench/github/tests/REQ-7.2.spec.ts) | 第一人确认后即检查唯一新提交、提交双亲和未改变的源分支；第二人尝试后再比对整个图和两个会话的合并人、提交号、时间。 |

Sheet 只用公开网格、公式栏、剪贴板和 Undo/Redo。GitHub 使用四个独立仓库种子及正常登录，操作顺序固定；核对公开分支提交图，不读取内部 API 或存储。未调用模型，未对新题面生成的应用执行这些业务场景。旧修订成绩不可与新修订直接混算。

从 ShallowCode 实验分支运行：

```powershell
npm.cmd run experiment -- run --bench-root ..\arc-bench-ext --tasks sheet,github --methods baseline,shallow --repeats 1
```

从 ARC-Bench Ext 根目录，使用 `node validation/summarize-interactions.mjs sheet <evaluation-N目录>` 或以 `github` 为参数，分开统计既有、新增基础与新增组合场景。GitHub 的基础验收已在原场景中；新场景都是组合验收。
