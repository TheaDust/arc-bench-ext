import { expectText } from './support/observations';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-4.2.2: Inspect Commit and Revision Differences - Scenario 1', async ({ page }, testInfo) => {
  const commitEntry = seedValue(testInfo, 'COMMIT_ENTRY');
  const changedFile = seedValue(testInfo, 'CHANGED_FILE');

  await openVisibleTarget(page, commitEntry);
  await expectText(page, changedFile, { exact: true });
  await expectText(page, /changed files|changed/i);
  await expectText(page, /\+\d+.*-\d+|\d+ additions?.*\d+ deletions?/i);
});
