import assert from 'node:assert/strict';
import { test } from '@playwright/test';
import { expectOverviewCommit, expectPullRequestNumbers, expectSavedReview, expectSearchDiff }
  from '../arc-bench/github/tests/support/pr-evidence';

test('PR list evidence rejects a new numbered record with an empty title', async ({ page }) => {
  await page.setContent('<section aria-label="Pull requests"><p>#1</p></section><aside>#3</aside>');
  await expectPullRequestNumbers(page, ['#1']);
  await page.getByRole('region', { name: 'Pull requests' }).evaluate(list => {
    list.insertAdjacentHTML('beforeend', '<p>#3 <a href="/pr/3"></a></p>');
  });
  await assert.rejects(expectPullRequestNumbers(page, ['#1']), /#3/);
});

test('PR commit evidence rejects an identifier and message on different records', async ({ page }) => {
  await page.setContent('<section aria-label="Commits"><ul><li><span>4f8a9c2</span><span>Implement onboarding search</span></li></ul></section>');
  await expectOverviewCommit(page);
  await page.getByRole('list').evaluate(list => {
    list.innerHTML = '<li>4f8a9c2</li><li>Implement onboarding search</li>';
  });
  await assert.rejects(expectOverviewCommit(page), /toHaveCount/);
});

test('PR diff evidence rejects plausible but incorrect aggregate totals', async ({ page }) => {
  await page.setContent('<section aria-label="Files changed"><p>src/search.ts</p><p role="status" aria-label="Diff totals">3 additions and 1 deletion</p><p>+3 -1</p></section>');
  await expectSearchDiff(page);
  await page.getByText('3 additions and 1 deletion', { exact: true }).evaluate(totals => {
    totals.textContent = '+13 -1';
  });
  await assert.rejects(expectSearchDiff(page), /\+13 -1/);
});

test('PR review evidence rejects the right summary attached to the wrong commit', async ({ page }) => {
  await page.setContent('<table aria-label="Review history"><tr><td>pr-reviewer</td><td>current</td><td>Changes requested</td><td>Fix parser</td></tr></table>');
  await expectSavedReview(page, 'pr-reviewer', 'current', /^Changes requested$/, 'Fix parser');
  await page.getByRole('cell', { name: 'Fix parser' }).evaluate(cell => {
    cell.textContent = 'Fix layout';
    cell.closest('table')!.insertAdjacentHTML('beforeend',
      '<tr><td>pr-reviewer</td><td>older</td><td>Changes requested</td><td>Fix parser</td></tr>');
  });
  await assert.rejects(expectSavedReview(page, 'pr-reviewer', 'current', /^Changes requested$/, 'Fix parser'));
});
