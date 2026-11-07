import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import assert from 'node:assert/strict';

const audit = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(audit, '..');
const yamlPath = 'arc-bench/sheet/requirements/requirements.yaml';
const source = fs.readFileSync(path.join(root, yamlPath), 'utf8');
const document = parseDocument(source, { uniqueKeys: true });
assert.equal(document.errors.length, 0);
const notes = {
  'REQ-1.1.1': [
    'UI-created unique workbook and A1 value are reopened through the named home record; record-scoped timestamp is compared with the editor. Same direct entry, saved A1 and active Sheet1 are checked in a fresh BrowserContext. Duplicate visible copies of name/value no longer fail presence.',
    'Two UI-created workbook identities and unique A1 values are distinguished. First and second direct entries restore their own values, including a new browser session. Foreign value absence is scoped to the active worksheet grid, allowing unrelated previews outside it.',
  ],
  'REQ-1.2.1': [
    'New blank workbook now requires exactly one active Sheet1, A1 as the sole selected cell, explicit multiselect/selection states and blank observable grid cells; the entire blank-state contract is checked again after refresh. Conditional infrastructure failure branch has no declared reproducible trigger.',
  ],
  'REQ-1.2.2': [
    'The explicit Enter submission in this GWT is retained. Space trimming, unique home link, unchanged A1 and reopened name-field raw value are checked; ordinary duplicate title text is accepted.',
    'All-space name submission retains the exact error wording and original saved name. Refresh plus reopening the rename form verifies the stored name; repeated visible feedback is not a duplicate action.',
  ],
  'REQ-1.3.1': [
    'Exact uploaded CSV includes quoted comma, escaped quotes, embedded newline, UTF-8 English/Chinese, raw 007 and trailing blank fields. Every listed coordinate and all persisted fields are checked; newline/space collapse can no longer hide corrupted multiline text. Input fixture and its source JSON string are synchronized.',
    'An unterminated quoted field is supplied through the labelled file input. Required format error appears and a named workbook link is absent on returning home; no application storage or parser internals are accessed.',
    'The three-column input preserves London A2, blank B3 and count 3 in C4 before and after refresh. Successful workbook name is checked through visible text; broader unasserted CSV cells are not claimed as independently checked in this case.',
    'Single-column CSV checks the file-derived workbook name and first/last rows across refresh. Added the required active Sheet1 assertion both before and after refresh; intermediate records are not independently inspected in this narrower case.',
  ],
  'REQ-1.3.2': [
    'CSV import plus explicit formula entry establishes E2/E3. Same-result formula re-entry is accepted by raw-formula readback. Both downloads are decoded to full row/column/empty/multiline/quote values; only E2/E3 are typed calculated outputs for numeric presentation equivalence.',
    'Export reads raw A1 text 2 and calculated B1 value 4; only CSV B1 permits equivalent numeric representation. Active Sheet1, numeric result and exact raw =A1*2 are checked before/after refresh.',
    'Two sheets have distinct A1 text; exporting active Sheet2 decodes exactly that one value and leaves Sheet2 active. Equivalent CSV quoting does not substitute another worksheet.',
    'Switching back to Sheet1 selects the intended source; the decoded export is First, not Sheet2 Second, with Sheet1 still active.',
  ],
  'REQ-2.1.1': [
    'Add Sheet2 preserves Sheet1 Existing data and starts blank. A1 visibility establishes a nonempty observation set; all observable gridcells are checked blank before/after refresh, alongside active Sheet2, selected A1 and retained Sheet1.',
    'Rename Sheet2 to Sheet3, then add again, verifies first-unused naming by expecting Sheet2 rather than the next numeric maximum. All three tabs and active Sheet2 survive refresh.',
  ],
  'REQ-2.1.2': [
    'Each worksheet restores its own selected coordinate and raw formula/value. Formula Sheet1 B1 must now equal numeric 4, replacing the weaker nonempty-result check, including after refresh.',
    'Explicit B1 selection on Sheet1 and A1 on Sheet2 are restored during switches. Numeric formula result 4 and original formula are distinguished from raw Other; Sheet2 remains active across refresh.',
    'Sheet1 filter and C2 validation controls are visible only on the source sheet; Sheet2 has Other sheet and no corresponding active controls, including after refresh. Hidden inactive DOM is naturally excluded by role visibility.',
    'Three sheets restore A1/B2/C3 independently together with Sheet1/Sheet2/Sheet3 data; refresh preserves selected C3 and active Sheet3. Content under other sheet coordinates cannot satisfy the named current cell.',
    'Sheet1 formula result is numeric 6 with exact =A1*3; Sheet2 shows raw Other and formula-bar Other. This case intentionally exercises switches without adding a new refresh obligation.',
  ],
  'REQ-2.1.3': [
    'Rename dialog opens through the declared per-sheet menu. Prefill, trimmed name, active new tab, retained Sheet1 and existing A1 survive refresh. Test now clicks declared Save rather than imposing Enter support absent from this GWT.',
    'Duplicate Sheet1 name is rejected with the declared message; Sheet1 remains present and Sheet2 stays active before/after refresh. Duplicate visible feedback is acceptable, duplicate dialog/action identity is not.',
    'All-space worksheet name is rejected; saved Sheet1 active state and the reopened field retain Sheet1 after refresh.',
  ],
  'REQ-2.1.4': [
    'Target-specific Sheet2 deletion dialog is confirmed; removed tab and adjacent active Sheet1 are checked immediately and after refresh.',
    'Deleting the only sheet shows the required error, no visible deletion dialog, and retained active Sheet1 across refresh.',
    'UI-built Pivot1 depends on Sheet1. Confirming source deletion is rejected; declared error, dialog closure, source identity/data and numeric pivot result 100 remain across refresh.',
    'Deleting Pivot1 first releases its source restriction; Sheet1 can then be deleted, leaving adjacent Sheet2 active. Both removed tab identities remain absent after refresh; data creation/calculated pivot values are setup observations.',
  ],
  'REQ-2.2.1': [
    'Insertion above row 3 creates blank A3/B3, preserves Alpha/10 and shifts Beta/20 to row 4; corresponding cells are checked after refresh.',
    'Deleting row 3 shifts Beta into A3, preserves Alpha A2 and clears former A4, before and after refresh.',
    'Insertion below row 1 preserves Alpha, creates blank A2 and shifts Beta to A3 across refresh.',
    'Row insertion moves raw 2 to A2 and calculated 4 to B2; exact adjusted raw formula =A2*2 remains after refresh. Numeric display may have trailing zeros without changing its value.',
    'The moved 0..100 rule rejects 120 in A3 with the original value 50, while the newly inserted unvalidated A2 accepts 120. Both values persist; controls are used through their declared labels.',
  ],
  'REQ-2.2.2': [
    'Insertion left of B creates blank B1 and shifts Beta/Gamma to C1/D1 without losing Alpha; all relevant cells persist.',
    'Deleting Quantity moves Total header left and makes the direct dependency #REF!, while preserving Unit price data and clearing former column C. Named error value is retained across refresh.',
    'Insertion right of A creates blank B1 and shifts Beta to C1 while preserving Alpha; all three cells persist.',
    'Insertion left of A moves raw 2 and its formula to B1/C1; numeric 4 and adjusted raw =B1*2 persist.',
    'Validation follows the originally constrained cell into C1, rejects 120 there, while inserted B1 accepts 120; both saved values are checked after refresh.',
  ],
  'REQ-3.1.1': [
    'Formula-bar editing updates raw A1 2 to 3, recalculates dependent B1 4 to 6, preserves exact =A1*2 and persists. Raw accepted edits are now read back instead of requiring a visible-result change.',
    'Escape cancels a grid edit, closes the inline editor and restores the saved grid/formula-bar value. Unsaved text absence is scoped to the active grid after refresh, rather than unrelated feedback/history.',
    'Grid edits cover plain text, raw numeric/boolean/date input and calculated 84 with raw formula inspection. Clicking another cell commits B1. All displayed outcomes persist; formula-only outputs allow equivalent numeric formatting.',
    'C3 raw 7 and D4 calculated 21 are placed at nondefault coordinates; exact =C3*3 and the numeric result remain after refresh.',
  ],
  'REQ-3.1.2': [
    'External 2D TSV fills B2:D3, including empty C2, and leaves A1/E4 unchanged. The full specified rectangle and both outside sentinels persist.',
    'A bulk paste containing 120 into a 0..100 range must be rejected atomically; exact error and both original values 10/20 are checked after refresh.',
    'Context-menu Paste overwrites a formula cell with raw 5, recalculates downstream C1 to numeric 6 and preserves =B1+1. Added exact dependent-formula readback after refresh closes the stated persistence clause.',
    'Single-row TSV retains blank middle cell, Gamma and outside E4 sentinel. Added E4 assertion after refresh prevents sentinel corruption from being overlooked.',
    'Offset 2x2 TSV occupies C3:D4 and preserves outside A1. Added the two previously omitted middle cells and outside sentinel after refresh.',
  ],
  'REQ-3.1.3': [
    'A1:B3 drag selection is now checked as the complete selected set, with explicit negative states on other observable cells. Clicking C1 leaves exactly C1 selected; extra selected cells beyond the old C-column sample are rejected.',
    'The complete A1:B3 rectangle and outside negative state persist through the first refresh. After clicking/refeshing C1, the complete saved selected set is exactly C1.',
  ],
  'REQ-3.2.1': [
    '2D copy preserves every original field, outside G1 and copied layout. E2 has adjusted raw =D1+$B$1 with unchanged absolute reference and numeric 3; source/copied values and formula survive refresh.',
    '2D cut clears A1:B2 only after destination D1:E2 is populated, retains G1 and verifies both source and destination states across refresh. Temporal ordering within the single paste event is not independently timed.',
    'Invalid cut/paste into validated D1:D2 retains both source values and both destination values, with the range error and identical persisted values.',
    'Single-cell copy retains source A1 and copies only that text to D4 across refresh; neighboring B1 is setup context rather than an implicit expanded selection.',
  ],
  'REQ-3.2.2': [
    'Undo clears unique A1 value and Redo restores it with formula-bar consistency; the restored value persists after refresh.',
    'After undo, a new branch value disables Redo; Ctrl+Y cannot restore the old branch. Saved new value and absence of old data within the active grid survive refresh.',
    'Undo/Redo restores raw A1 source values and numeric B1 results 4/6 while preserving =A1*2; all required saved results remain after refresh.',
    'Undo clears the complete 2x2 pasted rectangle; Redo restores A/B/C/D. Added B1/A2 assertions after refresh so persistence is not inferred only from diagonal cells.',
    'Undo reverses the cut atomically, restoring source and clearing destination. Redo clears both sources and restores Left/Right. Added source-cleared assertions after refresh.',
    'Undo/Redo of row and column insertions moves Keep and its validation affordance A1→A2→B2 and back in reverse order, then persists B2. Reapplication of the actual allowed-value rule is not separately probed in this structural case.',
    'Two independently named workbooks keep separate edit histories: undo affects only the second A1, both home links remain, first value stays intact and the second blank survives refresh/reopening.',
  ],
  'REQ-4.1.1': [
    'Arithmetic precedence/parentheses produce numeric 14 and retain the exact raw expression before/after refresh.',
    'SUM/AVERAGE/COUNT/MIN/MAX over numeric, blank, text and TRUE inputs yield numeric 12/4/3/2/6; each raw case-sensitive submitted expression is read after refresh even though function evaluation is case-insensitive.',
    'Subtraction, division, precedence and numeric-constant formulas yield 6/3/4/42; all original expressions and numeric outputs persist.',
    'Parentheses and division precedence give 24 and 6. Added both raw formulas after refresh; harmless numeric presentation no longer fails value correctness.',
    'Multiplication/addition and fractional division produce 34 and 2.75. Added raw-formula checks after refresh as required by the inherited formula contract.',
  ],
  'REQ-4.1.2': [
    'Copying C1 to C2 adjusts the relative A1→A2 while retaining $B$1, preserves source, and yields numeric 3/12 with exact formulas after refresh.',
    'Offsetting B1 into A1 creates an invalid reference, displays #REF! and stores =#REF!; source B1 retains =A1. Error and adjusted raw target formula survive refresh.',
  ],
  'REQ-4.2.1': [
    'Changing Sheet1 A1 recalculates B1/C1 to 40/45, preserves both raw dependencies, and does not change Sheet2 Other/2. Added raw-formula and other-sheet checks after refresh.',
    'External paste of 3 into A1 recomputes dependent B1/C1 to numeric 6/7. Added exact raw dependent formulas after refresh.',
    'Cut A1 into B1 clears source, overwrites target with raw 2 and recalculates C1/D1 to numeric 4/5. Both dependent formulas and all values persist.',
  ],
  'REQ-4.2.2': [
    'Five explicit error kinds preserve their exact stable error strings/raw formulas while unrelated A1 editing and C1/C2 computation still work. Errors, independent numeric 6 and raw expressions persist after refresh.',
    'Replacing division-by-zero error with =A1*3 yields numeric 6 with the new raw expression before/after refresh.',
    'Indirect cycle produces #REF! in both cells; added raw =B1/=A1 readback after refresh so stored expressions are not inferred from error text.',
    'Unsupported function and malformed syntax produce #NAME?/#ERROR!; both exact raw expressions are now verified after refresh.',
    'Direct self-reference changes from #REF! to numeric 4 after =2+2; the corrected raw expression is now checked again after refresh.',
  ],
  'REQ-5.1.1': [
    'Descending numeric Sales sorting preserves headers, stable equal-key order, complete Region/Sales/Status associations and outside E1. Added complete persisted record values, not only row labels.',
    'Ascending Name then descending Date uses declared option labels and preserves matching dates/numbers. Added every associated field after refresh.',
    'Sorted formula-bearing records retain relative formulas, calculated Double values and numeric validation. Invalid 11 is rejected; added all three complete records/formulas after refresh.',
    'Sorting the entire filtered range includes the hidden record, keeps the filter active and shows Charlie then Alpha. Range preparation now tolerates hidden/unmounted middle rows; clearing filter reveals Bravo/Charlie/Alpha.',
    'Equal Score 3 records retain Alpha before Bravo after Charlie. Added Score/Note associations after refresh to prevent a names-only sort from passing.',
    'Descending parsed dates order Bravo/Charlie/Alpha without touching E1. Added complete persisted dates/cities and all row names, closing the former first-row-only replay check.',
  ],
  'REQ-5.1.2': [
    'Value filter Region=East and numeric Sales>1000 combine with AND, preserve exact surviving rows 2/5 after refresh, and clearing restores all original rows/values including previously hidden data.',
    'Text/date/empty conditions first expose only Alpha East. Source says replacing the compound filter yields Alpha West; test explicitly clears and recreates the filter before Is not empty, preventing a contradictory accumulated date condition.',
    'Region filter hides North in the active grid, while decoded CSV still contains every source row including North and original raw number text. The filter remains after refresh.',
    'Status=Open retains two matching rows and hides the Closed record; visible sales values and active view remain after refresh.',
    'Numeric Sales>150 hides East/100 and retains North/200 and East/300 with their identities and values after refresh.',
  ],
  'REQ-5.2.1': [
    'Dropdown rule applies to both A1/A2, selecting In Progress sets A1 and both affordances survive refresh. Added reopening A2 after refresh and checking exactly the three declared option labels.',
    'Inclusive number rule rejects 120 then persisted-rule 101 with original 50 intact, accepts boundary 100 and persists that value. Exact feedback and raw saved values remain.',
    'Grid-inline invalid 120 leaves original 50 and exact error; added a repeated invalid attempt after refresh to actively prove the rule is retained.',
    'Editing bounds to 10..60 changes rejection immediately without altering 50; Delete rule removes the constraint, allows 5 and persists it.',
    'Invalid raw Pending is rejected against Open/Closed both before and after refresh with exact allowed-value message; original Open/raw value remains.',
    'Valid In Progress/Completed changes persist in A1/A2. Added both declared dropdown affordances before/after refresh; merely saving text is insufficient.',
  ],
  'REQ-5.3.1': [
    'UI-built Region/Sales source yields first-appearance East/North/South, SUM aggregates 1800/1500/1000 and Grand Total 4300. Complete source rows are unchanged and calculated pivot values persist.',
    'Changing source Sales retains old pivot values until explicit Refresh pivot table; refresh produces East 2100/North 800/Grand Total 2900 and persists without changing source records.',
    'Region rows/Quarter columns COUNT ignores the blank value field and displays explicit zero for North/Q2. Added all layout/row/count cells after refresh, not only East and grand total.',
    'AVERAGE ignores nonnumeric and blank values, yields numeric 200 for both groups and grand total. Added source raw/nonnumeric/blank checks after refresh; summaries cannot overwrite source.',
    'COUNT over nonempty text is accepted; switching the same text value field to SUM is rejected with the declared numeric-values error, preserving old counts and source data after refresh.',
    'Creating a pivot from a filtered source includes hidden North in SUM and total; hidden/unmounted intermediate rows no longer make range preparation fail. Explicit refresh and page refresh retain 400/200/600.',
    'Source row insertion and added East/50 update adjusted-range totals to 450/200/650 after refresh. Moving Sales with a source column insertion preserves the same result after another refresh/reload.',
    'Deleting selected source Sales header shows the exact missing-field error on refresh and preserves previous pivot 400/200/600; remaining source Region data and persisted pivot remain.',
    'COUNT over Status text produces East 2/North 1/South 1 in the declared order. Added South count and group identities after refresh, alongside the existing East/North counts.',
  ],
};

const findings = [
  ['SHEET-01','high','false-negative','fixed','REQ-3.1.1','tests/support/e2e.ts','The commit helper required displayed text to change on every accepted edit, rejecting idempotent edits and formulas yielding the previous result.','Read the accepted raw value/formula back through the declared Formula bar. Invalid-edit paths explicitly skip acceptance readback and retain their own error/unchanged-value assertions.'],
  ['SHEET-02','medium','false-negative','fixed','REQ-1.1.1','tests/support/observations.ts','Ordinary visible text was forced to be globally unique; absence of other-workbook/history text was checked outside its worksheet scope.','Use visible existential text presence, preserve strict named actions, and scope data-absence assertions to the active declared grid.'],
  ['SHEET-03','medium','ambiguity','fixed','REQ-1.3.2','tests/REQ-1.3.2.spec.ts','Raw CSV equality rejected equivalent legal quoting, BOM and record separators rather than measuring exported cell values.','Clarify decoded-cell equivalence in inherited REQ-1.3 and one Then; compare full ordered decoded fields, preserving significant spaces, empty fields, quotes, newline positions and raw leading zeros.'],
  ['SHEET-04','high','false-negative','fixed','REQ-5.1.1','tests/support/e2e.ts','Filtered-range preparation required role locators for intermediate hidden rows, rejecting valid hidden or unmounted filtered records.','Keep both visible endpoint selections and every observable interior cell strict. Hidden record preservation is checked independently by the ensuing complete-range sort, export and pivot business outcomes.'],
  ['SHEET-05','high','false-positive','fixed','REQ-1.2.1','tests/REQ-1.2.1.spec.ts','Checking active Sheet1 and empty A1 allowed extra worksheets or unwanted data elsewhere in the initially blank grid.','Require exactly one Sheet1, the declared sole A1 selection, explicit public selection states and blank observable cells before/after refresh.'],
  ['SHEET-06','medium','false-positive','fixed','REQ-3.1.3','tests/REQ-3.1.3.spec.ts','The rectangle test sampled outside C-column cells, allowing additional selected cells elsewhere.','Compare the complete selected-cell count with the explicitly required coordinates and require public true/false selection state on all observable gridcells.'],
  ['SHEET-07','medium','false-positive','fixed','REQ-2.1.2','tests/REQ-2.1.2.spec.ts','Sheet switching accepted any nonempty formula result rather than the required numeric 4.','Observe exact raw formula and required calculated numeric value in each restored worksheet state.'],
  ['SHEET-08','medium','false-negative','fixed','REQ-2.1.3','tests/REQ-2.1.3.spec.ts','Worksheet rename used Enter although its source only declared Save and did not require keyboard submission.','Click the declared Save button. Workbook rename retains Enter because its own GWT explicitly requires it.'],
  ['SHEET-09','medium','false-positive','fixed','REQ-1.3.1','tests/REQ-1.3.1.spec.ts','Whitespace-normalizing text assertions concealed lost embedded newlines; expected multiline text also introduced an absent space, and no existing input actually exercised declared Chinese support.','Use exact cell text with CRLF/LF line-break equivalence, synchronize the original multiline field, include English/Chinese UTF-8 in the existing field fixture/source, and check all stated persisted cells.'],
  ['SHEET-10','medium','coverage-gap','fixed','REQ-3.1.2','tests/REQ-3.1.2.spec.ts','Several Then persistence clauses rechecked only a diagonal/first row or grid result, omitting other required fields, raw formulas or retained validation controls.','Add the omitted post-refresh tuple fields, sentinels, raw formulas, rule reapplication and declared affordances in the existing scenarios; IDs and denominator remain unchanged.'],
  ['SHEET-11','medium','coverage-gap','deferred','REQ-1.2.1','tests/REQ-1.2.1.spec.ts','Conditional create/add/rename/structural/sort/pivot infrastructure-failure branches lack reproducible public failure-trigger scenarios.','Keep the 100-scenario scope explicit. Do not invent private API fault injection or claim these conditional failures, all boundary datasets or arbitrary workbook sizes are covered. A future expansion needs declared public failure preconditions.'],
  ['SHEET-12','low','measurement-scope','retained','ROOT','tests/support/e2e.ts','The task explicitly measures named ARIA grid/tab/control/record contracts in addition to spreadsheet business behavior; screenshots and excluded collaboration are not evaluated.','Retain these source-explicit accessibility identities; do not silently relax them to fit an application. Sharing/authentication permission probes are outside this task ROOT scope.'],
  ['SHEET-13','medium','false-negative','fixed','REQ-4.1.1','tests/support/observations.ts','Calculated numeric correctness was coupled to one textual numeric formatter, so 4.0 or 1,800 could fail despite correct arithmetic.','Clarify numeric presentation equivalence and apply it only to reviewed formula/pivot output cells. CSV numeric equivalence is limited to known E2/E3/B1 calculated positions; ordinary input and raw expressions stay unchanged.'],
  ['SHEET-14','medium','coverage-gap','fixed','REQ-2.1.1','tests/REQ-2.1.1.spec.ts','Single-column CSV observed A1/A4 without explicitly checking active Sheet1, and added Sheet2 blankness was sampled only at A1.','Add active Sheet1 before/after refresh in the CSV scenario; require visible A1 and blank text for every observable new-sheet gridcell before/after refresh. Only the two formal specs change; existing helpers, IDs and UI contracts stay unchanged.'],
].map(([id,severity,category,status,requirement,test,explanation,resolution]) => ({
  id,severity,category,status,source:[`${yamlPath}#${requirement}`],test:[`arc-bench/sheet/${test}`],
  explanation,resolution,requirementsChanged:['SHEET-03','SHEET-09','SHEET-13'].includes(id),
  validation: status === 'deferred' ? 'Source-level gap retained; not a proved behavior pass.' :
    status === 'retained' ? 'Source-explicit scope retained; no application inspected.' :
    'Targeted TypeScript passed. Parent combined 110/110 contract execution passed, including this task final 30 positive/negative cases.',
}));

const persistenceCases = new Set(['REQ-1.3.1:1','REQ-3.1.2:3','REQ-3.1.2:4','REQ-3.1.2:5','REQ-3.2.2:4','REQ-3.2.2:5',
  'REQ-4.1.1:4','REQ-4.1.1:5','REQ-4.2.1:1','REQ-4.2.1:2','REQ-4.2.2:3','REQ-4.2.2:4','REQ-4.2.2:5',
  'REQ-5.1.1:1','REQ-5.1.1:2','REQ-5.1.1:3','REQ-5.1.1:5','REQ-5.1.1:6','REQ-5.2.1:1','REQ-5.2.1:3','REQ-5.2.1:6','REQ-5.3.1:3','REQ-5.3.1:4','REQ-5.3.1:9']);
const conditionalGaps = new Set(['REQ-1.2.1','REQ-1.2.2','REQ-2.1.1','REQ-2.1.3','REQ-2.1.4','REQ-2.2.1','REQ-2.2.2','REQ-5.1.1','REQ-5.3.1']);
const scenarios = [];
const requirements = [];
function visit(node, ancestors = []) {
  if (!(node.children ?? []).length) {
    requirements.push(node.id);
    const testFile = `arc-bench/sheet/tests/${node.id}.spec.ts`;
    const code = fs.readFileSync(path.join(root, testFile), 'utf8');
    const matches = [...code.matchAll(/^test\('([^']+)'/gm)];
    assert.equal(matches.length, node.scenarios.length, node.id);
    assert.equal(notes[node.id].length, node.scenarios.length, `${node.id} manual review count`);
    node.scenarios.forEach((scenario, index) => {
      const number = index + 1;
      assert.ok(matches[index][1].endsWith(`Scenario ${number}`));
      const start = matches[index].index;
      const body = code.slice(start, matches[index + 1]?.index ?? code.length).trim();
      const ids = [];
      if (/commitCellThrough(?:FormulaBar|Grid)/.test(body)) ids.push('SHEET-01');
      if (body.includes('expectText(') || body.includes(".filter({ visible: true })).toHaveCount(0)")) ids.push('SHEET-02');
      if (body.includes('expectCsvValues')) ids.push('SHEET-03');
      if ((node.id === 'REQ-5.1.1' && number === 4) || (node.id === 'REQ-5.3.1' && number === 6)) ids.push('SHEET-04');
      if (node.id === 'REQ-1.2.1') ids.push('SHEET-05');
      if (node.id === 'REQ-3.1.3') ids.push('SHEET-06');
      if (node.id === 'REQ-2.1.2' && number === 1) ids.push('SHEET-07');
      if (node.id === 'REQ-2.1.3' && number === 1) ids.push('SHEET-08');
      if (node.id === 'REQ-1.3.1' && number === 1) ids.push('SHEET-09');
      if (persistenceCases.has(`${node.id}:${number}`)) ids.push('SHEET-10');
      if (conditionalGaps.has(node.id) && number === 1) ids.push('SHEET-11');
      if (body.includes('expectCalculatedNumber') || body.includes('[[1, 4], [2, 4]]') ||
          (node.id === 'REQ-2.1.2' && number === 1)) ids.push('SHEET-13');
      if ((node.id === 'REQ-1.3.1' && number === 4) || (node.id === 'REQ-2.1.1' && number === 1)) ids.push('SHEET-14');
      const line = code.slice(0, start).split('\n').length;
      const sourceLine = source.slice(0, source.indexOf(`id: ${scenario.id}\n`)).split('\n').length;
      scenarios.push({
        requirementId: node.id,scenarioId: scenario.id,scenarioName: scenario.name,testFile,testLine:line,
        source:`${yamlPath}:${sourceLine}`,
        coverage:{
          given:scenario.steps.filter(step=>step.Given!==undefined).map(step=>step.Given),
          when:scenario.steps.filter(step=>step.When!==undefined).map(step=>step.When),
          then:scenario.steps.filter(step=>step.Then!==undefined).map(step=>step.Then),
          additionalResults:scenario.steps.flatMap(step=>['And','But'].filter(key=>step[key]!==undefined).map(key=>({phase:key,text:step[key]}))),
          inheritedRequirements:ancestors.map(node=>({id:node.id,name:node.name})),
          testActionsAndAssertions:body.split('\n').map((text,i)=>({line:line+i,text:text.trim()}))
            .filter(row=>/^(await |const |for |if |else |expect\()/.test(row.text)),
          semanticReview:notes[node.id][index],
          evidenceBoundary:'Requirement/test/helper source review and synthetic public-DOM contracts; no complete target application executed.',
        },findings:ids,disposition:ids.includes('SHEET-11')?'reviewed-with-description-gap':ids.length?'reviewed-fixed':'reviewed',
      });
    });
  }
  for (const child of node.children ?? []) visit(child, [...ancestors,node]);
}
visit(document.toJS());
assert.equal(requirements.length,24);
assert.equal(scenarios.length,100);
const parent = JSON.parse(fs.readFileSync(path.join(audit,'parent-files.json'),'utf8')).files;
const {createHash}=await import('node:crypto');
const changedFiles=[];
function files(directory) {
  for (const item of fs.readdirSync(directory,{withFileTypes:true})) {
    const full=path.join(directory,item.name);
    if(item.isDirectory()) files(full);
    else {
      const relative=path.relative(root,full).replaceAll('\\','/');
      if(createHash('sha256').update(fs.readFileSync(full)).digest('hex')!==parent[relative]) changedFiles.push(relative);
    }
  }
}
files(path.join(root,'arc-bench/sheet'));
const report={task:'sheet',reviewedRequirements:24,reviewedScenarios:100,requirementsChanged:true,
  reviewScope:'All current requirement leaves, all 100 GWT scenarios, inherited descriptions and every spec/support module. No generated applications or scores consulted.',
  scenarios,findings,changedFiles:changedFiles.sort(),limitations:[
    'Static semantic review and synthetic contract tests are not execution of a complete spreadsheet application and do not establish a quantitative false-negative rate.',
    'The fixed 100 scenarios do not exercise every conditional infrastructure failure without a public reproducible trigger, arbitrary larger datasets or every combination of operations.',
    'The visible grid/sample dataset is observed; unrendered offscreen cells cannot be directly inspected by the public-DOM oracle.',
    'Existing explicit ARIA roles/names are retained benchmark contracts; screenshot similarity and excluded collaboration/authentication features are not scored.',
    'CSV serialization/numeric presentation were clarified and one existing CSV fixture now covers already-required UTF-8 Chinese; old outcomes are not transferred to this version.',
  ],validation:{typecheck:'Passed: node node_modules/typescript/bin/tsc --project outputs/arc-bench-reviewed-20261107/audit/sheet-tsconfig.json',
    browser:'Parent combined 110/110 contract execution passed (37.4s), including this task final 30 positive/negative cases. Final frozen combined report is authoritative.',
    controllerTests:'Not run: no controller or runtime code changed; bounded benchmark/type/oracle checks match this change scope.',businessApplication:'Not executed'}};
fs.writeFileSync(path.join(audit,'sheet.json'),JSON.stringify(report,null,2)+'\n');
const lines=['# Sheet 需求与测试逐场景审查','',
  '已读取并核对全部 24 条叶需求、100 个 GWT 场景、继承描述及所有 spec/support；逐场景原文、测试行号、动作断言与具体语义备注见 [sheet.json](sheet.json)。未读取生成应用或得分，不修改控制器、应用或公共控件模板。','',
  '本轮需求有两项显示等价性澄清（CSV 序列化、计算数值）及一个已有 CSV 场景输入增强（实际覆盖已要求的 UTF-8 中文）。ID、叶需求数和场景分母未变；后续各方法应统一使用同版需求重新生成，旧成绩不迁移。','',
  '## 已修订与保留问题','',...findings.map(f=>`- **${f.id} (${f.severity}, ${f.category}, ${f.status})** ${f.explanation} ${f.resolution}`),'',
  '计算数字等价只用于已核对的公式/pivot 结果；CSV 的 E2/E3 或 B1 计算位置显式列出，原始 `007`、普通文本数字、空格、空字段和原始公式均不整体 Number 化。普通文字可有重复可见副本，动作仍保持命名身份唯一。','',
  '## 验证与边界','',
  'Sheet 定向 TypeScript 检查通过；父代理合跑五题 110/110 正反例通过（37.4 秒），含本题最终 30 条（包括数字格式与 UTF-8 正反例），以最终冻结合跑报告为准。它们覆盖正确呈现、同结果编辑、忽略提交、错误值/格式、丢失空字段/前导零/换行/隐藏记录、额外工作表和选区等边界。没有运行 ShallowCode 全量测试，因为没有改动控制器、共享执行器或应用；没有执行完整 Sheet 业务应用，不能宣称 100 个真实场景已通过或不存在全部假阴性。','',
  ...report.limitations.map(text=>'- '+text),'',
  '## 修改文件','',...report.changedFiles.map(file=>'- `'+file+'`'),''];
fs.writeFileSync(path.join(audit,'sheet.md'),lines.join('\n'));
console.log(JSON.stringify({requirements:requirements.length,scenarios:scenarios.length,findings:findings.length,changedFiles:changedFiles.length},null,2));
