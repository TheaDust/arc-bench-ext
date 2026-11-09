import { test, expect, type Page } from '@playwright/test';
import { expectPivotFields, expectPivotResult, expectStoredCell } from '../arc-bench/sheet/tests/support/experiment-observations';

const count = [
  ['Region', 'Q1', 'Q2', 'Grand Total'], ['East', 2, 1, 3],
  ['North', 1, 0, 1], ['Grand Total', 3, 1, 4],
] as const;
const textCount = [['Region', 'COUNT of Status'], ['East', 2], ['North', 1], ['South', 1], ['Grand Total', 4]] as const;
const escape = (value: string | number) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
function grid(rows: readonly (readonly (string | number)[])[], mutate: Record<string, string> = {}) {
  return `<div role="grid" aria-label="Worksheet grid">${rows.map((values, row) => `<div role="row">${values.map((value, column) => {
    const coordinate = `${String.fromCharCode(65 + column)}${row + 1}`;
    return `<div role="gridcell" aria-label="${coordinate}">${escape(mutate[coordinate] ?? value)}</div>`;
  }).join('')}</div>`).join('')}</div>`;
}

test('Sheet accepts the complete column COUNT result', async ({ page }) => {
  await page.setContent(grid(count));
  await expectPivotResult(page, count);
});
for (const coordinate of ['B4', 'C4', 'D4']) {
  test(`Sheet rejects an incorrect COUNT marginal total at ${coordinate}`, async ({ page }) => {
    await page.setContent(grid(count, { [coordinate]: '99' }));
    await expect(expectPivotResult(page, count)).rejects.toThrow();
  });
}
test('Sheet accepts the complete text COUNT result', async ({ page }) => {
  await page.setContent(grid(textCount));
  await expectPivotResult(page, textCount);
});
for (const coordinate of ['A5', 'B5']) {
  test(`Sheet rejects a missing text COUNT grand total at ${coordinate}`, async ({ page }) => {
    await page.setContent(grid(textCount, { [coordinate]: '' }));
    await expect(expectPivotResult(page, textCount)).rejects.toThrow();
  });
}
test('Sheet cannot borrow a total from outside the active grid', async ({ page }) => {
  await page.setContent(grid(count, { B4: '99' }) + '<div role="gridcell" aria-label="B4">3</div>');
  await expect(expectPivotResult(page, count)).rejects.toThrow();
});
test('Sheet rejects a hidden or duplicate pivot cell', async ({ page }) => {
  await page.setContent(grid(count));
  await page.getByRole('gridcell', { name: 'B4', exact: true }).evaluate(element => { (element as HTMLElement).hidden = true; });
  await expect(expectPivotResult(page, count)).rejects.toThrow();
  await page.setContent(grid(count));
  await page.getByRole('grid', { name: 'Worksheet grid' }).evaluate(element => {
    const duplicate = document.createElement('div'); duplicate.setAttribute('role', 'gridcell');
    duplicate.setAttribute('aria-label', 'B4'); duplicate.textContent = '3'; element.append(duplicate);
  });
  await expect(expectPivotResult(page, count)).rejects.toThrow();
});

async function cellFixture(page: Page, input: string, result: string) {
  await page.setContent(`<div role="grid" aria-label="Worksheet grid"><div role="gridcell" aria-label="A1">${escape(result)}</div></div><input aria-label="Formula bar">`);
  await page.getByRole('gridcell').evaluate((element, input) => {
    element.addEventListener('click', () => { document.querySelector('input')!.value = input; });
  }, input);
}
test('Sheet accepts a rewritten stored expression with its calculated value', async ({ page }) => {
  await cellFixture(page, '=SUM(B2:B3)', '40.00');
  await expectStoredCell(page, 'A1', '=SUM(B2:B3)', 40);
});
test('Sheet rejects a stale stored expression even when the displayed result matches', async ({ page }) => {
  await cellFixture(page, '=SUM(B2:B4)', '40');
  await expect(expectStoredCell(page, 'A1', '=SUM(B2:B3)', 40)).rejects.toThrow();
});
test('Sheet rejects a restored cell whose own stored ordinary input is wrong', async ({ page }) => {
  await cellFixture(page, '7', '007');
  await expect(expectStoredCell(page, 'A1', '007')).rejects.toThrow();
});
test('Sheet distinguishes stored invalid references from a merely matching error display', async ({ page }) => {
  await cellFixture(page, '=#REF!', '#REF!');
  await expectStoredCell(page, 'A1', '=#REF!', '#REF!');
  await cellFixture(page, '=B3', '#REF!');
  await expect(expectStoredCell(page, 'A1', '=#REF!', '#REF!')).rejects.toThrow();
});

async function pivotFixture(page: Page, method: string, popup = false) {
  const control = (label: string, selected: string) => popup
    ? `<div role="combobox" aria-label="${label}">${selected}</div>`
    : `<label>${label}<select><option value="private-option">${selected}</option></select></label>`;
  await page.setContent(`<section aria-label="Pivot table editor">${control('Rows', 'Status')}${control('Values', 'Region')}${control('Summarize by', method)}</section>`);
}
for (const popup of [false, true]) {
  test(`Sheet accepts saved COUNT fields in ${popup ? 'popup' : 'native'} controls`, async ({ page }) => {
    await pivotFixture(page, 'COUNT', popup);
    await expectPivotFields(page, { rows: 'Status', values: 'Region', method: 'COUNT' });
  });
}
test('Sheet rejects a rejected SUM choice persisted as the applied method', async ({ page }) => {
  await pivotFixture(page, 'SUM');
  await expect(expectPivotFields(page, { rows: 'Status', values: 'Region', method: 'COUNT' })).rejects.toThrow();
});
test('Sheet rejects swapped saved row and value fields', async ({ page }) => {
  await pivotFixture(page, 'COUNT');
  await expect(expectPivotFields(page, { rows: 'Region', values: 'Status', method: 'COUNT' })).rejects.toThrow();
});
