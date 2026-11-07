import { expectText } from './support/observations';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-4.4: Manage Repository Files Through the Web Interface - Scenario 1', async ({ page }, testInfo) => {
  const contributor = seedAccount(testInfo, 'FILE_CONTRIBUTOR');
  const repositoryEntry = seedValue(testInfo, 'FILE_REPOSITORY_ENTRY');
  await signIn(page, contributor);
  await openVisibleTarget(page, repositoryEntry);
  const fileName = `pw-file-${Date.now()}-${testInfo.workerIndex}.md`;
  const content = `File content ${fileName}`;
  const message = `Add ${fileName}`;
  await page.getByRole('button', { name: 'Add file', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Create new file', exact: true }).click();
  await page.getByRole('textbox', { name: 'File name', exact: true }).fill(fileName);
  await page.getByRole('textbox', { name: 'File contents', exact: true }).fill(content);
  await page.getByRole('textbox', { name: 'Commit message', exact: true }).fill(message);
  await page.getByRole('button', { name: 'Commit changes', exact: true }).click();
  await expectText(page, content, { exact: true });
  await page.getByRole('link', { name: 'Commits', exact: true }).click();
  await expectText(page, message, { exact: true });
});

test('REQ-4.4: Manage Repository Files Through the Web Interface - Scenario 2', async ({ page }, testInfo) => {
  const contributor = seedAccount(testInfo, 'FILE_CONTRIBUTOR');
  const repositoryEntry = seedValue(testInfo, 'FILE_REPOSITORY_ENTRY');
  await signIn(page, contributor);
  await openVisibleTarget(page, repositoryEntry);
  await page.getByRole('button', { name: /^Add file$/ }).click();
  await page.getByRole('menuitem', { name: /^Create new file$/ }).click();
  await page.getByRole('textbox', { name: 'File name', exact: true }).fill('../invalid.md');
  await page.getByRole('textbox', { name: /^File contents$/ }).fill('must not be saved');
  await page.getByRole('button', { name: /^Commit changes$/ }).click();
  await expectText(page, /invalid.*path|commit message.*required/i);
});
