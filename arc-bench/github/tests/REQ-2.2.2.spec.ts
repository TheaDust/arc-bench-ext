import { expectText } from './support/observations';
import { expectSelectedChoice, selectChoice } from './support/public-controls';
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount, openVisibleOrganization, clickVisibleTarget } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-2.2.2: Manage Organization Team Members and Hierarchy - Scenario 1', async ({ page }, testInfo) => {
  const maintainer = seedAccount(testInfo, 'TEAM_MAINTAINER');
  const member = seedValue(testInfo, 'TEAM_CANDIDATE_USERNAME');

  await signIn(page, maintainer);
  await page.getByRole('button', { name: 'Account menu', exact: true }).click();
  await page.getByRole('link', { name: 'Your organizations', exact: true }).click();
  await openVisibleOrganization(page, seedValue(testInfo, 'EXISTING_ORGANIZATION'));
  await clickVisibleTarget(page, 'Teams');
  await clickVisibleTarget(page, 'frontend-team');
  await page.getByRole('link', { name: 'Members', exact: true }).click();
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username', exact: true }).fill(member);
  await page.getByRole('button', { name: 'Add member to team', exact: true }).click();
  await expectText(page, member, { exact: true });

  await page.getByRole('button', { name: `Remove ${member}`, exact: true }).click();
  await expect(page.getByText(member, { exact: true })).not.toBeVisible();
  await page.reload();
  await expect(page.getByText(member, { exact: true })).not.toBeVisible();
});

test('REQ-2.2.2: Manage Organization Team Members and Hierarchy - Scenario 2', async ({ page }, testInfo) => {
  const maintainer = seedAccount(testInfo, 'TEAM_MAINTAINER');
  const descendantTeam = seedValue(testInfo, 'CYCLIC_TEAM_DESCENDANT');
  const originalParent = seedValue(testInfo, 'CYCLIC_TEAM_ORIGINAL_PARENT');

  await signIn(page, maintainer);
  await page.getByRole('button', { name: 'Account menu', exact: true }).click();
  await page.getByRole('link', { name: 'Your organizations', exact: true }).click();
  await openVisibleOrganization(page, seedValue(testInfo, 'EXISTING_ORGANIZATION'));
  await clickVisibleTarget(page, 'Teams');
  await clickVisibleTarget(page, 'frontend-team');
  await clickVisibleTarget(page, 'Settings');
  await selectChoice(page.getByRole('combobox', { name: 'Parent team', exact: true }), {
    label: descendantTeam,
  });
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expectText(page, 'Cyclic team hierarchy is not allowed', { exact: true });
  await page.reload();
  await expectSelectedChoice(page.getByRole('combobox', { name: 'Parent team', exact: true }), originalParent);
});
