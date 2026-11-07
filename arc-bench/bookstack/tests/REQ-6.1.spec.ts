// requirement: REQ-6.1
import { test, expect } from '@playwright/test';
import { identity, enter, region, entry, home, login, heading, text, createBook, createPage, button, expectAbsentEntry,
  expectFieldValue, newContextFor, openBook, REVIEWER_ACCOUNT } from './helpers';

test("REQ-6.1: Publish a page", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const book = await createBook(page, id, 'Book 6.1.1');
  const name = await createPage(page, id, book, 'Page Created 6.1.1', 'Page content created by corresponding prerequisite behavior.');
  await heading(page, book);
  await expect(entry(region(page, 'Page list'), name)).toHaveCount(1);
});

test("REQ-6.1: Save an owned recent draft", async ({ page }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  await login(page);
  const book = await createBook(page, id, 'Book 6.1.2');
  const draft = await createPage(page, id, book, 'Page Draft 6.1.2', 'Draft content created by corresponding prerequisite behavior.', true);
  await home(page);
  const recentDraft = region(page, 'My Recent Drafts').getByText(draft, { exact: true }).filter({ visible: true });
  await expect(recentDraft).toHaveCount(1);
  await expect(recentDraft).toBeVisible();
});

test("REQ-6.1: Publish an owned draft", async ({ page, browser }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const baseURL = new URL(page.url()).origin;
  await login(page);
  const book = await createBook(page, id, 'Book 6.1.3');
  const draft = await createPage(page, id, book, 'Page Draft 6.1.3', 'Draft content 6.1.3.', true);
  const anonymous = await newContextFor(browser, baseURL);
  const anonymousPage = anonymous.page;
  await openBook(anonymousPage, book);
  await expectAbsentEntry(region(anonymousPage, 'Page list'), draft);
  await openBook(page, book);
  await entry(region(page, 'Page list'), draft).click();
  await expectFieldValue(page.getByRole('textbox', { name: 'Page title', exact: true }), draft);
  await expectFieldValue(page.getByRole('textbox', { name: 'Write your page content here...', exact: true }), 'Draft content 6.1.3.');
  await button(page, 'Save Page').click();
  await openBook(page, book);
  await expect(entry(region(page, 'Page list'), draft)).toHaveCount(1);
  await entry(region(page, 'Page list'), draft).click();
  await heading(page, draft);
  await text(page, 'Draft content 6.1.3.');
  await home(page);
  await expect(region(page, 'My Recent Drafts').getByText(draft, { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expect(entry(region(page, 'Recently Updated Pages'), draft)).toHaveCount(1);
  await anonymousPage.reload();
  await openBook(anonymousPage, book);
  await expect(entry(region(anonymousPage, 'Page list'), draft)).toHaveCount(1);
  await entry(region(anonymousPage, 'Page list'), draft).click();
  await heading(anonymousPage, draft);
  await text(anonymousPage, 'Draft content 6.1.3.');
  await anonymous.context.close();
});

test("REQ-6.1: Keep drafts private to their owner", async ({ page, browser }, testInfo) => {
  const id = identity(testInfo);
  await enter(page);
  const baseURL = new URL(page.url()).origin;
  await login(page);
  const book = await createBook(page, id, 'Book 6.1.4');
  const draft = await createPage(page, id, book, 'Page Draft 6.1.4', 'Draft content 6.1.4.', true);
  await openBook(page, book);
  await entry(region(page, 'Page list'), draft).click();
  const draftUrl = page.url();
  await expectFieldValue(page.getByRole('textbox', { name: 'Page title', exact: true }), draft);
  await expectFieldValue(page.getByRole('textbox', { name: 'Write your page content here...', exact: true }), 'Draft content 6.1.4.');
  const anonymous = await newContextFor(browser, baseURL);
  const anonymousPage = anonymous.page;
  await openBook(anonymousPage, book);
  await expectAbsentEntry(region(anonymousPage, 'Page list'), draft);
  await anonymousPage.goto(baseURL);
  await expect(anonymousPage.getByText(draft, { exact: true }).filter({ visible: true })).toHaveCount(0);
  await anonymousPage.goto(draftUrl);
  await expect(anonymousPage.getByRole('textbox', { name: 'Page title', exact: true })).toHaveCount(0);
  await expect(anonymousPage.getByText('Draft content 6.1.4.', { exact: true })).toHaveCount(0);
  await anonymous.context.close();
  const reviewer = await newContextFor(browser, baseURL, REVIEWER_ACCOUNT);
  const reviewerPage = reviewer.page;
  await openBook(reviewerPage, book);
  await expectAbsentEntry(region(reviewerPage, 'Page list'), draft);
  await expect(region(reviewerPage, 'My Recent Drafts').getByText(draft, { exact: true }).filter({ visible: true })).toHaveCount(0);
  await reviewerPage.goto(draftUrl);
  await expect(reviewerPage.getByRole('textbox', { name: 'Page title', exact: true })).toHaveCount(0);
  await expect(reviewerPage.getByText('Draft content 6.1.4.', { exact: true })).toHaveCount(0);
  await reviewer.context.close();
  await openBook(page, book);
  await expect(entry(region(page, 'Page list'), draft)).toHaveCount(1);
  await home(page);
  await expect(region(page, 'My Recent Drafts').getByText(draft, { exact: true }).filter({ visible: true })).toHaveCount(1);
});
