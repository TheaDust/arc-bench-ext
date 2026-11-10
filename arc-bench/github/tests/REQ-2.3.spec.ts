import { expectSelectedChoice, selectChoice } from './support/public-controls';
import type { Page } from '@playwright/test';
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount, openVisibleRepository, clickVisibleTarget } from './support/e2e';

const grantRow = (page: Page, name: string) => page.getByRole('row').filter({
  has: page.getByText(name, { exact: true }).filter({ visible: true }),
});

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-2.3: Grant Repository Access to People and Teams - Scenario 1', async ({ page }, testInfo) => {
  const administrator = seedAccount(testInfo, 'REPOSITORY_ADMIN');
  const repositoryName = seedValue(testInfo, 'PUBLIC_REPOSITORY_NAME');

  await signIn(page, administrator);
  await openVisibleRepository(page, repositoryName);
  await clickVisibleTarget(page, 'Settings');
  await clickVisibleTarget(page, 'Manage access');
  const team = seedValue(testInfo, 'ACCESS_TEAM_NAME');
  await page.getByRole('button', { name: 'Add people or teams', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill(team);
  await page.getByRole('option', { name: team, exact: true }).click();
  await selectChoice(page.getByRole('combobox', { name: 'Role', exact: true }), { label: 'Write' });
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  const row = grantRow(page, team);
  await expect(row).toHaveCount(1);
  await expectSelectedChoice(row.getByRole('combobox', { name: 'Role', exact: true }), 'Write');
  await page.reload();
  await expect(row).toHaveCount(1);
  await expectSelectedChoice(row.getByRole('combobox', { name: 'Role', exact: true }), 'Write');
});

test('REQ-2.3: Grant Repository Access to People and Teams - Scenario 2', async ({ page }, testInfo) => {
  const administrator = seedAccount(testInfo, 'REPOSITORY_ADMIN');
  const repositoryName = seedValue(testInfo, 'PUBLIC_REPOSITORY_NAME');
  const teamName = seedValue(testInfo, 'ACCESS_ROLE_CHANGE_TEAM_NAME');

  await signIn(page, administrator);
  await openVisibleRepository(page, repositoryName);
  await clickVisibleTarget(page, 'Settings');
  await clickVisibleTarget(page, 'Manage access');

  const accessRow = grantRow(page, teamName);
  await expect(accessRow).toHaveCount(1);
  await expectSelectedChoice(accessRow.getByRole('combobox', { name: 'Role', exact: true }), 'Write');
  await selectChoice(accessRow.getByRole('combobox', { name: 'Role', exact: true }), {
    label: 'Read',
  });
  await accessRow.getByRole('button', { name: 'Save', exact: true }).click();

  await page.reload();
  await expect(accessRow).toHaveCount(1);
  await expectSelectedChoice(accessRow.getByRole('combobox', { name: 'Role', exact: true }), 'Read');
});
