import { expectStoredCell } from './support/experiment-observations';
import { expectCalculatedNumber } from './support/observations';
import { expectText } from './support/observations';
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import {
  columnHeader,
  commitCellThroughFormulaBar,
  configureNumberValidation,
  createBlankWorkbook,
  formulaBar,
  gridCell,
  setClipboardText,
} from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-2.2.2: Insert and Delete Columns - Scenario 1', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Alpha\tBeta\tGamma\n1\t2\t3');
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'A1')).toHaveText('Alpha');
  await expect(gridCell(page, 'B1')).toHaveText('Beta');
  await expect(gridCell(page, 'C1')).toHaveText('Gamma');

  await commitCellThroughFormulaBar(page, 'A4', '=SUM(A2:C2)');
  await commitCellThroughFormulaBar(page, 'A5', '=SUM($B$2:$C$2)');
  await commitCellThroughFormulaBar(page, 'A6', '=SUM(A2:A2)');
  await columnHeader(page, 'B').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 column left$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Alpha');
  await expect(gridCell(page, 'B1')).toHaveText('');
  await expect(gridCell(page, 'C1')).toHaveText('Beta');
  await expect(gridCell(page, 'D1')).toHaveText('Gamma');

  await expectStoredCell(page, 'A4', '=SUM(A2:D2)', 6);
  await expectStoredCell(page, 'A5', '=SUM($C$2:$D$2)', 5);
  await expectStoredCell(page, 'A6', '=SUM(A2:A2)', 1);
  for (const [coordinate, value] of Object.entries({ A2: '1', B2: '', C2: '2', D2: '3' })) await expect(gridCell(page, coordinate)).toHaveText(value);
  await page.reload();
  await expect(gridCell(page, 'A1')).toHaveText('Alpha');
  await expect(gridCell(page, 'B1')).toHaveText('');
  await expect(gridCell(page, 'C1')).toHaveText('Beta');
  await expect(gridCell(page, 'D1')).toHaveText('Gamma');
  await expectStoredCell(page, 'A4', '=SUM(A2:D2)', 6);
  await expectStoredCell(page, 'A5', '=SUM($C$2:$D$2)', 5);
  await expectStoredCell(page, 'A6', '=SUM(A2:A2)', 1);
  for (const [coordinate, value] of Object.entries({ A2: '1', B2: '', C2: '2', D2: '3' })) await expect(gridCell(page, coordinate)).toHaveText(value);
});

test('REQ-2.2.2: Insert and Delete Columns - Scenario 2', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Unit price\tQuantity\tTotal\n10\t2\t=A2*B2\n1\t2\t3');
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'A1')).toHaveText('Unit price');
  await expect(gridCell(page, 'B1')).toHaveText('Quantity');
  await expect(gridCell(page, 'C1')).toHaveText('Total');
  await expect(gridCell(page, 'A2')).toHaveText('10');
  await expect(gridCell(page, 'B2')).toHaveText('2');
  await expect(gridCell(page, 'C2')).toHaveText('20');

  await commitCellThroughFormulaBar(page, 'A4', '=SUM(A3:C3)');
  await commitCellThroughFormulaBar(page, 'A5', '=SUM(B3:B3)');
  await columnHeader(page, 'B').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Delete column$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Unit price');
  await expect(gridCell(page, 'A2')).toHaveText('10');
  await expect(gridCell(page, 'B1')).toHaveText('Total');
  await expect(gridCell(page, 'B2')).toHaveText('#REF!');
  await expect(gridCell(page, 'C1')).toHaveText('');
  await expect(gridCell(page, 'C2')).toHaveText('');

  await expectStoredCell(page, 'B2', '=#REF!', '#REF!');
  await expectStoredCell(page, 'A4', '=SUM(A3:B3)', 4);
  await expectStoredCell(page, 'A5', '=#REF!', '#REF!');
  for (const [coordinate, value] of Object.entries({ A3: '1', B3: '3', C3: '' })) await expect(gridCell(page, coordinate)).toHaveText(value);
  await page.reload();
  await expect(gridCell(page, 'A1')).toHaveText('Unit price');
  await expect(gridCell(page, 'A2')).toHaveText('10');
  await expect(gridCell(page, 'B1')).toHaveText('Total');
  await expect(gridCell(page, 'B2')).toHaveText('#REF!');
  await expectStoredCell(page, 'B2', '=#REF!', '#REF!');
  await expectStoredCell(page, 'A4', '=SUM(A3:B3)', 4);
  await expectStoredCell(page, 'A5', '=#REF!', '#REF!');
  for (const [coordinate, value] of Object.entries({ A3: '1', B3: '3', C3: '' })) await expect(gridCell(page, coordinate)).toHaveText(value);
});

test('REQ-2.2.2: Insert and Delete Columns - Scenario 3', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A1', 'Alpha');
  await commitCellThroughFormulaBar(page, 'B1', 'Beta');

  await columnHeader(page, 'A').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 column right$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Alpha');
  await expect(gridCell(page, 'B1')).toHaveText('');
  await expect(gridCell(page, 'C1')).toHaveText('Beta');
  await page.reload();
  await expect(gridCell(page, 'A1')).toHaveText('Alpha');
  await expect(gridCell(page, 'B1')).toHaveText('');
  await expect(gridCell(page, 'C1')).toHaveText('Beta');
});

test('REQ-2.2.2: Insert and Delete Columns - Scenario 4', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A1', '2');
  await commitCellThroughFormulaBar(page, 'B1', '=A1*2');

  await columnHeader(page, 'A').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 column left$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('');
  await expect(gridCell(page, 'B1')).toHaveText('2');
  await expectCalculatedNumber(gridCell(page, 'C1'), 4);
  await gridCell(page, 'C1').click();
  await expect(formulaBar(page)).toHaveValue('=B1*2');

  await page.reload();
  await expectCalculatedNumber(gridCell(page, 'C1'), 4);
  await gridCell(page, 'C1').click();
  await expect(formulaBar(page)).toHaveValue('=B1*2');
});

test('REQ-2.2.2: Insert and Delete Columns - Scenario 5', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'B1', '50');
  await configureNumberValidation(page, 'B1', 'B1', '0', '100');

  await columnHeader(page, 'B').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 column left$/ }).click();
  await expect(gridCell(page, 'B1')).toHaveText('');
  await expect(gridCell(page, 'C1')).toHaveText('50');

  await commitCellThroughFormulaBar(page, 'C1', '120', { accepted: false });
  await expectText(page, /Please enter a number between 0 and 100/);
  await expect(gridCell(page, 'C1')).toHaveText('50');
  await commitCellThroughFormulaBar(page, 'B1', '120');
  await expect(gridCell(page, 'B1')).toHaveText('120');

  await page.reload();
  await expect(gridCell(page, 'B1')).toHaveText('120');
  await expect(gridCell(page, 'C1')).toHaveText('50');
});
