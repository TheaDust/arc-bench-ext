// requirement: REQ-5.3.3
import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { entry, button, row, region, orders, orderSetup } from './helpers';
test("REQ-5.3.3: Resume payment by order identity", async ({ page }) => {
    await entry(page);
    await orderSetup(page, 'orders_unpaid_user');
    await orders(page, 'Uncompleted orders');
    await button(row(page, 'G1001'), 'Pay').click();
    const details = region(page, 'Order details');
    for (const value of ['G1001', 'Passenger Example', 'P20269801', 'Business-class seat'])
        await expect(details).toContainText(value);
    await expect(region(page, 'Payment information')).toBeVisible();
});
