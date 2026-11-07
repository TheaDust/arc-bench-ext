import { test, expect } from '@playwright/test';
import * as travel from '../arc-bench/ctrip/tests/helpers';
import * as questions from '../arc-bench/stackoverflow/tests/helpers';
import * as store from '../arc-bench/prestashop/tests/helpers';
import * as git from '../arc-bench/github/tests/support/e2e';
import { formulaBar } from '../arc-bench/sheet/tests/support/e2e';

for (const name of ['Email', 'Body', 'Comment']) {
  test(`StackOverflow ${name} keeps its name with a hidden required marker`, async ({ page }) => {
    await page.setContent(`<label for="field">${name}<span aria-hidden="true"> *</span></label><textarea id="field"></textarea>`);
    await questions.field(page, name).fill('contract value');
    await expect(questions.field(page, name)).toHaveValue('contract value');
  });
}

test('StackOverflow rejects a wrong field role', async ({ page }) => {
  await page.setContent('<button aria-label="Email">Email</button>');
  await expect(questions.field(page, 'Email')).toHaveCount(0);
});

test('StackOverflow keeps duplicate controls ambiguous', async ({ page }) => {
  await page.setContent('<input aria-label="Email"><input aria-label="Email">');
  await expect(questions.field(page, 'Email').fill('value')).rejects.toThrow(/strict mode/);
});

for (const name of ['Account', 'Departure date', 'Taxpayer ID']) {
  test(`Ctrip ${name} uses textbox naming`, async ({ page }) => {
    await page.setContent(`<label for="field">${name}<span aria-hidden="true"> *</span></label><input id="field">`);
    await travel.field(page, name).fill('value');
    await expect(travel.field(page, name)).toHaveValue('value');
  });
}

for (const name of ['Cabin class', 'Airline', 'Type', 'Gender']) {
  test(`Ctrip ${name} retains combobox semantics`, async ({ page }) => {
    await page.setContent(`<label for="choice">${name}<span aria-hidden="true"> *</span></label><select id="choice"><option>First</option><option>Second</option></select>`);
    await travel.field(page, name).selectOption({ label: 'Second' });
    await expect(travel.field(page, name)).toHaveValue('Second');
  });
}

test('Ctrip cannot substitute a textbox for a declared combobox', async ({ page }) => {
  await page.setContent('<input aria-label="Cabin class">');
  await expect(travel.field(page, 'Cabin class')).toHaveCount(0);
});

test('PrestaShop login helper handles decorated field labels', async ({ page }) => {
  await page.setContent(`
    <nav aria-label="Global navigation">
      <button onclick="this.hidden=true">Sign in</button><a href="#account">My account</a>
    </nav>
    <label for="email">Email<span aria-hidden="true"> *</span></label><input id="email" type="email">
    <label for="password">Password<span aria-hidden="true"> *</span></label><input id="password" type="password" role="textbox">
    <button>Sign in</button>`);
  await store.loginEmail(page, 'customer@example.test', 'ShopPass123!');
  await expect(page.locator('#email')).toHaveValue('customer@example.test');
  await expect(page.locator('#password')).toHaveValue('ShopPass123!');
});

test('PrestaShop address helper preserves every field and country selection', async ({ page }) => {
  const names = ['Alias', 'First name', 'Last name', 'Address', 'Postal code', 'City', 'Phone'];
  await page.setContent(names.map((name, i) => `<label for="f${i}">${name}<span aria-hidden="true"> *</span></label><input id="f${i}">`).join('')
    + '<label for="country">Country<span aria-hidden="true"> *</span></label><select id="country"><option>China</option><option>Other</option></select>');
  await store.fillAddress(page, 'Office');
  await expect(page.getByRole('textbox', { name: 'Alias', exact: true })).toHaveValue('Office');
});

test('Sheet formula bar accepts an associated label with a hidden marker', async ({ page }) => {
  await page.setContent('<label for="formula">Formula bar<span aria-hidden="true"> *</span></label><input id="formula">');
  await formulaBar(page).fill('=A1*2');
  await expect(formulaBar(page)).toHaveValue('=A1*2');
});

test('GitHub native password control supports hidden required markers', async ({ page }) => {
  await page.setContent('<label for="pw">Password<span aria-hidden="true"> *</span></label><input id="pw" type="password">');
  const password = await git.passwordField(page, 'Password');
  await password.fill('Valid-password-123!');
  await expect(password).toHaveAttribute('type', 'password');
});

test('GitHub native password selector preserves exact names', async ({ page }) => {
  await page.setContent('<label for="pw">Password *</label><input id="pw" type="password">');
  await expect(git.passwordField(page, 'Password')).rejects.toThrow();
});

test('GitHub native password selector rejects unmasked inputs', async ({ page }) => {
  await page.setContent('<label for="pw">Password</label><input id="pw" type="text">');
  await expect(git.passwordField(page, 'Password')).rejects.toThrow();
});

test('GitHub native password selector rejects duplicates', async ({ page }) => {
  await page.setContent('<input aria-label="Password" type="password"><input aria-label="Password" type="password">');
  await expect(git.passwordField(page, 'Password')).rejects.toThrow(/strict mode/);
});

test('GitHub navigation accepts a unique named control', async ({ page }) => {
  await page.setContent('<a href="#teams">Teams</a>');
  await git.clickVisibleTarget(page, 'Teams');
  await expect(page).toHaveURL(/#teams$/);
});

test('GitHub navigation rejects duplicate named controls', async ({ page }) => {
  await page.setContent('<a href="#first">Teams</a><a href="#second">Teams</a>');
  await expect(git.clickVisibleTarget(page, 'Teams')).rejects.toThrow();
  expect(page.url()).toBe('about:blank');
});

test('GitHub navigation does not replace an absent control with text or another page', async ({ page }) => {
  await page.setContent('<div onclick="location.hash=\'wrong\'">Teams</div>');
  await expect(git.clickVisibleTarget(page, 'Teams')).rejects.toThrow();
  expect(page.url()).toBe('about:blank');
});

test('GitHub object entries retain their declared link role', async ({ page }) => {
  await page.setContent('<button>acme-docs</button>');
  await expect(git.openVisibleTarget(page, 'acme-docs')).rejects.toThrow();
});

test('GitHub dialog is identified by role and exact name', async ({ page }) => {
  await page.setContent('<section role="dialog" aria-label="Sign out">Session confirmation</section>');
  await expect(await git.visibleDialog(page, 'Sign out')).toBeVisible();
});

test('GitHub dialog rejects a CSS container with matching text', async ({ page }) => {
  await page.setContent('<div class="dialog">Sign out</div>');
  await expect(git.visibleDialog(page, 'Sign out')).rejects.toThrow();
});

test('GitHub dialog rejects duplicate semantic identities', async ({ page }) => {
  await page.setContent('<section role="dialog" aria-label="Sign out"></section><section role="dialog" aria-label="Sign out"></section>');
  await expect(git.visibleDialog(page, 'Sign out')).rejects.toThrow();
});
