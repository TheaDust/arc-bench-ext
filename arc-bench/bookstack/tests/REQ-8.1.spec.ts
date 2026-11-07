// requirement: REQ-8.1
import { test, expect } from '@playwright/test';
import { expectAbsentEntry, identity, enter, region, entry, button, home, login, createBook, favorite, go, heading,
  openBook, newContextFor, REVIEWER_ACCOUNT } from './helpers';

test("REQ-8.1: Favorite a book", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  await createBook(page, id, 'Book 8.1');
  await expect(button(page, 'Favorite')).toHaveAttribute('aria-pressed', 'false');
  await button(page, 'Favorite').click();
  await expect(button(page, 'Unfavorite')).toHaveAttribute('aria-pressed', 'true');
});

test("REQ-8.1: Persist removal of a favorite", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  const book = await createBook(page, id, 'Book Unfavorite');
  await button(page, 'Favorite').click();
  await expect(button(page, 'Unfavorite')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(button(page, 'Unfavorite')).toHaveAttribute('aria-pressed', 'true');
  await button(page, 'Unfavorite').click();
  await expect(button(page, 'Favorite')).toHaveAttribute('aria-pressed', 'false');
  await page.reload();
  await expect(button(page, 'Favorite')).toHaveAttribute('aria-pressed', 'false');
  await home(page);
  await expectAbsentEntry(region(page, 'My Most Viewed Favorites'), book);
});

test("REQ-8.1: Keep favorites personal and remove deleted content", async ({ page, browser }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const baseURL = new URL(page.url()).origin;
  await login(page);
  const book = await createBook(page, id, 'Book 8.1.3');
  await openBook(page, book);
  await favorite(page);
  await home(page);
  await expect(entry(region(page, 'My Most Viewed Favorites'), book)).toHaveCount(1);
  const reviewer = await newContextFor(browser, baseURL, REVIEWER_ACCOUNT);
  const reviewerPage = reviewer.page;
  await openBook(reviewerPage, book);
  await expect(button(reviewerPage, 'Favorite')).toHaveAttribute('aria-pressed', 'false');
  await home(reviewerPage);
  await expectAbsentEntry(region(reviewerPage, 'My Most Viewed Favorites'), book);
  await openBook(page, book);
  await button(page, 'Delete').click();
  await button(page, 'Confirm Delete').click();
  await heading(page, 'Books');
  await expectAbsentEntry(region(page, 'Book list'), book);
  await home(page);
  await expectAbsentEntry(region(page, 'My Most Viewed Favorites'), book);
  await reviewerPage.reload();
  await expectAbsentEntry(region(reviewerPage, 'My Most Viewed Favorites'), book);
  await go(reviewerPage, 'Books');
  await expectAbsentEntry(region(reviewerPage, 'Book list'), book);
  await reviewer.context.close();
});
