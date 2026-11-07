// requirement: REQ-5.4
import { test, expect } from '@playwright/test';
import { go, region, entry, expectMetadata, identity, named, enter, button, heading, text, metadata, createBook, createShelf,
  createShelfBook, createPage, favorite, home, login, openBook, openShelf, expectAbsentEntry } from './helpers';

test("REQ-5.4: Save metadata changes", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const original = await createBook(page, id, 'Book 5.4.1', 'Reference book description.', 'manual, handbook');
  await openBook(page, original);
  await button(page, 'Edit').click();
  await expectMetadata(page, original, 'Reference book description.', 'manual, handbook');
  const updated = named(id, 'Book Updated 5.4.1');
  await metadata(page, updated, 'Book updated by corresponding prerequisite behavior.', 'manual, handbook');
  await button(page, 'Save Book').click();
  await heading(page, updated);
  await text(page, 'Book updated by corresponding prerequisite behavior.');
  await page.reload();
  await heading(page, updated);
  await text(page, 'Book updated by corresponding prerequisite behavior.');
  await button(page, 'Edit').click();
  await expectMetadata(page, updated, 'Book updated by corresponding prerequisite behavior.', 'manual, handbook');
  await go(page, 'Books');
  await expect(entry(region(page, 'Book list'), original)).toHaveCount(0);
  await expect(entry(region(page, 'Book list'), updated)).toHaveCount(1);
});

test("REQ-5.4: Cancel metadata changes", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const original = await createBook(page, id, 'Book 5.4.2', 'Reference book description.', 'manual, handbook');
  await openBook(page, original);
  await button(page, 'Edit').click();
  await expectMetadata(page, original, 'Reference book description.', 'manual, handbook');
  const updated = named(id, 'Book Updated 5.4.2');
  await metadata(page, updated, 'Book updated by corresponding prerequisite behavior.', 'manual, handbook');
  await button(page, 'Cancel').click();
  await heading(page, original);
  await text(page, 'Reference book description.');
  await expect(page.getByRole('heading', { name: updated, exact: true })).toHaveCount(0);
  await page.reload();
  await button(page, 'Edit').click();
  await expectMetadata(page, original, 'Reference book description.', 'manual, handbook');
});

test("REQ-5.4: Propagate renamed book", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  const shelf = await createShelf(page, id, 'Shelf 5.4.3', 'Reference shelf description.');
  const original = await createShelfBook(page, id, shelf, 'Book 5.4.3');
  await createPage(page, id, original, 'Page 5.4.3', 'Page content 5.4.3.');
  await openBook(page, original);
  await favorite(page);
  await home(page);
  await expect(entry(region(page, 'My Most Viewed Favorites'), original)).toHaveCount(1);
  await expect(entry(region(page, 'My Recently Viewed'), original)).toHaveCount(1);
  await openBook(page, original);
  await button(page, 'Edit').click();
  const updated = named(id, 'Book Renamed 5.4.3');
  await metadata(page, updated, 'Reference book description.', 'manual, handbook');
  await button(page, 'Save Book').click();
  await heading(page, updated);
  await page.reload();
  await heading(page, updated);
  await go(page, 'Books');
  await expect(entry(region(page, 'Book list'), updated)).toHaveCount(1);
  await expectAbsentEntry(region(page, 'Book list'), original);
  await openShelf(page, shelf);
  await expect(entry(region(page, 'Book list'), updated)).toHaveCount(1);
  await expectAbsentEntry(region(page, 'Book list'), original);
  await home(page);
  await expect(entry(region(page, 'My Most Viewed Favorites'), updated)).toHaveCount(1);
  await expect(entry(region(page, 'My Recently Viewed'), updated)).toHaveCount(1);
  await expectAbsentEntry(region(page, 'My Most Viewed Favorites'), original);
  await expectAbsentEntry(region(page, 'My Recently Viewed'), original);
  await page.reload();
  await expect(entry(region(page, 'My Most Viewed Favorites'), updated)).toHaveCount(1);
});
