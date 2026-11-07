import { expectVisibleText } from './support/public-controls';
import { passwordField } from './support/e2e';
import { expect, test } from '@playwright/test';
import { openAccountAccess, openPasswordSettings, seedValue, signIn, seedAccount } from './support/e2e';

test('REQ-1.3: Change Account Password - Scenario 1', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'PASSWORD_CHANGE_SUCCESS');
  const newPassword = seedValue(testInfo, 'PASSWORD_CHANGE_NEW_PASSWORD');
  await signIn(page, account);
  await openPasswordSettings(page);

  await (await passwordField(page, 'Current password')).fill(account.password);
  await (await passwordField(page, 'New password')).fill(newPassword);
  await (await passwordField(page, 'Confirm password')).fill(newPassword);
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expect(page.getByText('Password updated', { exact: true })).toBeVisible();

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.email);
  await (await passwordField(page, 'Password')).fill(newPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectVisibleText(page, account.username);
});

test('REQ-1.3: Change Account Password - Scenario 2', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'PASSWORD_CHANGE_INVALID_CURRENT');
  await signIn(page, account);
  await openPasswordSettings(page);

  await (await passwordField(page, 'Current password')).fill(`${account.password}-wrong`);
  await (await passwordField(page, 'New password')).fill('Another-valid-password-123!');
  await (await passwordField(page, 'Confirm password')).fill('does-not-match');
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expect(page.getByText('Current password is incorrect', { exact: true })).toBeVisible();

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.email);
  await (await passwordField(page, 'Password')).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectVisibleText(page, account.username);
});

test('REQ-1.3: Change Account Password - Scenario 3', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'PASSWORD_CHANGE_REQUIRED');
  const candidate = seedValue(testInfo, 'PASSWORD_CHANGE_REQUIRED_NEW_PASSWORD');
  await signIn(page, account);
  await openPasswordSettings(page);

  await (await passwordField(page, 'New password')).fill(candidate);
  await (await passwordField(page, 'Confirm password')).fill(candidate);
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expect(page.getByText('Current password is required', { exact: true })).toBeVisible();

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.email);
  await (await passwordField(page, 'Password')).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectVisibleText(page, account.username);
});
