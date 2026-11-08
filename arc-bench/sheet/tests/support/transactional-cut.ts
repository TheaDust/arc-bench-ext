import { expect, type Page } from '@playwright/test';
import { baseUrl, createBlankWorkbook, formulaBar, gridCell, selectCellRange, setClipboardText } from './e2e';
import { expectCalculatedNumber, expectText } from './observations';

export type Cells = Record<string, string | readonly [expression: string, result: number]>;

export async function openWorksheet(page: Page, table: string) {
  await page.goto(baseUrl());
  await createBlankWorkbook(page);
  await setClipboardText(page, table);
  await gridCell(page, 'A1').click();
  await page.keyboard.press('Control+V');
}

export async function expectCells(page: Page, cells: Cells) {
  for (const [coordinate, value] of Object.entries(cells)) {
    const cell = gridCell(page, coordinate);
    if (typeof value === 'string') {
      await expect(cell, coordinate).toHaveText(value);
    } else {
      const [formula, result] = value;
      await expectCalculatedNumber(cell, result);
      await cell.click();
      await expect(formulaBar(page), coordinate).toHaveValue(formula);
    }
  }
}

export async function cutTo(page: Page, destination: string) {
  await selectCellRange(page, 'A1', 'B2');
  await page.keyboard.press('Control+X');
  await gridCell(page, destination).click();
  await page.keyboard.press('Control+V');
}

export async function history(page: Page, action: 'Undo' | 'Redo') {
  await page.getByRole('button', { name: action, exact: true }).click();
}

export async function expectRangeRejection(page: Page, maximum: number) {
  await expectText(page, `Please enter a number between 0 and ${maximum}`, { exact: true });
}

export async function expectNumberRejected(page: Page, coordinate: string, attempted: number, maximum: number) {
  await gridCell(page, coordinate).click();
  await formulaBar(page).fill(String(attempted));
  await formulaBar(page).press('Enter');
  await expectRangeRejection(page, maximum);
}
