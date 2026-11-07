import { expectText } from './support/observations';
import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import {
  commitCellThroughFormulaBar,
  createBlankWorkbook,
  gridCell,
  openWorkbookHome,
  uniqueName,
} from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-1.2.2: Rename a Workbook - Scenario 1', async ({ page }) => {
  await createBlankWorkbook(page);
  const newName = uniqueName('pw-workbook');
  await commitCellThroughFormulaBar(page, 'A1', 'Existing data');

  await page.getByRole('button', { name: /^Rename workbook$/ }).click();
  const nameInput = page.getByRole('textbox', { name: /^Workbook name$/ });
  await nameInput.fill(`  ${newName}  `);
  await nameInput.press('Enter');
  await expectText(page, newName, { exact: true });

  await openWorkbookHome(page);
  await page.getByRole('link', { name: newName, exact: true }).click();
  await expectText(page, newName, { exact: true });
  await expect(gridCell(page, 'A1')).toHaveText('Existing data');

  await page.getByRole('button', { name: /^Rename workbook$/ }).click();
  await expect(page.getByRole('textbox', { name: /^Workbook name$/ })).toHaveValue(newName);
});

test('REQ-1.2.2: Rename a Workbook - Scenario 2', async ({ page }) => {
  await createBlankWorkbook(page);

  await page.getByRole('button', { name: /^Rename workbook$/ }).click();
  const nameInput = page.getByRole('textbox', { name: /^Workbook name$/ });
  const originalName = await nameInput.inputValue();
  expect(originalName.trim()).not.toBe('');

  await nameInput.fill('   ');
  await page.getByRole('button', { name: /^Save$/ }).click();
  await expectText(page, /workbook name cannot be empty/);

  await page.reload();
  await expectText(page, originalName, { exact: true });
  await page.getByRole('button', { name: /^Rename workbook$/ }).click();
  await expect(page.getByRole('textbox', { name: /^Workbook name$/ })).toHaveValue(originalName);
});
