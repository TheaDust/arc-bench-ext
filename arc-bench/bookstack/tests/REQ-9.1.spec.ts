import { cappedEntry } from './support/list-cap';
// requirement: REQ-9.1
import { test, expect } from '@playwright/test';
import { identity, named, enter, region, entry, home, heading, text, button, createBook, createPage, openBook,
  expectAbsentEntry, records } from './helpers';

test("REQ-9.1: Open recently published page", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 9.1');
  const name = await createPage(page, id, book, 'Page Updated 9.1', 'Page content created by corresponding prerequisite behavior.');
  await home(page);
  const collection = region(page, 'Recently Updated Pages');
  await entry(region(page, 'Recently Updated Pages'), name).click();
  await heading(page, name);
  await text(page, 'Page content created by corresponding prerequisite behavior.');
  const names = [name];
  for (let i = 0; i < 5; i++) names.push(await createPage(page, id, book, `Cap updated page ${i}`, 'Cap page body'));
  await home(page);
  const selected = await cappedEntry(collection, names, 5);
  await selected.target.click();
  await heading(page, selected.name);
  await text(page, selected.name === name ? 'Page content created by corresponding prerequisite behavior.' : 'Cap page body');
});

test("REQ-9.1: Edit updates recently updated page", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 9.1.2');
  const original = await createPage(page, id, book, 'Page 9.1.2', 'Reading content for Page 9.1.2.');
  await openBook(page, book);
  await button(region(page, 'Page list'), original).click();
  await button(page, 'Edit').click();
  const updated = named(id, 'Page Updated 9.1.2');
  await page.getByRole('textbox', { name: 'Page title', exact: true }).fill(updated);
  await page.getByRole('textbox', { name: 'Write your page content here...', exact: true }).fill('Updated content for Page 9.1.2.');
  await button(page, 'Save Page').click();
  await home(page);
  const recent = region(page, 'Recently Updated Pages');
  await expect(entry(recent, updated)).toHaveCount(1);
  expect(await records(recent).count()).toBeLessThanOrEqual(5);
  await expectAbsentEntry(recent, original);
  await entry(recent, updated).click();
  await heading(page, updated);
  await text(page, 'Updated content for Page 9.1.2.');
  await page.reload();
  await home(page);
  await expect(entry(region(page, 'Recently Updated Pages'), updated)).toHaveCount(1);
});
