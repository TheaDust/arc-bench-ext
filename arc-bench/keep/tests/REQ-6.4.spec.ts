// requirement: REQ-6.4
import type { Page } from '@playwright/test';
import { test, expect, action, editor, openHome, createNote, note, expectNote, deleteNote, navigate,
  expectNoteInCollection, expectAlert } from './helpers';
import { identity } from './fixtures/data';
import { closeNote, field, openNote } from './support/note-identity';

const originalBody = 'Initially committed content';
const otherBody = 'Body committed in tab B';
const unsaved = 'Unsubmitted body in tab A';
const conflict = (page: Page) => page.getByRole('dialog', { name: 'Note edit conflict', exact: true });

async function openPair(page: Page, other: Page, title: string) {
  await openHome(page);
  await createNote(page, title, originalBody);
  await openHome(other);
  await openNote(page, title, originalBody);
  await openNote(other, title, originalBody);
}

test('REQ-6.4: Merge independent title and content edits from two tabs', async ({ page, context }, info) => {
  const title = identity(info, 'Merge note');
  const renamed = identity(info, 'Title committed in tab A');
  const other = await context.newPage();
  await openPair(page, other, title);
  await field(page, 'Title').fill(renamed);
  await field(other, 'Content').fill(otherBody);
  await closeNote(other);
  await expectNote(other, title, otherBody);
  await closeNote(page);
  await page.reload();
  await expectNote(page, renamed, otherBody);
  await expect(note(page, title)).toHaveCount(0);
});

test('REQ-6.4: Reload the latest note after a conflicting edit', async ({ page, context }, info) => {
  const title = identity(info, 'Conflicting note reload');
  const other = await context.newPage();
  await openPair(page, other, title);
  await field(page, 'Content').fill(unsaved);
  await field(other, 'Content').fill(otherBody);
  await closeNote(other);
  await expectNote(other, title, otherBody);
  await action(editor(page), 'Close').click();
  await expect(conflict(page)).toBeVisible();
  await action(conflict(page), 'Keep editing').click();
  await expect(conflict(page)).toBeHidden();
  await expect(field(page, 'Content')).toHaveValue(unsaved);
  await action(editor(page), 'Close').click();
  await action(conflict(page), 'Reload latest').click();
  await expect(conflict(page)).toBeHidden();
  await expect(field(page, 'Content')).toHaveValue(otherBody);
  await closeNote(page);
  await page.reload();
  await expectNote(page, title, otherBody);
});

test('REQ-6.4: Explicitly overwrite only conflicting note fields', async ({ page, context }, info) => {
  const title = identity(info, 'Conflicting note overwrite');
  const renamed = identity(info, 'Title committed in tab B');
  const other = await context.newPage();
  await openPair(page, other, title);
  await field(page, 'Content').fill(unsaved);
  await field(other, 'Title').fill(renamed);
  await field(other, 'Content').fill(otherBody);
  await closeNote(other);
  await expectNote(other, renamed, otherBody);
  await action(editor(page), 'Close').click();
  await expect(conflict(page)).toBeVisible();
  await other.reload();
  await expectNote(other, renamed, otherBody);
  await action(conflict(page), 'Overwrite').click();
  await expect(conflict(page)).toBeHidden();
  await page.reload();
  await expectNote(page, renamed, unsaved);
  await expect(note(page, title)).toHaveCount(0);
});

test('REQ-6.4: Reject a stale save after another tab deletes the note', async ({ page, context }, info) => {
  const title = identity(info, 'Deleted during editing');
  const other = await context.newPage();
  await openHome(page);
  await createNote(page, title, originalBody);
  await openNote(page, title, originalBody);
  await field(page, 'Content').fill(unsaved);
  await openHome(other);
  await expectNote(other, title, originalBody);
  await deleteNote(other, title);
  await action(editor(page), 'Close').click();
  await expectAlert(page, 'Note deleted elsewhere');
  await expect(field(page, 'Content')).toHaveValue(unsaved);
  await action(editor(page), 'Discard changes').click();
  await expect(editor(page)).toBeHidden();
  await page.reload();
  await expect(note(page, title)).toHaveCount(0);
  await navigate(page, 'Trash');
  await page.reload();
  await expectNoteInCollection(page, 'Deleted notes', title, originalBody);
});
