import { signInSubmit } from './helpers';
import { formField } from './support/public-controls';
// requirement: REQ-6.1
import { test, expect } from '@playwright/test';
import { home, nav, action, region, card, count, tabTo, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-6.1: Open sign-in entry", async ({ page }) => {
  await home(page); await action(nav(page), 'Sign in').click();
  for (const name of ['Email', 'Password']) await expect(formField(page, name)).toBeVisible();
  await expect(formField(page, 'Password')).toHaveAttribute('type', 'password');
  await expect(signInSubmit(page)).toBeVisible(); await expect(action(page, 'No account? Create one here')).toBeVisible();
});

test("REQ-6.1: Reveal password and sign in", async ({ page }) => {
  await home(page); await action(nav(page), 'Sign in').click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('prestashop_user@example.com'); await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('prestashop_user@example.com');
  const password = formField(page, 'Password'); await password.fill('ShopPass123!'); await expect(password).toHaveAttribute('type', 'password');
  await action(page, 'SHOW').click(); await expect(password).toHaveAttribute('type', 'text'); await expect(password).toHaveValue('ShopPass123!');
  const remember = page.getByRole('checkbox', { name: 'Remember me', exact: true }); await remember.check(); await expect(remember).toBeChecked();
  await signInSubmit(page).click(); await expect(nav(page)).toContainText('Store User');
  for (const name of ['My account', 'Sign out']) await expect(action(nav(page), name)).toBeVisible();
});
