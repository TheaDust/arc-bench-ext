// requirement: REQ-6.3
import { test, expect } from '@playwright/test';
import { identity, named, enter, region, entry, button, heading, text, createBook } from './helpers';

test("REQ-6.3: Save and open a chapter", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 6.2.1');
  await button(page, 'New Chapter').click();
  const chapter = named(id, 'Chapter Created 6.2.1');
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(chapter);
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill('Chapter created by corresponding prerequisite behavior.');
  await button(page, 'Save Chapter').click();
  await expect(button(region(page, 'Chapter list'), chapter)).toHaveCount(1);
  await button(region(page, 'Chapter list'), chapter).click();
  await heading(page, chapter);
  await text(page, 'Chapter created by corresponding prerequisite behavior.');
});
