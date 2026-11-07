import { expect, type Page } from '@playwright/test';

export async function output(page: Page, name: string, region?: string): Promise<string> {
  const scope = region ? page.getByRole('region', { name: region, exact: true }) : page;
  const value = scope.getByRole('status', { name, exact: true });
  await expect(value).toBeVisible();
  const text = (await value.innerText()).trim();
  expect(text).not.toBe('');
  return text;
}
async function rows(page: Page, name: string, headers: string[]): Promise<string[][]> {
  const table = page.getByRole('table', { name, exact: true });
  await expect(table).toBeVisible();
  await expect(table.getByRole('columnheader')).toHaveText(headers);
  const result: string[][] = [];
  for (const row of await table.getByRole('row').all()) {
    const cells = row.getByRole('cell');
    if (!await cells.count()) continue;
    await expect(row).toBeVisible();
    expect(await cells.count()).toBe(headers.length);
    result.push((await cells.allInnerTexts()).map(value => value.trim()));
  }
  return result.sort((a,b) => a[0].localeCompare(b[0]));
}
export async function branchState(page: Page) {
  const owner = await output(page, 'Repository owner', 'Branch state');
  const branch = await output(page, 'Branch name', 'Branch state');
  const head = await output(page, 'Branch head', 'Branch state');
  const files = await rows(page, 'Branch files', ['Path','Content']);
  const commits = await rows(page, 'Commit history', ['Commit','Parents','Author','Message']);
  expect(new Set(files.map(row => row[0])).size).toBe(files.length);
  expect(new Set(commits.map(row => row[0])).size).toBe(commits.length);
  expect(commits.some(row => row[0] === head)).toBe(true);
  for (const commit of commits) {
    expect(commit[0]).not.toBe('');
    for (const parent of commit[1].split(',').map(value => value.trim()).filter(Boolean)) {
      expect(commits.some(row => row[0] === parent)).toBe(true);
    }
  }
  return { owner, branch, head, files, commits };
}
export async function createFile(page: Page, name: string, content: string, message: string) {
  await page.getByRole('button', { name: 'Add file', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Create new file', exact: true }).click();
  await page.getByRole('textbox', { name: 'File name', exact: true }).fill(name);
  await page.getByRole('textbox', { name: 'File contents', exact: true }).fill(content);
  await page.getByRole('textbox', { name: 'Commit message', exact: true }).fill(message);
  await page.getByRole('button', { name: 'Commit changes', exact: true }).click();
}
