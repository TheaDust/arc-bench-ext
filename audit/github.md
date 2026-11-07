# GitHub requirement/test review

Reviewed all **47 atomic requirements / 100 scenarios**, all parent descriptions, all 47 test files and four original support files. No generated application or score was read. The complete per-scenario G/W/T, callback assertion evidence, line references and individual review notes are in [github.json](github.json).

## Bounded fixes (14)

- **GH-01** (false-negative): Same authenticated context was reused to seek Sign in, rejecting valid retained sessions. Fresh BrowserContext for credential verification; source scenario explicitly says fresh unauthenticated session.
- **GH-02** (false-negative): Cookie clearing was treated as logout, rejecting legitimate sessionStorage/localStorage authentication. Independent visitor BrowserContext; no authentication transport imposed.
- **GH-03** (false-negative): Ordinary visible text used strict single-locator assertions; duplicate correct public text failed. Existential visible-text checks preserve each original string/regex/exact option; action locators remain strict.
- **GH-04** (false-negative): Literal search phrase was required to occupy a complete standalone DOM text node despite saved longer content. Literal substring presence, with source clarification that phrase may be embedded in file content.
- **GH-05** (false-positive): Invalid-identifier/blank-display scenario omitted required display-name error. Assert both messages and retained attempted identifier.
- **GH-06** (false-positive): Author could be satisfied by account-menu username even if stored comment had wrong author. Bind exact body and username to the same article; assert both after reload.
- **GH-07** (false-negative): Global reviewer name disappearance forbade append-only activity or submitted review mentions. Use already specified Remove username control for current pending relationship, including reload; no new ARIA group.
- **GH-08** (ambiguous-scenario): Conditional/generic sign-out scenarios did not isolate confirm versus cancel or actually record/reopen a protected page. Explicit confirm/protected-navigation scenario and separate cancel/preserved-session scenario; same two scenario IDs.
- **GH-10** (false-negative): Team Add member launcher and submit can both remain visible; source declares neither a form scope nor launcher disappearance. Publicly distinguish launcher Add member from submit Add member to team; no wrapper role imposed. This changes an explicit control-name contract, so historical applications are incompatible unless regenerated under the revised input.
- **GH-11** (false-negative): Global assignee text absence after unassignment conflicts with required append-only assignment activity. Clarify selected state of existing option as the public current-relationship observation; check true after assignment/reload and false after removal/reload. No new ARIA group imposed; historical mentions are allowed.
- **GH-12** (false-positive): Copy tests assert feedback rather than actual clipboard value and protocol. Declare public Clone value label (read-only input or static labeled output), read selected protocol/address, initialize unrelated browser clipboard and require actual copied equality. Host is implementation-defined; no private endpoint used. New observation labels/states are versioned public inputs.
- **GH-16** (false-negative): Non-actionable was implemented as absent/not-visible, rejecting valid disabled controls. Require no enabled visible action; stronger explicitly absent controls remain absent.
- **GH-17** (false-negative): Source allowed identical or no-differences wording but test accepted only identical. Accept both explicitly allowed phrasings while preserving prevention of creation.
- **GH-18** (false-negative): Ready-for-review test globally forbids Draft text even though append-only activity can preserve prior Draft state. Observe Open and disappearance of existing Ready for review transition action, retaining title/branches and reload checks; explicitly allow historical Draft text.

## Open risks (4)

- **GH-09** (high, coverage-gap): Rejected registrations/logins and old/new credential refusal are incompletely checked; messages alone do not prove no authenticated session/account. Keep expected business obligations; add independently observable account/session checks in a subsequent protocol pass.
- **GH-13** (high, weak-observation): Generic commit/activity tokens can match navigation; diff checks validate numeric formatting rather than expected numbers; record attribution is sometimes global. Supply declared independent seed expectations and appropriate public record scopes before claiming complete semantic coverage.
- **GH-14** (high, coverage-gap): Several invalid/mutation cases do not compare unchanged persisted records, sibling fields, cascade permissions or current-role effects. Retain full domain obligations and report gaps; complete isolated positive/negative application implementations before stronger validity claims.
- **GH-15** (high, coverage-gap): Inherited stale-review/outdated-comment, terminal merged, complete permission matrix and atomicity policies exceed the fixed 100 scenario callbacks. No assertion that scenario count equals complete behavioral coverage; would require separately versioned additional scenarios.

## Scope and validation

Changed 44 task files; source clarifications cover fresh authentication, embedded search content, explicit sign-out confirm/cancel, current reviewer state versus history and existing assignee option selected state. **The team editor submit name changes from Add member to Add member to team, while the launcher stays Add member. Clone addresses now have the public Clone value label and selected protocol state; no fixed host or wrapper is imposed.** These are revised public inputs, not claims that old implementations violated the original labels. Historical apps/scores are not directly transferable. No extra ARIA metadata group was required. The public-controls template is unchanged.

Native TypeScript check passed for all 47 specs and 17 new browser contracts. Parent runs browser contracts and shared input checks. No full controller suite or model calls are needed: changes concern benchmark source/test observations. Full real-application outcomes, independent complete synthetic implementations, and full fault coverage remain unverified; no zero-false-negative or complete business-quality claim follows from this review.
