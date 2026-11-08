import { test, expect } from '@playwright/test';
import { noteWithBody } from '../arc-bench/keep/tests/support/note-identity';
import { chapterRecord, expectBreadcrumb } from '../arc-bench/bookstack/tests/support/page-revisions';
import { entry } from '../arc-bench/bookstack/tests/helpers';

test('Keep addresses the same-title note by its own visible body', async ({ page }) => {
  await page.setContent(`
    <section aria-label="Twin"><p>Alpha</p><button onclick="location.hash='alpha'">Open Twin</button></section>
    <section aria-label="Twin"><p>Beta</p><button onclick="location.hash='beta'">Open Twin</button></section>
    <section aria-label="Twin"><p hidden>Beta</p><p>Gamma</p><button>Open Twin</button></section>
  `);
  const beta = noteWithBody(page, 'Twin', 'Beta');
  await expect(beta).toHaveCount(1);
  await beta.getByRole('button', { name: 'Open Twin', exact: true }).click();
  await expect(page).toHaveURL(/#beta$/);
  await page.setContent('<section aria-label="Twin"><p>Alpha</p></section><p>Beta</p>');
  await expect(noteWithBody(page, 'Twin', 'Beta')).toHaveCount(0);
});

test('Keep does not silently choose between duplicate visible identities', async ({ page }) => {
  const card = '<section aria-label="Twin"><p>Beta</p><button>Open Twin</button></section>';
  await page.setContent(card + card);
  const open = noteWithBody(page, 'Twin', 'Beta').getByRole('button', { name: 'Open Twin', exact: true });
  await expect(open.click()).rejects.toThrow(/strict mode/);
});

for (const role of ['listitem', 'row']) {
  test(`BookStack scopes namesake chapter actions to their ${role} and visible description`, async ({ page }) => {
    await page.setContent(`
      <section aria-label="Chapter list">
        <div role="${role}"><span>Moved chapter description</span><a href="#moved">Twin</a></div>
        <div role="${role}"><span>Other chapter description</span><button>Twin</button></div>
        <div role="${role}"><span hidden>Moved chapter description</span><button>Decoy</button></div>
      </section>
      <div role="${role}"><span>Moved chapter description</span><button>Twin</button></div>
    `);
    const chapter = chapterRecord(page, 'Moved chapter description');
    await expect(chapter).toHaveCount(1);
    await entry(chapter, 'Twin').click();
    await expect(page).toHaveURL(/#moved$/);
    await expect(chapterRecord(page, 'Missing description')).toHaveCount(0);
  });
}

test('BookStack checks current ancestor order, rejecting former and reversed ancestry', async ({ page }) => {
  const crumbs = (content: string) => `<nav aria-label="Breadcrumb">${content}</nav>`;
  const book = '<a href="#target">Target</a>', chapter = '<button>Chapter</button>';
  await page.setContent(crumbs(book + chapter));
  await expectBreadcrumb(page, 'Target', 'Chapter', 'Source');
  await page.setContent(crumbs(chapter + book));
  await expect(expectBreadcrumb(page, 'Target', 'Chapter', 'Source')).rejects.toThrow();
  await page.setContent(crumbs('<a href="#source">Source</a>' + book + chapter));
  await expect(expectBreadcrumb(page, 'Target', 'Chapter', 'Source')).rejects.toThrow();
});
