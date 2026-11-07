import { expectText, expectCellText } from './support/observations';
import { baseUrl } from './support/e2e';
import { expect, Page, test } from '@playwright/test';
import {
  expectActiveWorksheet,
  gridCell,
  openWorkbookHome,
  uniqueName,
} from './support/e2e';

async function openCsvImport(page: Page): Promise<void> {
  await openWorkbookHome(page);
  await page.getByRole('button', { name: /^Import CSV$/ }).click();
  await expect(page.getByRole('dialog', { name: /^Import CSV$/ })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-1.3.1: Import CSV to Create a Workbook - Scenario 1', async ({ page }) => {
  const workbookName = uniqueName('pw-import');
  const csv = [
    'Name,Note,Count,Blank',
    'Alex,"Harbor District, East",42,',
    'Jordan,"They said""hello""',
    'next line",3,',
    'Alice,English text 中文,007,',
  ].join('\r\n');

  await openCsvImport(page);
  await page.getByLabel('CSV file', { exact: true }).setInputFiles({
    name: `${workbookName}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf8'),
  });
  await page.getByRole('button', { name: /^Confirm import$/ }).click();

  await expectText(page, workbookName, { exact: true });
  await expectActiveWorksheet(page, 'Sheet1');
  await expectCellText(gridCell(page, 'A1'), 'Name');
  await expectCellText(gridCell(page, 'B1'), 'Note');
  await expectCellText(gridCell(page, 'C1'), 'Count');
  await expectCellText(gridCell(page, 'D1'), 'Blank');
  await expectCellText(gridCell(page, 'A2'), 'Alex');
  await expectCellText(gridCell(page, 'B2'), 'Harbor District, East');
  await expectCellText(gridCell(page, 'C2'), '42');
  await expectCellText(gridCell(page, 'D2'), '');
  await expectCellText(gridCell(page, 'A3'), 'Jordan');
  await expectCellText(gridCell(page, 'B3'), 'They said"hello"\nnext line');
  await expectCellText(gridCell(page, 'C3'), '3');
  await expectCellText(gridCell(page, 'D3'), '');
  await expectCellText(gridCell(page, 'A4'), 'Alice');
  await expectCellText(gridCell(page, 'B4'), 'English text 中文');
  await expectCellText(gridCell(page, 'C4'), '007');
  await expectCellText(gridCell(page, 'D4'), '');

  await page.reload();
  await expectText(page, workbookName, { exact: true });
  await expectActiveWorksheet(page, 'Sheet1');
  await expectCellText(gridCell(page, 'B2'), 'Harbor District, East');
  await expectCellText(gridCell(page, 'B3'), 'They said"hello"\nnext line');
  await expectCellText(gridCell(page, 'D2'), '');
  await expectCellText(gridCell(page, 'D3'), '');
  await expectCellText(gridCell(page, 'B4'), 'English text 中文');
  await expectCellText(gridCell(page, 'C4'), '007');
  for (const [coordinate, value] of Object.entries({ A1: 'Name', B1: 'Note', C1: 'Count', D1: 'Blank',
    A2: 'Alex', C2: '42', A3: 'Jordan', C3: '3', A4: 'Alice', D4: '' }))
    await expectCellText(gridCell(page, coordinate), value);
});

test('REQ-1.3.1: Import CSV to Create a Workbook - Scenario 2', async ({ page }) => {
  const workbookName = uniqueName('pw-invalid-import');

  await openCsvImport(page);
  await page.getByLabel('CSV file', { exact: true }).setInputFiles({
    name: `${workbookName}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from('Name,Note\r\n Alex,"unfinished quote', 'utf8'),
  });
  await page.getByRole('button', { name: /^Confirm import$/ }).click();

  await expectText(page, /invalid csv file format\. import failed\./i);
  await openWorkbookHome(page);
  await expect(page.getByRole('link', { name: workbookName, exact: true })).toHaveCount(0);
});

test('REQ-1.3.1: Import CSV to Create a Workbook - Scenario 3', async ({ page }) => {
  const workbookName = uniqueName('pw-import');
  const csv = ['City,Description,Count', 'London,Capital,1', 'Berlin,,2', 'Paris,Finance,3'].join('\r\n');

  await openCsvImport(page);
  await page.getByLabel('CSV file', { exact: true }).setInputFiles({
    name: `${workbookName}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf8'),
  });
  await page.getByRole('button', { name: /^Confirm import$/ }).click();

  await expectText(page, workbookName, { exact: true });
  await expectCellText(gridCell(page, 'A2'), 'London');
  await expectCellText(gridCell(page, 'B3'), '');
  await expectCellText(gridCell(page, 'C4'), '3');

  await page.reload();
  await expectCellText(gridCell(page, 'A2'), 'London');
  await expectCellText(gridCell(page, 'B3'), '');
  await expectCellText(gridCell(page, 'C4'), '3');
});

test('REQ-1.3.1: Import CSV to Create a Workbook - Scenario 4', async ({ page }) => {
  const workbookName = uniqueName('pw-single-column-import');
  const csv = ['Title', 'Alpha', 'Beta', 'Gamma'].join('\r\n');

  await openCsvImport(page);
  await page.getByLabel('CSV file', { exact: true }).setInputFiles({
    name: `${workbookName}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf8'),
  });
  await page.getByRole('button', { name: /^Confirm import$/ }).click();

  await expectText(page, workbookName, { exact: true });
  await expectActiveWorksheet(page, 'Sheet1');
  await expectCellText(gridCell(page, 'A1'), 'Title');
  await expectCellText(gridCell(page, 'A4'), 'Gamma');
  await page.reload();
  await expectActiveWorksheet(page, 'Sheet1');
  await expectCellText(gridCell(page, 'A1'), 'Title');
  await expectCellText(gridCell(page, 'A4'), 'Gamma');
});
