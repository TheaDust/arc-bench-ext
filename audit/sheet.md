# Sheet 需求与测试逐场景审查

已读取并核对全部 24 条叶需求、100 个 GWT 场景、继承描述及所有 spec/support；逐场景原文、测试行号、动作断言与具体语义备注见 [sheet.json](sheet.json)。未读取生成应用或得分，不修改控制器、应用或公共控件模板。

本轮需求有两项显示等价性澄清（CSV 序列化、计算数值）及一个已有 CSV 场景输入增强（实际覆盖已要求的 UTF-8 中文）。ID、叶需求数和场景分母未变；后续各方法应统一使用同版需求重新生成，旧成绩不迁移。

## 已修订与保留问题

- **SHEET-01 (high, false-negative, fixed)** The commit helper required displayed text to change on every accepted edit, rejecting idempotent edits and formulas yielding the previous result. Read the accepted raw value/formula back through the declared Formula bar. Invalid-edit paths explicitly skip acceptance readback and retain their own error/unchanged-value assertions.
- **SHEET-02 (medium, false-negative, fixed)** Ordinary visible text was forced to be globally unique; absence of other-workbook/history text was checked outside its worksheet scope. Use visible existential text presence, preserve strict named actions, and scope data-absence assertions to the active declared grid.
- **SHEET-03 (medium, ambiguity, fixed)** Raw CSV equality rejected equivalent legal quoting, BOM and record separators rather than measuring exported cell values. Clarify decoded-cell equivalence in inherited REQ-1.3 and one Then; compare full ordered decoded fields, preserving significant spaces, empty fields, quotes, newline positions and raw leading zeros.
- **SHEET-04 (high, false-negative, fixed)** Filtered-range preparation required role locators for intermediate hidden rows, rejecting valid hidden or unmounted filtered records. Keep both visible endpoint selections and every observable interior cell strict. Hidden record preservation is checked independently by the ensuing complete-range sort, export and pivot business outcomes.
- **SHEET-05 (high, false-positive, fixed)** Checking active Sheet1 and empty A1 allowed extra worksheets or unwanted data elsewhere in the initially blank grid. Require exactly one Sheet1, the declared sole A1 selection, explicit public selection states and blank observable cells before/after refresh.
- **SHEET-06 (medium, false-positive, fixed)** The rectangle test sampled outside C-column cells, allowing additional selected cells elsewhere. Compare the complete selected-cell count with the explicitly required coordinates and require public true/false selection state on all observable gridcells.
- **SHEET-07 (medium, false-positive, fixed)** Sheet switching accepted any nonempty formula result rather than the required numeric 4. Observe exact raw formula and required calculated numeric value in each restored worksheet state.
- **SHEET-08 (medium, false-negative, fixed)** Worksheet rename used Enter although its source only declared Save and did not require keyboard submission. Click the declared Save button. Workbook rename retains Enter because its own GWT explicitly requires it.
- **SHEET-09 (medium, false-positive, fixed)** Whitespace-normalizing text assertions concealed lost embedded newlines; expected multiline text also introduced an absent space, and no existing input actually exercised declared Chinese support. Use exact cell text with CRLF/LF line-break equivalence, synchronize the original multiline field, include English/Chinese UTF-8 in the existing field fixture/source, and check all stated persisted cells.
- **SHEET-10 (medium, coverage-gap, fixed)** Several Then persistence clauses rechecked only a diagonal/first row or grid result, omitting other required fields, raw formulas or retained validation controls. Add the omitted post-refresh tuple fields, sentinels, raw formulas, rule reapplication and declared affordances in the existing scenarios; IDs and denominator remain unchanged.
- **SHEET-11 (medium, coverage-gap, deferred)** Conditional create/add/rename/structural/sort/pivot infrastructure-failure branches lack reproducible public failure-trigger scenarios. Keep the 100-scenario scope explicit. Do not invent private API fault injection or claim these conditional failures, all boundary datasets or arbitrary workbook sizes are covered. A future expansion needs declared public failure preconditions.
- **SHEET-12 (low, measurement-scope, retained)** The task explicitly measures named ARIA grid/tab/control/record contracts in addition to spreadsheet business behavior; screenshots and excluded collaboration are not evaluated. Retain these source-explicit accessibility identities; do not silently relax them to fit an application. Sharing/authentication permission probes are outside this task ROOT scope.
- **SHEET-13 (medium, false-negative, fixed)** Calculated numeric correctness was coupled to one textual numeric formatter, so 4.0 or 1,800 could fail despite correct arithmetic. Clarify numeric presentation equivalence and apply it only to reviewed formula/pivot output cells. CSV numeric equivalence is limited to known E2/E3/B1 calculated positions; ordinary input and raw expressions stay unchanged.
- **SHEET-14 (medium, coverage-gap, fixed)** Single-column CSV observed A1/A4 without explicitly checking active Sheet1, and added Sheet2 blankness was sampled only at A1. Add active Sheet1 before/after refresh in the CSV scenario; require visible A1 and blank text for every observable new-sheet gridcell before/after refresh. Only the two formal specs change; existing helpers, IDs and UI contracts stay unchanged.

计算数字等价只用于已核对的公式/pivot 结果；CSV 的 E2/E3 或 B1 计算位置显式列出，原始 `007`、普通文本数字、空格、空字段和原始公式均不整体 Number 化。普通文字可有重复可见副本，动作仍保持命名身份唯一。

## 验证与边界

Sheet 定向 TypeScript 检查通过；父代理合跑五题 110/110 正反例通过（37.4 秒），含本题最终 30 条（包括数字格式与 UTF-8 正反例），以最终冻结合跑报告为准。它们覆盖正确呈现、同结果编辑、忽略提交、错误值/格式、丢失空字段/前导零/换行/隐藏记录、额外工作表和选区等边界。没有运行 ShallowCode 全量测试，因为没有改动控制器、共享执行器或应用；没有执行完整 Sheet 业务应用，不能宣称 100 个真实场景已通过或不存在全部假阴性。

- Static semantic review and synthetic contract tests are not execution of a complete spreadsheet application and do not establish a quantitative false-negative rate.
- The fixed 100 scenarios do not exercise every conditional infrastructure failure without a public reproducible trigger, arbitrary larger datasets or every combination of operations.
- The visible grid/sample dataset is observed; unrendered offscreen cells cannot be directly inspected by the public-DOM oracle.
- Existing explicit ARIA roles/names are retained benchmark contracts; screenshot similarity and excluded collaboration/authentication features are not scored.
- CSV serialization/numeric presentation were clarified and one existing CSV fixture now covers already-required UTF-8 Chinese; old outcomes are not transferred to this version.

## 修改文件

- `arc-bench/sheet/requirements/requirements.yaml`
- `arc-bench/sheet/tests/REQ-1.1.1.spec.ts`
- `arc-bench/sheet/tests/REQ-1.2.1.spec.ts`
- `arc-bench/sheet/tests/REQ-1.2.2.spec.ts`
- `arc-bench/sheet/tests/REQ-1.3.1.spec.ts`
- `arc-bench/sheet/tests/REQ-1.3.2.spec.ts`
- `arc-bench/sheet/tests/REQ-2.1.1.spec.ts`
- `arc-bench/sheet/tests/REQ-2.1.2.spec.ts`
- `arc-bench/sheet/tests/REQ-2.1.3.spec.ts`
- `arc-bench/sheet/tests/REQ-2.1.4.spec.ts`
- `arc-bench/sheet/tests/REQ-2.2.1.spec.ts`
- `arc-bench/sheet/tests/REQ-2.2.2.spec.ts`
- `arc-bench/sheet/tests/REQ-3.1.1.spec.ts`
- `arc-bench/sheet/tests/REQ-3.1.2.spec.ts`
- `arc-bench/sheet/tests/REQ-3.1.3.spec.ts`
- `arc-bench/sheet/tests/REQ-3.2.1.spec.ts`
- `arc-bench/sheet/tests/REQ-3.2.2.spec.ts`
- `arc-bench/sheet/tests/REQ-4.1.1.spec.ts`
- `arc-bench/sheet/tests/REQ-4.1.2.spec.ts`
- `arc-bench/sheet/tests/REQ-4.2.1.spec.ts`
- `arc-bench/sheet/tests/REQ-4.2.2.spec.ts`
- `arc-bench/sheet/tests/REQ-5.1.1.spec.ts`
- `arc-bench/sheet/tests/REQ-5.1.2.spec.ts`
- `arc-bench/sheet/tests/REQ-5.2.1.spec.ts`
- `arc-bench/sheet/tests/REQ-5.3.1.spec.ts`
- `arc-bench/sheet/tests/support/e2e.ts`
- `arc-bench/sheet/tests/support/observations.ts`
