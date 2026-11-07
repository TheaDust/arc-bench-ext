import { cappedEntry } from './support/list-cap';
// requirement: REQ-7.1
import { test, expect } from '@playwright/test';
import { identity, enter, region, entry, home, login, heading, createShelf, openShelf } from './helpers';

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
