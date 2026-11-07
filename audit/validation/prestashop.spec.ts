import { test, expect } from '@playwright/test';
import { action, amount, DETAIL, expectCartUnits, expectMoney, expectProductRange, expectProductTotal,
  expectPromotionDestination, expectScopedMoneyText, expectText, expectHeading, expectProductSet, listingPrices, openProduct, productIdentities, signInSubmit } from '../../arc-bench/prestashop/tests/helpers';

for (const navigation of ['<nav aria-label="Global navigation">', '<div role="navigation" aria-label="Global navigation">']) {
  test(`prestashop submit is scoped outside persistent ${navigation.startsWith('<nav') ? 'native' : 'ARIA'} navigation`, async ({ page }) => {
    const close = navigation.startsWith('<nav') ? '</nav>' : '</div>';
    await page.setContent(`${navigation}<button>Sign in</button>${close}<form><button type="button">Sign in</button></form>`);
    await expect(signInSubmit(page)).toHaveCount(1);
    await signInSubmit(page).click();
  });
}
test('prestashop submit rejects duplicates and navigation-only false success', async ({ page }) => {
  await page.setContent('<nav><button>Sign in</button></nav><form><button>Sign in</button><button>Sign in</button></form>');
  await expect(signInSubmit(page).click()).rejects.toThrow(/strict mode/);
  await page.setContent('<nav><button>Sign in</button></nav>');
  await expect(signInSubmit(page)).toHaveCount(0);
});
test('prestashop explicit action roles and exact identities remain required', async ({ page }) => {
  await page.setContent('<a href="#save">Save</a><button>Men</button><a href="#other">Cart settings</a><button>sAvE</button>');
  await expect(action(page, 'Save')).toHaveCount(1);
  await expect(action(page, 'Save')).toHaveRole('button');
  await expect(action(page, 'Men')).toHaveCount(0);
  await expect(action(page, 'Cart')).toHaveCount(0);
});
for (const name of ['Cart (3)', 'Cart 3', 'Cart']) {
  test(`prestashop cart accepts ${name} with exact unit count`, async ({ page }) => {
    const text = name === 'Cart' ? 'Cart <span>3</span>' : name;
    await page.setContent(`<nav aria-label="Global navigation"><a href="#cart" aria-label="${name}">${text}</a></nav>`);
    await expectCartUnits(page, 3);
  });
}
test('prestashop cart 10 cannot satisfy one unit and duplicate Cart remains strict', async ({ page }) => {
  await page.setContent('<nav aria-label="Global navigation"><a href="#cart">Cart (10)</a></nav>');
  await expect(expectCartUnits(page, 1)).rejects.toThrow();
  await page.setContent('<nav aria-label="Global navigation"><a href="#one">Cart (1)</a><a href="#two">Cart (1)</a></nav>');
  await expect(action(page, 'Cart').click()).rejects.toThrow(/strict mode/);
});
test('prestashop Cart count may be accessible-only, but visible and accessible counts must agree', async ({ page }) => {
  await page.setContent('<nav aria-label="Global navigation"><a href="#cart" aria-label="Cart (3)">Cart</a></nav>');
  await expectCartUnits(page, 3);
  await page.setContent('<nav aria-label="Global navigation"><a href="#cart" aria-label="Cart (10)">Cart (1)</a></nav>');
  await expect(expectCartUnits(page, 1)).rejects.toThrow();
});
for (const markup of [
  '<section aria-label="Total">USD 31.00</section>',
  '<div role="group" aria-label="Total">31 USD</div>',
  '<output aria-label="Total">$31</output>',
  '<dl><dt>Total</dt><dd>31.00</dd></dl>',
]) {
  test(`prestashop observes named monetary association ${markup.slice(0, 25)}`, async ({ page }) => {
    await page.setContent(`<main>${markup}</main>`);
    await expectMoney(amount(page.getByRole('main'), 'Total'), 31);
  });
}
test('prestashop amount never borrows a neighboring record or an unrelated field', async ({ page }) => {
  await page.setContent('<article aria-label="Target"><dl><dt>Shipping</dt><dd>31</dd></dl></article><article aria-label="Other"><dl><dt>Total</dt><dd>31</dd></dl></article>');
  await expect(amount(page.getByRole('article', { name: 'Target' }), 'Total')).toHaveCount(0);
});
test('prestashop amount rejects wrong numeric value', async ({ page }) => {
  await page.setContent('<dl><dt>Total</dt><dd>310</dd></dl>');
  await expect(expectMoney(amount(page, 'Total'), 31)).rejects.toThrow();
});
test('prestashop amount rejects duplicate semantic containers', async ({ page }) => {
  await page.setContent('<section aria-label="Total">31</section><div role="group" aria-label="Total">31</div>');
  await expect(expectMoney(amount(page, 'Total'), 31)).rejects.toThrow();
});
test('prestashop amount rejects multiple definitions for one term', async ({ page }) => {
  await page.setContent('<dl><dt>Total</dt><dd>31</dd><dd>32</dd><dt>Shipping</dt><dd>5</dd></dl>');
  await expect(amount(page, 'Total')).toHaveCount(2);
  await expect(expectMoney(amount(page, 'Total'), 31)).rejects.toThrow();
});
test('prestashop definitions do not borrow following different term values', async ({ page }) => {
  await page.setContent('<dl><dt>Total</dt><dd>31</dd><dt>Shipping</dt><dd>5</dd></dl>');
  await expectMoney(amount(page, 'Total'), 31);
  await expectMoney(amount(page, 'Shipping'), 5);
});
test('prestashop definitions ignore hidden historical values but require a correct visible current value', async ({ page }) => {
  await page.setContent('<dl hidden><dt>Total</dt><dd>32</dd></dl><dl><dt>Total</dt><dd>31</dd><dd hidden>32</dd></dl>');
  await expectMoney(amount(page, 'Total'), 31);
  await page.setContent('<dl hidden><dt>Total</dt><dd>31</dd></dl><dl><dt>Total</dt><dd>32</dd></dl>');
  await expect(expectMoney(amount(page, 'Total'), 31)).rejects.toThrow();
});
test('prestashop listing prices follow every visible product in its rendered order', async ({ page }) => {
  await page.setContent('<section aria-label="Product list"><section aria-label="Product A"><dl><dt>Sale price</dt><dd>24</dd></dl></section><section aria-label="Product B"><div role="group" aria-label="Sale price">30</div></section><section hidden aria-label="Product C"><section aria-label="Sale price">1</section></section></section>');
  expect(await listingPrices(page)).toEqual([24, 30]);
});
test('prestashop listing cannot omit an unpriced product or borrow another card price', async ({ page }) => {
  await page.setContent('<section aria-label="Product list"><section aria-label="Product A"><section aria-label="Sale price">24</section></section><section aria-label="Product B"><p>No current price</p></section></section>');
  await expect(listingPrices(page)).rejects.toThrow();
});
test('prestashop product membership is independent of incidental price text', async ({ page }) => {
  await page.setContent('<section aria-label="Product list"><section aria-label="Product A">Price 24</section><section aria-label="Product B">Price 30</section></section>');
  const identities = await productIdentities(page);
  await page.setContent('<section aria-label="Product list"><section aria-label="Product B">Price 31</section><section aria-label="Product A">Price 25</section></section>');
  expect((await productIdentities(page)).sort()).toEqual(identities.sort());
});
test('prestashop product membership rejects duplicate visible identities', async ({ page }) => {
  await page.setContent('<section aria-label="Product list"><section aria-label="Product A">A</section><section aria-label="Product A">A</section></section>');
  await expect(productIdentities(page)).rejects.toThrow(/Duplicate visible product identity/);
});
test('prestashop filtering rejects wrong membership despite a plausible count', async ({ page }) => {
  await page.setContent('<div role="status" aria-label="Product count">Showing 1-2 of 2 items</div><section aria-label="Product list"><section aria-label="Product A">A</section><section aria-label="Product Wrong">Wrong</section></section>');
  await expect(expectProductSet(page, ['A', 'B'])).rejects.toThrow();
  await expectProductSet(page, ['Wrong', 'A']);
});
test('prestashop promotion accepts category with both category and card headings', async ({ page }) => {
  await page.setContent(`<h1>Men</h1><section aria-label="Product list"><section aria-label="Product ${DETAIL}"><h2>${DETAIL}</h2></section></section>`);
  await expectPromotionDestination(page);
});
test('prestashop promotion accepts real detail destination', async ({ page }) => {
  await page.setContent(`<h1>${DETAIL}</h1><section aria-label="Product information">${DETAIL}</section>`);
  await expectPromotionDestination(page);
});
test('prestashop promotion rejects homepage-card-only and wrong product category', async ({ page }) => {
  await page.setContent(`<h1>Popular Products</h1><section aria-label="Popular Products"><h2>${DETAIL}</h2></section>`);
  await expect(expectPromotionDestination(page)).rejects.toThrow();
  await page.setContent('<h1>Men</h1><section aria-label="Product list"><section aria-label="Product Other">Other</section></section>');
  await expect(expectPromotionDestination(page)).rejects.toThrow();
  await page.setContent(`<h1>${DETAIL}</h1><section aria-label="Product information">Other product</section>`);
  await expect(expectPromotionDestination(page)).rejects.toThrow();
});
test('prestashop preview accepts scoped unlabelled price and rejects neighboring price', async ({ page }) => {
  await page.setContent('<div role="dialog" aria-label="Preview"><h2>Product</h2><p>$24.00</p></div><p>$99</p>');
  await expectScopedMoneyText(page.getByRole('dialog'), 24);
  await page.setContent('<div role="dialog" aria-label="Preview"><h2>Product</h2><p>$99</p></div><p>$24.00</p>');
  await expect(expectScopedMoneyText(page.getByRole('dialog'), 24)).rejects.toThrow();
});
test('prestashop ordinary presence accepts duplicate visible text, not hidden-only text', async ({ page }) => {
  await page.setContent('<p>Sale</p><p>Sale</p>');
  await expectText(page, 'Sale');
  await page.setContent('<p hidden>Sale</p><p>Full price</p>');
  await expect(expectText(page, 'Sale')).rejects.toThrow();
});
test('prestashop heading presence accepts repeated headings but preserves the required role', async ({ page }) => {
  await page.setContent('<h1>Men</h1><h2>Men</h2>');
  await expectHeading(page, 'Men');
  await page.setContent('<div>Men</div>');
  await expect(expectHeading(page, 'Men')).rejects.toThrow();
});
test('prestashop opening a product cannot be satisfied by its existing card heading', async ({ page }) => {
  await page.setContent(`<nav aria-label="Global navigation"><a href="#category">CLOTHES</a><a href="#men">Men</a></nav><h1>Men</h1><section aria-label="Product list"><section aria-label="Product ${DETAIL}"><h2>${DETAIL}</h2><a href="#product">${DETAIL}</a></section></section>`);
  await expect(openProduct(page, DETAIL)).rejects.toThrow();
});
test('prestashop count grammar accepts normal plural while preserving exact numeric ranges', async ({ page }) => {
  await page.setContent('<div role="status" aria-label="Product count">Showing 1-12 of 13 items</div>');
  await expectProductRange(page, 1, 12, 13);
  await page.setContent('<div role="status" aria-label="Product count">Showing 1–12 of 13 item(s)</div>');
  await expectProductRange(page, 1, 12, 13);
  await expect(expectProductTotal(page, 3)).rejects.toThrow();
  await expect(expectProductRange(page, 13, 13, 13)).rejects.toThrow();
});
test('prestashop cotton matching survives adjacent DOM text concatenation', async ({ page }) => {
  await page.setContent('<section role="tabpanel" aria-label="Product Details"><dt>Composition</dt><dd>Cotton</dd><dt>Features</dt></section>');
  await expect(page.getByRole('tabpanel')).toContainText(/cotton/i);
  await page.setContent('<section role="tabpanel" aria-label="Product Details">Composition Polyester Features</section>');
  await expect(page.getByRole('tabpanel')).not.toContainText(/cotton/i);
});
