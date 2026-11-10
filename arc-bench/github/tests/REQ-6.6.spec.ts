import { output } from './support/branch-state';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-6.6: Close or Reopen a Pull Request Without Merging - Scenario 1', async ({ page }, testInfo) => {
  const author = seedAccount(testInfo, 'PR_AUTHOR');
  const pullRequestEntry = seedValue(testInfo, 'CLOSABLE_PULL_REQUEST_ENTRY');

  await signIn(page, author);
  await openVisibleTarget(page, pullRequestEntry);
  const status = page.getByRole('status', { name: 'PR status', exact: true });
  await expect(status).toHaveText('Open');
  const prUrl = page.url();
  const number = await output(page, 'PR number');
  expect(number).toMatch(/^#[1-9]\d*$/);
  const readHeads = async () => {
    const heads: string[] = [];
    for (const name of ['Base branch', 'Compare branch']) {
      await page.getByRole('link', { name, exact: true }).click();
      heads.push(await output(page, 'Branch head', 'Branch state'));
      await page.goto(prUrl);
    }
    return heads;
  };
  const before = await readHeads();
  expect(before[0]).not.toBe(before[1]);
  for (const [action, state] of [['Close pull request', 'Closed'], ['Reopen pull request', 'Open']] as const) {
    await page.getByRole('button', { name: action, exact: true }).click();
    await expect(status).toHaveText(state);
    await page.reload();
    await expect(status).toHaveText(state);
    expect(await output(page, 'PR number')).toBe(number);
    expect(await readHeads()).toEqual(before);
  }
  await expect(page.getByRole('button', { name: 'Close pull request', exact: true })).toBeVisible();
});

test('REQ-6.6: Close or Reopen a Pull Request Without Merging - Scenario 2', async ({ page }, testInfo) => {
  const viewer = seedAccount(testInfo, 'PR_VIEWER');
  const pullRequestEntry = seedValue(testInfo, 'PROTECTED_PULL_REQUEST_ENTRY');

  await signIn(page, viewer);
  await openVisibleTarget(page, pullRequestEntry);
  await expect(
    page.getByRole('button', { name: /close pull request/i }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /reopen pull request/i }),
  ).toHaveCount(0);
});
