import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNotice } from './support/observable';
export { test, expect };
export { alertMessage, expectAlert, expectNotice, liveRegion, notice, openUrl, reopen, visibleMessage } from './support/observable';
export const action = (scope: Page | Locator, name: string) =>
  scope.getByRole('button', { name, exact: true });
export const note = (page: Page, title: string) =>
  page.getByRole('region', { name: title, exact: true });
export const section = (page: Page, name: string) =>
  page.getByRole('region', { name, exact: true });
export const editor = (page: Page) => page.getByRole('dialog', { name: 'Note editor', exact: true });

/** Presence may have repeated visible copies; action and note identities stay unique. */
export async function expectVisibleText(scope: Page | Locator, value: string) {
  await expect.poll(() => scope.getByText(value, { exact: true }).filter({ visible: true }).count()).toBeGreaterThan(0);
}
export async function expectSearchHighlights(scope: Locator, keyword: string) {
  const fragments = scope.getByRole('region', { name: `Highlight ${keyword}`, exact: true }).filter({ visible: true });
  await expect.poll(() => fragments.count()).toBeGreaterThan(0);
  const exactKeyword = new RegExp(`^${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  for (const fragment of await fragments.all()) await expect(fragment).toHaveText(exactKeyword);
}
export async function expectEmptyTrash(page: Page) {
  const deleted = section(page, 'Deleted notes');
  // A genuine empty collection may have zero rendered area. The role query
  // excludes hidden/aria-hidden collections without requiring a placeholder.
  await expect(deleted).toHaveCount(1);
  await expect(deleted.getByRole('region')).toHaveCount(0);
}
export async function completeEmptyTrash(page: Page) {
  const confirmation = page.getByRole('dialog', { name: 'Empty Trash', exact: true });
  const deleted = section(page, 'Deleted notes');
  // Optional confirmation and an already empty visible collection may coexist.
  await expect.poll(async () => await confirmation.isVisible()
    || (await deleted.count() === 1 && await deleted.getByRole('region').count() === 0)).toBe(true);
  if (await confirmation.isVisible()) await action(confirmation, 'Empty Trash').click();
  await expectEmptyTrash(page);
}

export async function openHome(page: Page) {
  await page.goto('/');
  await expect(action(page, 'Take a note')).toBeVisible();
}
export async function navigate(page: Page, name: string) {
  await action(page.getByRole('navigation', { name: 'Sidebar', exact: true }), name).click();
}
export async function beginNote(page: Page) {
  await action(page, 'Take a note').click();
  await expect(editor(page)).toBeVisible();
}
export async function createNote(page: Page, title: string, content: string,
  options: { pinned?: boolean; labels?: string[]; green?: boolean } = {}) {
  await beginNote(page);
  await editor(page).getByRole('textbox', { name: 'Title', exact: true }).fill(title);
  await editor(page).getByRole('textbox', { name: 'Content', exact: true }).fill(content);
  if (options.pinned) await action(editor(page), 'Pin note').click();
  if (options.green) {
    await action(editor(page), 'Background color').click();
    await action(page, 'Light green').click();
  }
  if (options.labels) {
    await action(editor(page), 'Change labels').click();
    await chooseLabels(page, options.labels);
  }
  await action(editor(page), 'Close').click();
  await expect(editor(page)).toBeHidden();
  await expectNote(page, title, content);
}
export async function expectNote(page: Page, title: string, content?: string) {
  await expect(note(page, title)).toHaveCount(1);
  await expect(note(page, title)).toBeVisible();
  await expectVisibleText(note(page, title), title);
  if (content !== undefined) await expectVisibleText(note(page, title), content);
}
export async function expectNoteInCollection(page: Page, collection: string, title: string, content: string) {
  await expectNote(page, title, content);
  await expect(section(page, collection).getByRole('region', { name: title, exact: true })).toHaveCount(1);
}
export async function more(page: Page, title: string) {
  await note(page, title).hover();
  await action(note(page, title), `More options ${title}`).click();
}
export async function deleteNote(page: Page, title: string) {
  await more(page, title);
  await page.getByRole('menuitem', { name: 'Delete Note', exact: true }).click();
  await expect(note(page, title)).toBeHidden();
  await expectNotice(page, 'Note deleted');
}
export async function archiveNote(page: Page, title: string) {
  await note(page, title).hover();
  await action(note(page, title), `Archive ${title}`).click();
  await expect(note(page, title)).toBeHidden();
  await expectNotice(page, 'Note archived');
}
export async function labelManager(page: Page) {
  await navigate(page, 'Edit Labels');
  const dialog = page.getByRole('dialog', { name: 'Edit Labels', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}
export async function createLabel(page: Page, label: string) {
  const dialog = await labelManager(page);
  await dialog.getByRole('textbox', { name: 'New label', exact: true }).fill(label);
  await action(dialog, 'Create label').click();
  await expect(dialog.getByRole('textbox', { name: `Label name ${label}`, exact: true })).toHaveValue(label);
  await action(dialog, 'Done').click();
  await expect(dialog).toBeHidden();
  await expect(action(page.getByRole('navigation', { name: 'Sidebar', exact: true }), label)).toBeVisible();
}
export async function chooseLabels(page: Page, labels: string[], checked = true) {
  const dialog = page.getByRole('dialog', { name: 'Note labels', exact: true });
  await expect(dialog).toBeVisible();
  for (const label of labels) {
    const control = dialog.getByRole('checkbox', { name: label, exact: true });
    await control.setChecked(checked);
    await expect(control).toBeChecked({ checked });
  }
  await action(dialog, 'Done').click();
  await expect(dialog).toBeHidden();
}
export async function assignLabels(page: Page, title: string, labels: string[], checked = true) {
  await more(page, title);
  await page.getByRole('menuitem', { name: 'Change labels', exact: true }).click();
  await chooseLabels(page, labels, checked);
}
export async function settingsDialog(page: Page) {
  await action(page, 'Settings menu').click();
  await page.getByRole('menuitem', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function expectMultipleColumns(surfaces: Locator[]) {
  await expect.poll(async () => {
    const boxes = await Promise.all(surfaces.map(bounds));
    return boxes.some((left, index) => boxes.some((right, other) => other > index
      && (left.x + left.width <= right.x || right.x + right.width <= left.x)
      && Math.min(left.y + left.height, right.y + right.height) > Math.max(left.y, right.y)));
  }).toBe(true);
}

export async function expectSingleColumn(surfaces: Locator[]) {
  await expect.poll(async () => {
    const boxes = await Promise.all(surfaces.map(bounds));
    const sharedVerticalLine = Math.max(...boxes.map(box => box.x))
      < Math.min(...boxes.map(box => box.x + box.width));
    const separatedRows = boxes.every((box, index) => boxes.every((other, otherIndex) =>
      index === otherIndex || box.y + box.height <= other.y || other.y + other.height <= box.y));
    return sharedVerticalLine && separatedRows;
  }).toBe(true);
}

export async function bounds(surface: Locator) {
  await expect(surface).toBeVisible();
  const box = await surface.boundingBox();
  if (!box) throw new Error('Visible note has no rendered bounds');
  return box;
}
