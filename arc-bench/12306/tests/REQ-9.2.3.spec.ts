// requirement: REQ-9.2.3
import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { entry, link, region, expectGuideQuestion } from './helpers';
test("REQ-9.2.3: Open dropdown question anchor", async ({ page }) => {
    await entry(page);
    await link(page.getByRole('navigation'), 'Travel guide').hover();
    await link(region(region(page, 'Travel guide categories'), 'Ticketing'), 'How to book tickets online?').click();
    await expectGuideQuestion(page, 'How to book tickets online?', 'Ticketing');
    await expect(page.getByRole('tabpanel', { name: 'Ticketing', exact: true })).toContainText(/\S+/);
});
