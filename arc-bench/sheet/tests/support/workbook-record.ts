import { expect, type Page } from '@playwright/test';

export async function workbookTimestamp(page: Page, name: string): Promise<string> {
  const record = page.getByRole('group', { name: `Workbook ${name}`, exact: true });
  await expect(record).toHaveCount(1);
  await expect(record.getByRole('link', { name, exact: true })).toHaveCount(1);
  const timestamp = record.getByText(/^Last updated: /);
  await expect(timestamp).toBeVisible();
  return timestamp.innerText();
}
