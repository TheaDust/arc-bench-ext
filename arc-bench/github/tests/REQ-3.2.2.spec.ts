import { branchState, createFile } from './support/branch-state';
import { openVisibleTarget } from "./support/e2e";
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import { seedValue, signIn, uniqueAccount, seedAccount } from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-3.2.2: Fork a Repository into Another Namespace - Scenario 1', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'FORK_USER');
  const sourceRepositoryEntry = seedValue(testInfo, 'FORK_SOURCE_REPOSITORY_ENTRY');
  const sourceRepositoryName = seedValue(testInfo, 'FORK_SOURCE_REPOSITORY_NAME');
  const forkName = `pw-fork-${uniqueAccount().username.slice(-12)}`;

  await signIn(page, account);
  await openVisibleTarget(page, sourceRepositoryEntry);
  const sourceUrl = page.url();
  const source = await branchState(page);
  expect(source.branch).toBe('main');
  expect(source.files).toEqual([['README.md','Acme docs'],['src/README.md','Document search flow']]);
  expect(source.commits).toHaveLength(2);
  const root = source.commits.find(row => row[1] === '');
  expect(root?.slice(2)).toEqual(['alice-dev','Initialize acme docs']);
  const child = source.commits.find(row => row[0] === source.head)!;
  expect(child.slice(1)).toEqual([root![0],'alice-dev','Document search flow']);
  await page.getByRole('button', { name: 'Fork', exact: true }).click();
  await page.getByRole('textbox', { name: 'Repository name', exact: true }).fill(forkName);
  await page.getByRole('button', { name: /^Create fork$/ }).click();

  await expect(page.getByRole('heading', { name: new RegExp(forkName, 'i') })).toBeVisible();
  await expect(page.getByText(new RegExp(`forked from.*${sourceRepositoryName}`, 'i'))).toBeVisible();
  const forkUrl = page.url();
  const copied = { ...source, owner: account.username };
  expect(await branchState(page)).toEqual(copied);
  await page.reload();
  expect(await branchState(page)).toEqual(copied);
  await expect(page.getByText(`Forked from ${sourceRepositoryName}`, { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Owner repositories', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('link', { name: forkName, exact: true })).toHaveCount(1);
  await page.getByRole('link', { name: forkName, exact: true }).click();
  await createFile(page, 'fork-only.md', 'Independent fork content', 'Change fork independently');
  await page.goto(forkUrl);
  await page.reload();
  const changed = await branchState(page);
  expect(changed.files).toEqual([...source.files,['fork-only.md','Independent fork content']].sort((a,b)=>a[0].localeCompare(b[0])));
  expect(changed.head).not.toBe(source.head);
  expect(changed.commits).toHaveLength(source.commits.length+1);
  expect(changed.commits.filter(row => row[0] !== changed.head)).toEqual(source.commits);
  expect(changed.commits.find(row => row[0] === changed.head)?.slice(1)).toEqual([source.head,account.username,'Change fork independently']);
  await page.goto(sourceUrl);
  await page.reload();
  expect(await branchState(page)).toEqual(source);
});

test('REQ-3.2.2: Fork a Repository into Another Namespace - Scenario 2', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'FORK_USER');
  const sourceRepositoryEntry = seedValue(testInfo, 'FORK_SOURCE_REPOSITORY_ENTRY');
  const existingForkName = seedValue(testInfo, 'EXISTING_FORK_NAME');
  await signIn(page, account);
  await openVisibleTarget(page, sourceRepositoryEntry);
  const sourceUrl = page.url();
  const source = await branchState(page);
  expect(source.branch).toBe('main');
  expect(source.files).toEqual([['README.md','Acme docs'],['src/README.md','Document search flow']]);
  expect(source.commits).toHaveLength(2);
  const root = source.commits.find(row => row[1] === '');
  expect(root?.slice(2)).toEqual(['alice-dev','Initialize acme docs']);
  const child = source.commits.find(row => row[0] === source.head)!;
  expect(child.slice(1)).toEqual([root![0],'alice-dev','Document search flow']);
  await page.getByRole('button', { name: 'Fork', exact: true }).click();
  await page.getByRole('textbox', { name: 'Repository name', exact: true }).fill(existingForkName);
  await page.getByRole('button', { name: /^Create fork$/ }).click();
  await expect(page.getByText(/name.*(already|exists)/i)).toBeVisible();
});
