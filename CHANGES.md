# 2026-11-10: 补清容易误通过的验收结果

修订 `2026-11-10-observable-outcome-r2`，父版 `2026-11-10-github-12306-ctrip-experiment-polish`。GitHub 检查记录、12306 重订确认和 Ctrip 搜索恢复对齐题面与已有断言；场景数不变。GitHub 同步收紧空标题拒绝、提交与变更摘要、审核归属、关闭与重开的 8 个既有场景，统一 Owner 的关闭和重开权限。 见 [跨题审查](audit/false-positive-polish.md) 和 [GitHub PR 审查](audit/github-pr-evidence.md)。新旧评分口径不可混算。

# 2026-11-10: GitHub、12306 与 Ctrip 正式实验题面打磨

修订 `2026-11-10-github-12306-ctrip-experiment-polish`，父版本 `2026-11-09-sheet-experiment-r2`。沿用全部需求与场景 ID，不新增功能或场景。统一 GitHub 合并权限与提交状态、12306 订单状态流，以及 Ctrip 搜索、计价和支付口径。 见 [GitHub](audit/github-experiment-polish.md)、[12306](audit/12306-experiment-polish.md) 和 [Ctrip](audit/ctrip-experiment-polish.md)。同一轮实验使用本版，旧成绩不直接迁移。

# 2026-11-09: Sheet 实验需求与测试收口

修订 `2026-11-09-sheet-experiment-r2`，父版本 `2026-11-09-sheet-requirements-r1`（98723f2）。Sheet保持26/104，全库423/759。统一公式术语，明确COUNT、数值/CSV及结构范围边界，补齐总计、存储输入、撤销分支与pivot拒绝配置的断言。类型与47条定向DOM合同通过；完整应用104场景可行性仍须正式运行前验证。协议见 [SHEET-EXPERIMENT.md](SHEET-EXPERIMENT.md)，审查见 [audit/sheet-r2.md](audit/sheet-r2.md)。修正父提交、历史验证指针、审查范围和评测方法名称。

# 2026-11-09: Sheet 需求打磨第一轮

修订 `2026-11-09-sheet-requirements-r1`，父版本 `2026-11-09-keep-bookstack-observation-fixes`。Sheet 保持 26 条原子需求、104 个场景；全库保持 423/759。澄清插入位置、存储公式与计算结果、剪切外部引用、历史事务边界、筛选与排序关系及 pivot 已应用状态；五个已有场景补齐坐标、数据和总计。测试尚未对齐或执行；对 OpenCode 的区分度尚未测量。审查与未决输入域见 [Sheet 需求记录](audit/sheet-requirements-20261109.md)。历史结果不转移。

# 2026-11-09: Keep / BookStack 观测复核修正

修订 `2026-11-09-keep-bookstack-observation-fixes`，父版本 `2026-11-09-keep-bookstack-observation-hardening`。需求与场景分母保持 423/759。消息匹配支持内联标签拆分，排除隐藏及 aria-hidden 内容和按钮文案；新增相应正反例合同用例。单题套件拒绝已有输出目录；合同报告逐次保存到 validation/.tmp，避免临时探针覆盖完整结果。父版 110/110 完整报告未找到可恢复副本，原声明和覆盖它的探针单独归档。按用户要求未运行测试；当前修改的运行时结果待验证，历史通过数不转移。

# 2026-11-09: Keep / BookStack 观测合同加固

修订 `2026-11-09-keep-bookstack-observation-hardening`，父版本 `2026-11-08-keep-bookstack-lifecycle-transaction-guards`。需求、场景、标题和分母不变（423 条原子需求、759 个场景），只修正 Keep/BookStack 的观测合同与扩展工具：

- `status` / `alert` 按需求声明的角色和精确可见消息定位，不再要求未声明的 accessible name；重复通知允许存在，动作作用域仍要求唯一。
- 保存 URL 使用 `openUrl` 重新打开；相同 URL 或仅 hash 变化显式重新加载，修复 hash 路由下 `page.goto` 不刷新造成的假阴性。
- 新增 `validation/observable-contracts.ts` 模板、Keep/BookStack 独立副本、`validation/observable-contracts.spec.ts`、`validation/navigation-contracts.spec.ts` 和 `npm run test:policy`。
- `validation/oracle-policy.json` 将 Keep/BookStack 设为严格题目；其余题目先登记 warning 作为迁移清单。
- 新增 `validation/run-task-suite.mjs`，用于对参考实现或候选应用跑单题定向套件；它不替代逐场景隔离计分。

验证：类型检查通过；公开合同 110/110；审查合同 175/175；Keep/BookStack 静态策略 0 error；场景收集与输入完整性检查通过。既有 `pi` 候选在定向隔离检查中 BookStack REQ-11.1/REQ-11.3 共 5/5、Keep REQ-2.4/REQ-6.4 共 7/7 通过，BookStack REQ-5.4 Cancel 仍失败（真实实现缺陷）。共享单实例全量运行会受收藏上限等跨场景污染影响，不作为分数。旧分数属于父版本输入，不可与新版本混算。

# 2026-11-08: Keep / BookStack 生命周期扩展与 Sheet / GitHub 事务守卫合并修订

修订 `2026-11-08-keep-bookstack-lifecycle-transaction-guards`，合并 `2026-11-08-keep-bookstack-lifecycle-interactions` 与 `2026-11-08-sheet-github-transaction-guards`。全库合计 **423 条原子需求、759 个场景**：Keep 22/49，BookStack 29/56，Sheet 26/104，GitHub 49/104。既有需求 ID、场景 ID、场景名称和正式测试标题全部保留。

本版合并三组扩展：Keep 生命周期（REQ-2.10/REQ-2.11 与 8 个场景）、Keep/BookStack 组合约束（7 条原子需求、15 个场景，见 [audit/interactions.md](audit/interactions.md)）和 Sheet/GitHub 事务守卫（4 条原子需求、8 个场景，见 [audit/transaction-guards.md](audit/transaction-guards.md)）。Keep 通知定位 oracle 修正保留。冻结输入已重新收集并通过类型检查、759 场景收集、89 项公开合同与输入完整性检查；新增业务场景尚未对真实候选执行，不同修订的分数不可混算。

Windows Git checkout 的文本 CRLF 转换不再误触发冻结摘要拒绝；实质内容与二进制仍按冻结摘要校验。

# 2026-11-08: Keep / BookStack 生命周期与组合约束合并修订

修订 `2026-11-08-keep-bookstack-lifecycle-interactions`，父版本 `2026-11-07-bookstack-lifecycle`。本版合并 `2026-11-08-keep-bookstack-interactions` 与 `2026-11-08-keep-lifecycle`（含 `2026-11-08-keep-notification-oracle` 测试修正）：Keep 新增 6 条原子需求、16 个场景，BookStack 新增 3 条原子需求、7 个场景。既有需求 ID、场景 ID 与正式测试标题保留。合计 **419 条原子需求、751 个场景**（Keep 22/49，BookStack 29/56）。

组合约束场景围绕同名身份、过期编辑、局部 Undo、私有修订和跨书移动，矩阵见 [audit/interactions.md](audit/interactions.md)；Keep 生命周期与 BookStack 观察点补强见 [audit/keep.md](audit/keep.md) 与 [audit/bookstack.md](audit/bookstack.md)。合并后的冻结输入已重新收集并通过类型检查与公开合同；新增业务场景尚未对真实候选执行，旧分数不可混用。

Windows Git checkout 的文本 CRLF 转换不再误触发冻结摘要拒绝；实质内容与二进制仍按冻结摘要校验。

# 2026-11-08: Sheet 事务和 GitHub 提交守卫

修订 `2026-11-08-sheet-github-transaction-guards`，父版本 `2026-11-08-keep-bookstack-interactions`。Sheet 增加原子剪切、重叠引用重写和完整 Undo/Redo；GitHub 增加当前提交审查、权限降级与重复合并保护。新增 4 条原子需求和 8 个场景；合计 421 条原子需求、751 个场景。所有既有场景和测试标题保留。场景与分组评分见 [audit/transaction-guards.md](audit/transaction-guards.md)。不同修订的分数不可混算。

# 2026-11-08: Keep 与 BookStack 组合约束扩展

组件修订 `2026-11-08-keep-bookstack-interactions`。Keep 新增 4 条原子需求、8 个场景；BookStack 新增 3 条原子需求、7 个场景。所有既有 ID 与正式测试标题保留。该修订的独立分母为 417 条原子需求、743 个场景。

# 2026-11-08: Keep 通知定位 oracle 修正

通知按 role=status 与精确可见消息定位，存在性检查要求唯一且可见；Undo 和 Dismiss 继续限定在对应通知内。需求、场景身份与分母不变。新增命名/未命名通知正例，以及错误角色、错误或隐藏消息、重复身份和跨通知动作反例。本项是测试修正，标识为 `2026-11-08-keep-notification-oracle`；测试哈希随清单更新。原实验成绩保留，修订后的定向复评单独记录。

验证：通知合同 8/8 通过；同版测试对原 Shallow、baseline 应用分别定向复评 16/16 通过，均保持逐场景应用/数据隔离。类型、41 项场景收集及输入完整性检查通过。其余 25 项未重跑，不据此重写全量分数。详见 [验证记录](validation/keep-notification-oracle.json)。

# 2026-11-08: Keep 生命周期扩展与 BookStack 观察点补强

修订 `2026-11-08-keep-lifecycle`，父版本 `2026-11-07-bookstack-lifecycle`。Keep 新增 REQ-2.10/REQ-2.11 与 8 个场景：逐条恢复（保留属性、归档来源）、永久删除确认/取消、笔记重命名、标签跨活跃/归档/已删状态传播、生命周期搜索。Keep 由 16/33 变为 18/41；全库由 410/728 变为 412/736。已有场景/步骤身份与标题保留，所有新增行为、角色和名称同步写回需求。

BookStack 不改分母，补强书籍删除后章节/页面旧地址、双用户共同收藏后单方取消，以及书架成员保存后的刷新和反向关联。同步各场景 When/Then。

组件修订的独立范围为 412 条原子需求、736 个场景；当时仅完成静态核对与定向 TypeScript 检查。父版 49/49 等记录单独归档，未将历史通过结果转移给该组件输入。合并修订已重新收集全部输入并执行公开合同。

# 2026-11-07: BookStack 生命周期与关系一致性扩展

修订 `2026-11-07-bookstack-lifecycle`，父版本 `2026-11-07-per-task-semantic-review`。保留 BookStack 原 24 条原子需求、35 个场景及全部身份，新增 2 条原子需求和 14 个场景：

- 删除已发布页面、删除章节（含确认/取消、级联页面、首页/收藏/最近浏览清理）。
- 书架删除保留书籍；书架编辑添加/移除书籍成员且不删除书籍或破坏其他书架。
- 重命名书籍的全局传播；删除书籍级联章节/页面；页面编辑持久化并更新 Recently Updated。
- 草稿发布不产生重复页面；草稿仅作者可见，匿名和第二账号看不到标题或编辑器。
- 收藏与最近浏览按用户隔离、重访去重、删除后清理。

新增第二个已验证账号 `BookStack Reviewer`。扩展场景在本地参考实现上完成 49/49 场景执行（35 个既有 + 14 个扩展）；这是 oracle 可行性验证，不是 ShallowCode 候选的通过率。分数分母从 408/714 变为 410/728，旧分数不可直接比较。逐场景记录见 [audit/bookstack.md](audit/bookstack.md) 与 [audit/bookstack.json](audit/bookstack.json)。

# 2026-11-07: 八题逐场景语义审查

修订 `2026-11-07-per-task-semantic-review`，父版本 `2026-11-06-isolated-scenarios`。分别审查八题 408 条原子需求和 714 个场景；改正需求—测试错配、补充已有场景的漏断言，并显式记录来源歧义与覆盖缺口。逐题报告、逐场景矩阵与正反例见 [audit/README.md](audit/README.md)。需求澄清与测试修改一起版本化，原应用与原成绩不覆盖。该审查不是对 714 个完整应用场景的实际通过率测量。

# 2026-11-06: 场景隔离与已知一致性问题收口

修订 `2026-11-06-isolated-scenarios`，父版本 `2026-11-06-consistency-audit`。落实逐场景应用/数据隔离；补初始化、fork 与 merge 的完整结果观察、BookStack 饱和上限、成员表单/记录及 Sheet 元数据/直达。新增公开合同和 GitHub 初态详见 CONSISTENCY.md。全部原身份、测试标题、714 场景和参考文件保留；旧产物与旧成绩均按历史版本归档。

# 2026-11-06: 需求与测试一致性复查

当前修订 `2026-11-06-consistency-audit`，父版本 `2026-11-06-portable-oracles`。8 题共修正 62 个输入文件，补全 5 个 GitHub 成功流程及结果断言，修正 Sheet Undo 和数值筛选错配，补问题/答案归属、键盘路径、元数据预填、刷新和多列布局证据。完整说明与未闭合事项见 [CONSISTENCY.md](CONSISTENCY.md)。

408 条原子需求、714 个场景和全部身份/测试标题保留。Sheet 的 SCN-REQ-3.2.2-07 原预期违背 Undo 功能语义，本版明确修正，不能与父版混算分数。当前质量状态为 `known-gaps`。

# ARC-Bench 合同修订

## 2026-11-06：公共交互与结果断言

修订标识：`2026-11-06-portable-oracles`，父版本为 `2026-11-05-contract-alignment`。父清单完整保存在 `validation/previous-revision.json`；`revision.json` 同时记录累计变更与本轮增量。保留全部 408 条原子需求、714 个正式场景、需求/场景/步骤 ID 和全部参考图片。结果子句原文保持不变，StackOverflow 的评论认证初态与徽章公开入口同步明确到需求和测试。

| 题目 | 本轮核对和修正 |
| --- | --- |
| 12306 | 下拉操作与选中值按可见标签验证，支持原生和弹出选项；保留需求明确规定的 placeholder、日期、车次和权限断言。 |
| BookStack | 原生密码输入按关联名称识别，登录检查初始 password 类型；原有 shelf/book/page 和持久化业务断言保留。 |
| Ctrip | 登录和改密表单兼容原生密码，登录仍核对遮蔽类型；Cabin class、Airline、Gender、Type 按公开标签选择和验证。 |
| GitHub | 合同明确的控件名称使用锚定且大小写一致的定位；重复用户名按可见文本检查，不取 DOM 中第一份；下拉支持公开标签，Parent team 回滚检查显示标签而非私有 value。 |
| Keep | 核对字段、唯一对象后缀、语义区域和动作状态后保留现有输入与测试。 |
| PrestaShop | 登录、注册、改密兼容原生密码，登录保留遮蔽检查；尺寸、排序和国家选择使用公开标签。 |
| Sheet | 排序、过滤、验证与透视表的下拉支持原生/弹出实现；明确的控件名称按原文精确定位，CSV 文件仍要求原生 file 输入的精确 label。 |
| StackOverflow | 标签显示与导航动作分别验收；保留命名日期和数值输出，接受等价的八字符提示；评论、分数按所属问题/答案区分，支持 Answers 嵌套；排序比较跨页；明确认证评论和公开资料 Badges 入口；Votes 记录核对正确父标题；上下文清理保留原始断言错误。 |

公共选择工具拒绝错误角色、错误选项、重复身份以及隐藏或禁用的原生选项。需求中的密码例外与公共下拉合同同步说明；各题仍是可独立复制运行的测试包。类型、收集、输入审计和控件合同命令见 README。

正式场景上限改为 60 秒，断言仍为 10 秒，保留 1 worker 和 0 retry，使准备流程和失败断言有独立的诊断时间。该预算对全部题目和全部方法一致。

这是一次参考既有 StackOverflow 运行证据后的开发修订。后续比较需使用新的冻结输入；原版、父版本和本版本成绩分别保留，修订测试应对全部方法的冻结产物统一复评。

验证结论以当前 `validation.json` 为准。旧版验证记录保存在 `validation/history/`，不作为新版本全业务通过的证据。

---


修订日期：2026-11-05。来源提交为 `e59696b`，完整提交号、变更文件及每个任务文件的 SHA-256 见 `revision.json`。保留 8 题全部 408 条原子需求、714 个场景、需求及场景和步骤 ID、参考图片、账户与业务数据。

| 题目 | 本轮修订 |
| --- | --- |
| BookStack | 按精确 textbox 名称定位字段；明确返回 Shelf list 和草稿显示合同；补全创建及编辑后的元数据持久化断言。 |
| PrestaShop | 按需求分别使用 textbox、spinbutton 和 combobox，登录、地址、数量与价格过滤等字段保持各自声明的角色和名称。 |
| StackOverflow | 公共 field helper 使用精确 textbox 名称，覆盖登录、提问、个人资料和评论等输入。 |
| Ctrip | 公共 field helper 区分文本框与 Cabin class、Airline、Type、Gender 下拉框；保持精确名称和各自角色。 |
| GitHub | 文本字段按精确名称与 textbox 角色定位；原生密码字段通过关联 label 和 password 类型定位，并校验精确可访问名称。导航在当前页面选择唯一命名控件，对象入口使用 link，对话框使用 dialog 及精确名称。明确 review summary 可用 Summary 或 Comment 命名。补全评论场景缺失的 uniqueAccount 导入。 |
| Sheet | 文本框与下拉框分别按角色和名称定位，覆盖工作簿、工作表、公式栏、过滤、验证和透视表；CSV 上传保留需求规定的原生文件控件 label 定位。 |
| 12306 | 核对后保留原题：placeholder 是明确需求，公共 label helper 已处理必填标记及控件类型。 |
| Keep | 核对后保留原题：现有字段按需求的精确角色与名称定位。 |

PrestaShop、StackOverflow、Ctrip、GitHub、Sheet 的需求同步明确：装饰性必填标记保留控件的声明名称；有要求的 label 保持关联；原生密码与文件控件保留各自 input 类型。

新增的 27 项控件合同回归同时验证有效变体与失败边界，包括隐藏必填标记、文本框及下拉框角色、密码遮蔽类型、精确名称、重复控件、当前页面入口、对象 link 和命名 dialog。相关 helper 直接从本版本各题导入。回归位于 `validation/selector-contracts.spec.ts`，与 714 个业务场景分开运行。

验证记录包括全部题目的需求解析、引用和身份保持检查、714 项测试收集、423 个相关 TypeScript 文件检查以及 27 项控件合同回归。BookStack 的两份应用端到端结果沿用同一题目文件的已完成验证，均为 35/35。其他题目未对完整应用重跑全部业务场景。

在根目录安装依赖后，可通过 `npm run typecheck` 检查所有题目测试的类型及导入，通过 `npm run test:contracts` 运行控件合同回归。修订版与原版各自冻结输入并分别记录评测结果。详细来源见 `revision.json`，验证范围和报告位置见 `validation.json`。
