# Ctrip 逐需求与测试审查

完整检查 **97 条原子需求、152 个场景**。未读取生成应用或其成绩。需求正文、父级合同、场景初态、所有 97 份 spec、helpers、公共控件和去重种子均纳入审查。逐场景原文、动作及断言行号见 [ctrip.json](ctrip.json)。

## 已修订的可证明问题

- **CTRIP-01 [fixed] false-negative**：Account entry roles and ARIA menu container were required only by tests, although the concrete source does not declare them. accountEntry preserves exact identity/uniqueness and permits button/link/menuitem; removed undeclared ARIA menu check.
- **CTRIP-02 [fixed] false-positive**：A missing Fee details region satisfied child text count=0. Hidden retained markup could also fail a valid removal. Require visible uniquely named details region and no visible exact removed fee.
- **CTRIP-03 [fixed] false-positive**：July 21 fare was checked globally and could be supplied by an unrelated date or page region. Assert ¥460 within the declared July 21 button.
- **CTRIP-04 [fixed] false-negative**：New-password retry assumed legal checkbox stayed checked after old-password rejection, a policy absent from source. Explicitly accept terms for the second login attempt.
- **CTRIP-05 [fixed] false-positive**：History reuse omitted the explicit July 21 restoration outcome. Assert restored Departure date value after using history.
- **CTRIP-06 [fixed] false-positive**：Zero-record tests also passed if the declared list region was missing entirely. Require exactly one accessible named current-account list before checking empty records. 父代理补审允许合法空区域为零面积，新增三个正例及缺失/隐藏/非空反例；未要求空列表必须有非零尺寸。
- **CTRIP-07 [fixed] false-positive**：No-query-on-mode-switch was observed only after the second switch, missing a query triggered by Route selection. Check absence of both results regions immediately after Route as well as after Flight number.
- **CTRIP-08 [fixed] false-positive**：Bare substring 365 did not establish the specified 365-day availability window. Require 365 with a day/days unit, allowing spaces or hyphen.
- **CTRIP-09 [fixed] false-positive**：Generic action union accepted wrong roles even where source explicitly declares them; field helper accepted plaintext password textboxes outside login(). Honor explicitly declared action roles in helper and intersect password controls with input[type=password]. Unknown action roles remain generic.
- **CTRIP-10 [fixed; requirement clarification] source-ambiguity**：父代理按已有具体场景澄清描述：点击 Origin / Destination 字段打开现有 City selection 对话框及其分类 tabs。移除与该流程不一致的额外 City selection 按钮要求；保留原业务结果。
- **CTRIP-11 [partly-fixed] coverage-gap**：Some broader description obligations exceed concrete checked Then clauses: complete initial flight facts, retained Economy label, ad-hoc passenger non-persistence, exact new-order lineage, initially collapsed Common information, address mobile persistence and exact invoice count after reload. Added deterministic initial-collapse and invoice-reload count observations where already publicly observable. Exact new-order lineage and Economy observation require a clarified public outcome rather than private internals; address mobile need not be displayed in its list row, so no invented row field was added. Remaining breadth is disclosed in each row.
- **CTRIP-12 [fixed; requirement clarification] source-ambiguity**：父代理按两条已有场景澄清描述：选中记录后 Delete selected 直接打开对应命名确认对话框。移除额外中间按钮要求；确认、选择性删除与持久化要求保留。

## 验证与解释边界

新增 `audit/validation/ctrip.spec.ts` 正反控件合同，首轮 **12/12 通过（4.9 秒）**；父代理另补四个空集合合同，最终结果见统一合跑报告。本子任务完成全部 Ctrip 测试文件及新合同测试的 TypeScript 检查。只修改本题测试与 helper，不需要运行控制器全量测试。没有运行 152 个真实 Ctrip 业务场景，合同回归不能替代完整应用验证。

子代理没有改写需求；父代理随后对上述三处矛盾作最小流程澄清，已登记 requirementsChanged。没有新增 ARIA group/region 或测试专用结构。对保留的明确角色、密码遮蔽、记录身份和业务数值继续检查。其余覆盖缺口仍需披露；需求已更新，不能直接迁移旧成绩。

## 文件范围

- `arc-bench/ctrip/requirements/requirements.yaml`
- `arc-bench/ctrip/tests/helpers.ts`
- `arc-bench/ctrip/tests/REQ-2.16.spec.ts`
- `arc-bench/ctrip/tests/REQ-2.3.spec.ts`
- `arc-bench/ctrip/tests/REQ-3.13.spec.ts`
- `arc-bench/ctrip/tests/REQ-3.14.spec.ts`
- `arc-bench/ctrip/tests/REQ-3.15.spec.ts`
- `arc-bench/ctrip/tests/REQ-4.1.spec.ts`
- `arc-bench/ctrip/tests/REQ-4.7.spec.ts`
- `arc-bench/ctrip/tests/REQ-5.1.spec.ts`
- `arc-bench/ctrip/tests/REQ-5.17.spec.ts`
- `arc-bench/ctrip/tests/REQ-5.18.spec.ts`
- `arc-bench/ctrip/tests/REQ-5.9.spec.ts`
- `arc-bench/ctrip/tests/REQ-6.4.spec.ts`
- `arc-bench/ctrip/tests/REQ-7.4.spec.ts`
- `arc-bench/ctrip/tests/REQ-7.6.spec.ts`
- `arc-bench/ctrip/tests/REQ-8.2.spec.ts`
