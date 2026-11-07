import { selectChoice } from './support/public-controls';
// requirement: REQ-3.6.4
import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { entry, field, region, row, search, expectTrainIds } from './helpers';
test("REQ-3.6.4: Filter morning departures", async ({ page }) => {
    await entry(page);
    await search(page);
    await selectChoice(field(region(page, 'Filter'), 'Departure time'), { label: '06:00-12:00' });
    await expectTrainIds(page, ["G1001"]);
    await expect(row(page, 'G1001')).toContainText('08:00');
});
