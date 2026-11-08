import { expect, type Page } from '@playwright/test';
import { button, entry, expectFieldValue, heading, records, region, text } from '../helpers';
import { formField, selectChoice } from './public-controls';

export const pageTitle = (page: Page) => page.getByRole('textbox', { name: 'Page title', exact: true });
export const pageBody = (page: Page) => page.getByRole('textbox', { name: 'Write your page content here...', exact: true });
export const pageConflict = (page: Page) => page.getByRole('dialog', { name: 'Page edit conflict', exact: true });

export async function expectReading(page: Page, title: string, body: string) {
  await heading(page, title);
  await text(page, body);
}

export async function expectEditor(page: Page, title: string, body: string) {
  await expectFieldValue(pageTitle(page), title);
  await expectFieldValue(pageBody(page), body);
}

export async function editPage(page: Page, title: string, body: string) {
  await expectReading(page, title, body);
  await button(page, 'Edit').click();
  await expectEditor(page, title, body);
}

export async function fillEditor(page: Page, title: string, body: string) {
  await pageTitle(page).fill(title);
  await pageBody(page).fill(body);
}

export async function moveContent(page: Page, kind: 'Chapter' | 'Page', destination: string,
  placement?: 'First' | 'Last') {
  const name = `Move ${kind}`;
  await button(page, name).click();
  const dialog = page.getByRole('dialog', { name, exact: true });
  await expect(dialog).toBeVisible();
  await selectChoice(formField(dialog, 'Destination book', 'combobox'), { label: destination });
  if (placement) await selectChoice(formField(dialog, 'Placement', 'combobox'), { label: placement });
  await button(dialog, 'Move').click();
  await expect(dialog).toBeHidden();
}

export async function expectBreadcrumb(page: Page, book: string, chapter?: string, formerBook?: string) {
  const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb', exact: true });
  const bookEntry = entry(breadcrumb, book);
  await expect(bookEntry).toHaveCount(1);
  await expect(bookEntry).toBeVisible();
  if (formerBook) await expect(entry(breadcrumb, formerBook)).toHaveCount(0);
  if (chapter) {
    const chapterEntry = entry(breadcrumb, chapter);
    await expect(chapterEntry).toHaveCount(1);
    await expect(chapterEntry).toBeVisible();
    // The contract specifies the order of the two ancestor controls.
    const names = await bookEntry.or(chapterEntry).all();
    await expect(names[0]).toHaveAccessibleName(book);
    await expect(names[1]).toHaveAccessibleName(chapter);
  }
}

export const chapterRecord = (page: Page, description: string) =>
  records(region(page, 'Chapter list')).filter({
    has: page.getByText(description, { exact: true }).filter({ visible: true }),
  });

export async function openRevision(page: Page, title: string, body: string) {
  const draft = entry(region(page, 'My Recent Drafts'), title);
  await expect(draft).toHaveCount(1);
  await draft.click();
  await expectEditor(page, title, body);
}
