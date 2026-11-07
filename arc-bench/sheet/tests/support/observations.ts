import { expect, type Locator, type Page } from '@playwright/test';

/** Presence is existential; duplicate visible copies are not duplicate action identities. */
export async function expectText(scope: Page | Locator, value: string | RegExp, options: { exact?: boolean } = {}): Promise<void> {
  await expect.poll(() => scope.getByText(value, options).filter({ visible: true }).count()).toBeGreaterThan(0);
}

/** Compare cell text without collapsing a meaningful newline, space, or leading zero. */
export async function expectCellText(cell: Locator, value: string): Promise<void> {
  await expect(cell).toBeVisible();
  await expect.poll(async () => (await cell.textContent())?.replace(/\r\n/g, '\n')).toBe(value.replace(/\r\n/g, '\n'));
}

/** A calculated number is independent of harmless decimal zeros or grouping. */
function calculatedNumber(text: string): number | null {
  const numeric = /^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i;
  return numeric.test(text.trim()) ? Number(text.trim().replaceAll(',', '')) : null;
}

export async function expectCalculatedNumber(cell: Locator, expected: number): Promise<void> {
  await expect(cell).toBeVisible();
  await expect.poll(async () => calculatedNumber(await cell.innerText())).toBe(expected);
}

/** RFC-style CSV decoding for the external oracle, independent of target application code. */
export function csvCells(source: string): string[][] {
  const csv = source.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;
  let endedRecord = false;
  for (let index = 0; index < csv.length; index++) {
    const char = csv[index];
    endedRecord = false;
    if (quoted) {
      if (char !== '"') field += char;
      else if (csv[index + 1] === '"') { field += '"'; index++; }
      else { quoted = false; closedQuote = true; }
    } else if (char === ',' || char === '\r' || char === '\n') {
      row.push(field.replace(/\r\n/g, '\n'));
      field = '';
      closedQuote = false;
      if (char !== ',') {
        rows.push(row);
        row = [];
        endedRecord = true;
        if (char === '\r' && csv[index + 1] === '\n') index++;
      }
    } else if (closedQuote) throw new Error('Unexpected content after closing CSV quote');
    else if (char === '"') {
      if (field.length) throw new Error('A CSV quote must begin its field');
      quoted = true;
    } else field += char;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (!endedRecord) { row.push(field.replace(/\r\n/g, '\n')); rows.push(row); }
  return rows;
}

export function expectCsvValues(actual: string, expected: string, calculatedCells: readonly (readonly [number, number])[] = []): void {
  const actualRows = csvCells(actual);
  const expectedRows = csvCells(expected);
  expect(actualRows.map(row => row.length)).toEqual(expectedRows.map(row => row.length));
  for (const [row, fields] of expectedRows.entries()) for (const [column, value] of fields.entries()) {
    if (calculatedCells.some(([r, c]) => r === row && c === column))
      expect(calculatedNumber(actualRows[row][column])).toBe(Number(value));
    else expect(actualRows[row][column]).toBe(value);
  }
}
