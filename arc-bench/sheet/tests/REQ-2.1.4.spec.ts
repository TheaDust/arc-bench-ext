import { selectChoice } from './support/public-controls';
import { baseUrl } from './support/e2e';
import { expect, Page, test } from '@playwright/test';
import {
  addWorksheet,
  createBlankWorkbook,
  expectActiveWorksheet,
  gridCell,
  openDataMenu,
  openWorksheetOptions,
  selectCellRange,
  setClipboardText,
  worksheetTab,
} from './support/e2e';

async function chooseDelete(page: Page, worksheetName: string): Promise<void> {
  await openWorksheetOptions(page, worksheetName);
  await page.getByRole('menuitem', { name: /^Delete$/ }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-2.1.4: Delete a Worksheet - Scenario 1', async ({ page }) => {
  await createBlankWorkbook(page);
  await addWorksheet(page, 'Sheet2');

  await chooseDelete(page, 'Sheet2');
  const dialog = page.getByRole('dialog', { name: /^Delete worksheet$/ });
  await expect(dialog).toContainText('Sheet2');
  await dialog.getByRole('button', { name: /^Delete worksheet$/ }).click();

  await expect(worksheetTab(page, 'Sheet2')).toHaveCount(0);
  await expectActiveWorksheet(page, 'Sheet1');
  await page.reload();
  await expect(worksheetTab(page, 'Sheet2')).toHaveCount(0);
  await expectActiveWorksheet(page, 'Sheet1');
});

test('REQ-2.1.4: Delete a Worksheet - Scenario 2', async ({ page }) => {
  await createBlankWorkbook(page);

  await chooseDelete(page, 'Sheet1');
  await expect(page.getByText(/a workbook must contain at least one worksheet/)).toBeVisible();
  await expect(page.getByRole('dialog', { name: /^Delete worksheet$/ })).toHaveCount(0);
  await expectActiveWorksheet(page, 'Sheet1');

  await page.reload();
  await expectActiveWorksheet(page, 'Sheet1');
});

test('REQ-2.1.4: Delete a Worksheet - Scenario 3', async ({ page }) => {
  const sourceWorksheet = 'Sheet1';
  const sourceCell = 'A2';
  const sourceValue = 'East';
  const resultWorksheet = 'Pivot1';
  const resultCell = 'B2';
  const resultValue = '100';
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Region\tSales\nEast\t100\nNorth\t200');
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B3')).toHaveText('200');
  await selectCellRange(page, 'A1', 'B3');
  await openDataMenu(page);
  await page.getByRole('menuitem', { name: /^Create pivot table$/ }).click();
  const createDialog = page.getByRole('dialog', { name: /^Create pivot table$/ });
  await expect(createDialog).toContainText(/Source range:\s*A1:B3/i);
  await createDialog.getByRole('radio', { name: /^New worksheet$/ }).check();
  await createDialog.getByRole('button', { name: /^Create$/ }).click();
  const editor = page.getByRole('region', { name: /^Pivot table editor$/ });
  await selectChoice(editor.getByRole('combobox', { name: /^Rows$/ }), { label: /^Region$/i });
  await selectChoice(editor.getByRole('combobox', { name: /^Values$/ }), { label: /^Sales$/i });
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await worksheetTab(page, sourceWorksheet).click();
  await expectActiveWorksheet(page, sourceWorksheet);
  await expect(gridCell(page, sourceCell)).toHaveText(sourceValue);

  await chooseDelete(page, sourceWorksheet);
  const dialog = page.getByRole('dialog', { name: /^Delete worksheet$/ });
  await dialog.getByRole('button', { name: /^Delete worksheet$/ }).click();
  await expect(page.getByText(/delete or rebuild dependent pivot tables first/i)).toBeVisible();
  await expect(dialog).toHaveCount(0);

  await expectActiveWorksheet(page, sourceWorksheet);
  await expect(gridCell(page, sourceCell)).toHaveText(sourceValue);
  await worksheetTab(page, resultWorksheet).click();
  await expectActiveWorksheet(page, resultWorksheet);
  await expect(gridCell(page, resultCell)).toHaveText(resultValue);

  await page.reload();
  await expect(worksheetTab(page, sourceWorksheet)).toBeVisible();
  await expectActiveWorksheet(page, resultWorksheet);
  await expect(gridCell(page, resultCell)).toHaveText(resultValue);
  await worksheetTab(page, sourceWorksheet).click();
  await expectActiveWorksheet(page, sourceWorksheet);
  await expect(gridCell(page, sourceCell)).toHaveText(sourceValue);
});

test('REQ-2.1.4: Delete a Worksheet - Scenario 4', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Region\tSales\nEast\t100\nNorth\t200');
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B3')).toHaveText('200');
  await addWorksheet(page, 'Sheet2');
  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');

  await selectCellRange(page, 'A1', 'B3');
  await openDataMenu(page);
  await page.getByRole('menuitem', { name: /^Create pivot table$/ }).click();
  const createDialog = page.getByRole('dialog', { name: /^Create pivot table$/ });
  await createDialog.getByRole('radio', { name: /^New worksheet$/ }).check();
  await createDialog.getByRole('button', { name: /^Create$/ }).click();
  const editor = page.getByRole('region', { name: /^Pivot table editor$/ });
  await selectChoice(editor.getByRole('combobox', { name: /^Rows$/ }), { label: /^Region$/i });
  await selectChoice(editor.getByRole('combobox', { name: /^Values$/ }), { label: /^Sales$/i });
  await selectChoice(editor.getByRole('combobox', { name: /^Summarize by$/ }), { label: /^SUM$/i });
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await expect(gridCell(page, 'B2')).toHaveText('100');
  await expect(gridCell(page, 'B3')).toHaveText('200');

  await chooseDelete(page, 'Pivot1');
  const pivotDialog = page.getByRole('dialog', { name: /^Delete worksheet$/ });
  await pivotDialog.getByRole('button', { name: /^Delete worksheet$/ }).click();
  await expect(worksheetTab(page, 'Pivot1')).toHaveCount(0);
  await expectActiveWorksheet(page, 'Sheet2');

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expect(gridCell(page, 'B2')).toHaveText('100');
  await chooseDelete(page, 'Sheet1');
  const sourceDialog = page.getByRole('dialog', { name: /^Delete worksheet$/ });
  await sourceDialog.getByRole('button', { name: /^Delete worksheet$/ }).click();
  await expect(worksheetTab(page, 'Sheet1')).toHaveCount(0);
  await expectActiveWorksheet(page, 'Sheet2');

  await page.reload();
  await expect(worksheetTab(page, 'Pivot1')).toHaveCount(0);
  await expect(worksheetTab(page, 'Sheet1')).toHaveCount(0);
  await expectActiveWorksheet(page, 'Sheet2');
});
