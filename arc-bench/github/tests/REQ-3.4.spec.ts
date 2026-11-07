import { expectText } from './support/observations';
import { expectNoActionable } from './support/observations';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-3.4: Change Repository Visibility with Permission Checks - Scenario 1', async ({ page, browser }, testInfo) => {
  const administrator = seedAccount(testInfo, 'VISIBILITY_ADMIN');
  const repositoryEntry = seedValue(testInfo, 'VISIBILITY_REPOSITORY_ENTRY');

  await signIn(page, administrator);
  await openVisibleTarget(page, repositoryEntry);
  await page.getByRole('link', { name: /^Settings$/ }).click();
  await page.getByRole('link', { name: /general/i }).click();
  await page.getByRole('button', { name: 'Change visibility', exact: true }).click();
  await page.getByRole('radio', { name: 'Public', exact: true }).check();
  await page.getByRole('button', { name: 'Confirm visibility', exact: true }).click();
  await expectText(page, 'Public', { exact: true });
  const publicUrl = page.url();
  const visitorContext = await browser.newContext();
  try {
    const visitor = await visitorContext.newPage();
    await visitor.goto(publicUrl);
    await expect(visitor.getByRole('heading', { name: /visibility-demo/ })).toBeVisible();
    await expect(visitor.getByRole('button', { name: 'Account menu', exact: true })).toHaveCount(0);
  } finally { await visitorContext.close(); }
});

test('REQ-3.4: Change Repository Visibility with Permission Checks - Scenario 2', async ({ page }, testInfo) => {
  const collaborator = seedAccount(testInfo, 'NON_ADMIN_COLLABORATOR');
  const repositoryEntry = seedValue(testInfo, 'VISIBILITY_REPOSITORY_ENTRY');

  await signIn(page, collaborator);
  await openVisibleTarget(page, repositoryEntry);
  const settings = page.getByRole('link', { name: /^Settings$/ });
  if (await settings.isVisible()) await settings.click();
  await expectNoActionable(page.getByRole('button', { name: 'Change visibility', exact: true }));
});
