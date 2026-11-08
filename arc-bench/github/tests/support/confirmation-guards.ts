import { expect, test as base, type Locator, type Page } from '@playwright/test';
import { branchState, createFile, output } from './branch-state';
import { openVisibleTarget, seedAccount, signIn } from './e2e';
import { expectText } from './observations';
import { selectChoice } from './public-controls';

type State = Awaited<ReturnType<typeof branchState>>;
export const test = base.extend<{ session: (account: string) => Promise<Page> }>({
  session: async ({ browser }, use, info) => {
    const contexts: Awaited<ReturnType<typeof browser.newContext>>[] = [];
    try {
      await use(async account => {
        const context = await browser.newContext();
        contexts.push(context);
        const page = await context.newPage();
        await signIn(page, seedAccount(info, account));
        return page;
      });
    } finally {
      await Promise.all(contexts.map(context => context.close()));
    }
  },
});

export const button = (page: Page | Locator, name: string) => page.getByRole('button', { name, exact: true });
export const link = (page: Page, name: string) => page.getByRole('link', { name, exact: true });

export async function openPullRequest(page: Page, title: string) {
  await openVisibleTarget(page, title);
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  return page.url();
}

export async function expectOpen(page: Page) {
  await expectText(page, 'Open', { exact: true });
  await expect(page.getByRole('region', { name: 'Merge result', exact: true })).toHaveCount(0);
}

export async function observeBranches(page: Page, pr: string) {
  await page.goto(pr);
  await expectOpen(page);
  await link(page, 'Base branch').click();
  const baseUrl = page.url();
  const base = await branchState(page);
  await page.goto(pr);
  await link(page, 'Compare branch').click();
  const compareUrl = page.url();
  const compare = await branchState(page);
  expect(base.branch).toBe('main');
  expect(compare.branch).toBe('feature-guard');
  expect(base.head).not.toBe(compare.head);
  expect(base.files).toEqual([['base.md', 'Base content'], ['shared.md', 'Shared content']]);
  expect(compare.files).toEqual([['base.md', 'Base content'], ['change.txt', 'Original feature'], ['shared.md', 'Shared content']]);
  await page.goto(pr);
  return { baseUrl, base, compareUrl, compare };
}

export async function expectBranch(page: Page, url: string, expected: State) {
  await page.goto(url);
  expect(await branchState(page)).toEqual(expected);
}

export async function advanceCompare(author: Page, pr: string, previous: State) {
  await author.goto(pr);
  await link(author, 'Compare branch').click();
  const url = author.url();
  expect(await branchState(author)).toEqual(previous);
  await createFile(author, 'next.txt', 'Next feature', 'Advance compare');
  await expectText(author, 'Next feature', { exact: true });
  await author.goto(url);
  const next = await branchState(author);
  expect(next.owner).toBe(previous.owner);
  expect(next.branch).toBe(previous.branch);
  expect(next.head).not.toBe(previous.head);
  expect(next.files).toEqual([...previous.files, ['next.txt', 'Next feature']].sort((a, b) => a[0].localeCompare(b[0])));
  expect(next.commits.find(row => row[0] === next.head)).toEqual([next.head, previous.head, 'pr-author', 'Advance compare']);
  expect(next.commits.filter(row => row[0] !== next.head)).toEqual(previous.commits);
  return next;
}

export function historyRows(page: Page, name: 'Review history' | 'Inline review comments') {
  return page.getByRole('table', { name, exact: true }).getByRole('row').filter({ has: page.getByRole('cell') });
}

export function historyRow(page: Page, name: 'Review history' | 'Inline review comments', identity: string[]) {
  return identity.reduce((rows, value) => rows.filter({ has: page.getByRole('cell', { name: value, exact: true }) }),
    historyRows(page, name));
}

export async function expectApproval(page: Page, commit: string, state: 'Current' | 'Stale') {
  const row = historyRow(page, 'Review history', ['pr-reviewer', commit]);
  await expect(row).toHaveCount(1);
  await expect(row.getByRole('cell')).toHaveText(['pr-reviewer', commit, 'Approve', state]);
}

export async function expectHistoricalComment(page: Page, original: string, state: 'Current' | 'Outdated') {
  const row = historyRow(page, 'Inline review comments', ['pr-reviewer', original, 'Keep this original comment']);
  await expect(row).toHaveCount(1);
  await expect(row.getByRole('cell')).toHaveText(['pr-reviewer', original, 'change.txt', '1', 'Keep this original comment', state]);
  await expect(historyRows(page, 'Inline review comments')).toHaveCount(1);
}

export async function expectCheck(page: Page, commit: string, state: 'pending' | 'success') {
  await expect(page.getByRole('status', { name: 'Check commit', exact: true })).toHaveText(commit);
  await expect(page.getByRole('status', { name: 'test status', exact: true })).toHaveText(state);
}

export async function passCheck(admin: Page, pr: string, commit: string) {
  await admin.goto(pr);
  await link(admin, 'Checks').click();
  await expectCheck(admin, commit, 'pending');
  await selectChoice(admin.getByRole('combobox', { name: 'test status', exact: true }), { label: 'success' });
  await button(admin, 'Save check').click();
  await expectCheck(admin, commit, 'success');
  await admin.reload();
  await expectCheck(admin, commit, 'success');
}

export async function openApproval(page: Page, pr: string) {
  await page.goto(pr);
  await link(page, 'Files changed').click();
  await button(page, 'Review changes').click();
  await page.getByRole('radio', { name: 'Approve', exact: true }).check();
  const submit = button(page, 'Submit review');
  await expect(submit).toBeEnabled();
  return submit;
}

export async function openConfirmation(page: Page) {
  await expectOpen(page);
  await selectChoice(page.getByRole('combobox', { name: 'Merge method', exact: true }), { label: 'Create a merge commit' });
  const open = button(page, 'Merge pull request');
  await expect(open).toBeEnabled();
  await open.click();
  await expect(button(page, 'Confirm merge')).toBeEnabled();
}

export async function expectOldActionBlocked(page: Page, action: 'Confirm merge' | 'Submit review', reason: string) {
  const submit = button(page, action);
  const alert = page.getByRole('alert', { name: action === 'Confirm merge' ? 'Merge blocked' : 'Review blocked', exact: true });
  await expect.poll(async () => await alert.isVisible() || (await submit.isVisible() && await submit.isEnabled())).toBe(true);
  if (!await alert.isVisible()) {
    // A live UI may invalidate the dialog between observation and click.
    try {
      await submit.click({ timeout: 2000 });
    } catch (error) {
      if (!await alert.isVisible()) throw error;
    }
  }
  await expect(alert).toBeVisible();
  await expect(alert).toContainText(reason);
}

export async function mergeMetadata(page: Page) {
  await expectText(page, 'Merged', { exact: true });
  const result = {
    commit: await output(page, 'Merge commit', 'Merge result'),
    author: await output(page, 'Merged by', 'Merge result'),
    time: await output(page, 'Merged at', 'Merge result'),
  };
  expect(result.time).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/);
  expect(Number.isFinite(Date.parse(result.time))).toBe(true);
  return result;
}

export async function expectMergedBranches(page: Page, baseUrl: string, base: State, compareUrl: string, compare: State,
  result: Awaited<ReturnType<typeof mergeMetadata>>) {
  await page.goto(baseUrl);
  const merged = await branchState(page);
  expect(merged.owner).toBe(base.owner);
  expect(merged.branch).toBe(base.branch);
  expect(merged.head).toBe(result.commit);
  expect(merged.files).toEqual(compare.files);
  const newCommit = merged.commits.find(row => row[0] === result.commit);
  expect(newCommit).toBeDefined();
  expect(newCommit![1].split(',').map(value => value.trim())).toEqual([base.head, compare.head]);
  expect(newCommit![2]).toBe(result.author);
  const previous = new Map([...base.commits, ...compare.commits].map(row => [row[0], row]));
  expect(previous.has(result.commit)).toBe(false);
  expect(merged.commits.filter(row => row[0] !== result.commit)).toEqual([...previous.values()].sort((a, b) => a[0].localeCompare(b[0])));
  await expectBranch(page, compareUrl, compare);
}
