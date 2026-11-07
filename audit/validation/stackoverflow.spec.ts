import { test, expect } from '@playwright/test';
import { action, expectPresence, expectTimestamp, expectUtcDate, ownedByPost, output,
  post, region, visitFeed, noUsableAction } from '../../arc-bench/stackoverflow/tests/helpers';

test('stackoverflow ordinary feedback may repeat while actions stay strict', async ({ page }) => {
  await page.setContent('<p>Saved</p><p>Saved</p><button>Save edits</button><button>Save edits</button>');
  await expectPresence(page.getByText('Saved', { exact: true }));
  await expect(action(page, 'Save edits').click()).rejects.toThrow(/strict mode/);
});

test('stackoverflow feedback must be visible and have the expected identity', async ({ page }) => {
  await page.setContent('<p hidden>Saved</p><p>Rejected</p>');
  await expect(expectPresence(page.getByText('Saved', { exact: true }))).rejects.toThrow();
});

test('stackoverflow explicit business button role cannot be replaced by a link', async ({ page }) => {
  await page.setContent('<a href="#save">Save edits</a><button>Save edits elsewhere</button>');
  await expect(action(page, 'Save edits')).toHaveCount(0);
});

for (const spelling of ['2026-07-01', 'July 1, 2026', '1 Jul 2026', '2026-07-01T12:00:00Z', '2026-07-01T12:00:00']) {
  test(`stackoverflow UTC date accepts ${spelling}`, async ({ page }) => {
    await page.setContent(`<output aria-label="Asked">${spelling}</output>`);
    await expectUtcDate(output(page, 'Asked'), '2026-07-01');
  });
}

test('stackoverflow a different date remains a failure', async ({ page }) => {
  await page.setContent('<output aria-label="Asked">July 2, 2026</output>');
  await expect(expectUtcDate(output(page, 'Asked'), '2026-07-01')).rejects.toThrow();
});

test('stackoverflow question metadata excludes nested answer metadata', async ({ page }) => {
  await page.setContent('<section aria-label="Question post"><output aria-label="Asked">1 Jul 2026</output><section aria-label="Answers"><section aria-label="Answer by Helpful User"><output aria-label="Asked">2 Jul 2026</output></section></section></section>');
  await expectUtcDate(await ownedByPost(post(page), output(post(page), 'Asked')), '2026-07-01');
});

test('stackoverflow the answer date cannot compensate for a wrong question date', async ({ page }) => {
  await page.setContent('<section aria-label="Question post"><output aria-label="Asked">2 Jul 2026</output><section aria-label="Answers"><section aria-label="Answer by Helpful User"><output aria-label="Asked">1 Jul 2026</output></section></section></section>');
  await expect(expectUtcDate(await ownedByPost(post(page), output(post(page), 'Asked')), '2026-07-01')).rejects.toThrow();
});

for (const timestamp of ['12:02', '21 July 2026', 'July 21', '2 minutes ago', 'just now', '<time datetime="2026-07-21T12:02:00Z">today at noon</time>']) {
  test(`stackoverflow comment timestamp accepts public ${timestamp}`, async ({ page }) => {
    await page.setContent(`<section aria-label="Comment sample"><p>Question?</p><span>${timestamp}</span></section>`);
    await expectTimestamp(region(page, 'Comment sample'));
  });
}

test('stackoverflow a hidden timestamp does not establish visible comment metadata', async ({ page }) => {
  await page.setContent('<section aria-label="Comment sample"><p>Question?</p><time hidden datetime="2026-07-21T12:02:00Z">12:02</time></section>');
  await expect(expectTimestamp(region(page, 'Comment sample'))).rejects.toThrow();
});

const summary = (title: string) => `<section aria-label="Question ${title}"><button>${title}</button></section>`;

test('stackoverflow feed inspection reaches a required identity on a later page', async ({ page }) => {
  await page.setContent(`<section aria-label="Question feed">${summary('newer')}<button>Next page</button></section>`);
  await page.getByRole('button', { name: 'Next page', exact: true }).evaluate((button, next) => {
    button.addEventListener('click', () => { button.parentElement!.innerHTML = next; });
  }, `${summary('historical')}<button disabled>Next page</button>`);
  const found: string[] = [];
  await visitFeed(page, async feed => {
    for (const name of ['newer', 'historical'])
      if (await region(feed, `Question ${name}`).isVisible()) found.push(name);
  });
  expect(found).toEqual(['newer', 'historical']);
});

test('stackoverflow required feed identity cannot be borrowed from an unrelated widget', async ({ page }) => {
  await page.setContent(`${summary('historical')}<section aria-label="Question feed">${summary('other')}<button disabled>Next page</button></section>`);
  let seen = false;
  await visitFeed(page, async feed => { seen ||= await region(feed, 'Question historical').isVisible(); });
  expect(seen).toBe(false);
});

test('stackoverflow feed pagination that does not advance is rejected', async ({ page }) => {
  await page.setContent(`<section aria-label="Question feed">${summary('other')}<button>Next page</button></section>`);
  await expect(visitFeed(page, async () => {})).rejects.toThrow();
});

test('stackoverflow discovery stops inspecting the old listing after opening its target', async ({ page }) => {
  await page.setContent(`<section aria-label="Question feed">${summary('target')}<button disabled>Next page</button></section>`);
  await page.getByRole('button', { name: 'target', exact: true }).evaluate(button => {
    button.addEventListener('click', () => { document.body.innerHTML = '<h1>target detail</h1>'; });
  });
  await visitFeed(page, async feed => {
    await action(feed, 'target').click();
    return true;
  });
  await expect(page.getByRole('heading', { name: 'target detail', exact: true })).toBeVisible();
});

test('stackoverflow an empty named results or personal-list region may have zero area', async ({ page }) => {
  await page.setContent('<section aria-label="Search results"></section><section aria-label="Saved filters"></section>');
  await expect(region(page, 'Search results')).toHaveCount(1);
  await expect(region(page, 'Saved filters')).toHaveCount(1);
  await expect(action(region(page, 'Search results'), 'Deleted title')).toHaveCount(0);
  await page.setContent('<section hidden aria-label="Search results"></section>');
  await expect(region(page, 'Search results')).toHaveCount(0);
  await page.setContent('<main>Search failed</main>');
  await expect(region(page, 'Search results')).toHaveCount(0);
});

test('stackoverflow public deletion tolerates retained hidden text but not visible stale text', async ({ page }) => {
  await page.setContent('<section aria-label="Answers"><p hidden>Deleted answer</p></section>');
  await expect(region(page, 'Answers').getByText('Deleted answer', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await page.setContent('<section aria-label="Answers"><p>Deleted answer</p></section>');
  await expect(region(page, 'Answers').getByText('Deleted answer', { exact: true }).filter({ visible: true })).toHaveCount(1);
});

test('stackoverflow prohibited operations can be absent hidden or disabled', async ({ page }) => {
  await page.setContent('<section aria-label="Question post"><button disabled>Delete</button><button hidden>Edit</button></section>');
  await noUsableAction(post(page), 'Delete');
  await noUsableAction(post(page), 'Edit');
  await page.setContent('<section aria-label="Question post"><button>Delete</button></section>');
  await expect(noUsableAction(post(page), 'Delete')).rejects.toThrow();
});
