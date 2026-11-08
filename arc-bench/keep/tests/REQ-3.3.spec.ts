// requirement: REQ-3.3
import { test, expect, action, note, openHome, navigate, createNote, createLabel, labelManager, expectNote,
  expectNoteInCollection, expectVisibleText, archiveNote, deleteNote } from './helpers';
import { identity } from './fixtures/data';

test('REQ-3.3: Rename a label and retain membership', async ({ page }, info) => {
  await openHome(page);
  const original = identity(info, 'Work editable');
  const renamed = identity(info, 'Work renamed');
  const title = identity(info, 'Label rename control');
  await createLabel(page, original);
  await createNote(page, title, 'Retain label membership', { labels: [original] });
  const dialog = await labelManager(page);
  await dialog.getByRole('textbox', { name: `Label name ${original}`, exact: true }).fill(renamed);
  await action(dialog, `Save label ${original}`).click();
  await action(dialog, 'Done').click();
  await page.reload();
  const sidebar = page.getByRole('navigation', { name: 'Sidebar', exact: true });
  await expect(action(sidebar, original)).toHaveCount(0);
  await expect(action(sidebar, renamed)).toHaveCount(1);
  await expect(note(page, title).getByText(original, { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expectVisibleText(note(page, title), renamed);
  await navigate(page, renamed);
  await expectNote(page, title, 'Retain label membership');
});

test('REQ-3.3: Rename a label across active archived and deleted notes', async ({ page }, info) => {
  await openHome(page);
  const original = identity(info, 'Lifecycle label');
  const renamed = identity(info, 'Renamed lifecycle label');
  const active = identity(info, 'Labeled active note');
  const archived = identity(info, 'Labeled archived note');
  const deleted = identity(info, 'Labeled deleted note');
  await createLabel(page, original);
  for (const title of [active, archived, deleted]) await createNote(page, title, 'Retain this membership', { labels: [original] });
  await archiveNote(page, archived);
  await deleteNote(page, deleted);
  const dialog = await labelManager(page);
  await dialog.getByRole('textbox', { name: `Label name ${original}`, exact: true }).fill(renamed);
  await action(dialog, `Save label ${original}`).click();
  await action(dialog, 'Done').click();
  await expect(dialog).toBeHidden();
  await page.reload();
  const sidebar = page.getByRole('navigation', { name: 'Sidebar', exact: true });
  await expect(action(sidebar, original)).toHaveCount(0);
  await expect(action(sidebar, renamed)).toHaveCount(1);
  for (const [view, collection, title] of [['Notes', 'Other notes', active], ['Archived', 'Archived notes', archived],
    ['Trash', 'Deleted notes', deleted]]) {
    await navigate(page, view);
    await expectNoteInCollection(page, collection, title, 'Retain this membership');
    await expectVisibleText(note(page, title), renamed);
    await expect(note(page, title).getByText(original, { exact: true }).filter({ visible: true })).toHaveCount(0);
    for (const absent of [active, archived, deleted].filter(value => value !== title)) await expect(note(page, absent)).toBeHidden();
  }
  await note(page, deleted).hover();
  await action(note(page, deleted), `Restore ${deleted}`).click();
  await expect(note(page, deleted)).toBeHidden();
  await navigate(page, renamed);
  await expectNote(page, active, 'Retain this membership');
  await expectNote(page, deleted, 'Retain this membership');
  await expectVisibleText(note(page, deleted), renamed);
  await expect(note(page, archived)).toBeHidden();
});

test('REQ-3.3: Delete a label across active archived and deleted notes', async ({ page }, info) => {
  await openHome(page);
  const removed = identity(info, 'Remove lifecycle label');
  const retained = identity(info, 'Keep lifecycle label');
  const active = identity(info, 'Active label removal');
  const archived = identity(info, 'Archived label removal');
  const deleted = identity(info, 'Deleted label removal');
  await createLabel(page, removed);
  await createLabel(page, retained);
  for (const title of [active, archived, deleted]) await createNote(page, title, 'Preserve this content', { labels: [removed, retained] });
  await archiveNote(page, archived);
  await deleteNote(page, deleted);
  const dialog = await labelManager(page);
  await action(dialog, `Delete label ${removed}`).click();
  await action(dialog, 'Done').click();
  await expect(dialog).toBeHidden();
  await page.reload();
  const sidebar = page.getByRole('navigation', { name: 'Sidebar', exact: true });
  await expect(action(sidebar, removed)).toHaveCount(0);
  await expect(action(sidebar, retained)).toHaveCount(1);
  for (const [view, collection, title] of [['Notes', 'Other notes', active], ['Archived', 'Archived notes', archived],
    ['Trash', 'Deleted notes', deleted]]) {
    await navigate(page, view);
    await expectNoteInCollection(page, collection, title, 'Preserve this content');
    await expect(note(page, title).getByText(removed, { exact: true }).filter({ visible: true })).toHaveCount(0);
    await expectVisibleText(note(page, title), retained);
    for (const absent of [active, archived, deleted].filter(value => value !== title)) await expect(note(page, absent)).toBeHidden();
  }
  await note(page, deleted).hover();
  await action(note(page, deleted), `Restore ${deleted}`).click();
  await expect(note(page, deleted)).toBeHidden();
  await navigate(page, 'Archived');
  await note(page, archived).hover();
  await action(note(page, archived), `Unarchive ${archived}`).click();
  await navigate(page, retained);
  for (const title of [active, archived, deleted]) {
    await expectNote(page, title, 'Preserve this content');
    await expectVisibleText(note(page, title), retained);
    await expect(note(page, title).getByText(removed, { exact: true }).filter({ visible: true })).toHaveCount(0);
  }
  await action(note(page, deleted), `Open ${deleted}`).click();
  const edit = page.getByRole('dialog', { name: 'Note editor', exact: true });
  await action(edit, 'Change labels').click();
  const chooser = page.getByRole('dialog', { name: 'Note labels', exact: true });
  await expect(chooser).toBeVisible();
  await expect(chooser.getByRole('checkbox', { name: removed, exact: true })).toHaveCount(0);
  await expect(chooser.getByRole('checkbox', { name: retained, exact: true })).toBeChecked();
  await action(chooser, 'Done').click();
  await expect(chooser).toBeHidden();
  await action(edit, 'Close').click();
  await expect(edit).toBeHidden();
  await page.reload();
  await navigate(page, 'Notes');
  for (const title of [active, archived, deleted]) {
    await expectNote(page, title, 'Preserve this content');
    await expect(note(page, title).getByText(removed, { exact: true }).filter({ visible: true })).toHaveCount(0);
  }
});

test('REQ-3.3: Delete a label without deleting its note', async ({ page }, info) => {
  await openHome(page);
  const label = identity(info, 'Disposable label');
  const title = identity(info, 'Label delete control');
  await createLabel(page, label);
  await createNote(page, title, 'Keep this labeled note', { labels: [label] });
  const dialog = await labelManager(page);
  await action(dialog, `Delete label ${label}`).click();
  await action(dialog, 'Done').click();
  await page.reload();
  await expect(action(page.getByRole('navigation', { name: 'Sidebar', exact: true }), label)).toHaveCount(0);
  await expectNote(page, title, 'Keep this labeled note');
  await expect(note(page, title).getByText(label, { exact: true }).filter({ visible: true })).toHaveCount(0);
});
