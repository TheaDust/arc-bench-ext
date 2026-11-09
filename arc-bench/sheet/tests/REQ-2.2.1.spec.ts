import { expectStoredCell } from './support/experiment-observations';
import { expectCalculatedNumber } from './support/observations';
import { expectText } from './support/observations';
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import {
  commitCellThroughFormulaBar,
  configureNumberValidation,
  createBlankWorkbook,
  formulaBar,
  gridCell,
  rowHeader,
  setClipboardText,
} from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-2.2.1: Insert and Delete Rows - Scenario 1', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Item\tAmount\nAlpha\t10\nBeta\t20');
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'A1')).toHaveText('Item');
  await expect(gridCell(page, 'B1')).toHaveText('Amount');
  await expect(gridCell(page, 'A2')).toHaveText('Alpha');
  await expect(gridCell(page, 'B2')).toHaveText('10');
  await expect(gridCell(page, 'A3')).toHaveText('Beta');
  await expect(gridCell(page, 'B3')).toHaveText('20');

  await commitCellThroughFormulaBar(page, 'D1', '=SUM(B2:B3)');
  await commitCellThroughFormulaBar(page, 'E1', '=SUM($B$3:$B$3)');
  await commitCellThroughFormulaBar(page, 'F1', '=SUM(B2:B2)');
  await rowHeader(page, 3).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 row above$/ }).click();

  await expect(gridCell(page, 'A2')).toHaveText('Alpha');
  await expect(gridCell(page, 'B2')).toHaveText('10');
  await expect(gridCell(page, 'A3')).toHaveText('');
  await expect(gridCell(page, 'B3')).toHaveText('');
  await expect(gridCell(page, 'A4')).toHaveText('Beta');
  await expect(gridCell(page, 'B4')).toHaveText('20');

  await expectStoredCell(page, 'D1', '=SUM(B2:B4)', 30);
  await expectStoredCell(page, 'E1', '=SUM($B$4:$B$4)', 20);
  await expectStoredCell(page, 'F1', '=SUM(B2:B2)', 10);
  await page.reload();

  await expect(gridCell(page, 'A3')).toHaveText('');
  await expect(gridCell(page, 'B3')).toHaveText('');
  await expect(gridCell(page, 'A4')).toHaveText('Beta');
  await expect(gridCell(page, 'B4')).toHaveText('20');
  await expectStoredCell(page, 'D1', '=SUM(B2:B4)', 30);
  await expectStoredCell(page, 'E1', '=SUM($B$4:$B$4)', 20);
  await expectStoredCell(page, 'F1', '=SUM(B2:B2)', 10);
});

test('REQ-2.2.1: Insert and Delete Rows - Scenario 2', async ({ page }) => {
  await createBlankWorkbook(page);
  await setClipboardText(page, 'Alpha\t10\nRemove me\t20\nBeta\t30');
  await gridCell(page, 'A2').click();
  await page.keyboard.press('Control+V');
  await expect(gridCell(page, 'A2')).toHaveText('Alpha');
  await expect(gridCell(page, 'A3')).toHaveText('Remove me');
  await expect(gridCell(page, 'A4')).toHaveText('Beta');

  await commitCellThroughFormulaBar(page, 'C1', '=B3');
  await commitCellThroughFormulaBar(page, 'D1', '=SUM(B2:B4)');
  await commitCellThroughFormulaBar(page, 'E1', '=SUM(B3:B3)');
  await expectStoredCell(page, 'C1', '=B3', 20);
  await expectStoredCell(page, 'D1', '=SUM(B2:B4)', 60);
  await rowHeader(page, 3).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Delete row$/ }).click();

  await expect(gridCell(page, 'A2')).toHaveText('Alpha');
  await expect(gridCell(page, 'A3')).toHaveText('Beta');
  await expect(gridCell(page, 'A4')).toHaveText('');

  await expectStoredCell(page, 'C1', '=#REF!', '#REF!');
  await expectStoredCell(page, 'D1', '=SUM(B2:B3)', 40);
  await expectStoredCell(page, 'E1', '=#REF!', '#REF!');
  await expect(gridCell(page, 'B2')).toHaveText('10');
  await expect(gridCell(page, 'B3')).toHaveText('30');
  await expect(gridCell(page, 'B4')).toHaveText('');
  await page.reload();
  await expect(gridCell(page, 'A2')).toHaveText('Alpha');
  await expect(gridCell(page, 'A3')).toHaveText('Beta');
  await expect(gridCell(page, 'A4')).toHaveText('');
  await expectStoredCell(page, 'C1', '=#REF!', '#REF!');
  await expectStoredCell(page, 'D1', '=SUM(B2:B3)', 40);
  await expectStoredCell(page, 'E1', '=#REF!', '#REF!');
  await expect(gridCell(page, 'B2')).toHaveText('10');
  await expect(gridCell(page, 'B3')).toHaveText('30');
  await expect(gridCell(page, 'B4')).toHaveText('');
});

test('REQ-2.2.1: Insert and Delete Rows - Scenario 3', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A1', 'Alpha');
  await commitCellThroughFormulaBar(page, 'A2', 'Beta');

  await rowHeader(page, 1).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 row below$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('Alpha');
  await expect(gridCell(page, 'A2')).toHaveText('');
  await expect(gridCell(page, 'A3')).toHaveText('Beta');
  await page.reload();
  await expect(gridCell(page, 'A1')).toHaveText('Alpha');
  await expect(gridCell(page, 'A2')).toHaveText('');
  await expect(gridCell(page, 'A3')).toHaveText('Beta');
});

test('REQ-2.2.1: Insert and Delete Rows - Scenario 4', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A1', '2');
  await commitCellThroughFormulaBar(page, 'B1', '=A1*2');

  await rowHeader(page, 1).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 row above$/ }).click();

  await expect(gridCell(page, 'A1')).toHaveText('');
  await expect(gridCell(page, 'A2')).toHaveText('2');
  await expectCalculatedNumber(gridCell(page, 'B2'), 4);
  await gridCell(page, 'B2').click();
  await expect(formulaBar(page)).toHaveValue('=A2*2');

  await page.reload();
  await expectCalculatedNumber(gridCell(page, 'B2'), 4);
  await gridCell(page, 'B2').click();
  await expect(formulaBar(page)).toHaveValue('=A2*2');
});

test('REQ-2.2.1: Insert and Delete Rows - Scenario 5', async ({ page }) => {
  await createBlankWorkbook(page);
  await commitCellThroughFormulaBar(page, 'A2', '50');
  await configureNumberValidation(page, 'A2', 'A2', '0', '100');

  await rowHeader(page, 2).click({ button: 'right' });
  await page.getByRole('menuitem', { name: /^Insert 1 row above$/ }).click();
  await expect(gridCell(page, 'A2')).toHaveText('');
  await expect(gridCell(page, 'A3')).toHaveText('50');

  await commitCellThroughFormulaBar(page, 'A3', '120', { accepted: false });
  await expectText(page, /Please enter a number between 0 and 100/);
  await expect(gridCell(page, 'A3')).toHaveText('50');
  await commitCellThroughFormulaBar(page, 'A2', '120');
  await expect(gridCell(page, 'A2')).toHaveText('120');

  await page.reload();
  await expect(gridCell(page, 'A2')).toHaveText('120');
  await expect(gridCell(page, 'A3')).toHaveText('50');
});
