// requirement: REQ-1.5
import { test, expect } from '@playwright/test';
import { tabTo, home, nav, action, region, card, count, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-1.5: Open popular t-shirt", async ({ page }) => {
  await home(page);
  await tabTo(page, action(region(page, 'Popular Products'), DETAIL));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: DETAIL, exact: true })).toBeVisible();
  await expect(action(page, 'Add to cart')).toBeVisible();
});
