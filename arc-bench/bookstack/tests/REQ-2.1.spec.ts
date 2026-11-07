import { formField } from './support/public-controls';
// requirement: REQ-2.1
import { test, expect } from '@playwright/test';
import { identity, enter, button, go, login } from './helpers';

test("REQ-2.1: Show login form", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await go(page, 'Login');
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
  await expect(formField(page, 'Password')).toBeVisible();
  await expect(formField(page, 'Password')).toHaveAttribute('type', 'password');
  await expect(button(page, 'Login')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Remember Me', exact: true })).not.toBeChecked();
});
