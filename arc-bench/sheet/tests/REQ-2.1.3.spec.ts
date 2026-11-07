import { baseUrl } from './support/e2e';
import { expect, Locator, Page, test } from '@playwright/test';
import {
  addWorksheet,
  commitCellThroughFormulaBar,
  createBlankWorkbook,
  expectActiveWorksheet,
  gridCell,
  openWorksheetOptions,
  uniqueName,
  worksheetTab,
} from './support/e2e';

async function openRenameDialog(page: Page, worksheetName: string): Promise<Locator> {
  await openWorksheetOptions(page, worksheetName);
  await page.getByRole('menuitem', { name: /^Rename$/ }).click();
  const dialog = page.getByRole('dialog', { name: /^Rename worksheet$/ });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-2.1.3: Rename a Worksheet - Scenario 1', async ({ page }) => {
  await createBlankWorkbook(page);
  await addWorksheet(page, 'Sheet2');
  await commitCellThroughFormulaBar(page, 'A1', 'Existing worksheet data');
  const newName = uniqueName('pw-sheet');

  const dialog = await openRenameDialog(page, 'Sheet2');
  await expect(dialog.getByRole('textbox', { name: /^Worksheet name$/ })).toHaveValue('Sheet2');
  const nameInput = dialog.getByRole('textbox', { name: /^Worksheet name$/ });
  await nameInput.fill(`  ${newName}  `);
  await nameInput.press('Enter');

  await expectActiveWorksheet(page, newName);
  await expect(worksheetTab(page, 'Sheet1')).toBeVisible();
  await page.reload();
  await expectActiveWorksheet(page, newName);
  await expect(gridCell(page, 'A1')).toHaveText('Existing worksheet data');

  const reopenedDialog = await openRenameDialog(page, newName);
  await expect(reopenedDialog.getByRole('textbox', { name: /^Worksheet name$/ })).toHaveValue(newName);
});

test('REQ-2.1.3: Rename a Worksheet - Scenario 2', async ({ page }) => {
  await createBlankWorkbook(page);
  await addWorksheet(page, 'Sheet2');

  const dialog = await openRenameDialog(page, 'Sheet2');
  await dialog.getByRole('textbox', { name: /^Worksheet name$/ }).fill('Sheet1');
  await dialog.getByRole('button', { name: /^Save$/ }).click();

  await expect(page.getByText(/worksheet name already exists/)).toBeVisible();
  await expect(worksheetTab(page, 'Sheet1')).toBeVisible();
  await expectActiveWorksheet(page, 'Sheet2');

  await page.reload();
  await expect(worksheetTab(page, 'Sheet1')).toBeVisible();
  await expectActiveWorksheet(page, 'Sheet2');
});

test('REQ-2.1.3: Rename a Worksheet - Scenario 3', async ({ page }) => {
  await createBlankWorkbook(page);

  const dialog = await openRenameDialog(page, 'Sheet1');
  await dialog.getByRole('textbox', { name: /^Worksheet name$/ }).fill('   ');
  await dialog.getByRole('button', { name: /^Save$/ }).click();

  await expect(page.getByText(/worksheet name cannot be empty/)).toBeVisible();
  await expectActiveWorksheet(page, 'Sheet1');

  await page.reload();
  await expectActiveWorksheet(page, 'Sheet1');
  const reopenedDialog = await openRenameDialog(page, 'Sheet1');
  await expect(reopenedDialog.getByRole('textbox', { name: /^Worksheet name$/ })).toHaveValue('Sheet1');
});
