// requirement: REQ-5.5
import { test, expect } from '@playwright/test';
import { expectAbsentEntry, identity, enter, region, entry, button, heading, text, go, createBook, createShelf,
  createShelfBook, createChapter, createPage, createPageInChapter, favorite, home, login, openBook, openChapter,
  openPage, openPageInChapter, openShelf, expectUnavailablePage } from './helpers';

test("REQ-5.5: Confirm deletion", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const name = await createBook(page, id, 'Book 5.5.1', 'Reference book description.');
  await openBook(page, name);
  await button(page, 'Delete').click();
  await expect(button(page, 'Cancel')).toBeVisible();
  await expect(button(page, 'Confirm Delete')).toBeVisible();
  await button(page, 'Confirm Delete').click();
  await heading(page, 'Books');
  await expectAbsentEntry(region(page, 'Book list'), name);
  await page.reload();
  await go(page, 'Books');
  await expectAbsentEntry(region(page, 'Book list'), name);
});

test("REQ-5.5: Cancel deletion", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const name = await createBook(page, id, 'Book 5.5.2', 'Reference book description.');
  await openBook(page, name);
  await button(page, 'Delete').click();
  await button(page, 'Cancel').click();
  await heading(page, name);
  await text(page, 'Reference book description.');
});

test("REQ-5.5: Delete contained chapters and pages", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  const shelf = await createShelf(page, id, 'Shelf 5.5.3', 'Reference shelf description.');
  const book = await createShelfBook(page, id, shelf, 'Book 5.5.3');
  const other = await createShelfBook(page, id, shelf, 'Book 5.5.3-Other');
  const chapter = await createChapter(page, id, book, 'Chapter 5.5.3');
  const pageA = await createPageInChapter(page, id, book, chapter, 'Page 5.5.3-A', 'Page content 5.5.3-A.');
  const pageB = await createPageInChapter(page, id, book, chapter, 'Page 5.5.3-B', 'Page content 5.5.3-B.');
  const root = await createPage(page, id, book, 'Page 5.5.3-Root', 'Page content 5.5.3-Root.');
  const pageUrls: { url: string; title: string; body: string }[] = [];
  for (const [title, body] of [[pageA, 'Page content 5.5.3-A.'], [pageB, 'Page content 5.5.3-B.'],
    [root, 'Page content 5.5.3-Root.']]) {
    await openPage(page, book, title);
    await text(page, body);
    pageUrls.push({ url: page.url(), title, body });
  }
  await openBook(page, book);
  const bookUrl = page.url();
  await favorite(page);
  await openChapter(page, book, chapter);
  const chapterUrl = page.url();
  await favorite(page);
  await openPageInChapter(page, book, chapter, pageA);
  await favorite(page);
  await home(page);
  await expect(entry(region(page, 'My Most Viewed Favorites'), book)).toHaveCount(1);
  await expect(entry(region(page, 'My Most Viewed Favorites'), chapter)).toHaveCount(1);
  await expect(entry(region(page, 'My Most Viewed Favorites'), pageA)).toHaveCount(1);
  await expect(entry(region(page, 'My Recently Viewed'), pageA)).toHaveCount(1);
  await expect(entry(region(page, 'Recently Updated Pages'), pageA)).toHaveCount(1);
  await openBook(page, book);
  await button(page, 'Delete').click();
  await button(page, 'Confirm Delete').click();
  await heading(page, 'Books');
  await expectAbsentEntry(region(page, 'Book list'), book);
  await openShelf(page, shelf);
  await expectAbsentEntry(region(page, 'Book list'), book);
  await expect(entry(region(page, 'Book list'), other)).toHaveCount(1);
  await home(page);
  for (const name of [book, chapter, pageA, pageB, root]) {
    await expectAbsentEntry(region(page, 'My Most Viewed Favorites'), name);
    await expectAbsentEntry(region(page, 'My Recently Viewed'), name);
  }
  for (const name of [pageA, pageB, root]) {
    await expectAbsentEntry(region(page, 'Recently Updated Pages'), name);
  }
  await page.reload();
  await go(page, 'Books');
  await expectAbsentEntry(region(page, 'Book list'), book);
  await expect(entry(region(page, 'Book list'), other)).toHaveCount(1);
  for (const saved of pageUrls) {
    await page.goto(saved.url);
    await expectUnavailablePage(page, saved.title, saved.body);
    await page.reload();
    await expectUnavailablePage(page, saved.title, saved.body);
  }
  await page.goto(chapterUrl);
  await expect(page.getByRole('heading', { name: chapter, exact: true })).toHaveCount(0);
  await page.goto(bookUrl);
  await expect(page.getByRole('heading', { name: book, exact: true })).toHaveCount(0);
  await openBook(page, other);
  await text(page, 'Book created by corresponding prerequisite behavior.');
});
