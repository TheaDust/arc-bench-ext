import { output } from './support/branch-state';
import { expectSavedReview } from './support/pr-evidence';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test, type Page } from '@playwright/test';
import { seedValue, signIn, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

async function openReview(page: Page, entry: string) {
  await openVisibleTarget(page, entry);
  await expect(page.getByRole('heading', { name: entry, exact: true })).toBeVisible();
  const prUrl = page.url();
  await page.getByRole('link', { name: 'Compare branch', exact: true }).click();
  const commit = await output(page, 'Branch head', 'Branch state');
  await page.goto(prUrl);
  await page.getByRole('link', { name: 'Files changed', exact: true }).click();
  await page.getByRole('button', { name: /review changes/i }).click();
  return { prUrl, commit };
}

test('REQ-6.3.4: Submit a Pull Request Review - Scenario 1', async ({ page }, testInfo) => {
  const reviewer = seedAccount(testInfo, 'PR_REVIEWER');
  const pullRequestEntry = seedValue(testInfo, 'REVIEWABLE_PULL_REQUEST_ENTRY');

  await signIn(page, reviewer);
  const { prUrl, commit } = await openReview(page, pullRequestEntry);
  await page.getByRole('radio', { name: 'Approve', exact: true }).check();
  await page.getByRole('button', { name: /submit review/i }).click();
  await page.getByRole('link', { name: 'Conversation', exact: true }).click();
  await expectSavedReview(page, reviewer.username, commit, /^Approve(?:d)?$/i);
  await page.goto(prUrl);
  await expectSavedReview(page, reviewer.username, commit, /^Approve(?:d)?$/i);
});

test('REQ-6.3.4: Submit a Pull Request Review - Scenario 2', async ({ page }, testInfo) => {
  const reviewer = seedAccount(testInfo, 'PR_REVIEWER');
  const pullRequestEntry = seedValue(testInfo, 'CHANGE_REQUEST_PULL_REQUEST_ENTRY');
  const summary = `Please address the failing case ${Date.now()}`;

  await signIn(page, reviewer);
  const { prUrl, commit } = await openReview(page, pullRequestEntry);
  await page.getByRole('textbox', { name: /^(Summary|Comment)$/ }).fill(summary);
  await page.getByRole('radio', { name: /request changes/i }).check();
  await page.getByRole('button', { name: /submit review/i }).click();

  await page.getByRole('link', { name: 'Conversation', exact: true }).click();
  await expectSavedReview(page, reviewer.username, commit, /^(?:Request changes|Changes requested)$/i, summary);
  await page.goto(prUrl);
  await expectSavedReview(page, reviewer.username, commit, /^(?:Request changes|Changes requested)$/i, summary);
});
