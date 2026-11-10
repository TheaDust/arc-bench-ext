import { expectText } from './support/observations';
import { expectVisibleText } from './support/public-controls';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, uniqueAccount, seedAccount } from './support/e2e';
import { expectPullRequestNumbers } from './support/pr-evidence';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-6.2.3: Create a Pull Request from Comparison Results - Scenario 1', async ({ page }, testInfo) => {
  const contributor = seedAccount(testInfo, 'PR_CONTRIBUTOR');
  const compareEntry = seedValue(testInfo, 'VALID_COMPARE_ENTRY');
  const title = `Playwright PR ${uniqueAccount().username.slice(-10)}`;

  await signIn(page, contributor);
  await openVisibleTarget(page, compareEntry);
  await page.getByRole('button', { name: /create pull request/i }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  await page.getByRole('button', { name: /create pull request/i }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expectVisibleText(page, 'Open');
  await page.reload();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
});

test('REQ-6.2.3: Create a Pull Request from Comparison Results - Scenario 2', async ({ page }, testInfo) => {
  const contributor = seedAccount(testInfo, 'PR_CONTRIBUTOR');
  const compareEntry = seedValue(testInfo, 'VALID_COMPARE_ENTRY');
  await signIn(page, contributor);
  await openVisibleTarget(page, seedValue(testInfo, 'PUBLIC_REPOSITORY_ENTRY'));
  await page.getByRole('link', { name: 'Pull requests', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open', exact: true })).toBeVisible();
  const listUrl = page.url();
  const expectListUnchanged = async () => {
    await page.getByRole('link', { name: 'Open', exact: true }).click();
    await expectPullRequestNumbers(page, ['#1']);
    await page.getByRole('link', { name: 'Closed', exact: true }).click();
    await expectPullRequestNumbers(page, ['#2']);
  };
  await expectListUnchanged();
  await page.goto(baseUrl());
  await openVisibleTarget(page, compareEntry);
  await page.getByRole('button', { name: /create pull request/i }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('   ');
  await page.getByRole('button', { name: /create pull request/i }).click();
  await expectText(page, /title.*required/i);
  await page.goto(listUrl);
  await expectListUnchanged();
});
