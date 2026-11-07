// requirement: REQ-6.4
import { test, expect } from '@playwright/test';
import { expectFieldValue, identity, named, enter, region, entry, button, heading, text, home, createBook, createPage,
  openBook, expectAbsentEntry } from './helpers';

test("REQ-6.4: Read selected page", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 6.3.1');
  const name = await createPage(page, id, book, 'Page 6.3.1', 'Reading content for Page 6.3.1.');
  await button(region(page, 'Page list'), name).click();
  await heading(page, name);
  await text(page, 'Reading content for Page 6.3.1.');
});

test("REQ-6.4: Reopen page editor", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 6.3.2');
  const name = await createPage(page, id, book, 'Page 6.3.2', 'Reading content for Page 6.3.2.');
  await button(region(page, 'Page list'), name).click();
  await button(page, 'Edit').click();
  await expectFieldValue(page.getByRole('textbox', { name: 'Page title', exact: true }), name);
  await expectFieldValue(page.getByRole('textbox', { name: 'Write your page content here...', exact: true }), 'Reading content for Page 6.3.2.');
  await expect(button(page, 'Save Page')).toBeVisible();
});

test("REQ-6.4: Save edited page", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 6.3.3');
  const original = await createPage(page, id, book, 'Page 6.3.3', 'Reading content for Page 6.3.3.');
  await openBook(page, book);
  await button(region(page, 'Page list'), original).click();
  await button(page, 'Edit').click();
  const updated = named(id, 'Page Updated 6.3.3');
  await page.getByRole('textbox', { name: 'Page title', exact: true }).fill(updated);
  await page.getByRole('textbox', { name: 'Write your page content here...', exact: true }).fill('Updated content for Page 6.3.3.');
  await button(page, 'Save Page').click();
  await heading(page, updated);
  await text(page, 'Updated content for Page 6.3.3.');
  await page.reload();
  await heading(page, updated);
  await text(page, 'Updated content for Page 6.3.3.');
  await openBook(page, book);
  await expect(entry(region(page, 'Page list'), updated)).toHaveCount(1);
  await expectAbsentEntry(region(page, 'Page list'), original);
  await home(page);
  await expect(entry(region(page, 'Recently Updated Pages'), updated)).toHaveCount(1);
  await expectAbsentEntry(region(page, 'Recently Updated Pages'), original);
});
