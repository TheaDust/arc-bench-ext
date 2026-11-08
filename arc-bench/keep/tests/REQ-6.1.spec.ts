// requirement: REQ-6.1
import type { Page } from '@playwright/test';
import { test, expect, action, beginNote, editor, chooseLabels, openHome, createNote, createLabel,
  note, section, navigate, expectNote, expectNotice } from './helpers';
import { identity } from './fixtures/data';
import { closeNote, field, noteWithBody, openNote, restoreNote, unarchiveNote, expectLabel } from './support/note-identity';
import { expectLightGreenSurface } from './visual';

const firstBody = 'Alpha body for the pinned note';
const secondBody = 'Beta body for the regular note';
const search = (page: Page) => page.getByRole('searchbox', { name: 'Search', exact: true });

async function addTwin(page: Page, title: string, label?: string) {
  await beginNote(page);
  await field(page, 'Title').fill(title);
  await field(page, 'Content').fill(secondBody);
  if (label) {
    await action(editor(page), 'Change labels').click();
    await chooseLabels(page, [label]);
  }
  await closeNote(page);
  await expect(note(page, title)).toHaveCount(2);
}

async function expectPins(page: Page, pinned: string, regular: string) {
  await expect(noteWithBody(page, pinned, firstBody)).toBeVisible();
  await expect(noteWithBody(page, regular, secondBody)).toBeVisible();
  const pinnedCards = section(page, 'Pinned notes').getByRole('region', { name: pinned, exact: true });
  const regularCards = section(page, 'Other notes').getByRole('region', { name: regular, exact: true });
  await expect(pinnedCards).toHaveCount(1);
  await expect(pinnedCards).toContainText(firstBody);
  await expect(regularCards).toHaveCount(1);
  await expect(regularCards).toContainText(secondBody);
}

test('REQ-6.1: Show both same-title notes independently in search and layouts', async ({ page }, info) => {
  const title = identity(info, 'Twin memo');
  await openHome(page);
  await createNote(page, title, firstBody, { pinned: true });
  await addTwin(page, title);
  await expectPins(page, title, title);
  await search(page).fill('Twin memo');
  await expect(note(page, title)).toHaveCount(2);
  await expect(noteWithBody(page, title, firstBody)).toBeVisible();
  await expect(noteWithBody(page, title, secondBody)).toBeVisible();
  await search(page).fill('');
  await navigate(page, 'Notes');
  await action(page, 'List view').click();
  await expect(section(page, 'Notes')).toHaveAccessibleDescription(/List view/i);
  await expectPins(page, title, title);
  await page.reload();
  await expect(note(page, title)).toHaveCount(2);
  await expectPins(page, title, title);
});

test('REQ-6.1: Edit and restore the correct same-title note across collections', async ({ page }, info) => {
  const title = identity(info, 'Twin memo');
  const renamed = identity(info, 'Renamed first memo');
  const firstLabel = identity(info, 'First twin label');
  const secondLabel = identity(info, 'Second twin label');
  await openHome(page);
  await createLabel(page, firstLabel);
  await createLabel(page, secondLabel);
  await createNote(page, title, firstBody, { pinned: true, green: true, labels: [firstLabel] });
  await addTwin(page, title, secondLabel);
  await navigate(page, firstLabel);
  await expect(note(page, title)).toHaveCount(1);
  await openNote(page, title, firstBody);
  await field(page, 'Title').fill(renamed);
  await closeNote(page);
  await expectNote(page, renamed, firstBody);
  await expect(note(page, title)).toHaveCount(0);
  await navigate(page, 'Notes');
  await expectPins(page, renamed, title);
  const second = noteWithBody(page, title, secondBody);
  await second.hover();
  await action(second, `Archive ${title}`).click();
  await expectNotice(page, 'Note archived');
  await expect(second).toHaveCount(0);
  await expectNote(page, renamed, firstBody);
  await navigate(page, 'Archived');
  const archived = section(page, 'Archived notes').getByRole('region', { name: title, exact: true });
  await expect(archived).toHaveCount(1);
  await expect(archived).toContainText(secondBody);
  await expect(note(page, renamed)).toHaveCount(0);
  await archived.hover();
  await action(archived, `More options ${title}`).click();
  await page.getByRole('menuitem', { name: 'Delete Note', exact: true }).click();
  await expect(archived).toHaveCount(0);
  await restoreNote(page, title, secondBody);
  await expect(note(page, renamed)).toHaveCount(0);
  await unarchiveNote(page, title, secondBody);
  await navigate(page, 'Notes');
  await search(page).fill('Twin memo');
  await expectNote(page, title, secondBody);
  await expect(note(page, renamed)).toHaveCount(0);
  await search(page).fill('');
  await navigate(page, 'Notes');
  await action(page, 'List view').click();
  await expect(section(page, 'Notes')).toHaveAccessibleDescription(/List view/i);
  await page.reload();
  await expectNote(page, renamed, firstBody);
  await expectNote(page, title, secondBody);
  await expectPins(page, renamed, title);
  await expectLabel(note(page, renamed), firstLabel, true);
  await expectLabel(note(page, renamed), secondLabel, false);
  await expectLabel(second, secondLabel, true);
  await expectLabel(second, firstLabel, false);
  await expectLightGreenSurface(note(page, renamed));
  await second.hover();
  await expect(action(second, `Background color ${title}`)).toBeVisible();
});
