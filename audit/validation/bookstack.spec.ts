import { test, expect } from '@playwright/test';
import { go, text, expectFieldValue, expectKeyboardEntry, expectAbsentEntry, entry, region } from '../../arc-bench/bookstack/tests/helpers';
import { cappedEntry } from '../../arc-bench/bookstack/tests/support/list-cap';

test('bookstack public links do not require an undeclared navigation wrapper', async ({ page }) => {
  await page.setContent('<header><a href="#shelves">Shelves</a><a href="#books">Books</a><a href="#login">Login</a></header>');
  await go(page, 'Books');
  expect(new URL(page.url()).hash).toBe('#books');
});

test('bookstack available public navigation disambiguates a breadcrumb', async ({ page }) => {
  await page.setContent('<nav><a href="#shelves">Shelves</a><a href="#books">Books</a></nav><aside><a href="#breadcrumb">Books</a></aside>');
  await go(page, 'Books');
  expect(new URL(page.url()).hash).toBe('#books');
});

test('bookstack duplicate public action identities remain strict', async ({ page }) => {
  await page.setContent('<a href="#one">Books</a><a href="#two">Books</a>');
  await expect(go(page, 'Books')).rejects.toThrow(/strict mode/);
});

test('bookstack ordinary correct text may repeat', async ({ page }) => {
  await page.setContent('<h1>BookStack User</h1><span>BookStack User</span>');
  await text(page, 'BookStack User');
});

test('bookstack hidden text cannot satisfy a visible outcome', async ({ page }) => {
  await page.setContent('<span hidden>BookStack User</span><p>Another user</p>');
  await expect(text(page, 'BookStack User')).rejects.toThrow();
});

for (const markup of [
  '<label>Description<textarea>Saved body</textarea></label>',
  '<div role="textbox" aria-label="Description" contenteditable="true"><b>Saved</b> body</div>',
]) {
  test(`bookstack saved textbox content supports ${markup.startsWith('<label') ? 'native textarea' : 'rich text'}`, async ({ page }) => {
    await page.setContent(markup);
    await expectFieldValue(page.getByRole('textbox', { name: 'Description', exact: true }), 'Saved body');
  });
}

test('bookstack rich text must retain the actual saved content', async ({ page }) => {
  await page.setContent('<div role="textbox" aria-label="Description" contenteditable="true">Wrong body</div><p>Saved body</p>');
  await expect(expectFieldValue(page.getByRole('textbox', { name: 'Description', exact: true }), 'Saved body')).rejects.toThrow();
});

test('bookstack a matching label on a button cannot substitute a textbox', async ({ page }) => {
  await page.setContent('<button aria-label="Description">Saved body</button>');
  await expect(expectFieldValue(page.getByRole('button'), 'Saved body')).rejects.toThrow();
});

test('bookstack keyboard access traverses the public tab order', async ({ page }) => {
  await page.setContent('<button>Other</button><a href="#shelf">Target shelf</a>');
  await expectKeyboardEntry(page, entry(page, 'Target shelf'));
});

test('bookstack programmatic focus alone cannot satisfy keyboard access', async ({ page }) => {
  await page.setContent('<button tabindex="-1">Target shelf</button><button>Other</button>');
  await expect(expectKeyboardEntry(page, entry(page, 'Target shelf'))).rejects.toThrow();
});

function tableRows(names: string[]) {
  return `<section aria-label="Collection"><table><thead><tr><th>Name</th></tr></thead><tbody>${names.map(name => `<tr><td><button>${name}</button></td></tr>`).join('')}</tbody></table></section>`;
}

test('bookstack capped table ignores a standard header row', async ({ page }) => {
  await page.setContent(tableRows(['A', 'B', 'C']));
  const selected = await cappedEntry(region(page, 'Collection'), ['A', 'B', 'C'], 3);
  expect(['A', 'B', 'C']).toContain(selected.name);
});

test('bookstack cap still rejects an extra actual business row', async ({ page }) => {
  await page.setContent(tableRows(['A', 'B', 'C', 'D']));
  await expect(cappedEntry(region(page, 'Collection'), ['A', 'B', 'C', 'D'], 3)).rejects.toThrow();
});

test('bookstack cap preserves duplicate business identity rejection', async ({ page }) => {
  await page.setContent(tableRows(['A', 'A']));
  await expect(cappedEntry(region(page, 'Collection'), ['A'], 3)).rejects.toThrow();
});

test('bookstack removed entry accepts an accessible zero-area empty region', async ({ page }) => {
  await page.setContent('<section aria-label="Collection"></section><button>Removed book</button>');
  await expect(region(page, 'Collection')).not.toBeVisible();
  await expectAbsentEntry(region(page, 'Collection'), 'Removed book');
});

for (const markup of ['', '<section aria-label="Collection" hidden></section>', '<section aria-label="Collection" aria-hidden="true"></section>']) {
  test(`bookstack removed entry rejects missing or inaccessible collection ${JSON.stringify(markup)}`, async ({ page }) => {
    await page.setContent(markup);
    await expect(expectAbsentEntry(region(page, 'Collection'), 'Removed book')).rejects.toThrow();
  });
}

test('bookstack a remaining target cannot satisfy deletion', async ({ page }) => {
  await page.setContent('<section aria-label="Collection"><button>Removed book</button></section>');
  await expect(expectAbsentEntry(region(page, 'Collection'), 'Removed book')).rejects.toThrow();
});
