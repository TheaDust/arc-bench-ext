import { expectHeading } from './helpers';
// requirement: REQ-2.1
import { test, expect } from '@playwright/test';
import { tabTo, home, nav, action, region, card, count, men, openProduct, slideIdentity, expectMoney, listingPrices, cartRow, success, addProduct, cartSetup, login, loginEmail, account, createAddress, fillAddress, addressesStep, checkoutSetup, shippingStep, paymentStep, placeOrder, confirmDeletion, history, historyRow, wishlistPage, createWishlist, wishlist, wishlistProduct, DETAIL, CART, STEP, WHITE, BLACK, HISTORY_PRODUCT, WISH_PRODUCT } from './helpers';

test("REQ-2.1: Inspect category and breadcrumb", async ({ page }) => {
  await home(page); await men(page);
  await expectHeading(page, 'Men');
  await expect(region(page, 'Category description')).toBeVisible();
  await expect(region(page, 'Category description')).toContainText(/\S+/);
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true });
  await expect(breadcrumb).toHaveText(/Home\s*.*CLOTHES\s*.*Men/);
  await expect(count(page)).toBeVisible(); await expect(count(page)).toContainText(/\d+/);
  await expect(page.getByRole('combobox', { name: 'Sort by', exact: true })).toBeVisible();
  await expect(region(page, 'Product list')).toBeVisible();
});

test("REQ-2.1: Return to parent category", async ({ page }) => {
  await home(page); await men(page);
  await action(page.getByRole('navigation', { name: 'Breadcrumb', exact: true }), 'CLOTHES').click();
  await expectHeading(page, 'CLOTHES');
  await expect(action(region(page, 'Subcategories'), 'Men')).toBeVisible();
  await tabTo(page, action(region(page, 'Subcategories'), 'Men'));
});

test("REQ-2.1: Browse Women from parent", async ({ page }) => {
  await home(page); await men(page);
  await action(page.getByRole('navigation', { name: 'Breadcrumb', exact: true }), 'CLOTHES').click();
  await expect(action(region(page, 'Subcategories'), 'Men')).toBeVisible();
  await tabTo(page, action(region(page, 'Subcategories'), 'Women'));
  await page.keyboard.press('Enter');
  await expectHeading(page, 'Women');
  await expect(page.getByRole('combobox', { name: 'Sort by', exact: true })).toBeVisible();
});
