import { cappedEntry } from './support/list-cap';
// requirement: REQ-7.1
import { test, expect } from '@playwright/test';
import { identity, enter, region, entry, home, login, heading, createShelf, openShelf, expectAbsentEntry,
  newContextFor, records, REVIEWER_ACCOUNT } from './helpers';

test("REQ-7.1: Record shelf visit", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  const shelf = await createShelf(page, id, 'Shelf 7.1');
  await openShelf(page, shelf);
  await home(page);
  const collection = region(page, 'My Recently Viewed');
  await expect(entry(collection, shelf)).toHaveCount(1);
  const names = [shelf];
  for (let i = 0; i < 10; i++) {
    const next = await createShelf(page, id, `Cap shelf ${i}`);
    names.push(next);
    await openShelf(page, next);
  }
  await home(page);
  const selected = await cappedEntry(collection, names, 10);
  await selected.target.click();
  await heading(page, selected.name);
});

test("REQ-7.1: Reopen visited shelf", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  const shelf = await createShelf(page, id, 'Shelf 7.2');
  await openShelf(page, shelf);
  await home(page);
  const collection = region(page, 'My Recently Viewed');
  await expect(entry(collection, shelf)).toHaveCount(1);
  await cappedEntry(collection, [shelf], 10);
  await entry(collection, shelf).click();
  await heading(page, shelf);
});

test("REQ-7.1: Deduplicate and isolate recent views", async ({ page, browser }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const baseURL = new URL(page.url()).origin;
  await login(page);
  const shelfA = await createShelf(page, id, 'Shelf 7.3-A');
  await openShelf(page, shelfA);
  await openShelf(page, shelfA);
  await home(page);
  await expect(entry(region(page, 'My Recently Viewed'), shelfA)).toHaveCount(1);
  expect(await records(region(page, 'My Recently Viewed')).count()).toBeLessThanOrEqual(10);
  const reviewer = await newContextFor(browser, baseURL, REVIEWER_ACCOUNT);
  const reviewerPage = reviewer.page;
  const shelfB = await createShelf(reviewerPage, id, 'Shelf 7.3-B');
  await openShelf(reviewerPage, shelfB);
  await home(reviewerPage);
  await expect(entry(region(reviewerPage, 'My Recently Viewed'), shelfB)).toHaveCount(1);
  expect(await records(region(reviewerPage, 'My Recently Viewed')).count()).toBeLessThanOrEqual(10);
  await expectAbsentEntry(region(reviewerPage, 'My Recently Viewed'), shelfA);
  await page.reload();
  await expect(entry(region(page, 'My Recently Viewed'), shelfA)).toHaveCount(1);
  await expectAbsentEntry(region(page, 'My Recently Viewed'), shelfB);
  await reviewer.context.close();
});
