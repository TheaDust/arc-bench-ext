import { expectPivotFields, expectPivotResult } from './support/experiment-observations';
import { expectCalculatedNumber } from './support/observations';
import { expectText } from './support/observations';
import { selectChoice } from './support/public-controls';
import { baseUrl } from './support/e2e';
import { expect, Locator, Page, test } from '@playwright/test';
import {
  columnHeader,
  commitCellThroughFormulaBar,
  createBlankWorkbook,
  expectActiveWorksheet,
  gridCell,
  openDataMenu,
  rowHeader,
  selectCellRange,
  setClipboardText,
  worksheetTab,
} from './support/e2e';

async function chooseEditorOption(
  page: Page,
  editor: Locator,
  label: RegExp,
  option: RegExp,
): Promise<void> {
  await selectChoice(editor.getByRole('combobox', { name: label }), { label: option });
}

async function createPivotEditor(page: Page, start: string, end: string): Promise<Locator> {
  await selectCellRange(page, start, end);
  await openDataMenu(page);
  await page.getByRole('menuitem', { name: /^Create pivot table$/ }).click();
  const dialog = page.getByRole('dialog', { name: /^Create pivot table$/ });
  await dialog.getByRole('radio', { name: /^New worksheet$/ }).check();
  await dialog.getByRole('button', { name: /^Create$/ }).click();
  await expectActiveWorksheet(page, 'Pivot1');
  return page.getByRole('region', { name: /^Pivot table editor$/ });
}

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 1', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Region\tSales\nEast\t1200\nNorth\t800\nEast\t600\nSouth\t1000\nNorth\t700');
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expectActiveWorksheet(page, 'Sheet1');
  const sourceRows = [
    { row: 2, region: 'East', sales: '1200' },
    { row: 3, region: 'North', sales: '800' },
    { row: 4, region: 'East', sales: '600' },
    { row: 5, region: 'South', sales: '1000' },
    { row: 6, region: 'North', sales: '700' },
  ];
  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'B1')).toHaveText('Sales');
  for (const source of sourceRows) {
    await expect(gridCell(page, `A${source.row}`)).toHaveText(source.region);
    await expect(gridCell(page, `B${source.row}`)).toHaveText(source.sales);
  }

  await selectCellRange(page, 'A1', 'B6');
  await openDataMenu(page);
  await page.getByRole('menuitem', { name: /^Create pivot table$/ }).click();
  const dialog = page.getByRole('dialog', { name: /^Create pivot table$/ });
  await expect(dialog).toContainText('A1:B6');
  await dialog.getByRole('radio', { name: /^New worksheet$/ }).check();
  await dialog.getByRole('button', { name: /^Create$/ }).click();

  await expectActiveWorksheet(page, 'Pivot1');
  const editor = page.getByRole('region', { name: /^Pivot table editor$/ });
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Sales$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^SUM$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'B1')).toHaveText('SUM of Sales');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expectCalculatedNumber(gridCell(page, 'B2'), 1800);
  await expect(gridCell(page, 'A3')).toHaveText('North');
  await expectCalculatedNumber(gridCell(page, 'B3'), 1500);
  await expect(gridCell(page, 'A4')).toHaveText('South');
  await expectCalculatedNumber(gridCell(page, 'B4'), 1000);
  await expect(gridCell(page, 'A5')).toHaveText('Grand Total');
  await expectCalculatedNumber(gridCell(page, 'B5'), 4300);

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  for (const source of sourceRows) {
    await expect(gridCell(page, `A${source.row}`)).toHaveText(source.region);
    await expect(gridCell(page, `B${source.row}`)).toHaveText(source.sales);
  }

  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.reload();
  await expectActiveWorksheet(page, 'Pivot1');
  await expectCalculatedNumber(gridCell(page, 'B2'), 1800);
  await expectCalculatedNumber(gridCell(page, 'B3'), 1500);
  await expectCalculatedNumber(gridCell(page, 'B4'), 1000);
  await expectCalculatedNumber(gridCell(page, 'B5'), 4300);
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 2', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Region\tSales\nEast\t1200\nNorth\t800\nEast\t600');
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B4')).toHaveText('600');
  const editor = await createPivotEditor(page, 'A1', 'B4');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Sales$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await commitCellThroughFormulaBar(page, 'B2', '1500');
  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expectCalculatedNumber(gridCell(page, 'B2'), 1800);
  await expect(gridCell(page, 'A3')).toHaveText('North');
  await expectCalculatedNumber(gridCell(page, 'B3'), 800);
  await expect(gridCell(page, 'A4')).toHaveText('Grand Total');
  await expectCalculatedNumber(gridCell(page, 'B4'), 2600);

  await page.getByRole('button', { name: /^Refresh pivot table$/ }).click();
  await expectCalculatedNumber(gridCell(page, 'B2'), 2100);
  await expectCalculatedNumber(gridCell(page, 'B3'), 800);
  await expectCalculatedNumber(gridCell(page, 'B4'), 2900);

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'B1')).toHaveText('Sales');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expect(gridCell(page, 'B2')).toHaveText('1500');
  await expect(gridCell(page, 'A3')).toHaveText('North');
  await expect(gridCell(page, 'B3')).toHaveText('800');
  await expect(gridCell(page, 'A4')).toHaveText('East');
  await expect(gridCell(page, 'B4')).toHaveText('600');

  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.reload();
  await expectActiveWorksheet(page, 'Pivot1');
  await expectCalculatedNumber(gridCell(page, 'B2'), 2100);
  await expectCalculatedNumber(gridCell(page, 'B3'), 800);
  await expectCalculatedNumber(gridCell(page, 'B4'), 2900);
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 3', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, [
    'Region\tQuarter\tSales',
    'East\tQ1\t100',
    'East\tQ1\t200',
    'East\tQ2\t150',
    'North\tQ1\t300',
    'North\tQ2\t',
  ].join('\n'));
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'A6')).toHaveText('North');

  const editor = await createPivotEditor(page, 'A1', 'C6');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(columns)$/i, /^Quarter$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Sales$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^COUNT$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'B1')).toHaveText('Q1');
  await expect(gridCell(page, 'C1')).toHaveText('Q2');
  await expect(gridCell(page, 'D1')).toHaveText('Grand Total');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expectCalculatedNumber(gridCell(page, 'B2'), 2);
  await expectCalculatedNumber(gridCell(page, 'C2'), 1);
  await expectCalculatedNumber(gridCell(page, 'D2'), 3);
  await expect(gridCell(page, 'A3')).toHaveText('North');
  await expectCalculatedNumber(gridCell(page, 'B3'), 1);
  await expectCalculatedNumber(gridCell(page, 'C3'), 0);
  await expectCalculatedNumber(gridCell(page, 'D3'), 1);
  await expect(gridCell(page, 'A4')).toHaveText('Grand Total');
  await expectCalculatedNumber(gridCell(page, 'D4'), 4);

  const expected = [['Region', 'Q1', 'Q2', 'Grand Total'], ['East', 2, 1, 3], ['North', 1, 0, 1], ['Grand Total', 3, 1, 4]] as const;
  await expectPivotResult(page, expected);
  await expectPivotFields(page, { rows: 'Region', columns: 'Quarter', values: 'Sales', method: 'COUNT' });
  await page.reload();
  await expectActiveWorksheet(page, 'Pivot1');
  await expectCalculatedNumber(gridCell(page, 'B2'), 2);
  await expectCalculatedNumber(gridCell(page, 'C2'), 1);
  await expectCalculatedNumber(gridCell(page, 'D4'), 4);

  for (const [coordinate, value] of Object.entries({ A1: 'Region', B1: 'Q1', C1: 'Q2', D1: 'Grand Total', A2: 'East',
    D2: '3', A3: 'North', B3: '1', C3: '0', D3: '1', A4: 'Grand Total' }))
    if (/^\d+$/.test(value)) await expectCalculatedNumber(gridCell(page, coordinate), Number(value));
    else await expect(gridCell(page, coordinate)).toHaveText(value);
  await expectPivotResult(page, expected);
  await expectPivotFields(page, { rows: 'Region', columns: 'Quarter', values: 'Sales', method: 'COUNT' });
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 4', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, [
    'Region\tSales',
    'East\t100',
    'East\tnot numeric',
    'East\t300',
    'North\t200',
    'North\t',
  ].join('\n'));
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B5')).toHaveText('200');

  const editor = await createPivotEditor(page, 'A1', 'B6');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Sales$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^AVERAGE$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'B1')).toHaveText('AVERAGE of Sales');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expectCalculatedNumber(gridCell(page, 'B2'), 200);
  await expect(gridCell(page, 'A3')).toHaveText('North');
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expect(gridCell(page, 'A4')).toHaveText('Grand Total');
  await expectCalculatedNumber(gridCell(page, 'B4'), 200);

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await expect(gridCell(page, 'B2')).toHaveText('100');
  await expect(gridCell(page, 'B3')).toHaveText('not numeric');
  await expect(gridCell(page, 'B4')).toHaveText('300');
  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.reload();
  await expectCalculatedNumber(gridCell(page, 'B2'), 200);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 200);

  await worksheetTab(page, 'Sheet1').click();
  for (const [coordinate, value] of Object.entries({ B2: '100', B3: 'not numeric', B4: '300', B5: '200', B6: '' }))
    await expect(gridCell(page, coordinate)).toHaveText(value);
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 5', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, [
    'Region\tStatus',
    'East\tOpen',
    'East\tClosed',
    'North\tOpen',
  ].join('\n'));
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B4')).toHaveText('Open');

  const editor = await createPivotEditor(page, 'A1', 'B4');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Status$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^COUNT$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await expect(gridCell(page, 'A2')).toHaveText('Open');
  await expectCalculatedNumber(gridCell(page, 'B2'), 2);
  await expect(gridCell(page, 'A3')).toHaveText('Closed');
  await expectCalculatedNumber(gridCell(page, 'B3'), 1);
  await expectCalculatedNumber(gridCell(page, 'B4'), 3);

  const expected = [['Status', 'COUNT of Region'], ['Open', 2], ['Closed', 1], ['Grand Total', 3]] as const;
  await expectPivotResult(page, expected);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^SUM$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await expectText(page, 
    /^(value field requires numeric values)$/i,
  );
  await expectCalculatedNumber(gridCell(page, 'B2'), 2);
  await expectCalculatedNumber(gridCell(page, 'B3'), 1);
  await expectCalculatedNumber(gridCell(page, 'B4'), 3);

  await expectPivotResult(page, expected);
  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await expect(gridCell(page, 'B2')).toHaveText('Open');
  await expect(gridCell(page, 'B3')).toHaveText('Closed');
  await expect(gridCell(page, 'B4')).toHaveText('Open');
  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.reload();
  await expect(gridCell(page, 'A2')).toHaveText('Open');
  await expectCalculatedNumber(gridCell(page, 'B2'), 2);
  await expect(gridCell(page, 'A3')).toHaveText('Closed');
  await expectCalculatedNumber(gridCell(page, 'B3'), 1);
  await expectCalculatedNumber(gridCell(page, 'B4'), 3);
  await expectPivotResult(page, expected);
  await expectPivotFields(page, { rows: 'Status', values: 'Region', method: 'COUNT' });
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 6', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, [
    'Region\tSales',
    'East\t100',
    'North\t200',
    'East\t300',
  ].join('\n'));
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B4')).toHaveText('300');

  await selectCellRange(page, 'A1', 'B4');
  await openDataMenu(page);
  await page.getByRole('menuitem', { name: /^Create filter$/ }).click();
  await page
    .getByRole('grid', { name: /^Worksheet grid$/ })
    .getByRole('button', { name: /^(filter Region)$/i })
    .click();
  const filterDialog = page.getByRole('dialog', { name: /^(filter Region)$/i });
  await filterDialog.getByRole('button', { name: /^Clear selection$/ }).click();
  await filterDialog.getByRole('checkbox', { name: /^East$/i }).check();
  await filterDialog.getByRole('button', { name: /^Apply$/ }).click();
  await expect(filterDialog).toBeHidden();

  await expect(gridCell(page, 'A3')).not.toBeVisible();

  const editor = await createPivotEditor(page, 'A1', 'B4');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Sales$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^SUM$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await expectCalculatedNumber(gridCell(page, 'B2'), 400);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 600);

  await page.getByRole('button', { name: /^Refresh pivot table$/ }).click();
  await expectCalculatedNumber(gridCell(page, 'B2'), 400);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 600);
  await page.reload();
  await expectCalculatedNumber(gridCell(page, 'B2'), 400);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 600);
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 7', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, [
    'Region\tSales',
    'East\t100',
    'North\t200',
    'East\t300',
  ].join('\n'));
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B4')).toHaveText('300');

  const editor = await createPivotEditor(page, 'A1', 'B4');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Sales$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^SUM$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await expectCalculatedNumber(gridCell(page, 'B2'), 400);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 600);

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await rowHeader(page, 3).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 row below$/ }).click();
  await expect(gridCell(page, 'A4')).toHaveText('');
  await expect(gridCell(page, 'A5')).toHaveText('East');
  await commitCellThroughFormulaBar(page, 'A4', 'East');
  await commitCellThroughFormulaBar(page, 'B4', '50');
  await expect(gridCell(page, 'A5')).toHaveText('East');
  await expect(gridCell(page, 'B5')).toHaveText('300');

  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.getByRole('button', { name: /^Refresh pivot table$/ }).click();
  await expectCalculatedNumber(gridCell(page, 'B2'), 450);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 650);

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await columnHeader(page, 'B').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 column left$/ }).click();
  await expect(gridCell(page, 'B1')).toHaveText('');
  await expect(gridCell(page, 'C1')).toHaveText('Sales');
  await expect(gridCell(page, 'C4')).toHaveText('50');

  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.getByRole('button', { name: /^Refresh pivot table$/ }).click();
  await expectCalculatedNumber(gridCell(page, 'B2'), 450);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 650);

  await page.reload();
  await expectActiveWorksheet(page, 'Pivot1');
  await expectCalculatedNumber(gridCell(page, 'B2'), 450);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 650);
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 8', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, [
    'Region\tSales',
    'East\t100',
    'North\t200',
    'East\t300',
  ].join('\n'));
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B4')).toHaveText('300');

  const editor = await createPivotEditor(page, 'A1', 'B4');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Sales$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^SUM$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();
  await expectCalculatedNumber(gridCell(page, 'B2'), 400);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 600);

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await columnHeader(page, 'B').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Delete column$/ }).click();
  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expect(gridCell(page, 'B1')).toHaveText('');

  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.getByRole('button', { name: /^Refresh pivot table$/ }).click();
  await expectText(page, 
    /^(pivot field is no longer available\. select a new field\.)$/i,
  );
  await expectCalculatedNumber(gridCell(page, 'B2'), 400);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 600);

  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');
  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await worksheetTab(page, 'Pivot1').click();
  await expectActiveWorksheet(page, 'Pivot1');
  await page.reload();
  await expectCalculatedNumber(gridCell(page, 'B2'), 400);
  await expectCalculatedNumber(gridCell(page, 'B3'), 200);
  await expectCalculatedNumber(gridCell(page, 'B4'), 600);
  const expected = [['Region', 'SUM of Sales'], ['East', 400], ['North', 200], ['Grand Total', 600]] as const;
  await expectPivotResult(page, expected);
  await expectPivotFields(page, { rows: 'Region', method: 'SUM' });
  await page.getByRole('button', { name: /^Refresh pivot table$/ }).click();
  await expectText(page, 'Pivot field is no longer available. Select a new field.', { exact: true });
  await expectPivotResult(page, expected);
  await worksheetTab(page, 'Sheet1').click();
  for (const [coordinate, value] of Object.entries({ A1: 'Region', A2: 'East', A3: 'North', A4: 'East', B1: '', B2: '', B3: '', B4: '' }))
    await expect(gridCell(page, coordinate)).toHaveText(value);
});

test('REQ-5.3.1: Create and Refresh a Basic Pivot Table - Scenario 9', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, [
    'Region\tStatus',
    'East\tOpen',
    'East\tClosed',
    'North\tOpen',
    'South\tOpen',
  ].join('\n'));
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'B5')).toHaveText('Open');

  const editor = await createPivotEditor(page, 'A1', 'B5');
  await chooseEditorOption(page, editor, /^(rows)$/i, /^Region$/i);
  await chooseEditorOption(page, editor, /^(values)$/i, /^Status$/i);
  await chooseEditorOption(page, editor, /^(summarize by)$/i, /^COUNT$/i);
  await editor.getByRole('button', { name: /^Apply$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Region');
  await expect(gridCell(page, 'B1')).toHaveText('COUNT of Status');
  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expectCalculatedNumber(gridCell(page, 'B2'), 2);
  await expect(gridCell(page, 'A3')).toHaveText('North');
  await expectCalculatedNumber(gridCell(page, 'B3'), 1);
  await expect(gridCell(page, 'A4')).toHaveText('South');
  await expectCalculatedNumber(gridCell(page, 'B4'), 1);
  const expected = [['Region', 'COUNT of Status'], ['East', 2], ['North', 1], ['South', 1], ['Grand Total', 4]] as const;
  await expectPivotResult(page, expected);
  await page.reload();
  await expectCalculatedNumber(gridCell(page, 'B2'), 2);
  await expectCalculatedNumber(gridCell(page, 'B3'), 1);

  await expect(gridCell(page, 'A2')).toHaveText('East');
  await expect(gridCell(page, 'A3')).toHaveText('North');
  await expect(gridCell(page, 'A4')).toHaveText('South');
  await expectCalculatedNumber(gridCell(page, 'B4'), 1);
  await expectPivotResult(page, expected);
  await expectPivotFields(page, { rows: 'Region', values: 'Status', method: 'COUNT' });
});
