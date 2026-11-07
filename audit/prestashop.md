# PrestaShop requirement/test review

Reviewed **55 requirement leaves and all 86 scenarios**. [prestashop.json](prestashop.json) records every current Given/When/Then, inherited source references, actual test actions/assertions and line numbers, an individually written semantic assessment, findings and disposition.

This is a continuation of an interrupted review. The earlier reviewer completed the initial full read and task edits. This pass re-read all six complete scenario batches, compared their extracted tests with the current tests, inspected current helpers/public controls and the current inherited/root/seed contracts, and completed the matrix. Generated applications and scores were not consulted.

The review preserves explicit roles, exact product/account/address/wishlist identities, selection state, prices and cart arithmetic, permission prompts, credential changes, historical-order ownership and declared result clauses. The shared public-controls template was left unchanged.

## Corrections

| Finding | Resulting oracle |
| --- | --- |
| F01 | Select the separate Sign in submit outside persistent native/ARIA navigation. No undeclared main/form is required; duplicate submits remain strict. |
| F02 | Match the declared button/link role and exact case-insensitive action identity. A matching name does not authorize a different role. |
| F03 | Observe a monetary field through a public named region/group/status-output or native dt/dd association within the selected product/row/order/summary. Wrong values, wrong records and duplicate visible candidates fail. Hidden historical values do not create false ambiguity. |
| F04 | Accept the disclosed Cart numeric suffix and check exact unit count, including agreement between accessible and visible counts. One cannot match 10. |
| F05 | Promotion destination is a complete detail or category predicate. A valid category with both its heading and a product-card heading passes; homepage-only or wrong-product evidence fails. |
| F06 | Quick-view price 24 is observed inside the exact preview dialog without inventing a named Sale price region. A price elsewhere cannot satisfy it. |
| F07 | Informational text/headings use visible presence, allowing repeated copies while retaining declared role and scoped identity. Home return requires the declared Popular Products region. Action locators remain strict. |
| F08 | Category description is visible/nonempty without requiring literal Men, count is numeric, parent Men is actually reached with Tab, and the Women case follows its stated breadcrumb-return setup. |
| F09 | Filtering checks complete eligible identities from the public 13-product catalog and precise totals where required. Every priced card supplies its own current amount; a plausible count alone cannot hide wrong membership. |
| F10 | Count grammar accepts item/items/item(s) and hyphen/en-dash while retaining exact ranges/totals. Pagination and filter restoration compare public product identities, independent of incidental card text or ordering. |
| F11 | Product Details requires cotton case-insensitively, retaining reference, data-sheet, features and regular-fit assertions. |
| F12 | Rating four cannot match 40/4.5; Quantity one cannot match 10. |
| F13 | Product detail explicitly checks Front/Back thumbnails. A different published Men related-product entry is actually reached with Tab. Its selection is an authorized existential witness, without bypassing duplicate action ambiguity. |
| F14 | Normal product-opening setup requires Product information identifying the selected product, preventing an already-present card heading from masquerading as detail navigation. |
| F15 | An assigned order reference must contain more than the bare Order reference label, without imposing a predetermined reference format. |

## Disclosed interpretation changes

ROOT now explains that monetary names without an explicit role=region identify a public field/value association in the selected record. Equivalent named region, group, status/output and native dt/dd presentations are accepted. This resolves the inherited phrase amount region and retains field ownership, amount values and strict visible ambiguity. ROOT also permits conventional Cart numeric accessible-name suffixes while keeping the base action identity and exact unit count.

These are explicit benchmark-contract clarifications. Historical results affected by mandatory monetary-region roles or unsuffixed exact Cart naming are **not directly comparable** and require rerun under the clarified contract. The denominator remains 55 requirements and 86 scenarios.

## Validation and limits

The current YAML parses, all 55 leaves and 86 exact scenario names map to their current tests and unique matrix rows, and the expected filter sets were recomputed from published seed attributes. Task-specific synthetic browser contracts cover substantive positive/negative selector, amount, record-identity, count, promotion and membership boundaries. The parent executes the collected browser suite. The earlier 27/27 snapshot is not presented as the expanded suite's final result.

The changes concern this task's oracle and wording, so synthetic public-UI contracts and static source/assertion mapping are appropriate. No controller full suite, model generation or mass application evaluation was run; these would not establish the task's interpretation correctness.

F16 records the visual-evidence boundary: image source/name/caption state does not prove pixel content or that an enlarged resource depicts the chosen back view. A valid enlargement can use a separate high-resolution URL, so its source is not forced to equal the main-image URL. Reference-image pixels and visual layout were not audited. Carousel Next timing can also coincide with automatic advancement.

F17 records that the anonymous Wishlist permission dialog and signed-out navigation establish visible permission behavior, without proving absence of invisible stored membership. No private APIs, invented success wording or authenticated adding-membership workflow were added. Remember-me lifetime, actual email delivery and guest completion remain unspecified. Invoice verification covers the declared reference-bearing filename and `%PDF-` signature, rather than full PDF parsing or invoice-content reconciliation.

This is a derivative benchmark review. It does not claim changes to untouched upstream official tests, complete application acceptance or score improvement.
