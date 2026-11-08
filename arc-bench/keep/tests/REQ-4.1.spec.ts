// requirement: REQ-4.1
import { test, expect, action, note, section, openHome, navigate, createNote, expectNote, expectSearchHighlights,
  archiveNote, deleteNote, expectNoteInCollection } from './helpers';
import { identity } from './fixtures/data';

test('REQ-4.1: Search title and content with highlights', async ({ page }, info) => {
  await openHome(page);
  const titleMatch = identity(info, 'Study schedule');
  const contentMatch = identity(info, 'Reading plan');
  const other = identity(info, 'Ocean memo');
  await createNote(page, titleMatch, 'Math on Monday');
  await createNote(page, contentMatch, 'Read a story');
  await createNote(page, other, 'Calm blue waves');
  const search = page.getByRole('searchbox', { name: 'Search', exact: true });
  await search.fill('st');
  await expect(note(page, titleMatch)).toHaveCount(1);
  await expect(note(page, contentMatch)).toHaveCount(1);
  await expect(note(page, other)).toBeHidden();
  // Named highlight regions provide the portable semantic highlight contract.
  for (const title of [titleMatch, contentMatch]) {
    await expectSearchHighlights(note(page, title), 'st');
  }
  await search.fill('');
  await navigate(page, 'Notes');
  await expectNote(page, titleMatch, 'Math on Monday');
  await expectNote(page, contentMatch, 'Read a story');
  await expectNote(page, other, 'Calm blue waves');
});

test('REQ-4.1: Exclude archived and deleted matches from search', async ({ page }, info) => {
  await openHome(page);
  const active = identity(info, 'Visible search note');
  const archived = identity(info, 'Archived search note');
  const deleted = identity(info, 'Deleted search note');
  const unrelated = identity(info, 'Unrelated search control');
  for (const title of [active, archived, deleted]) await createNote(page, title, 'Lifecyclekeyword searchable content');
  await createNote(page, unrelated, 'Unrelated content');
  await archiveNote(page, archived);
  await deleteNote(page, deleted);
  await navigate(page, 'Notes');
  await page.reload();
  const search = page.getByRole('searchbox', { name: 'Search', exact: true });
  await search.fill('LIFECYCLEKEYWORD');
  await expectNote(page, active);
  await expectSearchHighlights(note(page, active), 'LIFECYCLEKEYWORD');
  for (const title of [archived, deleted, unrelated]) await expect(note(page, title)).toBeHidden();
  await search.fill('');
  await navigate(page, 'Notes');
  await expectNote(page, active, 'Lifecyclekeyword searchable content');
  await expectNote(page, unrelated, 'Unrelated content');
  for (const title of [archived, deleted]) await expect(note(page, title)).toBeHidden();
  await navigate(page, 'Archived');
  await expectNoteInCollection(page, 'Archived notes', archived, 'Lifecyclekeyword searchable content');
  await note(page, archived).hover();
  await action(note(page, archived), `Unarchive ${archived}`).click();
  await navigate(page, 'Trash');
  await expectNoteInCollection(page, 'Deleted notes', deleted, 'Lifecyclekeyword searchable content');
  await note(page, deleted).hover();
  await action(note(page, deleted), `Restore ${deleted}`).click();
  await navigate(page, 'Notes');
  await page.reload();
  await search.fill('LIFECYCLEKEYWORD');
  for (const title of [active, archived, deleted]) {
    await expectNote(page, title);
    await expectSearchHighlights(note(page, title), 'LIFECYCLEKEYWORD');
  }
  await expect(note(page, unrelated)).toBeHidden();
});

test('REQ-4.1: Choose a suggested label filter', async ({ page }, info) => {
  await openHome(page);
  const matching = identity(info, 'Call dentist existing');
  const other = identity(info, 'Movie list');
  await createNote(page, matching, 'Reminder content', { labels: ['Reminders'] });
  await createNote(page, other, 'Unlabeled content');
  const search = page.getByRole('searchbox', { name: 'Search', exact: true });
  await search.click();
  await expect(section(page, 'Suggested filters')).toBeVisible();
  await action(section(page, 'Suggested filters'), 'Reminders').click();
  await expectNote(page, matching, 'Reminder content');
  await expect(note(page, other)).toBeHidden();
  await search.fill('');
  await navigate(page, 'Notes');
  await expectNote(page, matching, 'Reminder content');
  await expectNote(page, other, 'Unlabeled content');
});
