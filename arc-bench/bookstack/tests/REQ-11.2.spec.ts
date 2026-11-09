// requirement: REQ-11.2
import { test, expect, type Page } from '@playwright/test';
import { createBook, createChapter, createPageInChapter, enter, entry, expectAbsentEntry, favorite, heading,
  home, identity, login, openBook, openChapter, openPageInChapter, openUrl, records, region, text } from './helpers';
import { chapterRecord, expectBreadcrumb, expectReading, moveContent } from './support/page-revisions';

const movedDescription = 'Source chapter with original pages.';
const otherDescription = 'Target chapter with independent pages.';
const originalBody = 'Body of the moved namesake page.';
const otherBody = 'Body of the target namesake page.';
const followupBody = 'Second page in the moved chapter.';

async function expectSourceEmpty(page: Page, source: string, chapter: string, ...titles: string[]) {
  await openBook(page, source);
  await expectAbsentEntry(region(page, 'Chapter list'), chapter);
  for (const title of titles) await expectAbsentEntry(region(page, 'Page list'), title);
}

test('REQ-11.2: Move a chapter without changing its pages', async ({ page }, info) => {
  const id = identity(info);
  await enter(page);
  await login(page);
  const source = await createBook(page, id, 'Original book');
  const target = await createBook(page, id, 'Receiving book');
  const chapter = await createChapter(page, id, source, 'Movable chapter', movedDescription);
  const title = await createPageInChapter(page, id, source, chapter, 'Movable page', originalBody);
  await openPageInChapter(page, source, chapter, title);
  await expectReading(page, title, originalBody);
  const readingUrl = page.url();
  await openChapter(page, source, chapter);
  await moveContent(page, 'Chapter', target, 'Last');
  await expectSourceEmpty(page, source, chapter, title);
  await openBook(page, target);
  await expect(entry(region(page, 'Page list'), title)).toHaveCount(1);
  await openChapter(page, target, chapter);
  await page.reload();
  await expectBreadcrumb(page, target, undefined, source);
  await text(page, movedDescription);
  await expect(entry(region(page, 'Page list'), title)).toHaveCount(1);
  await entry(region(page, 'Page list'), title).click();
  await expectReading(page, title, originalBody);
  await openUrl(page, readingUrl);
  await expectReading(page, title, originalBody);
  await expectBreadcrumb(page, target, chapter, source);
});

test('REQ-11.2: Move a same-title chapter and preserve its order and references', async ({ page }, info) => {
  const id = identity(info);
  await enter(page);
  await login(page);
  const source = await createBook(page, id, 'Source book');
  const target = await createBook(page, id, 'Target book');
  const chapter = await createChapter(page, id, source, 'Namesake chapter', movedDescription);
  const targetChapter = await createChapter(page, id, target, 'Namesake chapter', otherDescription);
  expect(targetChapter).toBe(chapter);
  const title = await createPageInChapter(page, id, source, chapter, 'Namesake page', originalBody);
  const followup = await createPageInChapter(page, id, source, chapter, 'Followup page', followupBody);
  const targetTitle = await createPageInChapter(page, id, target, chapter, 'Namesake page', otherBody);
  expect(targetTitle).toBe(title);
  await openPageInChapter(page, source, chapter, title);
  await expectReading(page, title, originalBody);
  const readingUrl = page.url();
  await favorite(page);
  await openChapter(page, source, chapter);
  const chaptersPages = region(page, 'Page list');
  const chapterPageOrder = () => entry(chaptersPages, title).or(entry(chaptersPages, followup));
  await expect(chapterPageOrder()).toHaveCount(2);
  const before = await chapterPageOrder().allTextContents();
  await moveContent(page, 'Chapter', target, 'First');
  await expectSourceEmpty(page, source, chapter, title, followup);
  await openBook(page, target);
  await page.reload();
  const list = region(page, 'Chapter list');
  const moved = chapterRecord(page, movedDescription);
  const other = chapterRecord(page, otherDescription);
  await expect(moved).toHaveCount(1);
  await expect(other).toHaveCount(1);
  await expect(records(list)).toHaveCount(2);
  await expect(records(list).nth(0)).toContainText(movedDescription);
  await expect(entry(list, chapter)).toHaveCount(2);
  await expect(entry(region(page, 'Page list'), title)).toHaveCount(2);
  await expect(entry(region(page, 'Page list'), followup)).toHaveCount(1);
  await entry(moved, chapter).click();
  await heading(page, chapter);
  await text(page, movedDescription);
  await expectBreadcrumb(page, target, undefined, source);
  await expect(chapterPageOrder()).toHaveCount(2);
  await expect.poll(() => chapterPageOrder().allTextContents()).toEqual(before);
  await entry(chaptersPages, followup).click();
  await expectReading(page, followup, followupBody);
  await expectBreadcrumb(page, target, chapter, source);
  const chapterNav = page.getByRole('navigation', { name: 'Chapter pages', exact: true });
  await expect(entry(chapterNav, title)).toHaveCount(1);
  await entry(chapterNav, title).click();
  await expectReading(page, title, originalBody);
  await expectBreadcrumb(page, target, chapter, source);
  await expect(entry(chapterNav, followup)).toHaveCount(1);
  await openUrl(page, readingUrl);
  await expectReading(page, title, originalBody);
  for (const area of ['My Most Viewed Favorites', 'My Recently Viewed']) {
    await home(page);
    const saved = entry(region(page, area), title);
    await expect(saved).toHaveCount(1);
    await saved.click();
    await expectReading(page, title, originalBody);
    await expectBreadcrumb(page, target, chapter, source);
  }

  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true });
  await entry(breadcrumb, chapter).click();
  await text(page, movedDescription);
  await entry(breadcrumb, target).click();
  await heading(page, target);

  // Open the other same-title chapter after checking the moved page's personal entries.
  await openBook(page, target);
  await entry(other, chapter).click();
  await text(page, otherDescription);
  await expectBreadcrumb(page, target);
  await expect(entry(chaptersPages, title)).toHaveCount(1);
  await expectAbsentEntry(chaptersPages, followup);
  await entry(chaptersPages, title).click();
  await expectReading(page, title, otherBody);
  await expectBreadcrumb(page, target, chapter, source);
  await expect(page.getByText(originalBody, { exact: true })).toHaveCount(0);
  await expect(entry(chapterNav, followup)).toHaveCount(0);
});
