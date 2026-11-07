import { expectSelectedChoice, selectChoice } from './support/public-controls';
// requirement: REQ-2.4
import { test, expect } from '@playwright/test';
import { home, nav, action, region, card, count, tabTo, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-2.4: Sort current prices ascending", async ({ page }) => {
  await home(page); await men(page);
  const sort = page.getByRole('combobox', { name: 'Sort by', exact: true });
  await selectChoice(sort, { label: 'Price, low to high' });
  await expectSelectedChoice(sort, 'Price, low to high');
  await expect(card(page, WHITE)).toBeVisible();
  await expect.poll(async () => { const p = await listingPrices(page); return p.length >= 2 && p.every((v, i) => i === 0 || p[i - 1] <= v); }).toBe(true);
});
