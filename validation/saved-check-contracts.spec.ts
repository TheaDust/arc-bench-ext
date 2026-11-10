import { expect, test } from '@playwright/test';
import { expectTestCheck } from '../arc-bench/github/tests/support/saved-test-check';

test('saved check accepts a table row or a named check group', async ({ page }) => {
  for (const record of [
    '<table><tr><td>test</td><td>success</td><td>protection-admin</td></tr></table>',
    '<section aria-label="Check test"><p>test: success</p><p>Updated by: protection-admin</p></section>',
  ]) {
    await page.setContent(record);
    await expectTestCheck(page, 'success', 'protection-admin');
  }
});

test('a correct account name outside the check record does not prove the setter', async ({ page }) => {
  await page.setContent('<nav>protection-admin</nav><table><tr><td>test</td><td>success</td><td>another-user</td></tr></table>');
  await expect(expectTestCheck(page, 'success', 'protection-admin')).rejects.toThrow();
});

test('an unsaved selector or another check cannot supply the saved success', async ({ page }) => {
  await page.setContent('<table><tr><td>test</td><td>pending</td><td><select><option selected>success</option></select></td><td>protection-admin</td></tr><tr><td>build</td><td>success</td><td>protection-admin</td></tr></table>');
  await expectTestCheck(page, 'pending');
  await expect(expectTestCheck(page, 'success', 'protection-admin')).rejects.toThrow();
});

import { expectRebookingIdentity } from '../arc-bench/12306/tests/support/rebooking';
import { expectEmptyFlightSearch } from '../arc-bench/ctrip/tests/support/search-results';

test('unrelated train and passenger outside the rebooking dialog cannot prove the new selection', async ({ page }) => {
  const dialog = (body: string) => '<section role="dialog" aria-label="Please confirm the following information.">' + body + '</section>';
  await page.setContent(dialog('<p>G1001 — Passenger Example</p>'));
  await expectRebookingIdentity(page, 'G1001', 'Passenger Example');
  await page.setContent('<aside>G1001 — Passenger Example</aside>' + dialog('<p>G1002 — Other passenger</p>'));
  await expect(expectRebookingIdentity(page, 'G1001', 'Passenger Example')).rejects.toThrow();
});

test('empty search evidence rejects an empty message alongside actual flight rows', async ({ page }) => {
  const list = (body: string) => '<section aria-label="Flight list"><p>No flights found</p>' + body + '</section>';
  await page.setContent(list(''));
  await expectEmptyFlightSearch(page);
  await page.setContent(list('<ul><li aria-label="Flight JD5162">JD5162</li></ul>'));
  await expect(expectEmptyFlightSearch(page)).rejects.toThrow();
});
