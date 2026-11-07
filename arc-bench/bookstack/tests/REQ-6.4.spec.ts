// requirement: REQ-6.4
import { test, expect } from '@playwright/test';
import { expectFieldValue, identity, enter, region, entry, button, heading, text, createBook, createPage } from './helpers';

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
