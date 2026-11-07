import { expectSelectedChoice, selectChoice } from './support/public-controls';
// requirement: REQ-8.2.3.1
import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { entry, button, field, row, booking, checkHeaders } from './helpers';
test("REQ-8.2.3.1: Select and configure booking passenger", async ({ page }) => {
    await entry(page);
    await booking(page, 'bookable_user');
    await page.getByRole('checkbox', { name: 'Passenger Example', exact: true }).check();
    const table = page.getByRole('table', { name: 'Booking passengers', exact: true });
    await checkHeaders(table, ['Ticket class', 'Ticket type', 'Name', 'ID type', 'ID number', 'Nationality', 'Operation']);
    const r = row(table, 'P20269997');
    await expect(r).toHaveCount(1);
    await expect(r).toContainText('Passenger Example');
    await selectChoice(field(r, 'Ticket class'), { label: 'Business-class seat' });
    await selectChoice(field(r, 'Ticket type'), { label: 'Adult' });
    await expectSelectedChoice(field(r, 'Ticket class'), 'Business-class seat');
    await expectSelectedChoice(field(r, 'Ticket type'), 'Adult');
    await expect(button(r, 'Delete')).toBeVisible();
    await expect(button(page, 'Place order')).toBeVisible();
});
