import { expect, type Page } from '@playwright/test';
import { expectSelectedChoice } from './public-controls';
import { expectCalculatedNumber, expectCellText } from './observations';

/** Check the displayed value and the stored input of the same active-sheet cell. */
export async function expectStoredCell(page: Page, coordinate: string, input: string, result: string | number = input) {
  const cell = page.getByRole('grid', { name: 'Worksheet grid', exact: true })
    .getByRole('gridcell', { name: coordinate, exact: true });
  if (typeof result === 'number') await expectCalculatedNumber(cell, result);
  else await expectCellText(cell, result);
  await cell.click();
  await expect(page.getByRole('textbox', { name: 'Formula bar', exact: true })).toHaveValue(input);
}

/** Observe every cell of a small pivot result, including headers and marginal totals. */
export async function expectPivotResult(page: Page, rows: readonly (readonly (string | number)[])[]) {
  const grid = page.getByRole('grid', { name: 'Worksheet grid', exact: true });
  for (const [row, values] of rows.entries()) for (const [column, value] of values.entries()) {
    const cell = grid.getByRole('gridcell', { name: `${String.fromCharCode(65 + column)}${row + 1}`, exact: true });
    if (typeof value === 'number') await expectCalculatedNumber(cell, value);
    else await expectCellText(cell, value);
  }
}

/** Inspect applied fields after reopening; an unavailable source field need not be selectable. */
export async function expectPivotFields(page: Page, fields: {
  rows: string; values?: string; columns?: string; method: 'SUM' | 'COUNT' | 'AVERAGE';
}) {
  const editor = page.getByRole('region', { name: 'Pivot table editor', exact: true });
  for (const [label, value] of [['Rows', fields.rows], ['Columns', fields.columns],
    ['Values', fields.values], ['Summarize by', fields.method]] as const) {
    if (value !== undefined) await expectSelectedChoice(editor.getByRole('combobox', { name: label, exact: true }), value);
  }
}
