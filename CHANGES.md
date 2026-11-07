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
