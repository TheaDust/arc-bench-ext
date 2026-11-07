import { branchState } from './support/branch-state';
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, uniqueAccount, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-3.2.1: Create a Repository with Owner, Visibility, and Initialization Options - Scenario 1', async ({ page }, testInfo) => {
  const owner = seedAccount(testInfo, 'REPOSITORY_OWNER');
  const repositoryName = `pw-repository-${uniqueAccount().username.slice(-12)}`;

  await signIn(page, owner);
  await page.getByRole('link', { name: /^New repository$/ }).click();
  await page.getByRole('textbox', { name: 'Repository name', exact: true }).fill(repositoryName);
  const description = page.getByRole('textbox', { name: 'Description', exact: true });
  if (await description.isVisible()) await description.fill('Repository created by Playwright');
  await page.getByRole('radio', { name: /^Private$/ }).check();
  await page.getByRole('checkbox', { name: /add a readme/i }).check();
  await page.getByRole('button', { name: /^Create repository$/ }).click();

  await expect(page.getByRole('heading', { name: new RegExp(repositoryName, 'i') })).toBeVisible();
  await expect(page.getByText(/private/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /readme/i })).toBeVisible();
  const initial = await branchState(page);
  expect(initial.owner).toBe(owner.username);
  expect(initial.branch).toBe('main');
  expect(initial.files.map(row => row[0])).toEqual(['README.md']);
  expect(initial.commits).toHaveLength(1);
  expect(initial.commits[0][1]).toBe('');
  expect(initial.commits[0][2]).toBe(owner.username);
  await page.reload();
  expect(await branchState(page)).toEqual(initial);
  await expect(page.getByText('Private', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Owner repositories', exact: true }).click();
  await page.reload();
  const listed = page.getByRole('link', { name: repositoryName, exact: true });
  await expect(listed).toHaveCount(1);
  await listed.click();
  await expect(page.getByRole('heading', { name: new RegExp(repositoryName, 'i') })).toBeVisible();
  expect(await branchState(page)).toEqual(initial);
});

test('REQ-3.2.1: Create a Repository with Owner, Visibility, and Initialization Options - Scenario 2', async ({ page }, testInfo) => {
  const owner = seedAccount(testInfo, 'REPOSITORY_OWNER');
  const existingRepository = seedValue(testInfo, 'EXISTING_OWNED_REPOSITORY');

  await signIn(page, owner);
  await page.getByRole('link', { name: /^New repository$/ }).click();
  await page.getByRole('textbox', { name: 'Repository name', exact: true }).fill(existingRepository);
  await page.getByRole('button', { name: /^Create repository$/ }).click();

  await expect(page.getByText(/name.*(already|exists|unavailable)/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: new RegExp(existingRepository, 'i') })).not.toBeVisible();
});

test('REQ-3.2.1: Create a Repository with Owner, Visibility, and Initialization Options - Scenario 3', async ({ page }, testInfo) => {
  const owner = seedAccount(testInfo, 'REPOSITORY_OWNER');
  await signIn(page, owner);
  await page.getByRole('link', { name: /^New repository$/ }).click();
  await page.getByRole('button', { name: /^Create repository$/ }).click();
  await expect(page.getByText(/repository name.*required/i)).toBeVisible();
});
