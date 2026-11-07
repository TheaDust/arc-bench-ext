// requirement: REQ-9.3.1
import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { entry, link, region, expectGuideQuestion } from './helpers';
test("REQ-9.3.1: Open quick question How to book tickets online?", async ({ page }) => {
    await entry(page);
    const q = region(page, 'Quick Guide');
    for (const name of ['How to book tickets online?', 'How to change or refund tickets?', 'How to check train status?', 'How to use 12306 mobile app?'])
        await expect(link(q, name)).toBeVisible();
    await link(q, "How to book tickets online?").click();
    await expectGuideQuestion(page, 'How to book tickets online?', 'Ticketing');
});
test("REQ-9.3.1: Open quick question How to change or refund tickets?", async ({ page }) => {
    await entry(page);
    const q = region(page, 'Quick Guide');
    for (const name of ['How to book tickets online?', 'How to change or refund tickets?', 'How to check train status?', 'How to use 12306 mobile app?'])
        await expect(link(q, name)).toBeVisible();
    await link(q, "How to change or refund tickets?").click();
    await expectGuideQuestion(page, 'How to change or refund tickets?');
});
test("REQ-9.3.1: Open quick question How to check train status?", async ({ page }) => {
    await entry(page);
    const q = region(page, 'Quick Guide');
    for (const name of ['How to book tickets online?', 'How to change or refund tickets?', 'How to check train status?', 'How to use 12306 mobile app?'])
        await expect(link(q, name)).toBeVisible();
    await link(q, "How to check train status?").click();
    await expectGuideQuestion(page, 'How to check train status?');
});
test("REQ-9.3.1: Open quick question How to use 12306 mobile app?", async ({ page }) => {
    await entry(page);
    const q = region(page, 'Quick Guide');
    for (const name of ['How to book tickets online?', 'How to change or refund tickets?', 'How to check train status?', 'How to use 12306 mobile app?'])
        await expect(link(q, name)).toBeVisible();
    await link(q, "How to use 12306 mobile app?").click();
    await expectGuideQuestion(page, 'How to use 12306 mobile app?');
});
