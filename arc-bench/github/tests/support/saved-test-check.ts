import { expect, type Locator, type Page } from '@playwright/test';

async function hasDisplayed(scope: Locator, value: string | RegExp) {
  const matches = scope.getByText(value, { exact: typeof value === 'string' }).filter({ visible: true });
  for (const match of await matches.all()) {
    if (await match.evaluate(element => !element.closest('select,[role=combobox],[role=option],button,[role=button]')))
      return true;
  }
  return false;
}

/** Read a saved public result, never the selector's editable value or the signed-in account. */
export async function expectTestCheck(page: Page, state: 'pending' | 'success', setter?: string) {
  const identity = /^(?:Check )?test$/i;
  const label = new RegExp('^test\\s*[:–-]?\\s*' + state + '$', 'i');
  const named = page.getByRole('group', { name: identity })
    .or(page.getByRole('region', { name: identity }))
    .or(page.getByRole('article', { name: identity }));
  const listed = page.getByRole('row').or(page.getByRole('listitem')).or(page.getByRole('article'))
    .filter({ has: page.getByText(/^(?:test|test\s*[:–-]?\s*(?:pending|success))$/i) });
  const displayedState = new RegExp('^(?:Status\\s*:\\s*)?' + state + '$', 'i');
  const escaped = setter?.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  const displayedSetter = escaped && new RegExp('^(?:(?:Set|Updated) by\\s*:?\\s*)?' + escaped + '$');
  await expect.poll(async () => {
    for (const record of await named.or(listed).filter({ visible: true }).all()) {
      if (!(await hasDisplayed(record, label) || await hasDisplayed(record, displayedState))) continue;
      if (!displayedSetter || await hasDisplayed(record, displayedSetter)) return true;
    }
    return false;
  }, { message: 'Expected saved status and setter in the visible test check record' }).toBe(true);
}
