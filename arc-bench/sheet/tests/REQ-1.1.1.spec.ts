import { baseUrl } from './support/e2e';
import { workbookTimestamp } from './support/workbook-record';
import { Browser, expect, Page, test } from '@playwright/test';
import {
  commitCellThroughFormulaBar,
  createBlankWorkbook,
  expectActiveWorksheet,
  gridCell,
  openWorkbookHome,
  openVisibleWorkbook,
  uniqueName,
} from './support/e2e';

async function renameWorkbook(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: /^Rename workbook$/ }).click();
  await page.getByRole('textbox', { name: /^Workbook name$/ }).fill(name);
  await page.getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

async function expectWorkbookInNewSession(
  browser: Browser,
  workbookName: string,
  editorUrl: string,
  cellValue: string,
  lastUpdatedText: string,
): Promise<void> {
  const context = await browser.newContext();
  try {
    const reopenedPage = await context.newPage();
    await reopenedPage.goto(editorUrl);
    await expect(reopenedPage.getByText(workbookName, { exact: true })).toBeVisible();
    await expect(reopenedPage.getByText(lastUpdatedText, { exact: true })).toBeVisible();
    await expect(gridCell(reopenedPage, 'A1')).toHaveText(cellValue);
    await expectActiveWorksheet(reopenedPage, 'Sheet1');
  } finally {
    await context.close();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-1.1.1: View and Open a Workbook - Scenario 1', async ({ page, browser }) => {
  const workbookName = uniqueName('pw-open-workbook');
  const updatedText = uniqueName('pw-open-value');
  await createBlankWorkbook(page);
  await renameWorkbook(page, workbookName);
  await commitCellThroughFormulaBar(page, 'A1', updatedText);
  await openWorkbookHome(page);
  const activeWorksheet = 'Sheet1';
  const activeWorksheetValue = updatedText;
  const workbookLink = page.getByRole('link', { name: workbookName, exact: true });
  await expect(workbookLink).toBeVisible();
  const lastUpdatedText = await workbookTimestamp(page, workbookName);

  await workbookLink.click();
  const editorUrl = page.url();
  await expect(page.getByText(workbookName, { exact: true })).toBeVisible();
  await expect(page.getByText(lastUpdatedText, { exact: true })).toBeVisible();
  await expect(gridCell(page, 'A1')).toHaveText(updatedText);
  await expect(page.getByText(updatedText, { exact: true })).toBeVisible();
  await expectActiveWorksheet(page, activeWorksheet);
  await expect(page.getByText(activeWorksheetValue, { exact: true })).toBeVisible();

  await page.reload();
  await expect(gridCell(page, 'A1')).toHaveText(updatedText);

  await page.reload();
  await expect(page.getByText(workbookName, { exact: true })).toBeVisible();
  await expect(page.getByText(updatedText, { exact: true })).toBeVisible();
  await expectActiveWorksheet(page, activeWorksheet);
  await expect(page.getByText(activeWorksheetValue, { exact: true })).toBeVisible();

  await expectWorkbookInNewSession(browser, workbookName, editorUrl, updatedText, lastUpdatedText);
});

test('REQ-1.1.1: View and Open a Workbook - Scenario 2', async ({ page, browser }) => {
  const firstName = uniqueName('pw-first-workbook');
  const secondName = uniqueName('pw-second-workbook');
  const firstValue = uniqueName('pw-first-value');
  const secondValue = uniqueName('pw-second-value');

  await createBlankWorkbook(page);
  await renameWorkbook(page, firstName);
  await commitCellThroughFormulaBar(page, 'A1', firstValue);
  const firstEditorUrl = page.url();

  await createBlankWorkbook(page);
  await renameWorkbook(page, secondName);
  await commitCellThroughFormulaBar(page, 'A1', secondValue);
  const secondEditorUrl = page.url();

  await openWorkbookHome(page);
  await expect(page.getByRole('link', { name: firstName, exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: secondName, exact: true })).toBeVisible();
  await page.getByRole('link', { name: firstName, exact: true }).click();
  await expect(gridCell(page, 'A1')).toHaveText(firstValue);
  await expect(page.getByText(secondValue, { exact: true })).toHaveCount(0);

  await page.reload();
  await expect(gridCell(page, 'A1')).toHaveText(firstValue);
  await expect(page.getByText(secondValue, { exact: true })).toHaveCount(0);
  await page.goto(secondEditorUrl);
  await expect(gridCell(page, 'A1')).toHaveText(secondValue);
  const context = await browser.newContext();
  try {
    const direct = await context.newPage();
    await direct.goto(firstEditorUrl);
    await expect(direct.getByText(firstName, { exact: true })).toBeVisible();
    await expect(gridCell(direct, 'A1')).toHaveText(firstValue);
    await expect(direct.getByText(secondValue, { exact: true })).toHaveCount(0);
  } finally { await context.close(); }
});
