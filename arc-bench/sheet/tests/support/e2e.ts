import { selectChoice } from './public-controls';
import { Download, expect, Locator, Page, test } from '@playwright/test';

export function baseUrl(): string {
  const url = test.info().project.use.baseURL;
  if (!url) throw new Error('Configure use.baseURL in playwright.config.ts');
  return url;
}

export function uniqueName(prefix: string): string {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}`;
}

export async function expectOne(locator: Locator): Promise<void> {
  await expect(locator).toHaveCount(1);
  await expect(locator).toBeVisible();
}

export async function openWorkbookHome(page: Page): Promise<void> {
  await page.goto(baseUrl());
}

export async function openVisibleWorkbook(page: Page, workbookName: string): Promise<void> {
  await openWorkbookHome(page);
  await page.getByRole('link', { name: workbookName, exact: true }).click();
}

export function worksheetTab(page: Page, name: string): Locator {
  return page.getByRole('tab', { name, exact: true });
}

export function gridCell(page: Page, coordinate: string): Locator {
  return page.getByRole('gridcell', { name: coordinate, exact: true });
}

export function formulaBar(page: Page): Locator {
  return page.getByRole('textbox', { name: 'Formula bar', exact: true });
}

export function inlineCellEditor(page: Page, coordinate: string): Locator {
  return page.getByRole('textbox', {
    name: `Edit ${coordinate}`,
    exact: true,
  });
}

export function rowHeader(page: Page, rowNumber: number): Locator {
  return page.getByRole('rowheader', { name: String(rowNumber), exact: true });
}

export function columnHeader(page: Page, columnLetters: string): Locator {
  return page.getByRole('columnheader', { name: columnLetters, exact: true });
}

export function worksheetOptionsButton(page: Page, worksheetName: string): Locator {
  return page.getByRole('button', {
    name: `Worksheet options for ${worksheetName}`,
    exact: true,
  });
}

export async function expectActiveWorksheet(page: Page, name: string): Promise<void> {
  await expect(worksheetTab(page, name)).toHaveAttribute('aria-selected', 'true');
}

export async function expectSelectedCell(page: Page, coordinate: string): Promise<void> {
  await expect(gridCell(page, coordinate)).toHaveAttribute('aria-selected', 'true');
}

export async function expectSelectedRange(page: Page, start: string, end: string): Promise<void> {
  const references = cellReferencesInRange(start, end);
  const grid = page.getByRole('grid', { name: 'Worksheet grid', exact: true });
  await expect(grid).toHaveAttribute('aria-multiselectable', 'true');
  for (const coordinate of references) await expect(gridCell(page, coordinate)).toHaveAttribute('aria-selected', 'true');
  await expect(grid.getByRole('gridcell', { selected: true })).toHaveCount(references.length);
  await expect.poll(() => grid.getByRole('gridcell').evaluateAll(cells => cells.every(cell =>
    ['true', 'false'].includes(cell.getAttribute('aria-selected') ?? '')))).toBe(true);
}

export async function expectBlankWorkbook(page: Page): Promise<void> {
  await expect(page.getByRole('tab')).toHaveCount(1);
  await expectActiveWorksheet(page, 'Sheet1');
  await expectSelectedRange(page, 'A1', 'A1');
  const cells = page.getByRole('grid', { name: 'Worksheet grid', exact: true }).getByRole('gridcell');
  await expect.poll(async () => (await cells.allTextContents()).every(value => value.trim() === '')).toBe(true);
}

export async function createBlankWorkbook(page: Page): Promise<string> {
  await openWorkbookHome(page);
  const newWorkbook = page.getByRole('button', {
    name: 'New blank workbook',
    exact: true,
  });
  await expectOne(newWorkbook);
  await newWorkbook.click();
  const create = page.getByRole('button', { name: 'Create', exact: true });
  await expectOne(create);
  await create.click();
  await expectActiveWorksheet(page, 'Sheet1');
  await expectSelectedCell(page, 'A1');
  await expectBlankWorkbook(page);
  return page.url();
}

export async function addWorksheet(page: Page, expectedName: string): Promise<void> {
  const add = page.getByRole('button', { name: 'Add worksheet', exact: true });
  await expectOne(add);
  await add.click();
  await expectActiveWorksheet(page, expectedName);
  await expectSelectedCell(page, 'A1');
}

export async function openWorksheetOptions(page: Page, worksheetName: string): Promise<void> {
  const options = worksheetOptionsButton(page, worksheetName);
  await expectOne(options);
  await options.click();
}

export async function openDataMenu(page: Page): Promise<void> {
  const data = page.getByRole('button', { name: 'Data', exact: true });
  await expectOne(data);
  await data.click();
}

export async function selectCellRange(page: Page, start: string, end: string): Promise<void> {
  const startCell = gridCell(page, start);
  await expect(startCell).toBeVisible();

  if (start === end) {
    await startCell.click();
    await expect(startCell).toHaveAttribute('aria-selected', 'true');
    return;
  }

  const endCell = gridCell(page, end);
  const selectedCells = cellReferencesInRange(start, end).map((coordinate) => gridCell(page, coordinate));
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await startCell.dragTo(endCell);
    try {
      await expect(startCell).toHaveAttribute('aria-selected', 'true', { timeout: 1_000 });
      await expect(endCell).toHaveAttribute('aria-selected', 'true', { timeout: 1_000 });
      for (const cell of selectedCells) {
        // A filtered row may be hidden or unmounted. Visible endpoint selection
        // and the later full-range business result are independent obligations.
        if (await cell.count()) await expect(cell).toHaveAttribute('aria-selected', 'true', { timeout: 1_000 });
      }
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function cellReferencesInRange(start: string, end: string): string[] {
  const startCoordinate = parseCellReference(start);
  const endCoordinate = parseCellReference(end);
  const references: string[] = [];

  for (
    let rowIndex = Math.min(startCoordinate.rowIndex, endCoordinate.rowIndex);
    rowIndex <= Math.max(startCoordinate.rowIndex, endCoordinate.rowIndex);
    rowIndex += 1
  ) {
    for (
      let columnIndex = Math.min(startCoordinate.columnIndex, endCoordinate.columnIndex);
      columnIndex <= Math.max(startCoordinate.columnIndex, endCoordinate.columnIndex);
      columnIndex += 1
    ) {
      references.push(`${columnLetters(columnIndex)}${rowIndex + 1}`);
    }
  }

  return references;
}

function parseCellReference(reference: string): { rowIndex: number; columnIndex: number } {
  const match = /^([A-Z]+)(\d+)$/i.exec(reference);
  if (!match) {
    throw new Error(`Invalid cell reference: ${reference}`);
  }

  const columnIndex = match[1]
    .toUpperCase()
    .split('')
    .reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  return { rowIndex: Number(match[2]) - 1, columnIndex };
}

function columnLetters(columnIndex: number): string {
  let letters = '';
  let remaining = columnIndex;

  do {
    letters = String.fromCharCode(65 + (remaining % 26)) + letters;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);

  return letters;
}

export async function commitCellThroughFormulaBar(
  page: Page,
  coordinate: string,
  content: string,
  options: { accepted?: boolean } = {},
): Promise<void> {
  const cell = gridCell(page, coordinate);
  await cell.click();
  await formulaBar(page).fill(content);
  await formulaBar(page).press('Enter');
  if (options.accepted !== false) {
    await cell.click();
    await expect(formulaBar(page)).toHaveValue(content);
  }
}

export async function commitCellThroughGrid(
  page: Page,
  coordinate: string,
  content: string,
  options: { accepted?: boolean } = {},
): Promise<void> {
  const cell = gridCell(page, coordinate);
  await cell.dblclick();
  const editor = inlineCellEditor(page, coordinate);
  await expect(editor).toBeVisible();
  await editor.fill(content);
  await editor.press('Enter');
  if (options.accepted !== false) {
    await cell.click();
    await expect(formulaBar(page)).toHaveValue(content);
  }
}

export async function configureNumberValidation(
  page: Page,
  start: string,
  end: string,
  minimum: string,
  maximum: string,
): Promise<void> {
  await selectCellRange(page, start, end);
  await openDataMenu(page);
  await page.getByRole('menuitem', { name: 'Data validation', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Data validation', exact: true });
  await expect(dialog).toBeVisible();
  await selectChoice(dialog.getByRole('combobox', { name: 'Rule type', exact: true }), { label: 'Number range' });
  await dialog.getByRole('textbox', { name: 'Minimum', exact: true }).fill(minimum);
  await dialog.getByRole('textbox', { name: 'Maximum', exact: true }).fill(maximum);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function configureDropdownValidation(
  page: Page,
  start: string,
  end: string,
  allowedValues: string[],
): Promise<void> {
  await selectCellRange(page, start, end);
  await openDataMenu(page);
  await page.getByRole('menuitem', { name: 'Data validation', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Data validation', exact: true });
  await expect(dialog).toBeVisible();
  await selectChoice(dialog.getByRole('combobox', { name: 'Rule type', exact: true }), { label: 'Dropdown' });
  await dialog.getByRole('textbox', { name: 'Allowed values', exact: true }).fill(allowedValues.join(', '));
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function setClipboardText(page: Page, content: string): Promise<void> {
  const origin = new URL(page.url()).origin;
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await page.evaluate(async (text) => navigator.clipboard.writeText(text), content);
}

export async function readDownload(download: Download): Promise<string> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf8');
}

export function normalizeCsv(csv: string): string {
  return csv
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n');
}
