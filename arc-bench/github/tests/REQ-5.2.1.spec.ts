import { expectText } from './support/observations';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, uniqueAccount, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-5.2.1: Create a Repository Issue - Scenario 1', async ({ page }, testInfo) => {
  const author = seedAccount(testInfo, 'ISSUE_AUTHOR');
  const issuesEntry = seedValue(testInfo, 'ISSUES_ENTRY');
  const title = `Playwright issue ${uniqueAccount().username.slice(-10)}`;
  const body = `Issue body ${Date.now()}`;

  await signIn(page, author);
  await openVisibleTarget(page, issuesEntry);
  await page.getByRole('link', { name: /new issue/i }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill(body);
  await page.getByRole('button', { name: /submit new issue/i }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expectText(page, body, { exact: true });
  await openVisibleTarget(page, issuesEntry);
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
});

test('REQ-5.2.1: Create a Repository Issue - Scenario 2', async ({ page }, testInfo) => {
  const author = seedAccount(testInfo, 'ISSUE_AUTHOR');
  const issuesEntry = seedValue(testInfo, 'ISSUES_ENTRY');
  await signIn(page, author);
  await openVisibleTarget(page, issuesEntry);
  await page.getByRole('link', { name: /new issue/i }).click();
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('   ');
  await page.getByRole('button', { name: /submit new issue/i }).click();
  await expectText(page, /title.*required/i);
});
