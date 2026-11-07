import { memberForm, memberRecord } from './support/membership';
import { selectChoice } from './support/public-controls';
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, seedAccount, openVisibleOrganization, openVisibleRepository, clickVisibleTarget } from './support/e2e';

async function openPeople(page: import('@playwright/test').Page, organizationName: string): Promise<void> {
  await openVisibleOrganization(page, organizationName);
  await page.getByRole('link', { name: 'People', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-2.2.3: Directly Add a User as an Organization Member - Scenario 1', async ({ page, browser }, testInfo) => {
  const owner = seedAccount(testInfo, 'ORGANIZATION_OWNER');
  const newMember = seedAccount(testInfo, 'ORGANIZATION_NEW_MEMBER');
  const organizationName = seedValue(testInfo, 'EXISTING_ORGANIZATION');

  await signIn(page, owner);
  await page.getByRole('button', { name: 'Account menu', exact: true }).click();
  await page.getByRole('link', { name: 'Your organizations', exact: true }).click();
  await openPeople(page, organizationName);
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  const form = memberForm(page);
  await form.getByRole('textbox', { name: 'Username or email', exact: true }).fill(newMember.username);
  const role = form.getByRole('combobox', { name: 'Role', exact: true });
  await selectChoice(role, { label: 'Member' });
  await form.getByRole('button', { name: 'Add member', exact: true }).click();

  const record = memberRecord(page, newMember.username);
  await expect(record).toHaveCount(1);
  await expect(record.getByText(newMember.username, { exact: true })).toBeVisible();
  await expect(record.getByText('Member', { exact: true })).toBeVisible();
  await expect(page.getByText('Pending invitation', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(record).toHaveCount(1);
  await expect(record.getByText(newMember.username, { exact: true })).toBeVisible();
  await expect(record.getByText('Member', { exact: true })).toBeVisible();

  // Discover the protected destination in the authorized owner's session.
  await page.getByRole('link', { name: 'Repositories', exact: true }).click();
  await openVisibleRepository(page, seedValue(testInfo, 'PRIVATE_ORGANIZATION_REPOSITORY'));
  const privateRepositoryUrl = page.url();
  const memberContext = await browser.newContext();
  try {
    const memberPage = await memberContext.newPage();
    await signIn(memberPage, newMember, newMember.email);
    await memberPage.getByRole('button', { name: 'Account menu', exact: true }).click();
    await memberPage.getByRole('link', { name: 'Your organizations', exact: true }).click();
    await expect(memberPage.getByText(organizationName, { exact: true })).toBeVisible();
    await clickVisibleTarget(memberPage, organizationName);
    await memberPage.getByRole('link', { name: 'Repositories', exact: true }).click();
    await memberPage.goto(privateRepositoryUrl);
    await expect(memberPage.getByText('Access denied', { exact: true })).toBeVisible();
  } finally { await memberContext.close(); }
});

test('REQ-2.2.3: Directly Add a User as an Organization Member - Scenario 2', async ({ page }, testInfo) => {
  const owner = seedAccount(testInfo, 'ORGANIZATION_OWNER');
  const existingMember = seedAccount(testInfo, 'ORGANIZATION_EXISTING_MEMBER');
  const unknownAccount = 'unknown-reviewer';

  await signIn(page, owner);
  await page.getByRole('button', { name: 'Account menu', exact: true }).click();
  await page.getByRole('link', { name: 'Your organizations', exact: true }).click();
  await openPeople(page, seedValue(testInfo, 'EXISTING_ORGANIZATION'));
  await page.getByRole('button', { name: 'Add member', exact: true }).click();
  const form = memberForm(page);
  await form.getByRole('textbox', { name: 'Username or email', exact: true }).fill(existingMember.username);
  await form.getByRole('button', { name: 'Add member', exact: true }).click();
  await expect(form.getByText('Account is already a member', { exact: true })).toBeVisible();

  await form.getByRole('textbox', { name: 'Username or email', exact: true }).fill(unknownAccount);
  await form.getByRole('button', { name: 'Add member', exact: true }).click();
  await expect(form.getByText('Account not found', { exact: true })).toBeVisible();
  await expect(memberRecord(page, existingMember.username)).toHaveCount(1);
  await expect(memberRecord(page, unknownAccount)).toHaveCount(0);
  await page.reload();
  await expect(memberRecord(page, existingMember.username)).toHaveCount(1);
});
