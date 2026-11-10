import { expect, type Page } from '@playwright/test';

export async function expectRebookingIdentity(page: Page, train: string, passenger: string) {
    const dialog = page.getByRole('dialog', { name: 'Please confirm the following information.', exact: true });
    await expect(dialog).toBeVisible();
    for (const value of [train, passenger]) {
        await expect.poll(() => dialog.getByText(value, { exact: false }).filter({ visible: true }).count()).toBeGreaterThan(0);
    }
}
