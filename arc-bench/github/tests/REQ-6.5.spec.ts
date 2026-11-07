import { branchState, output } from './support/branch-state';
import { selectChoice, expectChoiceLabels } from './support/public-controls';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-6.5: Merge an Eligible Pull Request - Scenario 1', async ({ page }, testInfo) => {
  const maintainer = seedAccount(testInfo, 'PR_MAINTAINER');
  const pullRequestEntry = seedValue(testInfo, 'MERGEABLE_PULL_REQUEST_ENTRY');

  await signIn(page, maintainer);
  await openVisibleTarget(page, pullRequestEntry);
  const prUrl = page.url();
  const before = await branches(page, prUrl);
  const method = page.getByRole('combobox', { name: 'Merge method', exact: true });
  await selectChoice(method, { label: 'Create a merge commit' });
  await expectChoiceLabels(method, ['Create a merge commit']);
  await page.getByRole('button', { name: 'Merge pull request', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm merge', exact: true }).click();
  await expect(page.getByText('Merged', { exact: true })).toBeVisible();
  const commit = await output(page, 'Merge commit', 'Merge result');
  expect(await output(page, 'Merged by', 'Merge result')).toBe(maintainer.username);
  const time = await output(page, 'Merged at', 'Merge result');
  expect(time).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  expect(Number.isFinite(Date.parse(time))).toBe(true);
  for (let replay=0; replay<2; replay++) {
    await page.goto(before.baseUrl);
    await page.reload();
    const merged = await branchState(page);
    expect(merged.owner).toBe(before.base.owner);
    expect(merged.branch).toBe('main');
    expect(merged.head).toBe(commit);
    expect(commit).not.toBe(before.base.head);
    expect(merged.files).toEqual(before.compare.files);
    const merge = merged.commits.find(row => row[0] === commit)!;
    expect(merge).toBeDefined();
    expect(merge[1].split(',').map(value=>value.trim())).toEqual([before.base.head,before.compare.head]);
    expect(merge[2]).toBe(maintainer.username);
    const inherited = new Map([...before.base.commits,...before.compare.commits].map(row=>[row[0],row]));
    expect(merged.commits.filter(row=>row[0]!==commit)).toEqual([...inherited.values()].sort((a,b)=>a[0].localeCompare(b[0])));
    await page.goto(before.compareUrl);
    await page.reload();
    expect(await branchState(page)).toEqual(before.compare);
    await page.goto(prUrl);
    await page.reload();
    await expect(page.getByText('Merged', { exact: true })).toBeVisible();
    expect(await output(page, 'Merge commit', 'Merge result')).toBe(commit);
    expect(await output(page, 'Merged by', 'Merge result')).toBe(maintainer.username);
    expect(await output(page, 'Merged at', 'Merge result')).toBe(time);
  }
});

test('REQ-6.5: Merge an Eligible Pull Request - Scenario 2', async ({ page }, testInfo) => {
  const maintainer = seedAccount(testInfo, 'PR_MAINTAINER');
  const pullRequestEntry = seedValue(testInfo, 'UNMERGEABLE_PULL_REQUEST_ENTRY');
  await signIn(page, maintainer);
  await openVisibleTarget(page, pullRequestEntry);
  const prUrl = page.url();
  const before = await branches(page, prUrl);
  await expect(page.getByRole('button', { name: 'Merge pull request', exact: true })).toBeDisabled();
  await expect(page.getByText('Review required by branch protection', { exact: true })).toBeVisible();
  await expect(page.getByText('Open', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Open', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Merge result', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Merge pull request', exact: true })).toBeDisabled();
  for (const [url, state] of [[before.baseUrl,before.base],[before.compareUrl,before.compare]] as const) {
    await page.goto(url);
    await page.reload();
    expect(await branchState(page)).toEqual(state);
  }
});

async function branches(page: import('@playwright/test').Page, prUrl: string) {
  await expect(page.getByText('Open', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Base branch', exact: true }).click();
  const baseUrl = page.url();
  const base = await branchState(page);
  expect(base.branch).toBe('main');
  expect(base.files).toEqual([['base-only.md','Base branch content'],['shared.md','Common content']]);
  await page.goto(prUrl);
  await page.getByRole('link', { name: 'Compare branch', exact: true }).click();
  const compareUrl = page.url();
  const compare = await branchState(page);
  expect(compare.branch).toBe('feature-search');
  expect(compare.head).not.toBe(base.head);
  expect(compare.files).toEqual([['base-only.md','Base branch content'],['feature-only.md','Feature branch content'],['shared.md','Common content']]);
  await page.goto(prUrl);
  return { baseUrl, base, compareUrl, compare };
}
