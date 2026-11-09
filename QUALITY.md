# Benchmark 质量与验收边界

## 2026-11-09: Sheet 实验需求与测试收口

修订 `2026-11-09-sheet-experiment-r2`，父版本 `2026-11-09-sheet-requirements-r1`（98723f2）。Sheet保持26/104，全库423/759。统一公式术语，明确COUNT、数值/CSV及结构范围边界，补齐总计、存储输入、撤销分支与pivot拒绝配置的断言。类型与47条定向DOM合同通过；完整应用104场景可行性仍须正式运行前验证。协议见 [SHEET-EXPERIMENT.md](SHEET-EXPERIMENT.md)，审查见 [audit/sheet-r2.md](audit/sheet-r2.md)。修正父提交、历史验证指针、审查范围和评测方法名称。


## 2026-11-09: Sheet 需求打磨第一轮

修订 `2026-11-09-sheet-requirements-r1`，父版本 `2026-11-09-keep-bookstack-observation-fixes`。Sheet 保持 26 条原子需求、104 个场景；全库保持 423/759。澄清插入位置、存储公式与计算结果、剪切外部引用、历史事务边界、筛选与排序关系及 pivot 已应用状态；五个已有场景补齐坐标、数据和总计。测试尚未对齐或执行；对 OpenCode 的区分度尚未测量。审查与未决输入域见 [Sheet 需求记录](audit/sheet-requirements-20261109.md)。历史结果不转移。


## 2026-11-09: Keep / BookStack 观测复核修正

修订 `2026-11-09-keep-bookstack-observation-fixes`，父版本 `2026-11-09-keep-bookstack-observation-hardening`。需求与场景分母保持 423/759。消息匹配支持内联标签拆分，排除隐藏及 aria-hidden 内容和按钮文案；新增相应正反例合同用例。单题套件拒绝已有输出目录；合同报告逐次保存到 validation/.tmp，避免临时探针覆盖完整结果。父版 110/110 完整报告未找到可恢复副本，原声明和覆盖它的探针单独归档。按用户要求未运行测试；当前修改的运行时结果待验证，历史通过数不转移。


## 历史记录：2026-11-09 观测合同加固

历史修订 `2026-11-09-keep-bookstack-observation-hardening`，父版本 `2026-11-08-keep-bookstack-lifecycle-transaction-guards`。本版不改变需求、场景或分母，只修正 Keep/BookStack 的观测合同：

- `status` / `alert` 按需求声明的角色和精确可见消息定位，不再要求需求未声明的 accessible name；重复通知允许存在，动作作用域仍保持唯一。
- 保存 URL 通过 `openUrl` 重新打开；相同 URL 或仅 hash 变化会显式重新加载，修复 hash 路由下不刷新导致的假阴性。
- 新增 `validation/observable-contracts.ts` 模板、Keep/BookStack 独立副本、通知与导航正反例合同，以及 `npm run test:policy` 静态策略。Keep 与 BookStack 为严格题目，当前 0 error；其余题目的 90 条 warning 作为迁移清单。
- 验证结果：`npm run test:contracts` 110/110，`audit/validation` 175/175。既有 `pi` 候选在定向隔离检查中 BookStack REQ-11.1/REQ-11.3 共 5/5、Keep REQ-2.4/REQ-6.4 共 7/7 通过；BookStack REQ-5.4 Cancel 仍失败，属于真实实现缺陷。共享单实例全量运行出现收藏上限等跨场景污染，不作为 56 场景分数。
- 边界：尚未用逐场景隔离协议对三种方法全量重评；`expectNotice` / `expectAlert` 目前要求连续可见文本节点，拆分布局不在接受范围；合同与静态策略不证明所有合法 UI 变体均被接受。

---

父版本 `2026-11-08-keep-bookstack-lifecycle-transaction-guards`，由 `2026-11-08-keep-bookstack-lifecycle-interactions` 与 `2026-11-08-sheet-github-transaction-guards` 合并而来。全库 **423 条原子需求、759 个场景**：Keep 22/49，BookStack 29/56，Sheet 26/104，GitHub 49/104。Keep 生命周期扩展（REQ-2.10/REQ-2.11 与 8 个场景）和 Keep/BookStack 组合约束扩展（7 条原子需求、15 个场景）见 [audit/interactions.md](audit/interactions.md)、[audit/keep.md](audit/keep.md)、[audit/bookstack.md](audit/bookstack.md)；Sheet/GitHub 事务守卫扩展（4 条原子需求、8 个场景）见 [audit/transaction-guards.md](audit/transaction-guards.md)。八题既有审查、定向修订与限制见 [audit/README.md](audit/README.md)。

## 父版本证据

以下为父版本记录，不作为当前修订的执行结果。本轮完成源码语义审查、YAML 身份/引用核对、场景与测试标题映射、类型检查、全部场景收集和公开合同回归。新增业务场景（Keep 16 个、BookStack 7 个、Sheet 4 个、GitHub 4 个）尚未对真实候选执行，状态为 `inputs-and-contracts-verified-candidate-execution-pending`。合同与收集只证明输入、身份和公开观察边界，不证明新增行为已通过或已量化难度。浏览器合同只验证可观察断言边界，不能替代新题面的候选应用执行。

Keep 通知定位的 oracle 修正按 role=status 与精确可见消息定位，另有 8/8 合同和原 Shallow、baseline 应用各 16/16 定向复评；该修正不改变需求、场景身份或分母。

## 需求与测试合同

场景通过正常 UI 准备状态，使用公开角色、名称、正文和动作，不读取私有存储/API。Keep 明确声明 Restore、逐条永久删除确认框和归档来源恢复语义；标签修改影响活跃/归档/已删笔记但不改变生命周期状态。BookStack 明确删除后的旧地址不可读、双用户取消收藏隔离和刷新后的双向成员关系。对照对象用于排除过度删除与状态串改。

精确角色与名称属于公开评测合同；它们不替代所有合理产品 UI 的评估。旧地址负向断言不证明私有数据库删除。Keep 的背景色阈值和既有文本/空集合/图标/键盘观察边界、BookStack 的描述级覆盖与父动作多副本歧义继续保留。

`revision.json` 冻结单题需求、参考图片、正式测试、独立控件副本和 setup 生成器。公共控件副本须与已验证模板内容一致；冻结文本的 CRLF checkout 转换可接受。父版本清单和旧验证记录保留在 validation 下，原实验输出不参与修订。

## 隔离与预算

执行协议保持 application-per-scenario-v1：每场景独立进程与初态副本，场景内多个浏览器共享应用数据；1 worker、0 retry、60 秒场景、10 秒断言、15 秒动作、30 秒导航。新增组合场景尚未实测其预算，不能把静态可实现性当作已完成的运行验证。

StackOverflow 评论入口以认证用户为初态；徽章目录从公开 Users 中的 Helpful User 资料进入。上述初态与路径已经写回源需求，不由测试单独隐含约定。

## 可比性

所有方法必须使用同一冻结修订重新生成/评测；旧分数按历史输入保存。报告宜同时给出原有与扩展场景结果，结合失败原因说明多个场景对同一基础能力的依赖。正式比较前需实际确认 oracle 可行性与预算。

## 证据与适用范围

场景收集、类型检查和控件回归是跨题合同验证；完整应用的端到端结果按题目、产物、需求摘要与报告分别登记。当前存在的 BookStack 应用可用于端到端回归，其他题目仍需相应应用验证业务流程、持久化、跨账户权限和数据计算。

父版 BookStack 生命周期扩展场景曾在一个本地参考实现上执行 **49/49** 通过。该参考实现由既有生成应用补充页面/章节删除 UI、第二账号种子和草稿活动过滤得到，只用于证明扩展测试可以被一个符合需求的实现通过，不等于 ShallowCode 候选或官方应用的通过率。扩展暴露的“草稿标题出现在公共 Recent Activity”属于被测试捕获的跨视图泄漏；参考实现已修复以完成 oracle 验证，不能据此推断所有候选都会实现该过滤。

本版利用已观察的 StackOverflow 错误修订公共合同，属于开发阶段。正式报告应冻结本版后统一评测各方法，保留历史分数，并用未参与此次修订的任务检验泛化。

## 本轮复查状态

当前状态为 `inputs-and-contracts-verified-candidate-execution-pending`：423 条叶需求、759 个场景已完成输入、身份和收集核对；合并前的生命周期组件矩阵仍单独标注缺口和未决解释。前轮五组定向验证保留在 [CONSISTENCY.md](CONSISTENCY.md)。BookStack 父版扩展的 14 个场景已在本地参考实现上执行，其余既有场景的真实应用重验和所有复合条件的完整故障覆盖尚未完成，不能据此宣称零假阴性或完整满足所有产品描述。公开测评合同与原始业务需要分开解释；旧分数保持其原版本归属。
