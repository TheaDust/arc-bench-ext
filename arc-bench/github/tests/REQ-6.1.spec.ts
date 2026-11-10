import { expectText } from './support/observations';
import { expectVisibleText, selectChoice } from './support/public-controls';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-6.1: Protect Branches with Review and Status-Check Requirements - Scenario 1', async ({ page }, testInfo) => {
  const administrator = seedAccount(testInfo, 'PROTECTION_ADMIN');
  const repositoryEntry = seedValue(testInfo, 'PROTECTION_REPOSITORY_ENTRY');
  const pattern = seedValue(testInfo, 'PROTECTED_BRANCH_PATTERN');

  await signIn(page, administrator);
  await openVisibleTarget(page, repositoryEntry);
  await page.getByRole('link', { name: /^Settings$/ }).click();
  await page.getByRole('link', { name: /branches/i }).click();
  await page.getByRole('button', { name: 'Add branch protection rule', exact: true }).click();
  await page.getByRole('textbox', { name: 'Branch name pattern', exact: true }).fill(pattern);
  await page.getByRole('checkbox', { name: 'Require 1 approval', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Require status check test', exact: true }).check();
  await page.getByRole('button', { name: /^(Create|Save changes)$/ }).click();
  await page.reload();
  await expectText(page, pattern, { exact: true });
  await expectText(page, /1 approval/i);
  await expectText(page, /status check.*test/i);
});

test('REQ-6.1: Protect Branches with Review and Status-Check Requirements - Scenario 2', async ({ page }, testInfo) => {
  const nonAdministrator = seedAccount(testInfo, 'PROTECTION_NON_ADMIN');
  const repositoryEntry = seedValue(testInfo, 'PROTECTION_REPOSITORY_ENTRY');

  await signIn(page, nonAdministrator);
  await openVisibleTarget(page, repositoryEntry);

  const settingsLink = page.getByRole('link', { name: /^Settings$/ });
  if ((await settingsLink.count()) > 0) {
    await settingsLink.click();
    const branchesLink = page.getByRole('link', { name: /branches/i });
    if ((await branchesLink.count()) > 0) {
      await branchesLink.click();
    }
  }

  await expect(
    page.getByRole('button', { name: 'Add branch protection rule', exact: true }),
  ).toHaveCount(0);
});

test('REQ-6.1: Protect Branches with Review and Status-Check Requirements - Scenario 3', async ({ page }, testInfo) => {
  const administrator = seedAccount(testInfo, 'PROTECTION_ADMIN');
  const pullRequestEntry = seedValue(testInfo, 'PROTECTION_PULL_REQUEST_ENTRY');

  await signIn(page, administrator);
  await openVisibleTarget(page, pullRequestEntry);
  await page.getByRole('link', { name: 'Checks', exact: true }).click();
  await expectText(page, /test.*pending|pending.*test/i);
  const testStatus = page.getByRole('combobox', { name: /test.*status|status.*test/i });
  await selectChoice(testStatus, { label: 'success' });
  await page.getByRole('button', { name: /^(Save|Update)$/ }).click();

  await expectText(page, /test.*success|success.*test/i);
  await expectVisibleText(page, administrator.username);
  await page.reload();
  await expectText(page, /test.*success|success.*test/i);
});
