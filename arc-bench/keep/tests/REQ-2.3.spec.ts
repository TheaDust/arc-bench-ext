// requirement: REQ-2.3
import { test, expect, action, note, editor, section, openHome, navigate, createNote, createLabel,
  expectNote, expectNoteInCollection, expectVisibleText } from './helpers';
import { identity } from './fixtures/data';

test('REQ-2.3: Save an edited note', async ({ page }, info) => {
  await openHome(page);
  const title = identity(info, 'Project ideas');
  await createNote(page, title, 'Initial editable content');
  await action(note(page, title), `Open ${title}`).click();
  await expect(editor(page).getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(title);
  const content = editor(page).getByRole('textbox', { name: 'Content', exact: true });
  await expect(content).toHaveValue('Initial editable content');
  await content.fill('Updated editable content');
  await action(editor(page), 'Close').click();
  await expect(editor(page)).toBeHidden();
  await page.reload();
  await expectNote(page, title, 'Updated editable content');
  await expect(note(page, title).getByText('Initial editable content', { exact: true }).filter({ visible: true })).toHaveCount(0);
});

test('REQ-2.3: Rename a note without losing its attributes', async ({ page }, info) => {
  await openHome(page);
  const original = identity(info, 'Original project title');
  const renamed = identity(info, 'Renamed project title');
  const other = identity(info, 'Rename control');
  const label = identity(info, 'Project label');
  await createLabel(page, label);
  await createNote(page, original, 'Original project content', { pinned: true, labels: [label] });
  await createNote(page, other, 'Unchanged control content');
  await action(note(page, original), `Open ${original}`).click();
  await expect(editor(page).getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(original);
  await expect(editor(page).getByRole('textbox', { name: 'Content', exact: true })).toHaveValue('Original project content');
  await editor(page).getByRole('textbox', { name: 'Title', exact: true }).fill(renamed);
  await editor(page).getByRole('textbox', { name: 'Content', exact: true }).fill('Renamed project content');
  await action(editor(page), 'Close').click();
  await expect(editor(page)).toBeHidden();
  await page.reload();
  await expect(note(page, original)).toHaveCount(0);
  await expectNoteInCollection(page, 'Pinned notes', renamed, 'Renamed project content');
  await expect(section(page, 'Other notes').getByRole('region', { name: renamed, exact: true })).toHaveCount(0);
  await expect(note(page, renamed).getByText('Original project content', { exact: true }).filter({ visible: true })).toHaveCount(0);
  await expectVisibleText(note(page, renamed), label);
  await note(page, renamed).hover();
  await expect(action(note(page, renamed), `Unpin ${renamed}`)).toHaveAttribute('aria-pressed', 'true');
  await expectNote(page, other, 'Unchanged control content');
  await navigate(page, label);
  await expectNote(page, renamed, 'Renamed project content');
  await expect(note(page, original)).toHaveCount(0);
  await expect(note(page, other)).toBeHidden();
  await action(note(page, renamed), `Open ${renamed}`).click();
  await expect(editor(page).getByRole('textbox', { name: 'Title', exact: true })).toHaveValue(renamed);
  await expect(editor(page).getByRole('textbox', { name: 'Content', exact: true })).toHaveValue('Renamed project content');
  await action(editor(page), 'Close').click();
  await expect(editor(page)).toBeHidden();
  await navigate(page, 'Notes');
  await expectNote(page, renamed, 'Renamed project content');
  await expect(note(page, original)).toHaveCount(0);
});
