// requirement: REQ-10.1
import { test, expect } from '@playwright/test';
import { button, createBook, createChapter, createPage, createPageInChapter, enter, entry, expectAbsentEntry, favorite,
  heading, home, identity, login, openBook, openChapter, openPageInChapter, openUrl, region, text } from './helpers';

test("REQ-10.1: Confirm page deletion", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  const book = await createBook(page, id, 'Book 10.1.1');
  const chapter = await createChapter(page, id, book, 'Chapter 10.1.1');
  const pageA = await createPageInChapter(page, id, book, chapter, 'Page 10.1.1', 'Page content 10.1.1.');
  const sibling = await createPage(page, id, book, 'Page 10.1.1-Sibling', 'Sibling content 10.1.1.');
  await openPageInChapter(page, book, chapter, pageA);
  await favorite(page);
  const pageUrl = page.url();
  await home(page);
  await expect(entry(region(page, 'My Most Viewed Favorites'), pageA)).toHaveCount(1);
  await expect(entry(region(page, 'My Recently Viewed'), pageA)).toHaveCount(1);
  await expect(entry(region(page, 'Recently Updated Pages'), pageA)).toHaveCount(1);
  await openPageInChapter(page, book, chapter, pageA);
  await button(page, 'Delete').click();
  await expect(button(page, 'Cancel')).toBeVisible();
  await expect(button(page, 'Confirm Delete')).toBeVisible();
  await button(page, 'Confirm Delete').click();
  await heading(page, book);
  await expectAbsentEntry(region(page, 'Page list'), pageA);
  await expect(entry(region(page, 'Page list'), sibling)).toHaveCount(1);
  await openChapter(page, book, chapter);
  await expectAbsentEntry(region(page, 'Page list'), pageA);
  await home(page);
  await expectAbsentEntry(region(page, 'Recently Updated Pages'), pageA);
  await expectAbsentEntry(region(page, 'My Most Viewed Favorites'), pageA);
  await expectAbsentEntry(region(page, 'My Recently Viewed'), pageA);
  await openUrl(page, pageUrl);
  await expect(page.getByRole('textbox', { name: 'Page title', exact: true })).toHaveCount(0);
  await expect(page.getByText('Page content 10.1.1.', { exact: true })).toHaveCount(0);
  await openBook(page, book);
  await page.reload();
  await expectAbsentEntry(region(page, 'Page list'), pageA);
});

test("REQ-10.1: Cancel page deletion", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 10.1.2');
  const pageA = await createPage(page, id, book, 'Page 10.1.2', 'Page content 10.1.2.');
  await openBook(page, book);
  await button(region(page, 'Page list'), pageA).click();
  await button(page, 'Delete').click();
  await button(page, 'Cancel').click();
  await heading(page, pageA);
  await text(page, 'Page content 10.1.2.');
  await openBook(page, book);
  await expect(entry(region(page, 'Page list'), pageA)).toHaveCount(1);
  await home(page);
  await expect(entry(region(page, 'Recently Updated Pages'), pageA)).toHaveCount(1);
  await page.reload();
  await openBook(page, book);
  await expect(entry(region(page, 'Page list'), pageA)).toHaveCount(1);
});
