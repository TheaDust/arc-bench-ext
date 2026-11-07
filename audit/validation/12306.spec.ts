import { test, expect } from '@playwright/test';
import { text, button, row, trainIds, expectGuideQuestion, openAgreement, expectPaymentDetails } from '../../arc-bench/12306/tests/helpers';

test.use({ actionTimeout: 600 });

test('12306 presence accepts repeated visible feedback and plain feedback markup', async ({ page }) => {
    await page.setContent('<p>Refund successful.</p><p>Refund successful.</p>');
    await text(page, 'Refund successful', false);
});

test('12306 presence excludes hidden feedback and wrong message', async ({ page }) => {
    await page.setContent('<p hidden>Refund successful.</p><p>Refund rejected.</p>');
    await expect(text(page, 'Refund successful', false)).rejects.toThrow();
});

test('12306 presence relaxation leaves action ambiguity strict', async ({ page }) => {
    await page.setContent('<button>Search</button><button>Search</button>');
    await expect(button(page, 'Search').click()).rejects.toThrow();
});

test('12306 agreement action rejects duplicate link identities', async ({ page }) => {
    await page.setContent('<a href="#terms">Terms of Service</a><a href="#other">Terms of Service</a>');
    await expect(openAgreement(page, 'Terms of Service')).rejects.toThrow();
});

test('12306 agreement action follows its unique declared link', async ({ page }) => {
    await page.setContent('<a href="#terms">Terms of Service</a>');
    await openAgreement(page, 'Terms of Service');
    expect(new URL(page.url()).hash).toBe('#terms');
});

test('12306 result membership includes extra trains lacking Book', async ({ page }) => {
    await page.setContent('<table><tr><td>G1001</td><td><button>Book</button></td></tr><tr><td>K1003</td><td>Sold out</td></tr></table>');
    expect(await trainIds(page)).toEqual(['G1001', 'K1003']);
    expect(await trainIds(page)).not.toEqual(['G1001']);
});

test('12306 result membership tolerates repeated same train identity within one row', async ({ page }) => {
    await page.setContent('<table><tr><td><span>G1001</span></td><td><span>G1001</span><button>Book</button></td></tr></table>');
    expect(await trainIds(page)).toEqual(['G1001']);
});

test('12306 protected holder absence cannot satisfy identity presence', async ({ page }) => {
    await page.setContent('<table><tr><td>Other passenger</td></tr></table>');
    expect(await row(page, 'passenger_manager_user').count()).toBe(0);
    await expect(expect(row(page, 'passenger_manager_user')).toBeVisible({ timeout: 600 })).rejects.toThrow();
});

test('12306 guide accepts target in the unique selected named panel', async ({ page }) => {
    await page.setContent('<button role="tab" aria-selected="true">Ticketing</button><section role="tabpanel" aria-label="Ticketing"><h2>How to book tickets online?</h2><p>Use the booking form.</p></section>');
    await expectGuideQuestion(page, 'How to book tickets online?', 'Ticketing');
});

test('12306 guide rejects question placed only in a different visible panel', async ({ page }) => {
    await page.setContent('<button role="tab" aria-selected="true">Ticketing</button><section role="tabpanel" aria-label="Ticketing"><p>Other guidance.</p></section><section role="tabpanel" aria-label="Miscellaneous"><h2>How to book tickets online?</h2></section>');
    await expect(expectGuideQuestion(page, 'How to book tickets online?', 'Ticketing')).rejects.toThrow();
});

test('12306 guide rejects two selected categories', async ({ page }) => {
    await page.setContent('<button role="tab" aria-selected="true">Ticketing</button><button role="tab" aria-selected="true">Miscellaneous</button><section role="tabpanel" aria-label="Ticketing"><h2>How to book tickets online?</h2></section>');
    await expect(expectGuideQuestion(page, 'How to book tickets online?', 'Ticketing')).rejects.toThrow();
});

const paymentMarkup = (total: string, information = true) => `<section aria-label="Order details"><p>G1001 Passenger Example P20269993 Business-class seat</p><p>Total: ￥${total}</p></section>${information ? '<section aria-label="Payment information">Payment methods</section>' : ''}`;

test('12306 payment binds total to declared order details with payment information visible', async ({ page }) => {
    await page.setContent(paymentMarkup('1870.00'));
    await expectPaymentDetails(page);
});

test('12306 unrelated correct total cannot satisfy wrong order total', async ({ page }) => {
    await page.setContent(paymentMarkup('1.00') + '<aside>Total: ￥1870.00</aside>');
    await expect(expectPaymentDetails(page)).rejects.toThrow();
});

test('12306 payment cannot omit the declared payment information region', async ({ page }) => {
    await page.setContent(paymentMarkup('1870.00', false));
    await expect(expectPaymentDetails(page)).rejects.toThrow();
});
