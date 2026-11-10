import { expect, type Page } from '@playwright/test';
import { historyRow } from './confirmation-guards';
import { expectText } from './observations';

export async function expectPullRequestNumbers(page: Page, numbers: string[]) {
  const list = page.getByRole('region', { name: 'Pull requests', exact: true });
  await expect(list).toBeVisible();
  const identifiers = list.getByText(/^\s*#[1-9]\d*\s*$/).filter({ visible: true });
  await expect.poll(async () => (await identifiers.allInnerTexts()).map(value => value.trim()).sort())
    .toEqual([...numbers].sort());
}

export async function expectOverviewCommit(page: Page) {
  const commits = page.getByRole('region', { name: 'Commits', exact: true });
  const records = commits.getByRole('row').or(commits.getByRole('listitem')).or(commits.getByRole('article'));
  const record = records.filter({
    has: page.getByText(/^4f8a9c2[0-9a-f]*$/i).filter({ visible: true }),
  }).filter({ has: page.getByText('Implement onboarding search', { exact: true }).filter({ visible: true }) });
  await expect(record).toHaveCount(1);
  await expect(record).toBeVisible();
}

export async function expectSearchDiff(page: Page) {
  const diff = page.getByRole('region', { name: 'Files changed', exact: true });
  await expectText(diff, 'src/search.ts', { exact: true });
  const totals = diff.getByRole('status', { name: 'Diff totals', exact: true });
  await expect(totals).toBeVisible();
  await expect(totals).toHaveText(/^(?:\+3\s*(?:[,/·]\s*)?[-−]1|3\s+additions\s*(?:(?:[,/·]|and)\s*)?1\s+deletion)$/i, { useInnerText: true });
}

export async function expectSavedReview(page: Page, reviewer: string, commit: string, decision: RegExp, summary?: string) {
  const record = historyRow(page, 'Review history', [reviewer, commit]);
  await expect(record).toHaveCount(1);
  await expect(record).toBeVisible();
  await expectText(record.getByRole('cell', { name: decision }), decision);
  if (summary) await expectText(record.getByRole('cell', { name: summary, exact: true }), summary, { exact: true });
}
