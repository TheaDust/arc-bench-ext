// requirement: REQ-11.1
import { test, expect, type Locator, type Page } from '@playwright/test';
import { button, createBook, createPage, enter, entry, expectAbsentEntry, expectNotice, favorite, home, identity, login,
  named, newContextFor, openBook, openPage, openUrl, region, REVIEWER_ACCOUNT } from './helpers';
import { editPage, expectEditor, expectReading, fillEditor, openRevision, pageConflict } from './support/page-revisions';

const v1 = 'Initial public body';
const v2 = 'First author revised body';
const draftB = 'Second author private body';

async function expectSearch(page: Page, title: string, present: boolean) {
  await home(page);
  const search = page.getByRole('searchbox', { name: 'Search', exact: true });
  await search.fill(title);
  await search.press('Enter');
  const results = region(page, 'Search results');
  if (present) {
    const result = entry(results, title);
    await expect(result).toHaveCount(1);
    await expect(result).toBeVisible();
  } else {
    await expect(results.getByText('No matching pages', { exact: true })).toBeVisible();
    await expectAbsentEntry(results, title);
  }
}

async function saveRevision(page: Page, title: string, body: string) {
  await fillEditor(page, title, body);
  await button(page, 'Save Draft').click();
  await expectNotice(page, 'Revision draft saved');
  await home(page);
  await expect(entry(region(page, 'My Recent Drafts'), title)).toHaveCount(1);
}

async function expectNoTitle(scope: Locator, title: string) {
  await expectAbsentEntry(scope, title);
  await expect(scope.getByText(title, { exact: true }).filter({ visible: true })).toHaveCount(0);
}

async function expectPublicLists(page: Page, book: string, visible: string, ...hidden: string[]) {
  await openBook(page, book);
  const pages = region(page, 'Page list');
  await expect(entry(pages, visible)).toHaveCount(1);
  for (const title of hidden) await expectNoTitle(pages, title);
  await home(page);
  const updated = region(page, 'Recently Updated Pages');
  await expect(entry(updated, visible)).toHaveCount(1);
  for (const title of hidden) await expectNoTitle(updated, title);
}

test('REQ-11.1: Keep a saved revision private until its author publishes', async ({ page, browser, baseURL }, info) => {
  const id = identity(info);
  const revised = named(id, 'Published revision V2');
  await enter(page);
  await login(page);
  const book = await createBook(page, id, 'Revision source');
  const original = await createPage(page, id, book, 'Published revision V1', v1);
  await openPage(page, book, original);
  const readingUrl = page.url();
  await favorite(page);
  const reader = await newContextFor(browser, baseURL!);
  try {
    await openUrl(reader.page, readingUrl);
    await expectReading(reader.page, original, v1);
    await editPage(page, original, v1);
    await saveRevision(page, revised, v2);
    await reader.page.reload();
    await expectReading(reader.page, original, v1);
    await expect(reader.page.getByText(v2, { exact: true })).toHaveCount(0);
    await expectPublicLists(reader.page, book, original, revised);
    await expectSearch(reader.page, original, true);
    await expectSearch(reader.page, revised, false);
    await openRevision(page, revised, v2);
    await button(page, 'Save Page').click();
    await expectReading(page, revised, v2);
    await home(page);
    await expectNoTitle(region(page, 'My Recent Drafts'), revised);
    const saved = entry(region(page, 'My Most Viewed Favorites'), revised);
    await expect(saved).toHaveCount(1);
    await expectAbsentEntry(region(page, 'My Most Viewed Favorites'), original);
    await saved.click();
    await expectReading(page, revised, v2);
    await openUrl(reader.page, readingUrl);
    await expectReading(reader.page, revised, v2);
    await expect(reader.page.getByText(v1, { exact: true })).toHaveCount(0);
    await expectPublicLists(reader.page, book, revised, original);
    await expectSearch(reader.page, revised, true);
    await entry(region(reader.page, 'Search results'), revised).click();
    await expectReading(reader.page, revised, v2);
    await expectSearch(reader.page, original, false);
  } finally {
    await reader.context.close();
  }
});

test("REQ-11.1: Keep a second author's revision private and reject its stale publish", async ({ page, browser, baseURL }, info) => {
  const id = identity(info);
  const revised = named(id, 'Revision by A');
  const second = named(id, 'Revision by B');
  await enter(page);
  await login(page);
  const book = await createBook(page, id, 'Shared revision book');
  const original = await createPage(page, id, book, 'Shared published page', v1);
  await openPage(page, book, original);
  const readingUrl = page.url();
  const reviewer = await newContextFor(browser, baseURL!, REVIEWER_ACCOUNT);
  const reader = await newContextFor(browser, baseURL!);
  try {
    await editPage(page, original, v1);
    await saveRevision(page, revised, v2);
    await openUrl(reviewer.page, readingUrl);
    await editPage(reviewer.page, original, v1);
    await saveRevision(reviewer.page, second, draftB);
    await page.reload();
    await expectNoTitle(region(page, 'My Recent Drafts'), second);
    await expectNoTitle(region(reviewer.page, 'My Recent Drafts'), revised);
    await openBook(page, book);
    await expectNoTitle(region(page, 'Page list'), second);
    await home(page);
    await openBook(reviewer.page, book);
    await expectNoTitle(region(reviewer.page, 'Page list'), revised);
    await home(reviewer.page);
    await openUrl(reader.page, readingUrl);
    await expectReading(reader.page, original, v1);
    await expectPublicLists(reader.page, book, original, revised, second);
    await openRevision(reviewer.page, second, draftB);
    await home(reviewer.page);
    await openRevision(page, revised, v2);
    await button(page, 'Save Page').click();
    await expectReading(page, revised, v2);
    await home(page);
    await expectNoTitle(region(page, 'My Recent Drafts'), revised);
    await expectNoTitle(region(page, 'My Recent Drafts'), second);
    await reviewer.page.reload();
    await openRevision(reviewer.page, second, draftB);
    await button(reviewer.page, 'Save Page').click();
    const conflict = pageConflict(reviewer.page);
    await expect(conflict).toBeVisible();
    await button(conflict, 'Keep editing').click();
    await expectEditor(reviewer.page, second, draftB);
    await home(reviewer.page);
    await openRevision(reviewer.page, second, draftB);
    await openUrl(reader.page, readingUrl);
    await expectReading(reader.page, revised, v2);
    await expect(reader.page.getByText(draftB, { exact: true })).toHaveCount(0);
    await expectPublicLists(reader.page, book, revised, second);
    await expectSearch(reader.page, second, false);
  } finally {
    await reviewer.context.close();
    await reader.context.close();
  }
});
