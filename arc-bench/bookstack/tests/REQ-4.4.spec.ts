// requirement: REQ-4.4
import { test, expect } from '@playwright/test';
import { expectAbsentEntry, identity, enter, region, entry, button, heading, text, go, createShelf, createShelfBook, openShelf, openBook } from './helpers';

test("REQ-4.4: Confirm deletion", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const name = await createShelf(page, id, 'Shelf 4.4.1', 'Reference shelf description.');
  await openShelf(page, name);
  await button(page, 'Delete').click();
  await expect(button(page, 'Cancel')).toBeVisible();
  await expect(button(page, 'Confirm Delete')).toBeVisible();
  await button(page, 'Confirm Delete').click();
  await expect(region(page, 'Shelf list')).toBeVisible();
  await expect(entry(region(page, 'Shelf list'), name)).toHaveCount(0);
  await page.reload();
  await go(page, 'Shelves');
  await expectAbsentEntry(region(page, 'Shelf list'), name);
});

test("REQ-4.4: Cancel deletion", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const name = await createShelf(page, id, 'Shelf 4.4.2', 'Reference shelf description.');
  await openShelf(page, name);
  await button(page, 'Delete').click();
  await button(page, 'Cancel').click();
  await heading(page, name);
  await text(page, 'Reference shelf description.');
});

test("REQ-4.4: Retain books after shelf deletion", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const shelf = await createShelf(page, id, 'Shelf 4.4.3', 'Reference shelf description.');
  const book = await createShelfBook(page, id, shelf, 'Book 4.4.3');
  await openShelf(page, shelf);
  await button(page, 'Delete').click();
  await button(page, 'Confirm Delete').click();
  await expectAbsentEntry(region(page, 'Shelf list'), shelf);
  await openBook(page, book);
  await heading(page, book);
  await text(page, 'Book created by corresponding prerequisite behavior.');
  await expect(entry(page, shelf)).toHaveCount(0);
  await page.reload();
  await heading(page, book);
  await text(page, 'Book created by corresponding prerequisite behavior.');
  await go(page, 'Books');
  await expect(entry(region(page, 'Book list'), book)).toHaveCount(1);
});
