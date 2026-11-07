import { expectHeading } from './helpers';
import { expectText } from './helpers';
import { amount } from './helpers';
// requirement: REQ-2.2
import { test, expect } from '@playwright/test';
import { home, nav, action, region, card, count, tabTo, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-2.2: Inspect card and hover actions", async ({ page }) => {
  await home(page); await men(page);
  const product = card(page, DETAIL);
  await expect(product.getByRole('img', { name: DETAIL, exact: true })).toBeVisible();
  await expect(action(product, DETAIL)).toBeVisible();
  await expectText(product, 'Sale');
  await expectMoney(amount(product, 'Sale price'), 24); await expectMoney(amount(product, 'Regular price'), 30);
  await product.hover();
  for (const name of ['Quick view', 'Wishlist', 'White']) await expect(action(product, name)).toBeVisible();
});

test("REQ-2.2: Open card using keyboard", async ({ page }) => {
  await home(page); await men(page);
  await tabTo(page, action(card(page, DETAIL), DETAIL)); await page.keyboard.press('Enter');
  await expectHeading(page, DETAIL);
  await expect(action(page, 'Add to cart')).toBeVisible();
});
