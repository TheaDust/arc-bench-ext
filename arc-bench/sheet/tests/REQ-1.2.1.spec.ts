import { baseUrl } from './support/e2e';
import { expect, test } from '@playwright/test';
import {
  createBlankWorkbook,
  expectActiveWorksheet,
  expectSelectedCell,
  gridCell,
  expectBlankWorkbook,
} from './support/e2e';

test.beforeEach(async ({ page }) => {
  await page.goto(baseUrl());
});

test('REQ-1.2.1: Create a Blank Workbook - Scenario 1', async ({ page }) => {
  await createBlankWorkbook(page);

  await page.reload();
  await expectBlankWorkbook(page);
  await expectActiveWorksheet(page, 'Sheet1');
  await expectSelectedCell(page, 'A1');
  await expect(gridCell(page, 'A1')).toHaveText('');
});
