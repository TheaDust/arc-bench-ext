import { expectVisibleText } from './support/public-controls';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, uniqueAccount, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-6.2.4: Create a Draft Pull Request - Scenario 1', async ({ page }, testInfo) => {
  const contributor = seedAccount(testInfo, 'PR_CONTRIBUTOR');
  const compareEntry = seedValue(testInfo, 'DRAFT_COMPARE_ENTRY');
  const title = `Playwright draft ${uniqueAccount().username.slice(-10)}`;

  await signIn(page, contributor);
  await openVisibleTarget(page, compareEntry);
  await page.getByRole('button', { name: /create draft pull request/i }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  await page.getByRole('button', { name: /create draft pull request/i }).click();
  await expectVisibleText(page, 'Draft');
  await expect(page.getByRole('button', { name: /merge pull request/i })).toBeDisabled();
});

test('REQ-6.2.4: Create a Draft Pull Request - Scenario 2', async ({ page }, testInfo) => {
  const author = seedAccount(testInfo, 'DRAFT_PR_AUTHOR');
  const draftPullRequestEntry = seedValue(testInfo, 'DRAFT_PULL_REQUEST_ENTRY');
  const title = seedValue(testInfo, 'DRAFT_PULL_REQUEST_TITLE');
  const sourceBranch = seedValue(testInfo, 'DRAFT_PULL_REQUEST_SOURCE_BRANCH');
  const targetBranch = seedValue(testInfo, 'DRAFT_PULL_REQUEST_TARGET_BRANCH');

  await signIn(page, author);
  await openVisibleTarget(page, draftPullRequestEntry);
  const draftStatus = page.getByText('Draft', { exact: true });
  await expect(draftStatus.first()).toBeVisible();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText(sourceBranch, { exact: true })).toBeVisible();
  await expect(page.getByText(targetBranch, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /ready for review/i }).click();
  const confirm = page.getByRole('button', { name: /^Confirm$/ });
  if (await confirm.isVisible()) {
    await confirm.click();
  }

  await expectVisibleText(page, 'Open');
  await expect(draftStatus).toHaveCount(0);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText(sourceBranch, { exact: true })).toBeVisible();
  await expect(page.getByText(targetBranch, { exact: true })).toBeVisible();
  await expect(page.getByText(/ready for review|marked.*ready/i)).toBeVisible();
  await page.reload();
  await expectVisibleText(page, 'Open');
});
