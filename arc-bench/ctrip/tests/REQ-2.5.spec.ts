import { expectSelectedChoice, selectChoice } from './support/public-controls';
// requirement: REQ-2.5
import { test, expect } from "@playwright/test";
import { field, checkbox, heading, textVisible, openHome, installClock, searchFlights } from "./helpers";

test.beforeEach(async ({ page }) => { await installClock(page); });

test('REQ-2.5: Search with children included', async ({ page }, testInfo) => {
  await openHome(page);
  await checkbox(page, 'Traveling with children').check();
  await searchFlights(page);
  await heading(page, 'Flight results');
  await textVisible(page, 'Children included');
});

test('REQ-2.5: Choose Economy preference', async ({ page }, testInfo) => {
  await openHome(page);
  await selectChoice(field(page, 'Cabin class'), { label: 'Economy' });
  await searchFlights(page);
  await expectSelectedChoice(field(page, 'Cabin class'), 'Economy');
});

