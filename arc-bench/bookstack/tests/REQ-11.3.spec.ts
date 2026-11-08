// requirement: REQ-11.3
import { test, expect, type Browser, type Page } from '@playwright/test';
import { button, createBook, createPage, enter, entry, expectAbsentEntry, heading, home, identity,
  login, named, newContextFor, openBook, openPage, region, REVIEWER_ACCOUNT } from './helpers';
import { editPage, expectBreadcrumb, expectEditor, expectReading, fillEditor, moveContent,
  pageConflict } from './support/page-revisions';

const originalBody = 'Initial published body.';
const changedA = 'Unsaved text entered by editor A.';
const changedB = 'New public text saved by editor B.';

async function prepare(page: Page, browser: Browser, baseURL: string, id: string, destination = false) {
  await enter(page);
  await login(page);
  const source = await createBook(page, id, 'Source edit book');
  const target = destination ? await createBook(page, id, 'Destination edit book') : source;
  const title = await createPage(page, id, source, 'Published edit page', originalBody);
  await openPage(page, source, title);
  const readingUrl = page.url();
  const second = await newContextFor(browser, baseURL, REVIEWER_ACCOUNT);
  await second.page.goto(readingUrl);
  await expectReading(second.page, title, originalBody);
  await editPage(page, title, originalBody);
  const revised = named(id, 'Title entered by editor A');
  await fillEditor(page, revised, changedA);
  return { source, target, title, revised, readingUrl, second };
}

test('REQ-11.3: Protect a newer publication from a stale editor', async ({ page, browser, baseURL }, info) => {
  const id = identity(info);
  const { source, title, revised, readingUrl, second } = await prepare(page, browser, baseURL!, id);
  const bTitle = named(id, 'Published title from editor B');
  try {
    await editPage(second.page, title, originalBody);
    await fillEditor(second.page, bTitle, changedB);
    await button(second.page, 'Save Page').click();
    await expectReading(second.page, bTitle, changedB);
    await second.page.goto(readingUrl);
    await expectReading(second.page, bTitle, changedB);

    await button(page, 'Save Page').click();
    const conflict = pageConflict(page);
    await expect(conflict).toBeVisible();
    await button(conflict, 'Keep editing').click();
    await expect(conflict).toBeHidden();
    await expectEditor(page, revised, changedA);
    await second.page.reload();
    await expectReading(second.page, bTitle, changedB);
    await expect(second.page.getByText(changedA, { exact: true })).toHaveCount(0);
    await button(page, 'Save Page').click();
    await expect(conflict).toBeVisible();
    await button(conflict, 'Overwrite').click();
    await expect(conflict).toBeHidden();
    await expectReading(page, revised, changedA);
    await second.page.goto(readingUrl);
    await expectReading(second.page, revised, changedA);
    await openBook(page, source);
    const pages = region(page, 'Page list');
    await expect(entry(pages, revised)).toHaveCount(1);
    await expectAbsentEntry(pages, title);
    await expectAbsentEntry(pages, bTitle);
  } finally {
    await second.context.close();
  }
});

test("REQ-11.3: Save stale editor text to the page's new book", async ({ page, browser, baseURL }, info) => {
  const { source, target, title, revised, readingUrl, second } = await prepare(page, browser, baseURL!, identity(info), true);
  try {
    await moveContent(second.page, 'Page', target);
    await openBook(second.page, target);
    await expect(entry(region(second.page, 'Page list'), title)).toHaveCount(1);
    await button(page, 'Save Page').click();
    await expect(pageConflict(page)).toBeHidden();
    await expectReading(page, revised, changedA);
    await page.goto(readingUrl);
    await expectReading(page, revised, changedA);
    await expectBreadcrumb(page, target, undefined, source);
    await openBook(page, source);
    await expectAbsentEntry(region(page, 'Page list'), title);
    await expectAbsentEntry(region(page, 'Page list'), revised);
    await openBook(page, target);
    await page.reload();
    await expect(entry(region(page, 'Page list'), revised)).toHaveCount(1);
    await expectAbsentEntry(region(page, 'Page list'), title);
    await entry(region(page, 'Page list'), revised).click();
    await expectReading(page, revised, changedA);
    await expectBreadcrumb(page, target, undefined, source);
  } finally {
    await second.context.close();
  }
});

test('REQ-11.3: Reject a stale page save after deletion', async ({ page, browser, baseURL }, info) => {
  const { source, title, revised, readingUrl, second } = await prepare(page, browser, baseURL!, identity(info));
  try {
    await button(second.page, 'Delete').click();
    await button(second.page, 'Confirm Delete').click();
    await heading(second.page, source);
    await expectAbsentEntry(region(second.page, 'Page list'), title);
    await button(page, 'Save Page').click();
    await expect(page.getByRole('alert', { name: 'Page deleted', exact: true })).toBeVisible();
    await expectEditor(page, revised, changedA);
    await button(page, 'Back to book').click();
    await heading(page, source);
    await page.reload();
    for (const name of [title, revised]) await expectAbsentEntry(region(page, 'Page list'), name);
    await home(page);
    for (const name of [title, revised]) await expectAbsentEntry(region(page, 'Recently Updated Pages'), name);
    await page.goto(readingUrl);
    for (const name of [title, revised]) await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
    for (const body of [originalBody, changedA]) await expect(page.getByText(body, { exact: true })).toHaveCount(0);
  } finally {
    await second.context.close();
  }
});
