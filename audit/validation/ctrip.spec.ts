import { test, expect } from '@playwright/test';
import { accountEntry, action, field, expectFeeAbsent, expectEmptyRecords } from '../../arc-bench/ctrip/tests/helpers';

for (const [variant, markup] of [
  ['button', '<button>Orders</button>'],
  ['link', '<a href="#orders">Orders</a>'],
  ['menuitem', '<div role="menuitem" tabindex="0">Orders</div>'],
] as const) {
  test(`ctrip account entry accepts ${variant} without imposing ARIA menu`, async ({ page }) => {
    await page.setContent(`<main>${markup}</main>`);
    await accountEntry(page, 'Orders').click();
  });
}

test('ctrip account entry preserves exact identity and uniqueness', async ({ page }) => {
  await page.setContent('<button>Orders history</button><div>Orders</div>');
  await expect(accountEntry(page, 'Orders')).toHaveCount(0);
  await page.setContent('<button>Orders</button><a href="#orders">Orders</a>');
  await expect(accountEntry(page, 'Orders')).toHaveCount(2);
  await expect(accountEntry(page, 'Orders').click()).rejects.toThrow(/strict mode violation/);
});

test('ctrip explicit action roles remain required', async ({ page }) => {
  await page.setContent('<a href="#account">My account</a><button>Verification code login</button>');
  await expect(action(page, 'My account')).toHaveCount(0);
  await expect(action(page, 'Verification code login')).toHaveCount(0);
  await page.setContent('<button>My account</button><a href="#sms">Verification code login</a>');
  await expect(action(page, 'My account')).toBeVisible();
  await expect(action(page, 'Verification code login')).toBeVisible();
});

test('ctrip password controls accept native masking and reject plaintext', async ({ page }) => {
  await page.setContent('<label>Password<input type="password"></label>');
  await field(page, 'Password').fill('Secret123');
  await expect(field(page, 'Password')).toHaveValue('Secret123');
  await page.setContent('<label>Password<input type="text"></label>');
  await expect(field(page, 'Password')).toHaveCount(0);
});

test('ctrip removed fee accepts a visible empty summary with an unrelated neighboring fee', async ({ page }) => {
  await page.setContent('<section aria-label="Fee details"><p>Fare: ¥460</p></section><aside>Extra 10 kg: ¥60</aside>');
  await expectFeeAbsent(page, 'Extra 10 kg: ¥60');
});

test('ctrip removed fee accepts hidden historical markup', async ({ page }) => {
  await page.setContent('<section aria-label="Fee details"><p hidden>Extra 10 kg: ¥60</p><p>Fare: ¥460</p></section>');
  await expectFeeAbsent(page, 'Extra 10 kg: ¥60');
});

test('ctrip removed fee rejects a missing summary', async ({ page }) => {
  await page.setContent('<main>Fare: ¥460</main>');
  await expect(expectFeeAbsent(page, 'Extra 10 kg: ¥60')).rejects.toThrow();
});

test('ctrip removed fee rejects a visible stale fee', async ({ page }) => {
  await page.setContent('<section aria-label="Fee details"><p>Extra 10 kg: ¥60</p></section>');
  await expect(expectFeeAbsent(page, 'Extra 10 kg: ¥60')).rejects.toThrow();
});

test('ctrip date fare belongs to the selected public date', async ({ page }) => {
  await page.setContent('<button aria-label="2026-07-21">July 21 ¥460</button><button aria-label="2026-07-22">July 22 ¥320</button>');
  await expect(page.getByRole('button', { name: '2026-07-21', exact: true })).toContainText('¥460');
  await page.setContent('<button aria-label="2026-07-21">July 21 ¥320</button><p>¥460</p>');
  await expect(page.getByRole('button', { name: '2026-07-21', exact: true })).not.toContainText('¥460');
});

test('ctrip issuance rules require a day window rather than an unrelated number', async ({ page }) => {
  await page.setContent('<section aria-label="Issuance rules">Available within 365 days of payment</section>');
  await expect(page.getByRole('region', { name: 'Issuance rules', exact: true })).toContainText(/\b365[\s-]*days?\b/i);
  await page.setContent('<section aria-label="Issuance rules">Support reference 365; availability 30 hours</section>');
  await expect(page.getByRole('region', { name: 'Issuance rules', exact: true })).not.toContainText(/\b365[\s-]*days?\b/i);
});

for (const name of ['Order list', 'Contact list', 'Invoice title list']) {
  test(`ctrip empty ${name} may have zero visual area`, async ({ page }) => {
    await page.setContent(`<section aria-label="${name}"></section>`);
    await expectEmptyRecords(page, name);
  });
}

test('ctrip empty collection rejects missing, hidden or populated regions', async ({ page }) => {
  for (const html of ['<main>No list</main>', '<section hidden aria-label="Order list"></section>', '<section aria-label="Order list"><div role="group" aria-label="Record x">x</div></section>']) {
    await page.setContent(html);
    await expect(expectEmptyRecords(page, 'Order list')).rejects.toThrow();
  }
});
