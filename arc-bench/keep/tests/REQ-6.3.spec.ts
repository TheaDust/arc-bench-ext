// requirement: REQ-6.3
import { test, expect, action, openHome, createLabel, createNote, labelManager, deleteNote, note, notice,
  expectNote, expectNotice, navigate, section } from './helpers';
import { identity } from './fixtures/data';
import { closeNote, field, openNote, expectLabel } from './support/note-identity';

test('REQ-6.3: Undo a deletion after a label rename and another note edit', async ({ page }, info) => {
  const label = identity(info, 'Undo original label');
  const renamed = identity(info, 'Undo renamed label');
  const pinned = identity(info, 'Undo pinned note');
  const other = identity(info, 'Independent note');
  await openHome(page);
  await createLabel(page, label);
  await createNote(page, pinned, 'Original pinned body', { pinned: true, labels: [label] });
  await createNote(page, other, 'Original separate body');
  await expect(section(page, 'Pinned notes').getByRole('region', { name: pinned, exact: true })).toHaveCount(1);
  await deleteNote(page, pinned);
  const undo = action(notice(page, 'Note deleted'), 'Undo');
  await expect(undo).toBeVisible();
  const dialog = await labelManager(page);
  await dialog.getByRole('textbox', { name: `Label name ${label}`, exact: true }).fill(renamed);
  await action(dialog, `Save label ${label}`).click();
  await action(dialog, 'Done').click();
  await openNote(page, other, 'Original separate body');
  await field(page, 'Content').fill('Later separate body');
  await closeNote(page);
  await expectNote(page, other, 'Later separate body');
  await expect(note(page, pinned)).toHaveCount(0);
  await undo.click();
  await expectNotice(page, 'Action undone');
  await page.reload();
  await expectNote(page, pinned, 'Original pinned body');
  await expect(section(page, 'Pinned notes').getByRole('region', { name: pinned, exact: true })).toHaveCount(1);
  await expectLabel(note(page, pinned), renamed, true);
  await expectLabel(note(page, pinned), label, false);
  const sidebar = page.getByRole('navigation', { name: 'Sidebar', exact: true });
  await expect(action(sidebar, renamed)).toBeVisible();
  await expect(action(sidebar, label)).toHaveCount(0);
  await expectNote(page, other, 'Later separate body');
  await navigate(page, 'Trash');
  await expect(note(page, pinned)).toHaveCount(0);
});
