import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { createHash } from 'node:crypto';

const root = resolve('outputs/arc-bench-reviewed-20261107');
const prefix = 'arc-bench/stackoverflow';
const source = (await readFile(resolve(root, prefix, 'requirements/requirements.yaml'), 'utf8')).replaceAll('\r\n', '\n');
const lineOf = id => {
  const index = source.indexOf(`id: ${id}\n`);
  assert.ok(index >= 0, `Missing source identity ${id}`);
  return source.slice(0, index).split('\n').length;
};
const leaves = [];
function walk(node, inherited = []) {
  if (!(node.children ?? []).length) leaves.push({ ...node, inherited });
  for (const child of node.children ?? []) walk(child, [...inherited, node.id]);
}
walk(parse(source));
const notes = {
  'REQ-1.1': ['Banner identity/search/account entries, four navigation actions, feed ordering controls, exact retry identity/tags, numeric metrics and linked widgets are observed. It does not compare screenshots or prove every historical metric equals its initial seed.'],
  'REQ-1.2': ['Questions/Tags/Users/Home transitions each assert current=page and their corresponding named region; feed Next page and two public users are observed. Generic initial navigation and leaf-specific button roles are distinguished by known control names.'],
  'REQ-1.3': ['Public search opens the exact heading/body/tags with anonymous account entries and no login form. Zero-answer seed is consistent with a publicly exposed empty Answers region: accessible existence is checked without a minimum rendered area.'],
  'REQ-2.1': [
    'Credential login observes feed/profile and reload persistence; anonymous Log in disappears.',
    'Empty submission retains the form with both exact field messages, anonymous login entry and no Stack User profile.',
    'Malformed-email rejection retains exact feedback/form and no Stack User action; it does not inspect private authentication state.',
    'Unknown-account rejection retains exact feedback/form and no Stack User action; independent account persistence is not established by this rejection case.',
    'Wrong-password rejection retains exact feedback/form and no account profile; authentication transport remains unrestricted.',
    'Password masking/reveal and unchanged value are checked at each stage; recovery and signup entries are now rechecked after both toggle actions, as the result clause requires.'
  ],
  'REQ-2.2': [
    'Unique UI registration inspects join/terms/privacy and observes the exact registered email plus feed after submission. Verification is not invented.',
    'Duplicate email produces the exact scoped error, keeps the form and no Stack User profile. Repeated visible error text is allowed.',
    'Weak password retains the form and proposed-email profile is absent; eight-character explanation is observed without imposing an undisclosed stronger password policy.'
  ],
  'REQ-2.3': ['Profile Activity/Summary navigation, numeric Reputation and Badges/Recent activity landmarks match the result. Reputation text must now be a complete integer, not merely contain digits.'],
  'REQ-2.4': ['All eight seeded fields are verified, changed public identity values observed and all values reopened with allowed URL normalization/X unchanged. Added refresh before reopening to distinguish saved data from an editor-local draft; repeated profile text is an existence check.'],
  'REQ-2.5': ['Scoped account-form switching verifies chosen region/Email/Password/matching submit and absence of the other form and profile. Hidden old regions are excluded by semantic role lookup.'],
  'REQ-2.6': ['Registration and subsequent credential login use separate contexts at the same application world. Fresh context initially lacks the email profile, then has it and the feed; no cookie/storage strategy is assumed.'],
  'REQ-3.1': ['Questions entry verifies visible Question feed, Ask Question and nonzero publicly identified question summaries; sibling behaviors are not inferred from this entry check.'],
  'REQ-3.2': ['Exact question/body/tags, all declared post actions and Score 7 are checked. Asked/Modified/View count now belong to Question post excluding nested Answers; UTC calendar spellings are compared by date. Author/image/reputation/badges/time and own Comments entry remain observed, with visual image content and exact author metadata still limited.'],
  'REQ-3.3': [
    'Title length, preview text/body, all three suggestions, saved heading/body/tags and owned Questions activity link are checked. Complete Markdown formatting semantics are not independently proved by text presence.',
    'Three sequential missing-field submissions assert their exact messages and retained editor/no Question post. Repeated visible messages do not create false ambiguity.',
    'The exact 14-character and 219-character boundaries are submitted with otherwise valid values; corresponding errors and no published post are checked.'
  ],
  'REQ-3.4': ['Owner updates title/body/tags/summary; detail verifies replacement/edited marker and removed node.js, history contains summary and original/replacement body. Broader preview/toolbar/revision-selection/cancel behavior has no separate scenario here.'],
  'REQ-3.5': ['Owner delete requires the confirmation dialog and preserves historical content. Complete paginated feed is inspected for retained retry identity and no deleted title; public exact search requires an exposed results region, including a valid empty one. No database-retention inference.'],
  'REQ-3.6': ['Question Score 7→8→7, active pressed states and relative author +10/restoration are observed, including reload of the active vote. Scoped own outputs prevent answer metric confusion.'],
  'REQ-3.7': ['Question Score 3→2, Down vote pressed=true and relative author reputation−2 are checked; no unspecified undo/downvote-reputation policy is invented.'],
  'REQ-3.8': ['Owned Questions activity opens the exact UI-created title with its saved body and three tags, establishing a real public parent rather than a disconnected activity card.'],
  'REQ-3.9': ['Saved title/body/tags/summary are reread in an independently authenticated context after reload, with removed node.js absent and history summary retained.'],
  'REQ-3.10': ['Non-owner has no enabled visible Delete, no confirmation dialog and unchanged exact heading/body. This is public operation availability, not hidden API authorization testing.'],
  'REQ-4.1': ['Posted answer is scoped under its parent, Answer count becomes 1 and survives reload; owned activity includes actual parent and answer excerpt.'],
  'REQ-4.2': ['Answer Score 0→1→0, pressed state and relative author +10/restoration are checked while the parent question Score remains unchanged.'],
  'REQ-4.3': [
    'Owner accepts Helpful User, verifies after reload, then transfers to Stack User with exactly one accepted marker. Added second reload to verify persisted exclusivity after transfer.',
    'Non-owner sees no usable acceptance action and no accepted marker. The supplied answer remains visible through question setup; green rendering is not measured by this semantic oracle.'
  ],
  'REQ-4.4': ['All three visible sort labels are exact; historical answer text order reverses from Date modified to Highest score and Answer count is 2. Trending ranking is unspecified and not asserted.'],
  'REQ-4.5': [
    'Same-body answer save verifies prefill, unchanged public body, edited metadata and retained summary; a text change is not required to establish a revision.',
    'Empty answer edit shows scoped visible feedback and retains editable Body; Cancel returns the original answer.',
    'Cancel removes editor, retains original body and excludes unsaved replacement; no saved revision is inferred from a canceled draft.'
  ],
  'REQ-4.6': ['One real upvote supplies the author +10 precondition; deletion reverses to baseline and count 0. Both owner and independent visitor require the empty Answers landmark; hidden retained old text is allowed while visible stale body is rejected.'],
  'REQ-4.7': ['Distinct score/date fixture supports both order observations; Date modified reverses sequence, retains count 2 and exact parent heading.'],
  'REQ-4.8': ['Owner changes actual answer content and summary; independent visitor after reload sees replacement, no original body, edited marker and saved history summary.'],
  'REQ-4.9': ['Non-author has no usable Delete while the correct Helpful User body and count 1 remain visible.'],
  'REQ-4.10': ['Owner acceptance is established in a separate context, then the answer author sees the accepted solution/body and no usable Delete. This preserves the accepted-answer deletion exception.'],
  'REQ-5.1': ['Authenticated public discovery exposes the question-owned Comments and Add a comment, excluding nested answer comment threads.'],
  'REQ-5.2': ['UI-published question comment verifies scoped author/timestamp and persistence. Added author and timestamp rechecks after reload; timestamp presentation supports public semantic time and ordinary clock/date/relative forms.'],
  'REQ-5.3': ['First five historical comments are visible and final two hidden before expansion; all seven and pairwise chronological order are then checked within own Comments.'],
  'REQ-5.4': ['Within-window historical edit checks prefill, replacement region/edited marker and original region absence under the same question. The described 12:06 expired-window case is absent from the fixed scenario list and remains a coverage gap.'],
  'REQ-5.5': ['Own comment disappears without any confirmation dialog while the exact parent heading and original body remain, preserving immediate comment-deletion semantics.'],
  'REQ-5.6': ['Score 1→2→1 and pressed false→true→false are checked; added explicit initial false and no Down vote checks after both transitions.'],
  'REQ-5.7': ['Answer-owned comment author/timestamp are checked before and after reload; the same text is excluded from the question-owned thread.'],
  'REQ-5.8': ['Reply is entered via the identified parent and its Replies region; submitted text and @Helpful User mention are observed. Added mention recheck after reload alongside persisted parent association.'],
  'REQ-5.9': ['Non-owner has no usable Edit/Delete on the correct visible Helpful User comment, retaining source body and attribution.'],
  'REQ-5.10': ['Separate question/answer comments are UI-created under distinct parents; after reload each keeps its own body/attribution and excludes the other text, including nested Answers presentation.'],
  'REQ-6.1': ['Baseline tag descriptions/current counts and descending catalog order are checked. Both required python identities and python on every returned summary are now observed across all feed pages; retry identity is excluded on every page. Catalog five-tag visibility still follows this concrete fixture.'],
  'REQ-6.2': ['Watch/unwatch transitions, watched navigation and reload persistence are verified. Empty Watched tags remains a publicly exposed region; added post-unwatch reload so removal cannot be a temporary UI state.'],
  'REQ-6.3': ['Real-time suggestions and committed search expose the known React title, excluding three explicit nonmatches; arbitrary keyword/tag/user/date syntax remains out of scope.'],
  'REQ-6.4': ['Newest/Active pressed states and distinct historical identity order are checked across pages; Questions resets the listing before switching sorting.'],
  'REQ-6.5': ['Criteria, save dialog/name, persisted entry and reopened criteria are checked. All result pages are now checked for required unanswered python identity, excluded control titles and numeric answer count 0. One matching historical fixture cannot establish nontrivial Newest order by itself.'],
  'REQ-6.6': ['Tag discovery follows the exact selected question across pages before opening its heading/body/python tag, keeping anonymous Log in. Traversal stops on successful navigation rather than reading a stale listing.'],
  'REQ-6.7': ['Creator sees/reopens persisted saved filter; independent account must expose its own possibly empty Saved filters region but not that title. Configuration restoration is covered by the companion save/reuse case, not independently proved merely by clicking here.'],
  'REQ-6.8': ['Only creator observes Unwatch; independent account has an exposed empty Watched tags, no python and Watch rather than Unwatch; creator restores original Watch state.'],
  'REQ-7.1': ['History contains both reasons, signed +10/+5, parent links and newest-first reason order. Amount/reason/parent association is not fully bound to separate semantic event records.'],
  'REQ-7.2': ['Seeded Teacher appears in Badges and its named notification says earned/awarded. No new award threshold or backend event uniqueness is inferred.'],
  'REQ-7.3': ['Anonymous public Helpful User entry opens all three named categories; each group binds badge name, description and exact numeric earn count.'],
  'REQ-7.4': [
    'All sidebar categories, Answers/Questions current states, answer sort/pagination affordances, actual parent/excerpt/accepted text and question metrics 3/1/11 are checked. Multiple-record attribution is not proven by the single seeded question.',
    'Responses has actual React parent/text; owner Votes contains upvote/retry and Reputation contains both reasons and signed values. Per-event parent/value binding remains weaker than complete history semantics.',
    'Anonymous visitor opens the distinct activity-user profile; private Votes is unavailable and retry vote title absent from activity content while public profile navigation remains. This is a public UI privacy check, not private endpoint access testing.'
  ],
  'REQ-7.5': ['Owned answer activity navigates to its actual React parent with correct heading, Stack User answer body and accepted marker, proving the activity parent link is functional.']
};

const definitions = [
  ['SO-01','medium','false-negative','fixed', ['REQ-2.1','REQ-2.2','REQ-2.4','REQ-3.3','REQ-4.5','REQ-7.4'], 'Ordinary visible feedback/text used strict unique locators, rejecting repeated correct text.', 'Use visible existential text checks without changing expected strings or relaxing action uniqueness.'],
  ['SO-02','high','false-negative-and-positive','fixed',['REQ-3.5','REQ-6.1','REQ-6.5','REQ-6.6'], 'Membership/discovery assumed the first feed page; excluded records on later pages could be missed.', 'Traverse declared public Next page controls, check all relevant pages, and stop traversal after opening the exact selected question.'],
  ['SO-03','medium','false-negative-and-positive','fixed',['REQ-1.3','REQ-3.5','REQ-4.6','REQ-6.2','REQ-6.7','REQ-6.8'], 'Empty result/list region either had an unjustified area requirement or could disappear while child count=0 passed.', 'Require one publicly exposed named region, allowing zero-area empty content; hidden/missing regions cannot satisfy semantic lookup.'],
  ['SO-04','high','false-negative-and-positive','fixed',['REQ-3.2'], 'Question timestamps/views were read globally and date matching rejected ordinary equivalent UTC spellings.', 'Bind outputs to their owning Question post excluding nested Answers; compare parsed UTC calendar dates and preserve strict output uniqueness.'],
  ['SO-05','medium','false-negative','fixed',['REQ-5.2','REQ-5.7'], 'Comment timestamp checks accepted only year 2026/ago/just now and rejected valid clock/month-day/native time presentation.', 'Accept visible public time metadata and common UTC clock/date/relative text; retain scoped author/body and persistence checks. This is timestamp presence, not proof of its exact instant.'],
  ['SO-06','medium','false-negative','fixed',['REQ-4.6'], 'Deleting an answer required old body text to be absent from DOM even though source only requires public disappearance.', 'Exclude hidden retained text from deletion observations; visible stale text and wrong answer counts still fail.'],
  ['SO-07','medium','coverage-gap','fixed',['REQ-2.1','REQ-2.4','REQ-4.3','REQ-5.2','REQ-5.6','REQ-5.8','REQ-6.2'], 'Several explicit retained-state, initial-state and post-reload result clauses were only partially checked.', 'Recheck recovery/signup after password toggles; profile data and second acceptance after reload; persisted comment author/time/reply mention; initial comment pressed=false and no downvote at every stage; persisted unwatch.'],
  ['SO-08','medium','false-positive','fixed',['REQ-1.2','REQ-2.1','REQ-2.2','REQ-2.3','REQ-3.2','REQ-3.3','REQ-4.2','REQ-5.6'], 'Shared action union accepted links for explicitly declared fixed-name business buttons; reputation regex merely contained digits.', 'Known explicit control names retain button role and exact identity; unrestricted navigational identities retain the prior alternatives. Reputation outputs must be whole integers.'],
  ['SO-09','high','coverage-gap','deferred',['REQ-5.4'], 'Descriptions mention an independent expired-comment scenario at 12:06, but the current 66 scenarios contain only within-window editing.', 'Keep five-minute product rule intact and disclose missing expired/boundary cases; do not claim the phantom scenario was executed or silently expand this denominator.'],
  ['SO-10','medium','coverage-gap','deferred',['REQ-3.3','REQ-3.4','REQ-4.3','REQ-6.1','REQ-6.5'], 'Complete Markdown rendering, question editor toolbar/revision selection/cancel, green acceptance rendering, paginated tag catalog and nontrivial filtered Newest ordering exceed current assertions/fixtures.', 'Disclose concrete unmeasured behavior. Do not invent ranking data, mandatory DOM wrappers, screenshot thresholds or extra cases in this revision.'],
  ['SO-11','high','weak-observation','deferred',['REQ-7.1','REQ-7.4'], 'History reasons, signed changes and parent titles are observed globally within a history view; swapped event attribution may pass.', 'Needs a source-grounded association-preserving record oracle/independent event fixtures. No test-only container role added.'],
  ['SO-12','medium','weak-observation','deferred',['REQ-3.2','REQ-5.2','REQ-5.7'], 'Author badge/time checks and comment timestamp presence do not fully establish exact source values or semantic visual content.', 'Keep public existence checks honest; precise timestamp, author-record fields and visual avatar/green-marker quality require further independent verification.']
];
const findings = definitions.map(([id,severity,category,status,requirements,explanation,resolution]) => ({ id,severity,category,status,requirements,
  source: requirements.map(id => `${prefix}/requirements/requirements.yaml:${lineOf(id)}`),
  test: requirements.map(id => `${prefix}/tests/${id}.spec.ts`), explanation,resolution,
  validation: status === 'fixed' ? 'Task-only TypeScript passed; new positive/negative browser contracts delegated to parent for execution.' : 'Complete static source/scenario review; explicitly unresolved.' }));
const scenarios = [];
for (const leaf of leaves) {
  const path = `${prefix}/tests/${leaf.id}.spec.ts`;
  const lines = (await readFile(resolve(root,path),'utf8')).split('\n');
  const starts = lines.flatMap((line,index) => /^test\(/.test(line) ? [index] : []);
  assert.equal(starts.length, leaf.scenarios.length, `${leaf.id}: tests/scenarios`);
  assert.equal(notes[leaf.id]?.length, leaf.scenarios.length, `${leaf.id}: independent review notes`);
  for (const [index,scenario] of leaf.scenarios.entries()) {
    const block = lines.slice(starts[index], starts[index+1] ?? lines.length);
    const related = findings.filter(finding => finding.requirements.includes(leaf.id));
    scenarios.push({ requirementId: leaf.id, scenarioId: scenario.id, scenarioName: scenario.name,
      testFile: path, testLine: starts[index]+1,
      source: `${prefix}/requirements/requirements.yaml:${lineOf(scenario.id)}`,
      coverage: { inheritedFrom: leaf.inherited,
        given: scenario.steps.filter(step => step.Given !== undefined).map(step => step.Given),
        when: scenario.steps.filter(step => step.When !== undefined).map(step => step.When),
        then: scenario.steps.filter(step => step.Then !== undefined).map(step => step.Then),
        actionsAndAssertions: block.flatMap((code,offset) => /\b(?:await|expect\()/.test(code) ? [{line: starts[index]+offset+1,code:code.trim()}] : []),
        review: notes[leaf.id][index], evidenceBoundary: 'Source-to-test review and bounded oracle contracts; no complete generated application was read or executed.' },
      findings: related.map(finding => finding.id),
      disposition: related.some(finding => finding.status === 'deferred') ? 'reviewed-with-explicit-gap'
        : related.length ? 'reviewed-fixed' : 'reviewed-no-mismatch-found' });
  }
}
const parent = JSON.parse(await readFile(resolve(root,'audit/parent-files.json'),'utf8')).files;
const changedFiles=[];
for (const path of Object.keys(parent).filter(path => path.startsWith(prefix+'/'))) {
  const current = createHash('sha256').update(await readFile(resolve(root,path))).digest('hex');
  if (current !== parent[path]) changedFiles.push(path);
}
const report={ task:'stackoverflow',reviewedRequirements:leaves.length,reviewedScenarios:scenarios.length,
  requirementsChanged:false, reviewScope:'All leaf descriptions, inherited contracts, 66 GWT scenarios, 52 test files, helpers, public controls and declared fixture worlds.',
  scenarios,findings,changedFiles,
  limitations:[
    'This is a model-assisted review of a derivative benchmark, not upstream official certification or human annotation.',
    'No generated applications or scores were consulted; no application/controller/source-requirement data was modified.',
    'The 66-scenario denominator is preserved. Expired-comment boundaries and identified broader editor/rendering/history behaviors remain unmeasured.',
    'Public UI privacy/ownership checks do not certify private endpoint authorization or internal database retention.',
    'Date/time parsers cover stated UTC and ordinary English presentations; this does not establish zero false negatives across all international display formats.',
    'Role/name conventions explicitly stated in the benchmark remain scoring contracts; passing them is not a complete real-world quality metric.'
  ], validation:{typecheck:'passed: audit/stackoverflow-tsconfig.json',browser:'Parent executes audit/validation/stackoverflow.spec.ts; no full application pass-rate claim.'}};
assert.equal(leaves.length,52); assert.equal(scenarios.length,66);
await writeFile(resolve(root,'audit/stackoverflow.json'),JSON.stringify(report,null,2)+'\n');
const fixed=findings.filter(f=>f.status==='fixed'); const open=findings.filter(f=>f.status!=='fixed');
const markdown=`# StackOverflow 逐场景审查\n\n已核对 **52 条叶需求、66 个场景**，以及全部继承合同、52 份 spec、helper、公开控件与种子。未读取生成应用或成绩。逐场景当前 G/W/T 原文、测试行号、断言和独立审查备注见 [stackoverflow.json](stackoverflow.json)。\n\n## 已修复 (${fixed.length})\n\n${fixed.map(f=>`- **${f.id} [${f.category}]** ${f.explanation} ${f.resolution}`).join('\n')}\n\n## 未决 (${open.length})\n\n${open.map(f=>`- **${f.id} [${f.severity}, ${f.category}]** ${f.explanation} ${f.resolution}`).join('\n')}\n\n## 验证和边界\n\n本题需求、种子、场景/步骤 ID、66 分母和公共控件副本均未修改。改动为 ${changedFiles.length} 个题内测试/helper 文件。全部本题 TypeScript 和新增合同的类型检查通过；浏览器正反例由父代理统一执行并登记最终结果。新增用例覆盖重复反馈、严格动作、日期归属/等价文本、时间戳、全页遍历与导航停止、空区域、隐藏旧正文和禁用操作。没有运行真实 StackOverflow 应用，因此不能声称66个业务场景已通过或假阴性已全部消除。\n\n仅修改基准观察方式，不需运行控制器全量测试。当前公开角色、名称、数值、对象归属与权限要求保留；描述级遗漏、真实时间值和事件记录关联仍单独标注。所有方法须使用同一冻结版本，旧分数保持原版本归属。\n\n修改文件：\n\n${changedFiles.map(path=>`- \`${path}\``).join('\n')}\n`;
await writeFile(resolve(root,'audit/stackoverflow.md'),markdown);
console.log(report.reviewedRequirements,report.reviewedScenarios,changedFiles.length,findings.length);
