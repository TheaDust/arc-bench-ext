import { formField } from './support/public-controls';
import { createHash, randomBytes } from 'node:crypto';
import { expect, test as base, type Page, type Locator, type Browser, type TestInfo } from '@playwright/test';
import { accounts, password, body, answerBody, commentBody } from './fixtures/data';
export { expect };
const runId = randomBytes(8).toString('hex');
// Only freeze the business clock. Keep native timers, performance and animation
// frames running so browser actionability checks and context teardown can finish.
export async function freezeClock(page: Page, instant: string) {
  await page.addInitScript(({ milliseconds }) => {
    const NativeDate = Date;
    globalThis.Date = new Proxy(NativeDate, {
      construct(target, args) {
        return Reflect.construct(target, args.length ? args : [milliseconds]);
      },
      apply() {
        return new NativeDate(milliseconds).toString();
      },
      get(target, property, receiver) {
        if (property === 'now') return () => milliseconds;
        return Reflect.get(target, property, receiver);
      },
    });
  }, { milliseconds: Date.parse(instant) });
}
export const test = base.extend({
  page: async ({ page }, use) => {
    await freezeClock(page, '2026-07-21T12:02:00Z');
    await use(page);
  },
});
export type Account = keyof typeof accounts;
export const region = (scope: Page | Locator, name: string) => scope.getByRole('region', { name, exact: true });
const buttonActions = new Set(['Products', 'Log in', 'Sign up', 'Show password', 'Hide password',
  'Forgot password?', 'Stack User', 'Helpful User', 'Home', 'Questions', 'Tags', 'Users',
  'Ask Question', 'Newest', 'Active', 'Next page', 'Edit profile',
  'Save and copy changes to all public communities', 'Up vote', 'Down vote', 'Save',
  'Timeline', 'Share', 'Edit', 'Follow', 'Add a comment', 'Post Your Question', 'Bold',
  'Italic', 'Code', 'Save edits', 'Cancel', 'Delete', 'Confirm deletion', 'Post Your Answer',
  'Accept answer', 'Accepted answer', 'Show 2 more comments', 'Reply', 'Add Reply',
  'Watch tag', 'Unwatch tag', 'Filter', 'Save custom filter', 'Save filter']);
export const action = (scope: Page | Locator, name: string) => buttonActions.has(name)
  ? scope.getByRole('button', { name, exact: true })
  : scope.getByRole('button', { name, exact: true }).or(scope.getByRole('link', { name, exact: true }));
/** Existence is not a uniqueness obligation for ordinary visible feedback. */
export async function expectPresence(candidates: Locator) {
  await expect.poll(() => candidates.filter({ visible: true }).count()).toBeGreaterThan(0);
}
export const field = (scope: Page | Locator, name: string) => formField(scope, name);
export const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Main navigation', exact: true });
export const profileNav = (page: Page) => page.getByRole('navigation', { name: 'Profile navigation', exact: true });
export const activityNav = (page: Page) => page.getByRole('navigation', { name: 'Activity navigation', exact: true });
export const post = (page: Page) => region(page, 'Question post');
export const answer = (page: Page, author = 'Helpful User') => region(region(page, 'Answers'), `Answer by ${author}`);
export async function ownedByPost(scope: Page | Locator, candidates: Locator, exclude = /^(?:Answers|Answer by .+)$/): Promise<Locator> {
  await expect.poll(() => candidates.count()).toBeGreaterThan(0);
  const nested = await scope.getByRole('region', { name: exclude }).elementHandles();
  try {
    const owned: Locator[] = [];
    for (let i = 0; i < await candidates.count(); i++) {
      const candidate = candidates.nth(i);
      if (await candidate.evaluate((element, roots) => !roots.some(root => root.contains(element)), nested)) owned.push(candidate);
    }
    expect(owned, 'Exactly one control or region belongs to this post').toHaveLength(1);
    return owned[0];
  } finally { await Promise.all(nested.map(handle => handle.dispose())); }
}
export const ownComments = (scope: Page | Locator) => ownedByPost(scope, region(scope, 'Comments'));
export async function comment(scope: Page | Locator, text = commentBody) {
  return region(await ownComments(scope), `Comment ${text}`);
}
export const output = (scope: Page | Locator, name: string) => scope.getByRole('status', { name, exact: true });
export async function entry(page: Page) { await page.goto('/'); }
export async function openLogin(page: Page) {
  await entry(page);
  await action(page.getByRole('banner'), 'Log in').click();
  const form = region(page, 'Log in');
  await expect(field(form, 'Password')).toHaveAttribute('type', 'password');
  return form;
}
export async function login(page: Page, account: Account) {
  const form = await openLogin(page);
  await field(form, 'Email').fill(accounts[account]);
  await field(form, 'Password').fill(password);
  await action(form, 'Log in').click();
  await expect(region(page, 'Question feed')).toBeVisible();
  await expect(action(page.getByRole('banner'), account === 'helpful_user' ? 'Helpful User' : 'Stack User')).toBeVisible();
}
export async function openQuestion(page: Page, title: string) {
  await action(mainNav(page), 'Questions').click();
  // Public Search is used rather than assuming the question is on page one.
  await page.getByRole('banner').getByRole('searchbox', { name: 'Search', exact: true }).fill(title);
  await page.getByRole('banner').getByRole('searchbox', { name: 'Search', exact: true }).press('Enter');
  await action(region(page, 'Search results'), title).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await expect(post(page)).toBeVisible();
}
export async function ownProfile(page: Page, name = 'Stack User') {
  await action(page.getByRole('banner'), name).click();
  await expect(profileNav(page)).toBeVisible();
}
export async function activity(page: Page, category: string) {
  await ownProfile(page);
  await action(profileNav(page), 'Activity').click();
  await action(activityNav(page), category).click();
  return region(page, 'Activity content');
}
export function suffix(info: TestInfo) {
  const slug = createHash('sha256').update(info.title).digest('hex').slice(0, 10);
  return `${runId}-${info.parallelIndex}-${slug}`;
}
export function titleFor(info: TestInfo, stem: string) { return `${stem} ${suffix(info)}`; }
export async function composeQuestion(page: Page, title: string, text = body, tags = 'node.js,http,retry') {
  await action(region(page, 'Question feed'), 'Ask Question').click();
  await field(page, 'Title').fill(title);
  await field(page, 'Body').fill(text);
  await field(page, 'Tags').fill(tags);
  await action(page, 'Post Your Question').click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
}
export async function publishAnswer(page: Page, text = answerBody) {
  await field(page, 'Your Answer').fill(text);
  await action(page, 'Post Your Answer').click();
  await expectPresence(region(page, 'Answers').getByText(text, { exact: true }));
}
export async function publishComment(scope: Locator, text = commentBody) {
  const thread = await ownComments(scope);
  await action(thread, 'Add a comment').click();
  await field(thread, 'Comment').fill(text);
  await field(thread, 'Comment').press('Enter');
  await expect(await comment(scope, text)).toBeVisible();
}
export async function asUser(browser: Browser, account: Account, use: (page: Page) => Promise<void>) {
  const context = await browser.newContext({ baseURL: base.info().project.use.baseURL, timezoneId: 'UTC' });
  let primaryError: unknown;
  try {
    const page = await context.newPage();
    await freezeClock(page, '2026-07-21T12:02:00Z');
    await login(page, account);
    await use(page);
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try { await context.close(); }
    catch (error) {
      if (primaryError === undefined) throw error;
      base.info().annotations.push({ type: 'context-cleanup-error', description: String(error) });
    }
  }
}
export async function createQuestion(browser: Browser, info: TestInfo, owner: Account, stem: string) {
  const title = titleFor(info, stem);
  await asUser(browser, owner, page => composeQuestion(page, title));
  return title;
}
export async function createAnswer(browser: Browser, title: string, author: Account = 'helpful_user', text = answerBody) {
  await asUser(browser, author, async page => { await openQuestion(page, title); await publishAnswer(page, text); });
}
export async function createComment(browser: Browser, title: string, author: Account, text = commentBody) {
  await asUser(browser, author, async page => { await openQuestion(page, title); await publishComment(post(page), text); });
}
export async function numeric(scope: Page | Locator, name: string) {
  const value = (await (await ownedByPost(scope, output(scope, name))).innerText()).trim();
  if (!/^-?\d+$/.test(value)) throw new Error(`Expected visible integer ${name}, received ${value}`);
  return Number(value);
}
export async function expectNumeric(scope: Page | Locator, name: string, value: number) {
  await expect(await ownedByPost(scope, output(scope, name))).toHaveText(String(value));
}
export async function beforeText(scope: Locator, firstIdentity: string, secondIdentity: string) {
  await expect.poll(async () => {
    const text = await scope.innerText();
    const a = text.indexOf(firstIdentity), b = text.indexOf(secondIdentity);
    return a >= 0 && b >= 0 && a < b;
  }).toBe(true);
}

/** Inspect every public feed page, without assuming a particular page size. */
export async function visitFeed(page: Page, inspect: (feed: Locator) => Promise<void | boolean>) {
  const feed = region(page, 'Question feed');
  await expect(feed).toBeVisible();
  const seen = new Set<string>();
  while (true) {
    const content = await feed.innerText();
    expect(seen.has(content), 'Feed pagination must advance to a distinct page').toBe(false);
    seen.add(content);
    if (await inspect(feed)) return;
    const next = action(feed, 'Next page');
    await expect(next).toBeVisible();
    if (!await next.isEnabled()) return;
    await next.click();
    await expect(feed).not.toHaveText(content);
  }
}

/** A timestamp has no mandated display format; native time metadata is public. */
export async function expectTimestamp(scope: Locator) {
  await expect(scope).toBeVisible();
  await expect.poll(async () => {
    for (const time of await scope.locator('time[datetime]').filter({ visible: true }).all()) {
      const instant = await time.getAttribute('datetime');
      if (instant && Number.isFinite(Date.parse(instant)) && (await time.innerText()).trim()) return true;
    }
    const text = await scope.innerText();
    return /\b(?:20\d{2}[-/]\d{1,2}[-/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*|\d{1,2}:\d{2}(?::\d{2})?|just now|(?:\d+|an?)\s*(?:seconds?|minutes?|hours?|days?|[smhd])\s+ago)\b/i.test(text);
  }).toBe(true);
}

/** Compare the declared UTC calendar date, allowing ordinary equivalent spellings. */
export async function expectUtcDate(target: Locator, expected: string) {
  await expect(target).toBeVisible();
  await expect.poll(async () => {
    const text = (await target.innerText()).trim().replace(/^(?:Asked|Modified)\s*:?\s*/i, '');
    const qualified = /(?:Z|UTC|GMT|[+-]\d{2}:?\d{2})$/i.test(text) ? text
      : /^\d{4}-\d{2}-\d{2}T/.test(text) ? `${text}Z` : `${text} UTC`;
    const milliseconds = Date.parse(qualified);
    return Number.isFinite(milliseconds) ? new Date(milliseconds).toISOString().slice(0, 10) : null;
  }).toBe(expected);
}

/** Compare the two required public identities across the feed's pages. */
export async function expectFeedOrder(page: Page, firstIdentity: string, secondIdentity: string) {
  const feed = region(page, 'Question feed');
  let firstSeen = false;
  const seenPages = new Set<string>();
  while (true) {
    const content = await feed.innerText();
    if (seenPages.has(content)) throw new Error('Question pagination repeated a page');
    seenPages.add(content);
    const first = feed.getByRole('region', { name: `Question ${firstIdentity}`, exact: true });
    const second = feed.getByRole('region', { name: `Question ${secondIdentity}`, exact: true });
    const firstVisible = await first.isVisible();
    const secondVisible = await second.isVisible();
    if (secondVisible) {
      expect(firstSeen || firstVisible, `${firstIdentity} must precede ${secondIdentity}`).toBe(true);
      if (!firstSeen) await beforeText(feed, firstIdentity, secondIdentity);
      return;
    }
    firstSeen ||= firstVisible;
    const next = action(feed, 'Next page');
    await expect(next).toBeEnabled();
    await next.click();
    await expect(feed).not.toHaveText(content);
  }
}
export async function confirmDeletion(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Confirm deletion', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(/delet|remov/i);
  await action(dialog, 'Confirm deletion').click();
}

export async function noUsableAction(scope: Page | Locator, name: string) {
  const controls = action(scope, name).filter({ visible: true });
  // A hidden action or a visibly disabled action is unavailable to the user.
  for (const control of await controls.all()) await expect(control).toBeDisabled();
}

export const postAction = (page: Page, name: string) => ownedByPost(post(page), action(post(page), name), /^(?:Answers|Answer by .+|Comments)$/);
export const postAuthor = (page: Page) => ownedByPost(post(page), region(post(page), 'Author'));
