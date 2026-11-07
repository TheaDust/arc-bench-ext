import { expectSelectedChoice, formField, selectChoice } from './support/public-controls';
import { expect, type Page, type Locator } from '@playwright/test';

export const DETAIL = 'Hummingbird detail t-shirt';
export const CART = 'Hummingbird cart t-shirt';
export const STEP = 'Hummingbird checkout-step t-shirt';
export const WHITE = 'White t-shirt';
export const BLACK = 'Black mug';
export const HISTORY_PRODUCT = 'Hummingbird order-history t-shirt';
export const WISH_PRODUCT = 'Hummingbird wishlist t-shirt';
export const HUMMINGBIRD_PRODUCTS = [DETAIL, CART, STEP, 'Hummingbird order-confirmation t-shirt',
  'Hummingbird order-complete t-shirt', HISTORY_PRODUCT, WISH_PRODUCT];
export const CATALOG_PRODUCTS = [...HUMMINGBIRD_PRODUCTS, WHITE, BLACK, ...[1, 2, 3, 4].map(i => `Catalog item ${i}`)];
type Scope = Page | Locator;

function exactName(name: string) {
  return new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}
const buttonActions = new Set(['Sign in', 'Sign out', 'Menu', 'Next', 'Quick view', 'White', 'Close',
  'Add to cart', 'Increase quantity', 'Decrease quantity', 'Clear all', 'Zoom', 'Front', 'Back',
  'Write your review', 'Delete', 'Continue', 'Add new address', 'Save', 'Place order',
  'Edit address Home', 'Edit Shipping Method', 'Edit Addresses', 'SHOW', 'Send',
  'Create new address', 'Update', 'Create new wishlist', 'Edit', 'Remove'].map(name => name.toLowerCase()));
// Keep the source's explicit roles; action names themselves are case-insensitive.
export function action(scope: Scope, name: string): Locator {
  const label = name === 'Cart' ? /^Cart(?:\s*(?:\(\d+\)|\d+))?$/i : exactName(name);
  return scope.getByRole(buttonActions.has(name.toLowerCase()) ? 'button' : 'link', { name: label });
}
export function region(scope: Scope, name: string) { return scope.getByRole('region', { name, exact: true }); }
/** The requirement names monetary fields, without declaring a container ARIA role. */
export function amount(scope: Scope, name: string): Locator {
  const named = region(scope, name).or(scope.getByRole('group', { name, exact: true }))
    .or(scope.getByRole('status', { name, exact: true }));
  // Native definition lists publicly associate dt labels with their following dd values.
  // Include every dd for that term so genuinely ambiguous values remain strict.
  const literal = `'${name.replace(/'/g, "',\"'\",'")}'`;
  const xpathLabel = name.includes("'") ? `concat(${literal})` : literal;
  const definitions = scope.locator('dt').filter({ hasText: new RegExp(`^\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) }).filter({ visible: true })
    .locator(`xpath=following-sibling::dd[preceding-sibling::dt[1][normalize-space(.)=${xpathLabel}]]`);
  return named.or(definitions).filter({ visible: true });
}
export function nav(page: Page) { return page.getByRole('navigation', { name: 'Global navigation', exact: true }); }
export function signInSubmit(page: Page): Locator {
  // Exclude navigation by public HTML/ARIA semantics; do not require an undeclared main/form.
  return page.getByRole('button', { name: /^sign in$/i })
    .and(page.locator(':not(nav *, [role="navigation"] *)'));
}
export async function expectCartUnits(page: Page, units: number) {
  const cart = action(nav(page), 'Cart');
  await expect(cart).toBeVisible();
  await expect.poll(async () => {
    const label = /^- link "([^"]*)"/.exec(await cart.ariaSnapshot())?.[1] ?? '';
    const counts = [await cart.innerText(), label].map(text => text.match(/\d+/g)).filter((value): value is RegExpMatchArray => value !== null);
    return counts.length > 0 && counts.every(value => value.length === 1 && value[0] === String(units));
  }).toBe(true);
}
export async function expectText(scope: Scope, text: string | RegExp) {
  await expect.poll(() => scope.getByText(text, { exact: typeof text === 'string' }).filter({ visible: true }).count()).toBeGreaterThan(0);
}
export async function expectHeading(page: Page, name: string) {
  await expect.poll(() => page.getByRole('heading', { name, exact: true }).filter({ visible: true }).count()).toBeGreaterThan(0);
}
export function card(page: Page, name: string) { return region(region(page, 'Product list'), `Product ${name}`); }
export function count(page: Page) { return page.getByRole('status', { name: 'Product count', exact: true }); }
export async function expectProductRange(page: Page, start: number, end: number, total: number) {
  await expect(count(page)).toBeVisible();
  await expect(count(page)).toHaveText(new RegExp(`^Showing\\s+${start}\\s*[-–]\\s*${end}\\s+of\\s+${total}\\s+item(?:s|\\(s\\))?$`, 'i'));
}
export async function expectProductTotal(page: Page, total: number) {
  await expect(count(page)).toBeVisible();
  await expect(count(page)).toHaveText(new RegExp(`^Showing\\s+\\d+\\s*[-–]\\s*\\d+\\s+of\\s+${total}\\s+item(?:s|\\(s\\))?$`, 'i'));
}
export function cartRow(page: Page, name: string) { return page.getByRole('row', { name, exact: true }); }
export function success(page: Page) { return page.getByRole('dialog', { name: 'Product successfully added to your shopping cart', exact: true }); }
export async function home(page: Page) {
  await page.goto('/');
  await expect(nav(page)).toBeVisible();
}
export async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  // Bounded keyboard traversal observes focus through the exposed UI, never DOM tab indices.
  for (let i = 0; i < 150; i++) {
    await page.keyboard.press('Tab');
    try { await expect(target).toBeFocused({ timeout: 20 }); return; } catch { /* try next focusable control */ }
  }
  await expect(target).toBeFocused();
}
export async function men(page: Page) {
  await action(nav(page), 'CLOTHES').hover();
  await action(nav(page), 'Men').click();
  await expectHeading(page, 'Men');
  await expect(card(page, DETAIL)).toBeVisible();
}
export async function openProduct(page: Page, name: string) {
  await men(page);
  await action(card(page, name), name).click();
  await expectHeading(page, name);
  await expect(region(page, 'Product information')).toBeVisible();
  await expect(region(page, 'Product information')).toContainText(name);
}
export async function slideIdentity(page: Page) {
  // Lightweight identity only: no pixel comparison, asset download, or visual-content analysis.
  const active = region(page, 'Carousel').getByRole('img').filter({ visible: true });
  await expect(active).toHaveCount(1);
  await expect(active).toBeVisible();
  return { name: await active.getAttribute('aria-label') ?? await active.getAttribute('alt'), source: await active.getAttribute('src') };
}
export function monetaryValue(text: string): number {
  const numbers = text.match(/-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length !== 1) throw new Error(`Expected one monetary amount, received ${JSON.stringify(text)}`);
  return Number(numbers[0]);
}
export async function expectMoney(scope: Locator, amount: number) {
  await expect(scope).toBeVisible();
  await expect.poll(async () => monetaryValue(await scope.innerText())).toBeCloseTo(amount, 2);
}
export async function expectScopedMoneyText(scope: Locator, value: number) {
  const number = String(value).replace('.', '\\.');
  const pattern = new RegExp(`^(?:USD\\s*|\\$\\s*)?${number}(?:\\.0{1,2})?(?:\\s*USD)?$`, 'i');
  await expect(scope).toBeVisible();
  await expectText(scope, pattern);
}
export async function expectPromotionDestination(page: Page) {
  await expect.poll(async () => {
    const information = region(page, 'Product information');
    const detail = await information.isVisible() && (await information.innerText()).includes(DETAIL)
      && await page.getByRole('heading', { name: DETAIL, exact: true }).filter({ visible: true }).count() > 0;
    const category = await page.getByRole('heading', { name: /^(?:Men|CLOTHES)$/i }).filter({ visible: true }).count() > 0
      && await card(page, DETAIL).isVisible();
    return detail || category;
  }).toBe(true);
}
export async function productIdentities(page: Page) {
  const products = region(page, 'Product list').getByRole('region', { name: /^Product / }).filter({ visible: true });
  const identities = [];
  for (const product of await products.all()) {
    const snapshot = await product.ariaSnapshot();
    const name = /^- region "(Product [^"]+)"/.exec(snapshot)?.[1];
    if (!name) throw new Error('Missing public product-region identity');
    identities.push(name);
  }
  if (new Set(identities).size !== identities.length) throw new Error('Duplicate visible product identity');
  return identities;
}
export async function expectProductSet(page: Page, names: string[]) {
  await expect.poll(async () => (await productIdentities(page)).sort()).toEqual(names.map(name => `Product ${name}`).sort());
}
export async function listingPrices(page: Page) {
  const products = region(page, 'Product list').getByRole('region', { name: /^Product / }).filter({ visible: true });
  const prices: number[] = [];
  for (const product of await products.all()) {
    const price = amount(product, 'Sale price');
    await expect(price).toBeVisible();
    prices.push(monetaryValue(await price.innerText()));
  }
  if (!prices.length) throw new Error('Product list contains no visible product prices');
  return prices;
}
export async function addProduct(page: Page, name: string) {
  await openProduct(page, name);
  await action(page, 'Add to cart').click();
  await expect(success(page)).toBeVisible();
  await expect(success(page)).toContainText(name);
}
export async function cartSetup(page: Page, name: string) {
  await addProduct(page, name);
  await action(success(page), 'Proceed to checkout').click();
  await expect(cartRow(page, name)).toBeVisible();
}
export async function loginEmail(page: Page, email: string, password: string) {
  await action(nav(page), 'Sign in').click();
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email);
  await expect(formField(page, 'Password')).toHaveAttribute('type', 'password');
  await formField(page, 'Password').fill(password);
  await signInSubmit(page).click();
  await expect(action(nav(page), 'My account')).toBeVisible();
}
export async function login(page: Page, accountName: string) {
  await loginEmail(page, `prestashop_${accountName}@example.com`, 'ShopPass123!');
}
export async function account(page: Page) {
  await action(nav(page), 'My account').click();
  await expect(region(page, 'Account overview')).toBeVisible();
}
export async function fillAddress(page: Page, alias: string) {
  const values: Record<string, string> = { Alias: alias, 'First name': 'Store', 'Last name': 'User', Address: '1 Commerce Road', 'Postal code': '200000', City: 'Shanghai', Phone: '13800000020' };
  for (const [name, value] of Object.entries(values)) {
    const field = formField(page, name);
    await expect(field).toBeVisible(); await field.fill(value); await expect(field).toHaveValue(value);
  }
  const country = page.getByRole('combobox', { name: 'Country', exact: true });
  await selectChoice(country, { label: 'China' });
  // Native selected-option semantics, independent of implementation-specific option values.
  await expectSelectedChoice(country, 'China');
}
export async function createAddress(page: Page, alias: string) {
  await account(page);
  await action(region(page, 'Account overview'), 'Addresses').click();
  await action(page, 'Create new address').click();
  await fillAddress(page, alias); await action(page, 'Save').click();
  await expect(page.getByRole('article', { name: alias, exact: true })).toBeVisible();
}
export async function addressesStep(page: Page) {
  const addresses = region(page, 'Addresses');
  const homeChoice = addresses.getByRole('radio', { name: 'Home', exact: true });
  const add = action(addresses, 'Add new address');
  if (!(await homeChoice.isVisible()) && !(await add.isVisible())) {
    await action(region(page, 'Personal Information'), 'Continue').click();
  }
  await expect(addresses).toBeVisible();
}
export async function checkoutSetup(page: Page, accountName: string, product: string) {
  await login(page, accountName);
  await createAddress(page, 'Home');
  await cartSetup(page, product);
  await action(page, 'Proceed to checkout').click();
  await addressesStep(page);
}
export async function shippingStep(page: Page) {
  const addresses = region(page, 'Addresses');
  await addresses.getByRole('radio', { name: 'Home', exact: true }).check();
  await action(addresses, 'Continue').click();
  await expect(region(page, 'Shipping Method')).toBeVisible();
}
export async function paymentStep(page: Page) {
  await shippingStep(page);
  const shipping = region(page, 'Shipping Method');
  await shipping.getByRole('radio', { name: 'Delivery', exact: true }).check();
  await action(shipping, 'Continue').click();
  await expect(region(page, 'Payment')).toBeVisible();
}
export async function placeOrder(page: Page) {
  const payment = region(page, 'Payment');
  await payment.getByRole('radio', { name: 'Bank wire', exact: true }).check();
  await payment.getByRole('checkbox', { name: 'Terms and conditions', exact: true }).check();
  await action(payment, 'Place order').click();
}
export async function confirmDeletion(page: Page, control: Locator) {
  const accept = (dialog: import('@playwright/test').Dialog) => dialog.accept();
  page.on('dialog', accept);
  try { await control.click(); } finally { page.off('dialog', accept); }
}
export async function history(page: Page) {
  await login(page, 'order_history_user'); await account(page);
  await action(region(page, 'Account overview'), 'Order history and details').click();
  await expect(historyRow(page)).toBeVisible();
}
export function historyRow(page: Page) { return region(page, 'Order history').getByRole('row', { name: 'PS-HISTORY-001', exact: true }); }
export function wishlist(page: Page, name: string) { return page.getByRole('listitem', { name, exact: true }); }
export function wishlistProduct(page: Page) { return page.getByRole('listitem', { name: WISH_PRODUCT, exact: true }); }
export async function wishlistPage(page: Page, accountName: string) {
  await login(page, accountName); await account(page); await action(region(page, 'Account overview'), 'Wishlist').click();
  await expect(action(page, 'Create new wishlist')).toBeVisible();
}
export async function createWishlist(page: Page, name: string) {
  await action(page, 'Create new wishlist').click();
  const dialog = page.getByRole('dialog', { name: 'Create new wishlist', exact: true });
  await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill(name); await action(dialog, 'Save').click();
  await expect(wishlist(page, name)).toBeVisible();
}
