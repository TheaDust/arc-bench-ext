import { amount } from './helpers';
// requirement: REQ-4.1
import { test, expect } from '@playwright/test';
import { home, nav, action, region, card, count, tabTo, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-4.1: Inspect cart row and totals", async ({ page }) => {
  await home(page); await cartSetup(page, CART); const row = cartRow(page, CART);
  await expect(row.getByRole('img', { name: CART, exact: true })).toBeVisible(); await expect(row).toContainText(CART);
  await expect(row).toContainText(/Size\s*:?\s*M/); await expect(row).toContainText(/Color\s*:?\s*White/);
  await expectMoney(amount(row, 'Unit price'), 25); await expect(row.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveValue('1');
  await expectMoney(amount(row, 'Subtotal'), 25); await expect(action(row, 'Delete')).toBeVisible();
  const summary = region(page, 'Cart summary'); await expectMoney(amount(summary, 'Items subtotal'), 25);
  await expectMoney(amount(summary, 'Shipping'), 5); await expectMoney(amount(summary, 'Total'), 30);
  await expect(summary).toContainText(/tax/i); await expect(amount(summary, 'Discount')).toHaveCount(0);
});
