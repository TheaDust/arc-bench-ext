// requirement: REQ-6.2
import { test, expect, action, openHome, createLabel, createNote, archiveNote, deleteNote,
  labelManager, navigate, note, expectNote, assignLabels } from './helpers';
import { identity } from './fixtures/data';
import { closeNote, field, openNote, restoreNote, unarchiveNote, expectLabel } from './support/note-identity';

test('REQ-6.2: Recreate a label without inheriting old memberships', async ({ page, context }, info) => {
  const project = identity(info, 'Project');
  const retained = identity(info, 'Retained');
  const active = identity(info, 'Active project note');
  const archived = identity(info, 'Archived project note');
  const deleted = identity(info, 'Deleted project note');
  const bodies = ['Active body', 'Archived body', 'Deleted body'];
  const titles = [active, archived, deleted];
  await openHome(page);
  await createLabel(page, project);
  await createLabel(page, retained);
  for (const [i, title] of titles.entries()) {
    await createNote(page, title, bodies[i], { labels: [project, retained] });
    await expectLabel(note(page, title), project, true);
    await expectLabel(note(page, title), retained, true);
  }
  await archiveNote(page, archived);
  await deleteNote(page, deleted);
  await openNote(page, active, bodies[0]);
  const updated = 'Text saved by the stale editor';
  await field(page, 'Content').fill(updated);

  const other = await context.newPage();
  try {
    await openHome(other);
    await expectNote(other, active, bodies[0]);
    const dialog = await labelManager(other);
    await action(dialog, `Delete label ${project}`).click();
    await expect(dialog.getByRole('textbox', { name: `Label name ${project}`, exact: true })).toHaveCount(0);
    await action(dialog, 'Done').click();
    await createLabel(other, project);
    await navigate(other, project);
    for (const title of titles) await expect(note(other, title)).toHaveCount(0);
    await closeNote(page);
    await page.reload();
    await expectNote(page, active, updated);
    await expectLabel(note(page, active), project, false);
    await restoreNote(page, deleted, bodies[2]);
    await unarchiveNote(page, archived, bodies[1]);
    await navigate(page, 'Notes');
    for (const [i, title] of titles.entries()) {
      await expectNote(page, title, i === 0 ? updated : bodies[i]);
      await expectLabel(note(page, title), retained, true);
      await expectLabel(note(page, title), project, false);
    }
    await assignLabels(page, deleted, [project]);
    await navigate(page, project);
    await page.reload();
    await expectNote(page, deleted, bodies[2]);
    await expectLabel(note(page, deleted), retained, true);
    await expectLabel(note(page, deleted), project, true);
    await expect(note(page, active)).toHaveCount(0);
    await expect(note(page, archived)).toHaveCount(0);
  } finally {
    await other.close();
  }
});
