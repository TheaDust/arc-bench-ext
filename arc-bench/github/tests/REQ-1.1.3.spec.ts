import { expectText } from './support/observations';
import { expectVisibleText } from './support/public-controls';
import { passwordField } from './support/e2e';
import { expect, test } from '@playwright/test';
import { openAccountAccess, seedAccount } from './support/e2e';

async function openResetStep(page: import('@playwright/test').Page, email: string): Promise<void> {
  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('link', { name: 'Forgot password', exact: true }).click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
  await expectText(page, '123456');
  await expect((await passwordField(page, 'New password'))).toBeVisible();
}

test('REQ-1.1.3: Recover Account Access Through a Verified Email - Scenario 1', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'RECOVERY_VISIBILITY');

  await openResetStep(page, account.email);
  await expect(page.getByRole('textbox', { name: 'Verification code', exact: true })).toBeVisible();

  await openResetStep(page, 'unknown@example.test');
  await expect(page.getByRole('textbox', { name: 'Verification code', exact: true })).toBeVisible();
});

test('REQ-1.1.3: Recover Account Access Through a Verified Email - Scenario 2', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'RECOVERY_INVALID_CODE');
  const attemptedPassword = 'Replacement-password-456!';

  await openResetStep(page, account.email);
  await page.getByRole('textbox', { name: 'Verification code', exact: true }).fill('000000');
  await (await passwordField(page, 'New password')).fill(attemptedPassword);
  await (await passwordField(page, 'Confirm password')).fill(attemptedPassword);
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expectText(page, 'Verification code is invalid');

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.email);
  await (await passwordField(page, 'Password')).fill(account.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectVisibleText(page, account.username);
});

test('REQ-1.1.3: Recover Account Access Through a Verified Email - Scenario 3', async ({ page }, testInfo) => {
  const account = seedAccount(testInfo, 'RECOVERY_SUCCESS');
  const newPassword = 'Replacement-password-456!';

  await openResetStep(page, account.email);
  await page.getByRole('textbox', { name: 'Verification code', exact: true }).fill('123456');
  await (await passwordField(page, 'New password')).fill(newPassword);
  await (await passwordField(page, 'Confirm password')).fill(newPassword);
  await page.getByRole('button', { name: 'Reset password', exact: true }).click();
  await expectText(page, 'Password updated');

  await openAccountAccess(page);
  await page.getByRole('link', { name: 'Sign in', exact: true }).click();
  await page.getByRole('textbox', { name: 'Username or email', exact: true }).fill(account.email);
  await (await passwordField(page, 'Password')).fill(newPassword);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expectVisibleText(page, account.username);
});
