import { expectCredentialLogin } from './support/observations';
import { expectText } from './support/observations';
import { expectVisibleText } from './support/public-controls';
import { passwordField } from './support/e2e';
import { expect, test } from '@playwright/test';
import { openAccountAccess, openPasswordSettings, seedValue, signIn, seedAccount } from './support/e2e';

test('REQ-1.3: Change Account Password - Scenario 1', async ({ page, browser }, testInfo) => {
  const account = seedAccount(testInfo, 'PASSWORD_CHANGE_SUCCESS');
  const newPassword = seedValue(testInfo, 'PASSWORD_CHANGE_NEW_PASSWORD');
  await signIn(page, account);
  await openPasswordSettings(page);

  await (await passwordField(page, 'Current password')).fill(account.password);
  await (await passwordField(page, 'New password')).fill(newPassword);
  await (await passwordField(page, 'Confirm password')).fill(newPassword);
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expectText(page, 'Password updated', { exact: true });

  await expectCredentialLogin(browser, { ...account, password: newPassword });
});

test('REQ-1.3: Change Account Password - Scenario 2', async ({ page, browser }, testInfo) => {
  const account = seedAccount(testInfo, 'PASSWORD_CHANGE_INVALID_CURRENT');
  await signIn(page, account);
  await openPasswordSettings(page);

  await (await passwordField(page, 'Current password')).fill(`${account.password}-wrong`);
  await (await passwordField(page, 'New password')).fill('Another-valid-password-123!');
  await (await passwordField(page, 'Confirm password')).fill('does-not-match');
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expectText(page, 'Current password is incorrect', { exact: true });

  await expectCredentialLogin(browser, { ...account, password: account.password });
});

test('REQ-1.3: Change Account Password - Scenario 3', async ({ page, browser }, testInfo) => {
  const account = seedAccount(testInfo, 'PASSWORD_CHANGE_REQUIRED');
  const candidate = seedValue(testInfo, 'PASSWORD_CHANGE_REQUIRED_NEW_PASSWORD');
  await signIn(page, account);
  await openPasswordSettings(page);

  await (await passwordField(page, 'New password')).fill(candidate);
  await (await passwordField(page, 'Confirm password')).fill(candidate);
  await page.getByRole('button', { name: 'Update password', exact: true }).click();
  await expectText(page, 'Current password is required', { exact: true });

  await expectCredentialLogin(browser, { ...account, password: account.password });
});
