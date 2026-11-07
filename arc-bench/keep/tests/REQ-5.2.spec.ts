// requirement: REQ-5.2
import { test, expect, action, note, section, expectSingleColumn, expectMultipleColumns, openHome, createNote, expectNote } from './helpers';
import { identity } from './fixtures/data';

test('REQ-5.2: Switch grid to list and back', async ({ page }, info) => {
  await openHome(page);
  await expect(action(page, 'List view')).toBeVisible();
  await expect(section(page, 'Notes')).toHaveAccessibleDescription(/Grid view/i);
  const titles = ['View alpha', 'View beta', 'View gamma'].map(example => identity(info, example));
  for (const title of titles) await createNote(page, title, 'Layout content');
  await action(page, 'List view').click();
  await expect(action(page, 'Grid view')).toBeVisible();
  await expect(section(page, 'Notes')).toHaveAccessibleDescription(/List view/i);
  // Responsive geometry is observed without prescribing a DOM or exact widths.
  await expectSingleColumn(titles.map(title => note(page, title)));
  for (const title of titles) await expectNote(page, title, 'Layout content');
  await action(page, 'Grid view').click();
  await expect(action(page, 'List view')).toBeVisible();
  await expect(section(page, 'Notes')).toHaveAccessibleDescription(/Grid view/i);
  for (const title of titles) await expectNote(page, title, 'Layout content');
  await expectMultipleColumns(titles.map(title => note(page, title)));
});
