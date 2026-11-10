// requirement: REQ-3.7
import { test } from "@playwright/test";
import { button, region, checkbox, textVisible, total, openHome, installClock, openBooking, expectFeeAbsent } from "./helpers";

test.beforeEach(async ({ page }) => { await installClock(page); });

test('REQ-3.7: Compose optional fee details', async ({ page }, testInfo) => {
  await openHome(page);
  await openBooking(page);
  await total(page, 530);
  await checkbox(region(page, 'Trip protection'), 'Combo insurance').check();
  await checkbox(region(page, 'Baggage allowance'), 'Extra 10 kg').check();
  await button(page, 'Fee details').click();
  await total(page, 630);
  await textVisible(region(page, 'Fee details'), 'Combo insurance: ¥40');
  await textVisible(region(page, 'Fee details'), 'Extra 10 kg: ¥60');
});

test('REQ-3.7: Remove only the deselected optional fee', async ({ page }, testInfo) => {
  await openHome(page);
  await openBooking(page);
  await checkbox(region(page, 'Trip protection'), 'Combo insurance').check();
  await checkbox(region(page, 'Baggage allowance'), 'Extra 10 kg').check();
  await total(page, 630);
  await checkbox(region(page, 'Trip protection'), 'Combo insurance').uncheck();
  await button(page, 'Fee details').click();
  await total(page, 590);
  await textVisible(region(page, 'Fee details'), 'Extra 10 kg: ¥60');
  await expectFeeAbsent(page, 'Combo insurance: ¥40');
});

