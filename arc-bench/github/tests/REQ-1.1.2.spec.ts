import { expectText } from './support/observations';
import { expectVisibleText } from './support/public-controls';
import { passwordField } from './support/e2e';
import { expect, test } from '@playwright/test';
import { openAccountAccess, signIn, seedAccount } from './support/e2e';

test('REQ-1.1.2: Sign In with an Existing Account - Scenario 1', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'LOGIN');

  await signIn(page, account);
  await page.reload();
  await expectVisibleText(page, account.username);
});

test('REQ-1.1.2: Sign In with an Existing Account - Scenario 2', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'LOGIN');

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.email);
  await (await passwordField(page, 'Password')).fill(`${account.password}-incorrect`);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expectText(page, 'Invalid credentials');
});

test('REQ-1.1.2: Sign In with an Existing Account - Scenario 3', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'LOGIN_EMAIL');

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.email);
  await (await passwordField(page, 'Password')).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expectVisibleText(page, account.username);
});

test('REQ-1.1.2: Sign In with an Existing Account - Scenario 4', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'LOGIN');

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill('unknown@example.test');
  await (await passwordField(page, 'Password')).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectText(page, 'Invalid credentials');

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.username);
  await (await passwordField(page, 'Password')).fill(`${account.password}-wrong`);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectText(page, 'Invalid credentials');
});
