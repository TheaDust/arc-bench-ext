import { formField } from './support/public-controls';
import { expect, type Browser, type Locator, type Page, type TestInfo } from '@playwright/test';
import { randomBytes } from 'node:crypto';
export { alertMessage, expectAlert, expectNotice, liveRegion, notice, openUrl, reopen, visibleMessage } from './support/observable';

const runId = randomBytes(8).toString('hex');

export interface Account {
  nickname: string;
  email: string;
  password: string;
}

export const ACCOUNT: Account = {
  nickname: 'BookStack User',
  email: 'bookstack_user@example.com',
  password: 'Password123!',
};
export const REVIEWER_ACCOUNT: Account = {
  nickname: 'BookStack Reviewer',
  email: 'bookstack_reviewer@example.com',
  password: 'Password123!',
};
export const BOOTSTRAP_SHELF = 'Benchmark Bootstrap Shelf';

// Literal scenario titles are unique in this package; normalize them to readable case ids.
export function identity(info: TestInfo): string {
  const caseId = info.title.replace(/[^A-Za-z0-9]+/g, '-');
  return `${runId}-w${info.workerIndex}-${caseId}`;
}
export const named = (id: string, base: string) => `${base} [${id}]`;
export const region = (page: Page, name: string) => page.getByRole('region', { name, exact: true });
export const button = (page: Page | Locator, name: string) => page.getByRole('button', { name, exact: true });
// The contract allows either a link or a button. Union does not choose by DOM order.
export const entry = (scope: Page | Locator, name: string) =>
  scope.getByRole('link', { name, exact: true }).or(scope.getByRole('button', { name, exact: true }));
export async function expectAbsentEntry(collection: Locator, name: string) {
  // Empty accessible regions may have zero area; existence does not require a box.
  await expect(collection).toHaveCount(1);
  await expect(entry(collection, name)).toHaveCount(0);
}
export async function enter(page: Page) {
  await page.goto('/');
}
export async function go(page: Page, name: string) {
  // The main navigation exposes both public content entries; breadcrumbs need not.
  const navigation = page.getByRole('navigation')
    .filter({ has: page.getByRole('link', { name: 'Shelves', exact: true }) })
    .filter({ has: page.getByRole('link', { name: 'Books', exact: true }) });
  const scoped = navigation.getByRole('link', { name, exact: true });
  // The source requires public entry links, not a particular landmark wrapper.
  // Use its semantic navigation when present; otherwise require a unique page link.
  if (await scoped.count()) await scoped.click();
  else await page.getByRole('link', { name, exact: true }).click();
}
export const home = enter;
export async function heading(page: Page, name: string) {
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
}
export async function text(page: Page, value: string) {
  await expect.poll(() => page.getByText(value, { exact: true }).filter({ visible: true }).count()).toBeGreaterThan(0);
}
export async function expectFieldValue(control: Locator, value: string) {
  await expect(control).toBeVisible();
  await expect(control).toHaveRole('textbox');
  await expect.poll(() => control.evaluate(element => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) return element.value;
    if (element instanceof HTMLElement && element.isContentEditable) return element.innerText;
    return null;
  })).toBe(value);
}
export async function expectKeyboardEntry(page: Page, target: Locator) {
  await expect(target).toHaveCount(1);
  await expect(target).toBeVisible();
  for (let index = 0; index < 150; index++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate(element => element === element.ownerDocument.activeElement)) return;
  }
  await expect(target).toBeFocused();
}
export async function login(page: Page, remember = false, account: Account = ACCOUNT) {
  await go(page, 'Login');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(account.email);
  await expect(formField(page, 'Password')).toHaveAttribute('type', 'password');
  await formField(page, 'Password').fill(account.password);
  if (remember) await page.getByRole('checkbox', { name: 'Remember Me', exact: true }).check();
  await button(page, 'Login').click();
  await text(page, account.nickname);
  await expect(region(page, 'My Recent Drafts')).toBeVisible();
}

export async function newContextFor(browser: Browser, baseURL: string, account?: Account) {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await page.goto('/');
  if (account) await login(page, false, account);
  return { context, page };
}
export async function metadata(page: Page, name: string, description: string, tags: string) {
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill(description);
  await page.getByRole('textbox', { name: 'Tags', exact: true }).fill(tags);
}
export async function expectMetadata(page: Page, name: string, description: string, tags: string) {
  await expectFieldValue(page.getByRole('textbox', { name: 'Name', exact: true }), name);
  await expectFieldValue(page.getByRole('textbox', { name: 'Description', exact: true }), description);
  await expectFieldValue(page.getByRole('textbox', { name: 'Tags', exact: true }), tags);
}
export async function openShelf(page: Page, name: string) {
  await go(page, 'Shelves');
  await entry(region(page, 'Shelf list'), name).click();
  await heading(page, name);
}
export async function openBook(page: Page, name: string) {
  await go(page, 'Books');
  await entry(region(page, 'Book list'), name).click();
  await heading(page, name);
}
export async function beginShelf(page: Page) {
  await openShelf(page, BOOTSTRAP_SHELF);
  await button(page, 'New Shelf').click();
}
export async function beginBook(page: Page) {
  await go(page, 'Books');
  await button(page, 'Create New Book').click();
}
export async function createShelf(page: Page, id: string, base: string, description = 'Reference shelf description.', tags = 'knowledge-base, docs') {
  const name = named(id, base);
  await beginShelf(page);
  await metadata(page, name, description, tags);
  await button(page, 'Save Shelf').click();
  await expect(entry(region(page, 'Shelf list'), name)).toHaveCount(1);
  await expect(entry(region(page, 'Shelf list'), name)).toBeVisible();
  return name;
}
export async function createBook(page: Page, id: string, base: string, description = 'Reference book description.', tags = 'manual, handbook') {
  const name = named(id, base);
  await beginBook(page);
  await metadata(page, name, description, tags);
  await button(page, 'Save Book').click();
  await heading(page, name);
  return name;
}
export async function createShelfBook(page: Page, id: string, shelf: string, base: string) {
  await openShelf(page, shelf);
  await button(page, 'Create New Book').click();
  const name = named(id, base);
  await metadata(page, name, 'Book created by corresponding prerequisite behavior.', 'created, shelf-book');
  await button(page, 'Save Book').click();
  await heading(page, name);
  return name;
}
export async function createPage(page: Page, id: string, book: string, base: string, content: string, draft = false) {
  await openBook(page, book);
  await button(page, 'New Page').click();
  const name = named(id, base);
  await page.getByRole('textbox', { name: 'Page title', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Write your page content here...', exact: true }).fill(content);
  await button(page, draft ? 'Save Draft' : 'Save Page').click();
  if (draft) {
    // Source allows draft save to stay in editor; observe it via the parent book.
    await openBook(page, book);
  } else {
    await heading(page, book);
  }
  const opening = draft ? entry(region(page, 'Page list'), name) : button(region(page, 'Page list'), name);
  await expect(opening).toHaveCount(1);
  await expect(opening).toBeVisible();
  return name;
}

export async function createChapter(page: Page, id: string, book: string, base: string,
  description = 'Chapter created by corresponding prerequisite behavior.') {
  await openBook(page, book);
  await button(page, 'New Chapter').click();
  const name = named(id, base);
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill(description);
  await button(page, 'Save Chapter').click();
  await openBook(page, book);
  await expect(button(region(page, 'Chapter list'), name)).toHaveCount(1);
  return name;
}

export async function openChapter(page: Page, book: string, name: string) {
  await openBook(page, book);
  await button(region(page, 'Chapter list'), name).click();
  await heading(page, name);
}

export async function createPageInChapter(page: Page, id: string, book: string, chapter: string,
  base: string, content: string) {
  await openChapter(page, book, chapter);
  await button(page, 'New Page').click();
  const name = named(id, base);
  await page.getByRole('textbox', { name: 'Page title', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'Write your page content here...', exact: true }).fill(content);
  await button(page, 'Save Page').click();
  await openBook(page, book);
  await expect(entry(region(page, 'Page list'), name)).toHaveCount(1);
  return name;
}

export async function openPage(page: Page, book: string, name: string) {
  await openBook(page, book);
  await entry(region(page, 'Page list'), name).click();
  await heading(page, name);
}

export async function openPageInChapter(page: Page, book: string, chapter: string, name: string) {
  await openChapter(page, book, chapter);
  await entry(region(page, 'Page list'), name).click();
  await heading(page, name);
}

export async function favorite(page: Page) {
  await expect(button(page, 'Favorite')).toHaveAttribute('aria-pressed', 'false');
  await button(page, 'Favorite').click();
  await expect(button(page, 'Unfavorite')).toHaveAttribute('aria-pressed', 'true');
}

export function records(collection: Locator) {
  return collection.getByRole('listitem').or(collection.getByRole('row')
    .filter({ hasNot: collection.page().getByRole('columnheader') }));
}

export function membership(page: Page, name: string) {
  return page.getByRole('checkbox', { name, exact: true });
}

export async function expectMembership(page: Page, name: string, checked: boolean) {
  const control = membership(page, name);
  await expect(control).toHaveCount(1);
  if (checked) await expect(control).toBeChecked();
  else await expect(control).not.toBeChecked();
}

export async function setMembership(page: Page, name: string, checked: boolean) {
  const control = membership(page, name);
  await expect(control).toHaveCount(1);
  if (checked) await control.check();
  else await control.uncheck();
}

export async function expectUnavailablePage(page: Page, title: string, body: string) {
  await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
  await expect(page.getByText(body, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Page title', exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Write your page content here...', exact: true })).toHaveCount(0);
}

export async function expectNoVisibleText(page: Page, value: string) {
  await expect.poll(() => page.getByText(value, { exact: true }).filter({ visible: true }).count()).toBe(0);
}
