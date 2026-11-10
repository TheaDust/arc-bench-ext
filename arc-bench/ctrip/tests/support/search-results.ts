import { expect, type Page } from '@playwright/test';
import { region, textVisible } from '../helpers';

export async function expectEmptyFlightSearch(page: Page) {
  const list = region(page, 'Flight list');
  await textVisible(list, 'No flights found');
  await expect(list.getByRole('listitem')).toHaveCount(0);
}
