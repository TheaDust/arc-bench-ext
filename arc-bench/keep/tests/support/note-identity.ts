import type { Locator, Page } from '@playwright/test';
import { action, editor, expect, navigate, note, section } from '../helpers';

export const noteWithBody = (page: Page, title: string, body: string) =>
  note(page, title).filter({ has: page.getByText(body, { exact: true }).filter({ visible: true }) });

export const field = (page: Page, name: 'Title' | 'Content') =>
  editor(page).getByRole('textbox', { name, exact: true });

export async function openNote(page: Page, title: string, body: string) {
  const card = noteWithBody(page, title, body);
  await expect(card).toHaveCount(1);
  await action(card, `Open ${title}`).click();
  await expect(field(page, 'Title')).toHaveValue(title);
  await expect(field(page, 'Content')).toHaveValue(body);
}

export async function closeNote(page: Page) {
  await action(editor(page), 'Close').click();
  await expect(editor(page)).toBeHidden();
}

export async function restoreNote(page: Page, title: string, body: string) {
  await navigate(page, 'Trash');
  const card = noteWithBody(page, title, body);
  await expect(section(page, 'Deleted notes').getByRole('region', { name: title, exact: true })).toHaveCount(1);
  await card.hover();
  await action(card, `Restore ${title}`).click();
  await expect(note(page, title)).toHaveCount(0);
}

export async function unarchiveNote(page: Page, title: string, body: string) {
  await navigate(page, 'Archived');
  const card = noteWithBody(page, title, body);
  await expect(section(page, 'Archived notes').getByRole('region', { name: title, exact: true })).toHaveCount(1);
  await card.hover();
  await action(card, `Unarchive ${title}`).click();
  await expect(note(page, title)).toHaveCount(0);
}

export async function expectLabel(card: Locator, label: string, present: boolean) {
  const badges = card.getByText(label, { exact: true }).filter({ visible: true });
  if (present) await expect(badges).not.toHaveCount(0);
  else await expect(badges).toHaveCount(0);
}
