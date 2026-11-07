import { productIdentities } from './helpers';
import { expectProductRange } from './helpers';
// requirement: REQ-2.5
import { test, expect } from '@playwright/test';
import { home, nav, action, region, card, count, tabTo, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-2.5: Inspect first page and browse second", async ({ page }) => {
  await home(page); await men(page);
  await expectProductRange(page, 1, 12, 13);
  const cards = region(page, 'Product list').getByRole('region', { name: /^Product / });
  await expect(cards).toHaveCount(12); const before = await productIdentities(page);
  await action(page.getByRole('navigation', { name: 'Pagination', exact: true }), 'Next').click();
  await expectProductRange(page, 13, 13, 13);
  await expect(cards).toHaveCount(1); const after = await productIdentities(page);
  expect(after).not.toEqual(before); expect(before).not.toContain(after[0]);
});
