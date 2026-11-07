import { type Page } from '@playwright/test';

export const memberForm = (page: Page) => page.getByRole('group', { name: 'Add member form', exact: true });
export const memberRecord = (page: Page, username: string) => page.getByRole('group', { name: `Member ${username}`, exact: true });
