# StackOverflow 逐场景审查

已核对 **52 条叶需求、66 个场景**，以及全部继承合同、52 份 spec、helper、公开控件与种子。未读取生成应用或成绩。逐场景当前 G/W/T 原文、测试行号、断言和独立审查备注见 [stackoverflow.json](stackoverflow.json)。

## 已修复 (8)

- **SO-01 [false-negative]** Ordinary visible feedback/text used strict unique locators, rejecting repeated correct text. Use visible existential text checks without changing expected strings or relaxing action uniqueness.
- **SO-02 [false-negative-and-positive]** Membership/discovery assumed the first feed page; excluded records on later pages could be missed. Traverse declared public Next page controls, check all relevant pages, and stop traversal after opening the exact selected question.
- **SO-03 [false-negative-and-positive]** Empty result/list region either had an unjustified area requirement or could disappear while child count=0 passed. Require one publicly exposed named region, allowing zero-area empty content; hidden/missing regions cannot satisfy semantic lookup.
- **SO-04 [false-negative-and-positive]** Question timestamps/views were read globally and date matching rejected ordinary equivalent UTC spellings. Bind outputs to their owning Question post excluding nested Answers; compare parsed UTC calendar dates and preserve strict output uniqueness.
- **SO-05 [false-negative]** Comment timestamp checks accepted only year 2026/ago/just now and rejected valid clock/month-day/native time presentation. Accept visible public time metadata and common UTC clock/date/relative text; retain scoped author/body and persistence checks. This is timestamp presence, not proof of its exact instant.
- **SO-06 [false-negative]** Deleting an answer required old body text to be absent from DOM even though source only requires public disappearance. Exclude hidden retained text from deletion observations; visible stale text and wrong answer counts still fail.
- **SO-07 [coverage-gap]** Several explicit retained-state, initial-state and post-reload result clauses were only partially checked. Recheck recovery/signup after password toggles; profile data and second acceptance after reload; persisted comment author/time/reply mention; initial comment pressed=false and no downvote at every stage; persisted unwatch.
- **SO-08 [false-positive]** Shared action union accepted links for explicitly declared fixed-name business buttons; reputation regex merely contained digits. Known explicit control names retain button role and exact identity; unrestricted navigational identities retain the prior alternatives. Reputation outputs must be whole integers.

## 未决 (4)

- **SO-09 [high, coverage-gap]** Descriptions mention an independent expired-comment scenario at 12:06, but the current 66 scenarios contain only within-window editing. Keep five-minute product rule intact and disclose missing expired/boundary cases; do not claim the phantom scenario was executed or silently expand this denominator.
- **SO-10 [medium, coverage-gap]** Complete Markdown rendering, question editor toolbar/revision selection/cancel, green acceptance rendering, paginated tag catalog and nontrivial filtered Newest ordering exceed current assertions/fixtures. Disclose concrete unmeasured behavior. Do not invent ranking data, mandatory DOM wrappers, screenshot thresholds or extra cases in this revision.
- **SO-11 [high, weak-observation]** History reasons, signed changes and parent titles are observed globally within a history view; swapped event attribution may pass. Needs a source-grounded association-preserving record oracle/independent event fixtures. No test-only container role added.
- **SO-12 [medium, weak-observation]** Author badge/time checks and comment timestamp presence do not fully establish exact source values or semantic visual content. Keep public existence checks honest; precise timestamp, author-record fields and visual avatar/green-marker quality require further independent verification.

## 验证和边界

本题需求、种子、场景/步骤 ID、66 分母和公共控件副本均未修改。改动为 23 个题内测试/helper 文件。全部本题 TypeScript 和新增合同的类型检查通过；浏览器正反例由父代理统一执行并登记最终结果。新增用例覆盖重复反馈、严格动作、日期归属/等价文本、时间戳、全页遍历与导航停止、空区域、隐藏旧正文和禁用操作。没有运行真实 StackOverflow 应用，因此不能声称66个业务场景已通过或假阴性已全部消除。

仅修改基准观察方式，不需运行控制器全量测试。当前公开角色、名称、数值、对象归属与权限要求保留；描述级遗漏、真实时间值和事件记录关联仍单独标注。所有方法须使用同一冻结版本，旧分数保持原版本归属。

修改文件：

- `arc-bench/stackoverflow/tests/helpers.ts`
- `arc-bench/stackoverflow/tests/REQ-1.3.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-2.1.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-2.2.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-2.3.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-2.4.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-3.2.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-3.3.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-3.5.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-4.3.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-4.5.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-4.6.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-5.2.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-5.6.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-5.7.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-5.8.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-6.1.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-6.2.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-6.5.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-6.6.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-6.7.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-6.8.spec.ts`
- `arc-bench/stackoverflow/tests/REQ-7.4.spec.ts`
