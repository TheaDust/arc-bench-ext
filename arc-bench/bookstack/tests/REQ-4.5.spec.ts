// requirement: REQ-4.5
import { test, expect } from '@playwright/test';
import { go, region, entry, expectMetadata, identity, named, enter, button, heading, text, metadata, createShelf, createShelfBook,
  openShelf, openBook, expectAbsentEntry, expectMembership, setMembership } from './helpers';

test("REQ-4.5: Save metadata changes", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const original = await createShelf(page, id, 'Shelf 4.5.1', 'Reference shelf description.', 'knowledge-base, docs');
  await openShelf(page, original);
  await button(page, 'Edit').click();
  await expectMetadata(page, original, 'Reference shelf description.', 'knowledge-base, docs');
  const updated = named(id, 'Shelf Updated 4.5.1');
  await metadata(page, updated, 'Shelf updated by corresponding prerequisite behavior.', 'knowledge-base, docs');
  await button(page, 'Save Shelf').click();
  await heading(page, updated);
  await text(page, 'Shelf updated by corresponding prerequisite behavior.');
  await page.reload();
  await heading(page, updated);
  await text(page, 'Shelf updated by corresponding prerequisite behavior.');
  await button(page, 'Edit').click();
  await expectMetadata(page, updated, 'Shelf updated by corresponding prerequisite behavior.', 'knowledge-base, docs');
  await go(page, 'Shelves');
  await expect(entry(region(page, 'Shelf list'), original)).toHaveCount(0);
  await expect(entry(region(page, 'Shelf list'), updated)).toHaveCount(1);
});

test("REQ-4.5: Cancel metadata changes", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const original = await createShelf(page, id, 'Shelf 4.5.2', 'Reference shelf description.', 'knowledge-base, docs');
  await openShelf(page, original);
  await button(page, 'Edit').click();
  await expectMetadata(page, original, 'Reference shelf description.', 'knowledge-base, docs');
  const updated = named(id, 'Shelf Updated 4.5.2');
  await metadata(page, updated, 'Shelf updated by corresponding prerequisite behavior.', 'knowledge-base, docs');
  await button(page, 'Cancel').click();
  await heading(page, original);
  await text(page, 'Reference shelf description.');
  await expect(page.getByRole('heading', { name: updated, exact: true })).toHaveCount(0);
  await page.reload();
  await button(page, 'Edit').click();
  await expectMetadata(page, original, 'Reference shelf description.', 'knowledge-base, docs');
});

test("REQ-4.5: Edit related books", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const shelfA = await createShelf(page, id, 'Shelf 4.5.3-T', 'Reference shelf description.');
  const bookA = await createShelfBook(page, id, shelfA, 'Book 4.5.3-A');
  const shelfB = await createShelf(page, id, 'Shelf 4.5.3-S', 'Reference shelf description.');
  const bookB = await createShelfBook(page, id, shelfB, 'Book 4.5.3-B');
  await openShelf(page, shelfB);
  await button(page, 'Edit').click();
  await expectMembership(page, bookB, true);
  await expectMembership(page, bookA, false);
  await setMembership(page, bookA, true);
  await setMembership(page, bookB, false);
  await button(page, 'Save Shelf').click();
  await heading(page, shelfB);
  await expect(entry(region(page, 'Book list'), bookA)).toHaveCount(1);
  await expectAbsentEntry(region(page, 'Book list'), bookB);
  await openBook(page, bookB);
  await heading(page, bookB);
  await text(page, 'Book created by corresponding prerequisite behavior.');
  await expect(entry(page, shelfB)).toHaveCount(0);
  await openBook(page, bookA);
  await heading(page, bookA);
  await expect(entry(page, shelfA)).toHaveCount(1);
  await openShelf(page, shelfA);
  await expect(entry(region(page, 'Book list'), bookA)).toHaveCount(1);
  await openShelf(page, shelfB);
  await button(page, 'Edit').click();
  await expectMembership(page, bookA, true);
  await expectMembership(page, bookB, false);
});
