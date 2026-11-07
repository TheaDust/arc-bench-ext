import { selectChoice } from './support/public-controls';
// requirement: REQ-3.6.2
import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { entry, field, region, search, expectTrainIds } from './helpers';
test("REQ-3.6.2: Filter departure station", async ({ page }) => {
    await entry(page);
    await search(page);
    await selectChoice(field(region(page, 'Filter'), 'From Station'), { label: 'Shanghai Hongqiao' });
    await expectTrainIds(page, ["G1001"]);
});
