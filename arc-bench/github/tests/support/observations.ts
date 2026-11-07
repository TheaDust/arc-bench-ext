import { expect, type Browser, type Locator, type Page } from '@playwright/test';
import { signIn, type VerifiedAccount } from './e2e';

/** Presence is existential; repeated public text does not make an action ambiguous. */
export async function expectText(
  scope: Page | Locator,
  text: string | RegExp,
  options: { exact?: boolean } = {},
): Promise<void> {
  await expect.poll(() => scope.getByText(text, options).filter({ visible: true }).count()).toBeGreaterThan(0);
}

/** Hidden or disabled controls cannot perform the prohibited operation. */
export async function expectNoActionable(control: Locator): Promise<void> {
  await expect.poll(async () => {
    for (const candidate of await control.all()) {
      if (await candidate.isVisible() && await candidate.isEnabled()) return true;
    }
    return false;
  }).toBe(false);
}

/** The public option's selected state identifies the current relationship. */
export async function expectOptionSelected(option: Locator, selected: boolean): Promise<void> {
  await expect(option).toHaveCount(1);
  await expect.poll(() => option.evaluate(element => {
    if (element instanceof HTMLOptionElement) return element.selected;
    const state = element.getAttribute('aria-selected');
    return state === 'true' ? true : state === 'false' ? false : null;
  })).toBe(selected);
}

/** Compare the public selected address with the actual browser clipboard. */
export async function expectCloneCopied(page: Page, protocol: 'HTTPS' | 'SSH', repository: string): Promise<void> {
  const tab = page.getByRole('tab', { name: protocol, exact: true });
  await expect(tab).toHaveAttribute('aria-selected', 'true');
  const field = page.getByLabel('Clone value', { exact: true });
  await expect(field).toHaveCount(1);
  await expect(field).toBeVisible();
  const value = await field.evaluate(element => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (!element.readOnly) throw new Error('Clone value must be a read-only public address');
      return element.value;
    }
    if (element instanceof HTMLElement && element.isContentEditable) throw new Error('Clone value output must be read-only');
    return (element.textContent ?? '').trim();
  });
  expect(value.trim()).not.toBe('');
  if (protocol === 'HTTPS') expect(value).toMatch(/^https:\/\//i);
  else expect(value).toMatch(/^(?:ssh:\/\/|[^@\s]+@[^:\s]+:)/i);
  const publicPath = /^(?:https|ssh):\/\//i.test(value) ? new URL(value).pathname : value.slice(value.indexOf(':') + 1);
  const finalPath = publicPath.replace(/\/$/, '').split('/').at(-1)?.replace(/\.git$/, '');
  expect(finalPath).toBe(repository);
  // Clipboard is a public browser facility, not application storage. An unrelated
  // starting value prevents stale clipboard contents from faking successful copy.
  await page.bringToFront();
  await page.evaluate(() => navigator.clipboard.writeText('ARC-Bench before clone copy'));
  await page.getByRole('button', { name: /copy.*clone|copy/i }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(value);
  await expectText(page, /copied/i);
}

/** A fresh browser session tests credentials independently of an existing session. */
export async function expectCredentialLogin(browser: Browser, account: VerifiedAccount): Promise<void> {
  const context = await browser.newContext();
  try {
    await signIn(await context.newPage(), account, account.email);
  } finally {
    await context.close();
  }
}

export async function expectDiscussionComment(page: Page, body: string, author: string): Promise<void> {
  const record = page.getByRole('article').filter({ has: page.getByText(body, { exact: true }) });
  await expect(record).toHaveCount(1);
  await expectText(record, body, { exact: true });
  await expectText(record, author, { exact: true });
}
