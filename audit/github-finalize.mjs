import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import YAML from 'yaml';
import { fileURLToPath } from 'node:url';
const audit=path.dirname(fileURLToPath(import.meta.url)), root=path.dirname(audit);
const reqPath=path.join(root,'arc-bench/github/requirements/requirements.yaml');
let source=fs.readFileSync(reqPath,'utf8');
const doc=YAML.parseDocument(source), edits=[];
function scalar(node,value){const [a,b]=node.range;edits.push([a,b,JSON.stringify(value)+(source.slice(a,b).endsWith('\n')?'\n':'')]);}
function update(node){
  if(node.get('id')==='REQ-3.2.3'){
    const description=node.get('description').get('text',true);
    if(!description.value.includes('The selected protocol address is publicly labeled')) scalar(description,description.value+'\n\nThe selected protocol address is publicly labeled "Clone value": it may be a read-only native input/textarea or a static publicly labeled text output. No wrapper role or fixed host is required. The selected protocol tab exposes aria-selected=true. The HTTPS address uses https://; SSH uses ssh:// or the usual user@host:path form. The address identifies the current repository, optionally ending in .git. Copy must place that exact displayed address in the actual browser clipboard. Before each copy check, the permitted public clipboard is initialized to an unrelated text value; feedback alone is insufficient. This label and selected-state observation are explicit conventions of this revised benchmark.');
    for(const scenario of node.get('scenarios').items){
      const then=scenario.get('steps').items[0].get('Then',true);
      scalar(then,'The selected protocol tab reports selected=true. Clone value is visible, read-only, uses the selected protocol and identifies acme-docs; after copying, the actual browser clipboard equals the displayed Clone value, Copied feedback is visible, and the acme-docs repository heading remains visible. The concrete clone host is implementation-defined.');
    }
  }
  if(node.get('id')==='REQ-2.2.2'){
    const description=node.get('description').get('text',true);
    if(!description.value.includes('“Add member to team” submit button')) scalar(description,description.value.replace('and an “Add member” button;', 'and an “Add member to team” submit button;')+'\n\nThe page launcher remains named "Add member"; the editor submit action is named "Add member to team" so the two operations have distinct public identities even when both remain visible. This action-name disambiguation is a versioned benchmark input clarification; existing generated applications are not assumed to implement the revised name.');
    const when=node.get('scenarios').items[0].get('steps').items[0].get('When',true);
    scalar(when,when.value.replace('clicks the “Add member” button','clicks the “Add member to team” button'));
  }
  if(node.get('id')==='REQ-6.2.4'){
    const description=node.get('description').get('text',true);
    if(!description.value.includes('Historical timeline entries may retain Draft')) scalar(description,description.value+'\n\nThe Ready for review action is available for a current Draft PR and is no longer visible after it transitions to Open. Historical timeline entries may retain Draft text; current Open state and the disappearance of the transition action distinguish current status from history.');
    const then=node.get('scenarios').items[1].get('steps').items[0].get('Then',true);
    scalar(then,'The PR changes to Open, the Ready for review action is no longer visible, title and branches remain exact, ready-for-review activity is visible, and Open plus absence of the Ready for review action remain after reload. Historical Draft text may remain in the timeline.');
  }
  if(node.get('id')==='REQ-5.3.1'){
    const description=node.get('description').get('text',true);
    if(!description.value.includes('The currently assigned relationship is exposed')) scalar(description,description.value+'\n\nThe currently assigned relationship is exposed by the assignee option selected state: an ARIA option reports aria-selected=true when assigned and false when unassigned; a native option uses its selected property. Reopening the picker after reload reflects the persisted relationship. Activity history may retain the username after unassignment. This selected-state observation is an explicit convention of this revised benchmark, not an extra assignment policy.');
    const then=node.get('scenarios').items[0].get('steps').items[0].get('Then',true);
    scalar(then,'The exact bob-reviewer text is visible after assignment and reload; reopening the option reports selected=true. After the second selection and reload, reopening the option reports selected=false. Historical activity may still mention bob-reviewer.');
  }
  if(node.get('id')==='REQ-1.2'){
    const scenarios=node.get('scenarios').items;
    const steps1=scenarios[0].get('steps').items, steps2=scenarios[1].get('steps').items;
    scalar(steps1[0].get('Given',true),'In a fresh browser session, sign in as seeded alice-dev (alice.dev@example.test, Valid-password-123!), open Account menu then Settings, and record that protected page URL.');
    scalar(steps1[0].get('When',true),'Open Account menu, follow Sign out, and activate Confirm sign out in the Sign out dialog.');
    scalar(steps1[0].get('Then',true),'The Sign in link is visible and the current user Account menu is absent.');
    scalar(steps1[1].get('Then',true),'After refresh, browser Back, and direct navigation to the recorded protected URL, Sign in remains visible; direct navigation does not restore the signed-out Account menu.');
    scalar(steps2[0].get('Given',true),'In a fresh browser session, sign in as seeded alice-dev (alice.dev@example.test, Valid-password-123!), open Account menu then Settings, and record that protected page URL.');
    scalar(steps2[0].get('When',true),'Open Account menu, follow Sign out, and activate Cancel in the Sign out dialog.');
    scalar(steps2[0].get('Then',true),'The dialog closes, the original protected URL remains current, and Account menu remains visible.');
    scalar(steps2[1].get('Then',true),'After refresh, the same protected URL and authenticated Account menu remain available.');
  }
  for(const child of node.get('children')?.items??[])update(child);
}
update(doc.contents);
for(const [a,b,value]of edits.sort((a,b)=>b[0]-a[0]))source=source.slice(0,a)+value+source.slice(b);
YAML.parse(source);fs.writeFileSync(reqPath,source);

// Each entry below is the result of reading the complete leaf, inherited context,
// scenario steps and matching test callback, rather than a count-only check.
const notes={
'REQ-1.1.1':[
 'UI registration creates the supplied unused identity; email login and reload assert the username. Verified-email storage is not independently visible.',
 'Duplicate identity is registered through UI first; conflict and retained username/email are asserted. No-account/no-session/original-credentials clauses are not fully exercised.',
 'All four simultaneous field errors and retained username are asserted. Failure clearing of password fields, rejected account absence and no-session clauses remain under-tested.'
],
'REQ-1.1.2':[
 'Seeded username/password authentication uses declared link, exact labels and masked password input; username survives reload.',
 'Wrong-password submission observes generic error. Lack of a session and absence of account-disclosing supplementary text are not independently asserted.',
 'Seeded email/password login observes the same exact username; no fixture storage injection.',
 'Unknown-email and wrong-password attempts both observe generic failure text. The test does not verify that no protected session was created.'
],
'REQ-1.1.3':[
 'Both registered and unknown emails reach visible fixed code, masked new-password control and verification-code field.',
 'Wrong code yields error, then original credentials succeed through public login. Candidate credentials rejection is not checked.',
 'Correct code yields update message and new credentials succeed. Rejection of the old password and invalidation of other sessions are not checked.'
],
'REQ-1.2':[
 'Clarified confirmed sign-out uses a recorded Settings URL; Account menu absence and Sign in are checked after refresh, Back and direct protected navigation.',
 'Replaced generic duplicate sign-out scenario with the leaf-required Cancel branch; unchanged protected URL and authenticated menu survive reload.'
],
'REQ-1.3':[
 'Current/new/confirmation are masked controls; successful update message is followed by new-password login in a genuinely fresh context. Old-password refusal remains uncovered.',
 'Wrong current password with mismatched confirmation yields the stated current-password error; original credentials are rechecked in a fresh context. Candidate refusal is uncovered.',
 'Empty current password yields required error; original credentials are rechecked in a fresh context. Candidate refusal remains uncovered.'
],
'REQ-2.1.1':[
 'Public organization, repository filter, exact result link and overview heading are followed; returning via organization navigation retains the public link.',
 'Unauthenticated exact private-name filtering exposes no private repository link; direct URL access is not part of this callback.'
],
'REQ-2.1.2':[
 'Owner creates mobile-guild with Mobile Guild display name; overview heading survives reload. Persisted Owner relationship is not directly checked.',
 'Existing identifier with empty display name must report the declared conflict and remain off the overview. Error priority is a benchmark convention explicitly supplied in the scenario.',
 'Invalid identifier plus whitespace display name now checks both required errors; original test omitted Display name is required. Creation absence is only indirectly checked.'
],
'REQ-2.2.1':[
 'Owner creates unique mobile-team under Acme Demo; named heading persists on reload. Cross-organization uniqueness and non-owner refusal are uncovered.',
 'Malformed team name is submitted through the named public form and its validation message is observed; no independently read team-list snapshot.'
],
'REQ-2.2.2':[
 'Authorized member addition uses a publicly distinguished Add member to team submit action while launcher remains Add member; removal and reload absence are checked. The new submit name is an input revision, not compatible with every historical app.',
 'Descendant parent option is chosen by visible label; cycle error and unchanged saved parent are observed after reload. No hierarchy mutation is injected.'
],
'REQ-2.2.3':[
 'Existing named form/record groups bind username and Member role; reload persistence, independent member login, organization membership and private-repository refusal are checked.',
 'Existing and unknown accounts produce scoped errors; exactly one existing record and zero unknown records are checked, then reload preserves one existing member.'
],
'REQ-2.2.4':[
 'Owner confirms removal and observes People absence after reload. Team-membership/direct-grant cascades and retained external relationships remain untested.',
 'Read member may view the protected member but sees neither specified member menu nor removal menu item; role eligibility follows explicit non-Owner rule.'
],
'REQ-2.3':[
 'Admin selects a matching team and Write grant; team and role are visible, then team survives reload. Grant role is not bound to the same row after reload.',
 'Existing team row changes Write to Read and stays exactly one row after reload. Actual affected member repository capability is not rechecked.'
],
'REQ-3.1':[
 'Public exact search-result link opens a repository heading.',
 'Private exact-name query exposes no private result link.',
 'Unmatched query observes allowed no-results wording.',
 'Public search opens the same repository; heading survives reload.'
],
'REQ-3.2.1':[
 'New private initialized repository is checked via public Branch state/tree/history contract, author, root commit, owner list and reload. Description is conditionally filled and not checked after saving.',
 'Personal-namespace duplicate name yields conflict and no existing overview heading; no independent partial-object readback.',
 'Missing name yields required validation; no independent account-list snapshot for partial creation.'
],
'REQ-3.2.2':[
 'Fork copies the exact specified source files/history/heads, retains list/source relationship, and a new fork commit leaves source unchanged after reload; numeric ids remain implementation-defined.',
 'Existing fork name conflict is observed after validating the supplied source state. No duplicate-fork list snapshot is asserted.'
],
'REQ-3.2.3':[
 'HTTPS selected tab and publicly labeled read-only clone address are read; a nonmatching public clipboard initial value is set, copy must place the exact address in real clipboard, feedback and repository heading remain.',
 'SSH selected tab and static/native read-only clone address are read; protocol and repository identity are checked without fixing host, and actual clipboard equality rejects feedback-only copy.'
],
'REQ-3.3':[
 'Public overview requires heading, Public marker and declared Code navigation link, then heading survives reload; public text repetition is now accepted.'
],
'REQ-3.4':[
 'Admin visibility mutation is tested from a separately created unauthenticated BrowserContext, removing the cookie-only session assumption.',
 'Non-admin collaborator must have no enabled visible Change visibility action; absent, hidden or disabled presentations now satisfy the actual non-actionable requirement.'
],
'REQ-4.1':[
 'Visitor opens exact src then README.md links and supplied stored content survives reload; no application internals read.'
],
'REQ-4.2.1':[
 'Commits navigation checks seed message, author and ago timestamp. These values are not bound to the same record and history ordering remains untested.'
],
'REQ-4.2.2':[
 'Commit entry displays changed path, summary token and numeric additions/deletions. Exact expected numeric diff or line-level changes were not supplied and are not validated.'
],
'REQ-4.2.3':[
 'Search opens matching file; literal phrase may be part of saved Document search flow content, avoiding an isolated-text-node requirement. File-content scope is still weak.',
 'Empty code query observes no-code-results message and retains exact input value.',
 'Matching file opens, readable phrase survives reload and exact file link remains. No isolated text node is required.',
 'Repeated absent query from reopened repository produces empty state twice; no dependence on earlier scenario mutation.'
],
'REQ-4.3.1':[
 'Exact target branch option updates selector and exposes the explicitly target-only main-only.md link; the surprising filename is stated seed data, not corrected by intuition.',
 'Unknown branch query shows empty state, Escape preserves main and main remains after reload.'
],
'REQ-4.3.2':[
 'Unique branch creation selects the declared Create branch option; current name survives reload. Base commit equality and unchanged base history are not asserted.',
 'Invalid consecutive-dot name yields Invalid branch message; no independent branch-list or head readback.'
],
'REQ-4.3.3':[
 'Admin updates default to release via visible labels and confirmation; reopening uses release and old main remains selectable.',
 'Non-admin default combobox remains absent; Update default branch must not be actionable, accepting a legitimate disabled button.'
],
'REQ-4.4':[
 'Contributor creates a uniquely named file, exact content and exact commit message are read through UI. File/head/history atomicity, branch ownership and author are not asserted.',
 'Invalid path with missing message observes allowed validation. Unchanged file tree/head/history is not verified.'
],
'REQ-5.1.1':[
 'Open title filtering shows exact issue link before and after reload.',
 'Closed title filtering shows exact closed issue and excludes the known open issue.'
],
'REQ-5.1.2':[
 'Issue heading, exact description, Open and comment/activity presence are checked. Activity token can be a control label, so actual saved discussion remains weak.',
 'Exact issue title and description persist after reload.',
 'Reopening from home preserves exact heading and Open status.'
],
'REQ-5.2.1':[
 'New title/body create an exact heading and exact issue-list link after returning; Open, number and author are not independently asserted.',
 'Whitespace title yields required error. No saved-list snapshot demonstrates no issue creation.'
],
'REQ-5.2.2':[
 'Authorized title and description saves are checked after reload; unchanged sibling field after each individual save and activity are not independently checked.',
 'Whitespace title rejection yields error and original exact heading persists after reload.'
],
'REQ-5.2.3':[
 'Comment body and author now belong to the same uniquely matched discussion article, including after reload; account-menu username cannot satisfy authorship.',
 'Whitespace comment may disable submission or display declared error; article count is checked both immediately and after reload.'
],
'REQ-5.3.1':[
 'Assignment/reload/unassignment use the declared option selected state to distinguish the current relationship from append-only history. Selected=true is checked after assignment/reload; selected=false after removal/reload. This public observation convention is now explicit.'
],
'REQ-5.3.2':[
 'Exact label option saves visible label and persists after reload; current metadata is not distinguished from activity text.'
],
'REQ-5.3.3':[
 'Exact current-repository milestone option saves visible value and persists after reload; no cross-repository exclusion test or metadata-only scope.'
],
'REQ-5.4':[
 'Close shows Closed and closure activity token, reopen shows Open, reload restores Close control. Unchanged metadata and content are not independently compared.',
 'Read-only viewer sees no Close issue or Reopen issue controls; no implicit cumulative permission ladder is assumed.'
],
'REQ-6.1':[
 'Admin creates protection with approval/test requirements; reload checks pattern, approval and test labels. Rule effect is exercised only indirectly in separate seeded merge tests.',
 'Non-admin sees no Add branch protection rule control, following the explicit absence requirement.',
 'Admin changes test pending to success and reload preserves success. Status and setter are checked globally, not bound to the same check record.'
],
'REQ-6.2.1':[
 'Visitor Open filter exact PR link opens exact title heading.',
 'Visitor Open filter preserves exact PR link after reload.',
 'Visitor returns home, reopens Pull requests and Open, and finds exact seeded PR link.'
],
'REQ-6.2.2':[
 'Distinct branch comparison shows seeded changed path and commit token. Token may match navigation; exact commit membership is not asserted.',
 'Same branch comparison accepts either stated identical or no-differences wording and prevents any present Create control.'
],
'REQ-6.2.3':[
 'Valid comparison creates exact title and Open, title survives reload. Base/compare links and commit bindings are not rechecked.',
 'Whitespace PR title yields required message; no independent PR-list readback establishes no creation.'
],
'REQ-6.2.4':[
 'Draft creation checks Draft and disabled Merge button. It does not assert new exact title, author or branch bindings after creation.',
 'Author marks seed draft ready; Open, transition action disappearance, exact title/branches, activity and reload are checked. Historical Draft text remains allowed.'
],
'REQ-6.3.1':[
 'PR exact heading, Commits and Files changed views are followed. Generic commit token may be a navigation label and does not prove a stored commit record.',
 'PR heading survives reload and Commits token is visible, but record-level commit information is not verified.',
 'PR reopens from home with exact heading and changed-files summary token; actual changed file list not asserted in this callback.'
],
'REQ-6.3.2':[
 'Seeded changed path plus aggregate numeric additions/deletions string are visible. Numeric correctness and file/line anchoring are not asserted.'
],
'REQ-6.3.3':[
 'Source explicitly chooses first changed-line Add comment, so first() is authorized here; exact comment survives reload. Precise file/line anchor and absence in other PRs are not checked.',
 'First-line pending comment shows body and pending state; reload only checks pending state, leaving body persistence and pending-review ownership under-tested.'
],
'REQ-6.3.4':[
 'Non-author submits Approve and observes Approved. Review author/current compare commit binding and persistence are untested.',
 'Request changes stores exact summary and visible decision, decision survives reload. Summary persistence and effective commit binding are untested.'
],
'REQ-6.4':[
 'Requested reviewer and exact Remove username action appear; action survives reload, disappears after removal and remains absent after another reload. Historical mentions and hidden old controls are allowed.'
],
'REQ-6.5':[
 'Public branch/tree/history observations verify real file integration, both ordered merge parents, merger/time/result, unchanged compare and repeated persisted replay. Stale-review/conflict/check-only variants remain unexercised.',
 'Protected blocked PR has disabled merge, explicit reason, Open after reload, no Merge result, and unchanged base/compare snapshots; no forbidden activation attempted.'
],
'REQ-6.6':[
 'Author close/reopen observes Closed then Open and reload restores Close action. Branch immutability and terminal Merged rejection are not asserted.',
 'Read non-author sees neither close nor reopen controls, matching explicit absence rule.'
]
};

const findings=[
 ['GH-01','high','false-negative','REQ-1.3','Same authenticated context was reused to seek Sign in, rejecting valid retained sessions.','fixed','Fresh BrowserContext for credential verification; source scenario explicitly says fresh unauthenticated session.','Fresh-context browser contract.'],
 ['GH-02','high','false-negative','REQ-3.4','Cookie clearing was treated as logout, rejecting legitimate sessionStorage/localStorage authentication.','fixed','Independent visitor BrowserContext; no authentication transport imposed.','Fresh-context browser contract and typecheck.'],
 ['GH-03','medium','false-negative','ROOT','Ordinary visible text used strict single-locator assertions; duplicate correct public text failed.','fixed','Existential visible-text checks preserve each original string/regex/exact option; action locators remain strict.','Duplicate text, hidden-only/wrong value and duplicate action contracts.'],
 ['GH-04','high','false-negative','REQ-4.2.3','Literal search phrase was required to occupy a complete standalone DOM text node despite saved longer content.','fixed','Literal substring presence, with source clarification that phrase may be embedded in file content.','Embedded phrase contract; content-specific scope remains GH-13.'],
 ['GH-05','medium','false-positive','REQ-2.1.2','Invalid-identifier/blank-display scenario omitted required display-name error.','fixed','Assert both messages and retained attempted identifier.','Typecheck; source/test inspection.'],
 ['GH-06','high','false-positive','REQ-5.2.3','Author could be satisfied by account-menu username even if stored comment had wrong author.','fixed','Bind exact body and username to the same article; assert both after reload.','Correct and wrong-article-author contracts.'],
 ['GH-07','high','false-negative','REQ-6.4','Global reviewer name disappearance forbade append-only activity or submitted review mentions.','fixed','Use already specified Remove username control for current pending relationship, including reload; no new ARIA group.','Historical mention, hidden old control and retained request contracts.'],
 ['GH-08','high','ambiguous-scenario','REQ-1.2','Conditional/generic sign-out scenarios did not isolate confirm versus cancel or actually record/reopen a protected page.','fixed','Explicit confirm/protected-navigation scenario and separate cancel/preserved-session scenario; same two scenario IDs.','Typecheck and direct source/assertion review; real application execution pending.'],
 ['GH-09','high','coverage-gap','REQ-1','Rejected registrations/logins and old/new credential refusal are incompletely checked; messages alone do not prove no authenticated session/account.','open','Keep expected business obligations; add independently observable account/session checks in a subsequent protocol pass.','No full app/mutant coverage claim.'],
 ['GH-10','high','false-negative','REQ-2.2.2','Team Add member launcher and submit can both remain visible; source declares neither a form scope nor launcher disappearance.','fixed','Publicly distinguish launcher Add member from submit Add member to team; no wrapper role imposed. This changes an explicit control-name contract, so historical applications are incompatible unless regenerated under the revised input.','Both visible launcher and submit browser contract; exact action identity remains strict.'],
 ['GH-11','high','false-negative','REQ-5.3.1','Global assignee text absence after unassignment conflicts with required append-only assignment activity.','fixed','Clarify selected state of existing option as the public current-relationship observation; check true after assignment/reload and false after removal/reload. No new ARIA group imposed; historical mentions are allowed.','Positive selected/unselected history and retained-selection negative contracts.'],
 ['GH-12','high','false-positive','REQ-3.2.3','Copy tests assert feedback rather than actual clipboard value and protocol.','fixed','Declare public Clone value label (read-only input or static labeled output), read selected protocol/address, initialize unrelated browser clipboard and require actual copied equality. Host is implementation-defined; no private endpoint used. New observation labels/states are versioned public inputs.','Real browser clipboard positive for HTTPS input/SSH output and feedback-only negative.'],
 ['GH-13','high','weak-observation','REQ-4.2/REQ-6.2/REQ-6.3','Generic commit/activity tokens can match navigation; diff checks validate numeric formatting rather than expected numbers; record attribution is sometimes global.','open','Supply declared independent seed expectations and appropriate public record scopes before claiming complete semantic coverage.','Each affected scenario identifies the exact weakness.'],
 ['GH-14','high','coverage-gap','REQ-2/REQ-3/REQ-4/REQ-5/REQ-6','Several invalid/mutation cases do not compare unchanged persisted records, sibling fields, cascade permissions or current-role effects.','open','Retain full domain obligations and report gaps; complete isolated positive/negative application implementations before stronger validity claims.','Per-scenario matrix distinguishes exercised outcomes from missing assertions.'],
 ['GH-15','high','coverage-gap','REQ-4.4/REQ-6','Inherited stale-review/outdated-comment, terminal merged, complete permission matrix and atomicity policies exceed the fixed 100 scenario callbacks.','open','No assertion that scenario count equals complete behavioral coverage; would require separately versioned additional scenarios.','No new scenarios inserted silently.'],
 ['GH-16','medium','false-negative','REQ-3.4/REQ-4.3.3','Non-actionable was implemented as absent/not-visible, rejecting valid disabled controls.','fixed','Require no enabled visible action; stronger explicitly absent controls remain absent.','Absent/hidden/disabled positive and enabled negative contracts.'],
 ['GH-17','medium','false-negative','REQ-6.2.2','Source allowed identical or no-differences wording but test accepted only identical.','fixed','Accept both explicitly allowed phrasings while preserving prevention of creation.','Source/test review and typecheck.'],
 ['GH-18','high','false-negative','REQ-6.2.4','Ready-for-review test globally forbids Draft text even though append-only activity can preserve prior Draft state.','fixed','Observe Open and disappearance of existing Ready for review transition action, retaining title/branches and reload checks; explicitly allow historical Draft text.','Open current state with retained Draft history browser contract.']
].map(([id,severity,category,sourceId,explanation,status,resolution,validation])=>({id,severity,category,source:sourceId,test:'arc-bench/github/tests/'+(sourceId.includes('/')||sourceId==='ROOT'||sourceId==='REQ-1'?'(see matrix)':sourceId+'.spec.ts'),explanation,status,resolution,validation}));
const current=YAML.parse(source),nodes=[];
function walk(n,anc=[]){nodes.push({...n,ancestors:anc});for(const c of n.children??[])walk(c,[...anc,n.id]);}walk(current);
const sourceLines=source.split('\n');
const requirementLine=id=>sourceLines.findIndex(line=>new RegExp('^\\s*-?\\s*id: '+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$').test(line))+1;
const specific={
 'REQ-1.1.1':['GH-09'], 'REQ-1.1.2':['GH-09'], 'REQ-1.1.3':['GH-09'], 'REQ-1.2':['GH-08'], 'REQ-1.3':['GH-01','GH-09'],
 'REQ-2.1.2':['GH-05','GH-14'], 'REQ-2.2.1':['GH-14'], 'REQ-2.2.2':['GH-10'], 'REQ-2.2.4':['GH-14'], 'REQ-2.3':['GH-14'],
 'REQ-3.2.1':['GH-14'], 'REQ-3.2.2':['GH-14'], 'REQ-3.2.3':['GH-12'], 'REQ-3.4':['GH-02','GH-16'],
 'REQ-4.2.1':['GH-13'], 'REQ-4.2.2':['GH-13'], 'REQ-4.2.3':['GH-04','GH-13'], 'REQ-4.3.2':['GH-14'], 'REQ-4.3.3':['GH-16'], 'REQ-4.4':['GH-14','GH-15'],
 'REQ-5.1.2':['GH-13'], 'REQ-5.2.1':['GH-14'], 'REQ-5.2.2':['GH-14'], 'REQ-5.2.3':['GH-06'], 'REQ-5.3.1':['GH-11'], 'REQ-5.3.2':['GH-13'], 'REQ-5.3.3':['GH-13'], 'REQ-5.4':['GH-14'],
 'REQ-6.1':['GH-13'], 'REQ-6.2.2':['GH-13','GH-17'], 'REQ-6.2.3':['GH-14'], 'REQ-6.2.4':['GH-18','GH-14'], 'REQ-6.3.1':['GH-13'], 'REQ-6.3.2':['GH-13'], 'REQ-6.3.3':['GH-14','GH-15'], 'REQ-6.3.4':['GH-13','GH-15'], 'REQ-6.4':['GH-07'], 'REQ-6.5':['GH-15'], 'REQ-6.6':['GH-14','GH-15']
};
const matrix=[];
for(const n of nodes.filter(n=>n.scenarios?.length)){
  if(notes[n.id]?.length!==n.scenarios.length)throw new Error('Missing individual review notes '+n.id);
  const rel='arc-bench/github/tests/'+n.id+'.spec.ts',code=fs.readFileSync(path.join(root,rel),'utf8');
  const callbacks=[...code.matchAll(/test\((['"])(.*?)\1,\s*async/g)];
  if(callbacks.length!==n.scenarios.length)throw new Error('Callback count mismatch '+n.id);
  for(let i=0;i<n.scenarios.length;i++){
    const s=n.scenarios[i],cb=callbacks[i];
    if(cb[2]!==s.name)throw new Error('Scenario name mismatch '+s.id);
    const body=code.slice(cb.index,callbacks[i+1]?.index??code.length);
    const ids=[...(specific[n.id]??[])];if(body.includes('expectText'))ids.push('GH-03');
    const open=ids.some(id=>findings.find(f=>f.id===id)?.status==='open');
    matrix.push({requirementId:n.id,scenarioId:s.id,scenarioName:s.name,testFile:rel,sourceLine:requirementLine(n.id),testLine:code.slice(0,cb.index).split('\n').length,
      coverage:{given:s.steps.filter(x=>x.Given).map(x=>x.Given),when:s.steps.filter(x=>x.When).map(x=>x.When),then:s.steps.filter(x=>x.Then).map(x=>x.Then),assertionEvidence:body.split('\n').filter(x=>/await expect|^\s*expect\(|branchState|signIn|expectCredentialLogin|expectDiscussionComment|expectNoActionable/.test(x)).map(x=>x.trim()),review:notes[n.id][i],inheritedContext:n.ancestors,scope:'Read the complete leaf and ancestor descriptions; the note distinguishes callback assertions from wider untested domain obligations.'},findings:ids,disposition:open?'reviewed-with-open-risk':ids.length?'reviewed-bounded-fix':'reviewed-no-specific-mismatch-found'});
  }
}
const parent=JSON.parse(fs.readFileSync(path.join(audit,'parent-files.json'),'utf8'));
const changed=[];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of files(path.join(root,'arc-bench/github'))){const rel=path.relative(root,file).replaceAll('\\','/');const sha=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(parent.files[rel]!==sha)changed.push(rel);}
if(matrix.length!==100||Object.keys(notes).length!==47)throw new Error('Wrong review coverage');
const result={task:'github',reviewedRequirements:47,reviewedScenarios:100,reviewBasis:'Independent requirements/tests review; no generated apps or scores consulted.',requirementsChanged:true,compatibility:'Scenario clarifications preserve business intent but change the frozen input. The team submit name explicitly changes from Add member to Add member to team; assignee options declare selected state; clone addresses declare public Clone value label and selected protocol state. Historical applications/scores must not be presented as this revision.',scenarios:matrix,findings:findings.map(f=>({...f,source:f.source.split('/').map(id=>({requirementId:id,line:requirementLine(id)}))})),changedFiles:changed,validation:{typecheck:'passed: 47 GitHub specs plus audit/validation/github.spec.ts, native TypeScript CLI; 2026-11-07',browserContracts:'17 contracts prepared for parent execution; result pending integration'},limitations:['All 100 callbacks reviewed, but review is not 100 complete application executions.','Generic token/diff oracles and incomplete rejection/atomicity/permission cases remain open.','No screenshot equivalence claim; references used for context, not a hidden DOM schema.','No extra ARIA metadata group introduced. Existing public Branch state and membership groups are preserved. Assignee option selected state, distinct team-submit name and clone-value label/state are explicitly part of the new public observation contract.','The original external benchmark, all generated applications and prior scores remain unchanged.']};
fs.writeFileSync(path.join(audit,'github.json'),JSON.stringify(result,null,2)+'\n');
const fixed=findings.filter(f=>f.status==='fixed'),open=findings.filter(f=>f.status==='open');
fs.writeFileSync(path.join(audit,'github.md'),`# GitHub requirement/test review\n\nReviewed all **47 atomic requirements / 100 scenarios**, all parent descriptions, all 47 test files and four original support files. No generated application or score was read. The complete per-scenario G/W/T, callback assertion evidence, line references and individual review notes are in [github.json](github.json).\n\n## Bounded fixes (${fixed.length})\n\n`+fixed.map(f=>`- **${f.id}** (${f.category}): ${f.explanation} ${f.resolution}`).join('\n')+`\n\n## Open risks (${open.length})\n\n`+open.map(f=>`- **${f.id}** (${f.severity}, ${f.category}): ${f.explanation} ${f.resolution}`).join('\n')+`\n\n## Scope and validation\n\nChanged ${changed.length} task files; source clarifications cover fresh authentication, embedded search content, explicit sign-out confirm/cancel, current reviewer state versus history and existing assignee option selected state. **The team editor submit name changes from Add member to Add member to team, while the launcher stays Add member. Clone addresses now have the public Clone value label and selected protocol state; no fixed host or wrapper is imposed.** These are revised public inputs, not claims that old implementations violated the original labels. Historical apps/scores are not directly transferable. No extra ARIA metadata group was required. The public-controls template is unchanged.\n\nNative TypeScript check passed for all 47 specs and 17 new browser contracts. Parent runs browser contracts and shared input checks. No full controller suite or model calls are needed: changes concern benchmark source/test observations. Full real-application outcomes, independent complete synthetic implementations, and full fault coverage remain unverified; no zero-false-negative or complete business-quality claim follows from this review.\n`);
console.log(JSON.stringify({requirements:47,scenarios:matrix.length,taskFilesChanged:changed.length,fixed:fixed.length,open:open.length}));
