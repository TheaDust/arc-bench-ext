from pathlib import Path
import re, json, hashlib
import yaml

ROOT = Path(__file__).resolve().parents[1]
task = ROOT / 'arc-bench/ctrip'
source_path = task / 'requirements/requirements.yaml'
source_text = source_path.read_text(encoding='utf-8')
tree = yaml.safe_load(source_text)

# These notes were written after reading each group's full tests and the deduplicated inherited contracts.
notes = {
'1.1':'Exact singleton heading/navigation links; visible search and route controls. No screenshot/layout oracle.',
'1.2':'Password form and both direction switches preserve named fields; native password semantics checked by field().',
'1.3':'All three credential identities; each missing/wrong/agreement branch checks required error, retained form and absent signed-in entry.',
'1.4':'Sending precedes code acceptance; +86 and resend state; independent missing mobile/code, wrong code and legal acceptance branches.',
'1.5':'Both registration entries, visible named agreement, acceptance fields and decline return/closed dialog/signed-out state.',
'1.6':'Public UI agreement, unused generated phone, sent accepted code and password setup; resend checked in shared setup.',
'1.7':'Registration success plus reuse of created credentials; separate mismatch and weak-password errors retain setup and signed-out state.',
'1.8':'Explicit hover and menuitem logout; signed-out navigation checked before and after reload.',
'1.9':'Incorrect sent code preserves phone and verification heading and excludes password setup.',
'1.10':'Eight letters fail mixed-content rule; error and retained setup/signed-out state.',
'1.11':'Eight digits fail mixed-content rule independently of length; retained setup/signed-out state.',
'1.12':'Inclusive eight-character mixed password is registered and actually authenticates.',
'1.13':'Known example code without current Send code is rejected with visible alert and retained SMS form.',
'1.14':'Seven mixed characters fail minimum length separately from composition.',
'1.15':'Empty code after Send code is independently rejected; original phone remains and setup absent.',
'2.1':'Trip radio initial state, return visibility transitions and Add return restoration; Multi-city only availability, as specified.',
'2.2':'Swap values without query; origin Popular and destination GHIJ select correct city/code and close dialog. Description/button entry ambiguity remains.',
'2.3':'Selected July 21 button owns its fare, sets value and closes picker; past/too-early dates disabled; round-trip selection and four-day return retained.',
'2.4':'Exact three route/date flight identities and retained criteria; identical-city rejection; empty-route scoped message and modify action. Broader per-flight facts lack full assertion coverage.',
'2.5':'Child preference yields results notice; Economy uses public visible option label and selected state.',
'2.6':'Explicit initial anonymous history fixture reruns route with all three restored fields.',
'2.7':'Updated date/cabin retained; only named next-day flight and its price remain.',
'2.8':'Nearby fare is scoped to named date; result day/identity/price update; monthly fare and next-week date have dedicated observations.',
'2.9':'Nonstop intermediate exact set, excluded stopover and composed airline final identity.',
'2.10':'All three sort keys compare complete ordered public flight identities; no positional action locator.',
'2.11':'Fare expansion is scoped to JD5162, displays Economy/rules, closes and restores toggle.',
'2.12':'Booking opened through exact flight/fare group and route/date/number/total observed. Final Economy label itself is not asserted; explicit observation contract unresolved.',
'2.13':'Changed route/date fields and zero stale flights, scoped empty message and modify action.',
'2.14':'Modify search accepts either public submit action; exact original three matching flight identities return.',
'2.15':'Nonstop removal restores complete identity set and retains all route/date criteria.',
'2.16':'Before clearing airline check CZ3401 identity, then retained nonstop checkbox and exact two nonstop identities with excluded JD5162.',
'3.1':'Reminder details opened in scoped region; both notice subjects checked.',
'3.2':'Seeded current-owner frequent passengers selected; exact two selected records and 1→2 passenger/530→1060 fee transition.',
'3.3':'Valid ID retains value and has no alert after blur; invalid ID shows specific scoped alert. Non-persistence as frequent traveler not independently checked.',
'3.4':'Named Add passenger dialog and both fields only; no unspecified save outcome introduced.',
'3.5':'Seeded prefill, replacement retention after blur and no contact-region alert.',
'3.6':'Each optional service independently checks scoped selection, named fee and exact total; separate terms/free-baggage observations.',
'3.7':'Combined insurance+baggage arithmetic and detail lines; insurance removal retains baggage line and correct total.',
'3.8':'Guest booking through UI; named timer positive and explicit expiry reminder. Source explicitly mandates colon duration syntax, retained.',
'3.9':'Simulated Alipay selection, payment status and selected flight observed. Flight identity alone does not establish exact new order lineage.',
'3.10':'Deselection removes only Li Si, keeps exact Zhang San record and restores one-passenger total.',
'3.11':'Invalid passenger ID blocks Payment and retains Book flight with scoped validation.',
'3.12':'Agreement initially unchecked; valid other fields cannot bypass acceptance; alert and no Payment.',
'3.13':'Baggage baseline/checkbox/arithmetic restored; visible fee-details summary required and stale visible fee absent; hidden historical markup allowed.',
'3.14':'Drop-off checkbox/arithmetic restored and visible details summary omits removed fee.',
'3.15':'Lounge checkbox/arithmetic restored and visible details summary omits removed fee.',
'4.1':'Current-owner account entry observable; no unsupported link or ARIA menu requirement; Orders heading and list required.',
'4.2':'Each lifecycle tab checks exact identity/count/status exclusions; All orders checks all identities with corresponding fare and status.',
'4.3':'Exact number search retains correct flight identity and excludes both siblings.',
'4.4':'Named order number/flight/route, scoped rules/payment actions and decreasing positive timer; refund and change conditions scoped to itinerary.',
'4.5':'Dedicated cancellation owner; named confirmation; same number Closed before and after reload.',
'4.6':'Keep order closes dialog, preserves same number, Pending payment and Pay now.',
'4.7':'Visible current-account empty list required, and all other-owner fixture identities excluded.',
'5.1':'Personal center entry may use standard action roles; explicit Common information button; named four links initially hidden, expand visible, collapse hidden.',
'5.2':'Matching seeded traveler count/name; no-match count and scoped empty-state text.',
'5.3':'UI-created traveler exact count/name/masked identity before and after reload; missing-name error keeps form and count.',
'5.4':'One recipient record and every specified location component scoped to identity.',
'5.5':'UI-created recipient and location persist; helper records exact identity. Collected mobile is not asserted in list (Then refers to address values).',
'5.6':'Contact filter exact one matching saved name; negative filter is independent REQ-5.17.',
'5.7':'UI-created exact record count, mobile/email/default designation before and after reload.',
'5.8':'Company keyword filter exact record and taxpayer identity.',
'5.9':'Company title/taxpayer and exact singleton count persist across reload; special VAT independently exposes all four fields; missing taxpayer keeps form/list unchanged.',
'5.10':'Single and batch traveler deletion use UI-created targets/keep identities; confirmation and reload; only selected targets disappear.',
'5.11':'Single and batch address deletion preserve keep record before/after reload. Extra Delete addresses button in prose is not part of concrete When and remains an ambiguity.',
'5.12':'Single and batch contacts created through own UI; identified targets removed, keep survives both checkpoints.',
'5.13':'Single and batch invoice titles with different taxpayer identities; scoped confirmation/keep/reload. Extra Delete invoice titles button ambiguity remains.',
'5.14':'Prefilled full identity observed; only name changed; old record absent, updated masked ID/count preserved through reload.',
'5.15':'Identified saved address View address opens heading and region with recipient and all four specified details.',
'5.16':'Newly saved exact isolated traveler found with masked ID and exact singleton count.',
'5.17':'Visible Contact list required before zero-count exclusion; no invented empty-state wording.',
'5.18':'Visible Invoice title list required before zero-count exclusion; no invented empty-state wording.',
'5.19':'Declined traveler deletion closes dialog and retains same masked identity and count before/after reload.',
'6.1':'Profile current-owner masked phone/email and four corresponding profile values.',
'6.2':'Four submitted profile values including public Gender choice retained before/after reload.',
'6.3':'All three named security regions independently own Change action; reminder visible.',
'6.4':'Strength/new password/reauthentication; old credentials rejected; new attempt explicitly accepts terms again to avoid assuming checkbox retention after failure.',
'6.5':'Identity heading then new-phone stage, named code input and exact recipient notice; no invented final binding.',
'6.6':'Masked current email, sent valid code and New email stage; no final binding assertion.',
'6.7':'Wrong existing password retains form and error, does not request reauth; logout/relogin proves original password remains usable.',
'6.8':'Wrong password retains identity stage and excludes code-sent/new-phone stage.',
'6.9':'Incorrect sent current-email code retains validation/code field and excludes New email.',
'7.1':'Explicit Flights button and Flight status link lead to heading and both query dimensions.',
'7.2':'Correct flight/date query; all supplied details, carousel scoped to numeric field.',
'7.3':'Route status exact singleton identity and complete published observations; swap retains inputs without displaying results.',
'7.4':'Own UI query creates reusable history; restored flight/cities and now explicit restored date assertion.',
'7.5':'History made through search then cleared; named action absent and scoped empty state before/after reload.',
'7.6':'Fields and selected mode observed in both directions; no results/details checked after each dimension switch.',
'7.7':'Named route history reruns route (not number); exact identity/count/cities and restored route/date criteria.',
'7.8':'Two real authenticated owners; only current-owner history observed; no other-owner action and empty state.',
'8.1':'Authenticated service entry establishes tabs and named issuance notice, without claiming sibling transitions.',
'8.2':'Three tabs, semantic 365-day window, exact owned completed voucher record.',
'8.3':'Eligible current order, older date-loaded order and noneligible empty state tested independently on dedicated owners.',
'8.4':'No-order current owner sees visible empty notice and neither eligible other-owner order.',
'9.1':'Explicit Flights/More services/Airport guide buttons; heading visible.',
'9.2':'Exact popular and domestic directory links; supplied weather city/range and Boarding process link within weather region.',
'9.3':'Overview initially selected and facts; bus record-scoped timetable; named medical record hotline. No invented fourth tab.',
'9.4':'Both explicit directory shortcuts open correct selected tab and named region with corresponding airport/city link.',
}

finding_specs = [
('CTRIP-01','high','false-negative', ['4.1','5.1'], 'Account entry roles and ARIA menu container were required only by tests, although the concrete source does not declare them.', 'fixed', 'accountEntry preserves exact identity/uniqueness and permits button/link/menuitem; removed undeclared ARIA menu check.', 'account-entry presentation positives and wrong/duplicate identity negatives'),
('CTRIP-02','high','false-positive', ['3.13','3.14','3.15'], 'A missing Fee details region satisfied child text count=0. Hidden retained markup could also fail a valid removal.', 'fixed', 'Require visible uniquely named details region and no visible exact removed fee.', 'visible empty/hidden historical fee pass; absent summary/stale visible fee reject'),
('CTRIP-03','medium','false-positive', ['2.3'], 'July 21 fare was checked globally and could be supplied by an unrelated date or page region.', 'fixed', 'Assert ¥460 within the declared July 21 button.', 'correct date fare pass; wrong date fare with global decoy cannot satisfy'),
('CTRIP-04','medium','false-negative', ['6.4'], 'New-password retry assumed legal checkbox stayed checked after old-password rejection, a policy absent from source.', 'fixed', 'Explicitly accept terms for the second login attempt.', 'source/action inspection; semantic state-reset browser example below'),
('CTRIP-05','medium','false-positive', ['7.4'], 'History reuse omitted the explicit July 21 restoration outcome.', 'fixed', 'Assert restored Departure date value after using history.', 'source-to-assertion inspection; no full app execution'),
('CTRIP-06','high','false-positive', ['4.7','5.17','5.18'], 'Zero-record tests also passed if the declared list region was missing entirely.', 'fixed', 'Require the declared current-account list visible before checking empty records.', 'same missing-container class as fee-summary negative; scoped source inspection'),
('CTRIP-07','medium','false-positive', ['7.6'], 'No-query-on-mode-switch was observed only after the second switch, missing a query triggered by Route selection.', 'fixed', 'Check absence of both results regions immediately after Route as well as after Flight number.', 'source-to-assertion inspection; no generated app evaluation'),
('CTRIP-08','medium','false-positive', ['8.2'], 'Bare substring 365 did not establish the specified 365-day availability window.', 'fixed', 'Require 365 with a day/days unit, allowing spaces or hyphen.', 'valid day window and unrelated number negative'),
('CTRIP-09','medium','false-positive', ['1.2','1.3','1.4','1.5','1.6','1.7','1.8','1.10','1.11','1.12','1.13','1.14','3.4','6.1','6.2','6.4','6.5','6.7','6.8','7.1','7.7','8.3','9.1','9.4'], 'Generic action union accepted wrong roles even where source explicitly declares them; field helper accepted plaintext password textboxes outside login().', 'fixed', 'Honor explicitly declared action roles in helper and intersect password controls with input[type=password]. Unknown action roles remain generic.', 'correct/wrong explicit roles and masked/plaintext controls'),
('CTRIP-10','medium','source-ambiguity', ['2.2'], 'Description declares a City selection button; concrete When requires clicking Origin/Destination. The tests exercise only the latter. Whether both entry mechanisms are obligatory is not explicit.', 'deferred', 'Retain concrete scenario and flag the extra description capability for benchmark-owner policy; no invented UI added.', 'static source comparison; no new business expectation'),
('CTRIP-11','medium','coverage-gap', ['2.4','2.12','3.3','3.9','5.1','5.5','5.9'], 'Some broader description obligations exceed concrete checked Then clauses: complete initial flight facts, retained Economy label, ad-hoc passenger non-persistence, exact new-order lineage, initially collapsed Common information, address mobile persistence and exact invoice count after reload.', 'partly-fixed', 'Added deterministic initial-collapse and invoice-reload count observations where already publicly observable. Exact new-order lineage and Economy observation require a clarified public outcome rather than private internals; address mobile need not be displayed in its list row, so no invented row field was added. Remaining breadth is disclosed in each row.', 'static full-source review; app-level identity lineage unresolved'),
('CTRIP-12','medium','source-ambiguity', ['5.11','5.13'], 'Description additionally names Delete addresses/Delete invoice titles buttons, while concrete scenario goes from Delete selected directly to confirmation dialog.', 'deferred', 'Retain concrete scenario steps; extra intermediate action obligations need source-owner clarification, not guessed clicks.', 'description/When comparison'),
]

findings = []
for fid, severity, category, ids, explanation, status, resolution, validation in finding_specs:
    first = 'REQ-' + ids[0]
    source_line = next(i for i,l in enumerate(source_text.splitlines(),1) if re.search(r'\bid: '+re.escape(first)+r'$', l))
    findings.append(dict(id=fid,severity=severity,category=category,requirements=['REQ-'+x for x in ids],source=f'arc-bench/ctrip/requirements/requirements.yaml:{source_line}',test=[f'arc-bench/ctrip/tests/REQ-{x}.spec.ts' for x in ids],explanation=explanation,status=status,resolution=resolution,validation=validation))

scenario_rows=[]
queue=[(tree,[])]
while queue:
    node, parents=queue.pop(0)
    queue[0:0]=[(n,parents+[node['id']]) for n in node.get('children',[])]
    if node.get('children'):continue
    rid=node['id']; key=rid.removeprefix('REQ-')
    assert key in notes, rid
    file=task/'tests'/f'{rid}.spec.ts'
    code=file.read_text(encoding='utf-8')
    tests=list(re.finditer(r'''\btest\((['"])(.*?)\1\s*,''', code))
    indexed={m.group(2): (m.start(), tests[i+1].start() if i+1<len(tests) else len(code)) for i,m in enumerate(tests)}
    assert len(indexed)==len(node.get('scenarios',[])), rid
    for scenario in node.get('scenarios',[]):
        title=rid+': '+scenario['name']; assert title in indexed,(rid,title)
        start,end=indexed[title]; body=code[start:end]
        line=code[:start].count('\n')+1
        statements=[dict(line=line+i,code=s.strip()) for i,s in enumerate(body.splitlines()) if re.search(r'await (?:expect|visible|heading|textVisible|alertText|total|signedOut|expectSelectedChoice|expectFeeAbsent)|expect\(await|expect\(before',s)]
        actions=[dict(line=line+i,code=s.strip()) for i,s in enumerate(body.splitlines()) if re.search(r'await .*\.(?:click|fill|check|uncheck|hover|focus|reload|runFor)|await (?:open|login|search|register|create|choose|submit|query|signedOut)',s)]
        applicable=[f['id'] for f in findings if rid in f['requirements']]
        open_findings=[f['id'] for f in findings if rid in f['requirements'] and f['status'] in ['deferred','partly-fixed']]
        source_line=next(i for i,l in enumerate(source_text.splitlines(),1) if re.search(r'\bid: '+re.escape(scenario['id'])+r'$',l))
        scenario_rows.append(dict(requirementId=rid,scenarioId=scenario['id'],name=scenario['name'],testFile=f'arc-bench/ctrip/tests/{rid}.spec.ts',source=f'arc-bench/ctrip/requirements/requirements.yaml:{source_line}',coverage=dict(inheritedFrom=parents,given=[s.get('Given','') for s in scenario['steps']],when=[s.get('When','') for s in scenario['steps']],then=[s.get('Then','') for s in scenario['steps']],actions=actions,assertions=statements,review=notes[key]),findings=applicable,disposition='reviewed-with-open-source-or-coverage-limit' if open_findings else 'reviewed-corrected' if applicable else 'reviewed-no-mismatch-found'))

parent=json.loads((ROOT/'audit/parent-files.json').read_text(encoding='utf-8'))['files']
changed=[]
for p in task.rglob('*'):
    if p.is_file():
        rel=p.relative_to(ROOT).as_posix()
        if hashlib.sha256(p.read_bytes()).hexdigest()!=parent.get(rel):changed.append(rel)
result=dict(task='ctrip',reviewedRequirements=len(notes),reviewedScenarios=len(scenario_rows),reviewMethod='All 97 leaves, 152 concrete scenarios, inherited descriptions, all 97 spec files, helpers, public controls and deduplicated fixture declarations inspected without generated apps/scores. Matrix preserves actual source expectations and test evidence; this is a static semantic audit plus targeted synthetic contracts, not 152 live business executions.',scenarios=scenario_rows,findings=findings,changedFiles=changed,validationTests='audit/validation/ctrip.spec.ts',validation={'targetedBrowserContracts':{'passed':12,'failed':0,'seconds':4.9,'executedBy':'parent agent'},'allCtripTypeScript':'passed TypeScript CLI scoped to all ctrip/tests/**/*.ts; helper/contract files also passed'},requirementsChanged=False,limitations=['No generated Ctrip application was read or reevaluated; no claims of measured business pass rate or zero false negatives.','Explicit pre-existing public accessibility/record naming contracts remain; these are derivative benchmark conventions, not proof of upstream product necessity.','Unresolved source/coverage findings CTRIP-10, CTRIP-11, CTRIP-12 must remain visible in publication and freeze decisions.','Countdown syntax was retained because inherited contracts explicitly mandate MM:SS or HH:MM:SS.','Visual similarity and unspecified multi-city/fulfillment/phone-email-completion/context behaviors remain outside concrete scenario coverage.'])
assert len(notes)==97 and len(scenario_rows)==152
(ROOT/'audit/ctrip.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

lines=['# Ctrip 逐需求与测试审查','',f'完整检查 **97 条原子需求、152 个场景**。未读取生成应用或其成绩。需求正文、父级合同、场景初态、所有 97 份 spec、helpers、公共控件和去重种子均纳入审查。逐场景原文、动作及断言行号见 [ctrip.json](ctrip.json)。','', '## 已修订的可证明问题','']
for f in findings:
    lines += [f"- **{f['id']} [{f['status']}] {f['category']}**：{f['explanation']} {f['resolution']}"]
lines += ['','## 验证与解释边界','','新增 `audit/validation/ctrip.spec.ts` 正反控件合同，父代理已执行 **12/12 通过（4.9 秒）**。本子任务完成全部 Ctrip 测试文件及新合同测试的 TypeScript 检查。只修改本题测试与 helper，不需要运行控制器全量测试。没有运行 152 个真实 Ctrip 业务场景，合同回归不能替代完整应用验证。','','需求没有被改写；没有新增 ARIA group/region 或测试专用结构。对现有明确声明的角色、密码遮蔽、记录身份和业务数值保留严格检查。未决问题必须在冻结与论文中披露，不能称为已经消除歧义。','','## 文件范围','']+[f'- `{x}`' for x in changed]
(ROOT/'audit/ctrip.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'requirements':len(notes),'scenarios':len(scenario_rows),'findings':len(findings),'changedFiles':len(changed)}))
