import { expectHeading } from './helpers';
import { expectText } from './helpers';
// requirement: REQ-1.6
import { test, expect } from '@playwright/test';
import { home, nav, action, region, card, count, tabTo, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-1.6: Inspect empty cart", async ({ page }) => {
  await home(page); await action(nav(page), 'Cart').click();
  await expectHeading(page, 'Shopping cart');
  await expectText(page, /(?:cart is empty|no items in your cart)/i);
  await expect(cartRow(page, CART)).toHaveCount(0);
});
