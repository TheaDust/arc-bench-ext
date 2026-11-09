import { expectStoredCell } from './support/experiment-observations';
import { expectCalculatedNumber } from './support/observations';
import { baseUrl } from './support/e2e';
import { expectCsvValues } from './support/observations';
import { expect, Page, test } from '@playwright/test';
import {
  addWorksheet,
  commitCellThroughFormulaBar,
  createBlankWorkbook,
  expectActiveWorksheet,
  formulaBar,
  gridCell,
  normalizeCsv,
  openWorkbookHome,
  readDownload,
  uniqueName,
  worksheetTab,
} from './support/e2e';

async function exportCsv(page: Page): Promise<string> {
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Export CSV$/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.csv$/i);
  return normalizeCsv(await readDownload(download));
}

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-1.3.2: Export the Current Worksheet as CSV - Scenario 1', async ({ page }) => {
  const workbookName = uniqueName('pw-export-special');
  const sourceCsv = [
    'Region,Description,Count,Blank,Formula result',
    'West,"Contains, commas",2,,=C2*2',
    'North,"They said ""hello""\n next line",3,,=C3+2',
  ].join('\n');
  const expectedCsv = [
    'Region,Description,Count,Blank,Formula result',
    'West,"Contains, commas",2,,4',
    'North,"They said ""hello""\n next line",3,,5',
  ].join('\n');

  await openWorkbookHome(page);
  await page.getByRole('button', { name: /^Import CSV$/ }).click();
  await page.getByLabel('CSV file', { exact: true }).setInputFiles({
    name: `${workbookName}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from(sourceCsv, 'utf8'),
  });
  await page.getByRole('button', { name: /^Confirm import$/ }).click();

  await expect(gridCell(page, 'B2')).toHaveText('Contains, commas');
  await expect(gridCell(page, 'B3')).toHaveText('They said "hello"\n next line');
  await expectStoredCell(page, 'E2', '=C2*2', 4);
  await expectStoredCell(page, 'E3', '=C3+2', 5);
  await expectCalculatedNumber(gridCell(page, 'E2'), 4);
  await expectCalculatedNumber(gridCell(page, 'E3'), 5);
  const firstExport = await exportCsv(page);
  expectCsvValues(firstExport, expectedCsv, [[1, 4], [2, 4]]);

  await page.reload();
  await expectCalculatedNumber(gridCell(page, 'E2'), 4);
  await expectCalculatedNumber(gridCell(page, 'E3'), 5);
  const secondExport = await exportCsv(page);
  expectCsvValues(secondExport, expectedCsv, [[1, 4], [2, 4]]);
  await expectStoredCell(page, 'E2', '=C2*2', 4);
  await expectStoredCell(page, 'E3', '=C3+2', 5);
});

test('REQ-1.3.2: Export the Current Worksheet as CSV - Scenario 2', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A1', '2');
  await commitCellThroughFormulaBar(page, 'B1', '=A1*2');

  expectCsvValues(await exportCsv(page), '2,4', [[0, 1]]);
  await expectActiveWorksheet(page, 'Sheet1');
  await expect(gridCell(page, 'A1')).toHaveText('2');
  await expectCalculatedNumber(gridCell(page, 'B1'), 4);
  await gridCell(page, 'B1').click();
  await expect(formulaBar(page)).toHaveValue('=A1*2');

  await page.reload();
  await expectActiveWorksheet(page, 'Sheet1');
  await expect(gridCell(page, 'A1')).toHaveText('2');
  await expectCalculatedNumber(gridCell(page, 'B1'), 4);
  await gridCell(page, 'B1').click();
  await expect(formulaBar(page)).toHaveValue('=A1*2');
});

test('REQ-1.3.2: Export the Current Worksheet as CSV - Scenario 3', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A1', 'Sheet1');
  await addWorksheet(page, 'Sheet2');
  await commitCellThroughFormulaBar(page, 'A1', 'Sheet2');

  expectCsvValues(await exportCsv(page), 'Sheet2');
  await expectActiveWorksheet(page, 'Sheet2');
});

test('REQ-1.3.2: Export the Current Worksheet as CSV - Scenario 4', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A1', 'First');
  await addWorksheet(page, 'Sheet2');
  await commitCellThroughFormulaBar(page, 'A1', 'Second');
  await worksheetTab(page, 'Sheet1').click();
  await expectActiveWorksheet(page, 'Sheet1');

  expectCsvValues(await exportCsv(page), 'First');
  await expectActiveWorksheet(page, 'Sheet1');
});
