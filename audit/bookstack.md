# BookStack 需求与测试逐场景审查

完整阅读并核对 **24 条原子需求、35 个场景**、继承描述、全部 spec、helpers、list-cap 和公共控件合同。没有读取生成应用或成绩。逐场景的当前 Given/When/Then 原文、测试行、实际动作/断言以及独立审查结论见 [bookstack.json](bookstack.json)。

## 定向修订

- **BOOK-01：未声明的导航结构。** 原 helper 要求公共链接必须处于同时包含 Books/Shelves 的 navigation landmark。现在优先使用实际存在且身份明确的导航；没有该结构时只接受唯一的同名公共链接。重复动作仍严格失败，不使用 `.first()`。
- **BOOK-02：重复普通文本。** 允许页面多个位置显示同一正确昵称或描述；只计可见普通文本。Recent Drafts 的“可见标题恰好一次”也只计可见副本。对象和动作仍按明确身份检查。
- **BOOK-03：富文本字段。** 需求允许 `role=textbox` 的 rich-text Description 和页面正文；`toHaveValue` 会拒绝合法 contenteditable。现在读取原生字段 value 或 contenteditable 的公开 innerText，同时要求正确 textbox 角色和保存内容。
- **BOOK-04：列表上限。** 标准表格的列标题行不再计作业务记录，保留 listitem/data row、实际条数上限及对象唯一性。
- **BOOK-05：键盘访问。** `focus()` 不证明 Tab 可达。Shelves/Books 的检查现在遍历真实 Tab 顺序，补上 Books 原来缺失的可见/键盘结果断言。
- **BOOK-06：空集合与删除。** 删除/取消收藏后先确认命名集合语义上存在且唯一，再检查目标缺失。允许合法的零面积空区域；隐藏或缺失区域仍失败。Book 删除补确认按钮与即时删除检查，Remember Me 补可见检查。
- **BOOK-07：父关联唯一性。** Shelf 创建的 Book 在该 Shelf 的 Book list 中须恰好一次且可见。
- **BOOK-08：保留明确角色。** New Shelf、Create New Book、发布页面及 Chapter 的明确 button 角色不再被通用 button/link 联合定位放宽。源文允许等价 link 的入口继续接受。
- **BOOK-10：修改与取消的持久状态。** 保存重命名后，列表有一个新名称且旧名称消失，防止复制新对象冒充修改；Cancel 后重载并重开 metadata，确认原值仍保存。

## 保留的边界

- **BOOK-09：描述级覆盖。** 首页 search input、关联书籍编辑、封面/默认模板与富文本格式、章节专属 Page list、所有内容类型的访问/收藏、第二用户隔离、完整收藏页、dashboard activity 等尚没有完整的独立场景或固定观察合同。35 场景不等于全部描述能力已验证。
- **BOOK-11：未决公共作用域。** Book 的同名 parent entry 没有明确区分 breadcrumb/侧栏多副本，合法重复动作仍可能严格失败；详情正文的归属范围和 Tags 的显示序列化语义也未充分规定。没有为解决它们任取第一项或新增定位专用 ARIA 容器。

本轮 **11 类发现，9 类定向修复、2 类明确保留**。需求、种子、场景身份和分母未变，公共 `public-controls.ts` 保持原样；共有 16 个题内测试/helper 文件变化。

## 验证

新增 **19 条正反合同检查**，覆盖普通公共链接/导航、动作歧义、重复与隐藏文本、原生/富文本字段、错误值和错误角色、实际键盘访问、标准表格标题及超限/重复记录、零面积空集合及缺失/隐藏集合。浏览器检查由父代理合跑；结果以 `audit/contract-results.json` 为准。

本题所有 spec/helper 与新增合同的 TypeScript 定向检查通过。改动只涉及这道题的测试与观察 helper，因此不运行控制器全量测试。没有执行完整 BookStack 应用，不据此声称测得全部业务通过率或消除了所有假阴性。
