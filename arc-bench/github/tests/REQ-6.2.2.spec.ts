import { expectText } from './support/observations';
import { selectChoice } from './support/public-controls';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-6.2.2: Compare Branches Before Opening a Pull Request - Scenario 1', async ({ page }, testInfo) => {
  const contributor = seedAccount(testInfo, 'PR_CONTRIBUTOR');
  const pullsEntry = seedValue(testInfo, 'PULL_REQUESTS_ENTRY');
  const base = seedValue(testInfo, 'PR_BASE_BRANCH');
  const compare = seedValue(testInfo, 'PR_COMPARE_BRANCH');
  const changedFile = seedValue(testInfo, 'PR_CHANGED_FILE');

  await signIn(page, contributor);
  await openVisibleTarget(page, pullsEntry);
  await page.getByRole('link', { name: /^New pull request$/ }).click();
  await selectChoice(page.getByRole('combobox', { name: /base/i }), { label: base });
  await selectChoice(page.getByRole('combobox', { name: /compare/i }), { label: compare });
  await page.getByRole('button', { name: /compare changes/i }).click();
  await expectText(page, changedFile, { exact: true });
  await expectText(page, /commit/i);
});

test('REQ-6.2.2: Compare Branches Before Opening a Pull Request - Scenario 2', async ({ page }, testInfo) => {
  const contributor = seedAccount(testInfo, 'PR_CONTRIBUTOR');
  const pullsEntry = seedValue(testInfo, 'PULL_REQUESTS_ENTRY');
  const branch = seedValue(testInfo, 'PR_BASE_BRANCH');

  await signIn(page, contributor);
  await openVisibleTarget(page, pullsEntry);
  await page.getByRole('link', { name: /^New pull request$/ }).click();
  await selectChoice(page.getByRole('combobox', { name: /base/i }), { label: branch });
  await selectChoice(page.getByRole('combobox', { name: /compare/i }), { label: branch });

  await expectText(page, /identical|no differences/i);
  const createButton = page.getByRole('button', {
    name: /create pull request/i,
  });
  if ((await createButton.count()) > 0) {
    await expect(createButton).toBeDisabled();
  }
});
