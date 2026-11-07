import { expectScopedMoneyText } from './helpers';
import { expectCartUnits } from './helpers';
// requirement: REQ-1.7
import { test, expect } from '@playwright/test';
import { home, nav, action, region, card, count, tabTo, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-1.7: Preview popular product without leaving home", async ({ page }) => {
  await home(page);
  const popular = region(page, 'Popular Products');
  const product = region(popular, `Product ${DETAIL}`); await product.hover();
  await action(product, 'Quick view').click();
  const preview = page.getByRole('dialog', { name: `Quick view ${DETAIL}`, exact: true });
  await expect(preview).toBeVisible(); await expect(preview).toContainText(DETAIL);
  await expectScopedMoneyText(preview, 24);
  await action(preview, 'Close').click(); await expect(preview).toHaveCount(0);
  await expect(region(page, 'Popular Products')).toBeVisible();
  await expectCartUnits(page, 0);
});
