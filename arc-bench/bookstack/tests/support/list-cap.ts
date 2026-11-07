import { expect, type Locator } from '@playwright/test';
import { entry } from '../helpers';

/** Record roles are public; auxiliary buttons and links are not counted as records. */
export async function cappedEntry(collection: Locator, names: string[], limit: number): Promise<{ target: Locator; name: string }> {
  const records = collection.getByRole('listitem').or(collection.getByRole('row'));
  await expect.poll(() => records.count()).toBeGreaterThan(0);
  const count = await records.count();
  expect(count).toBeLessThanOrEqual(limit);
  const prepared: { target: Locator; name: string }[] = [];
  for (const name of names) expect(await entry(collection, name).count()).toBeLessThanOrEqual(1);
  for (const record of await records.all()) {
    await expect(record).toBeVisible();
    const matches: { target: Locator; name: string }[] = [];
    for (const name of names) {
      const target = entry(record, name);
      const found = await target.count();
      expect(found).toBeLessThanOrEqual(1);
      if (found) matches.push({ target, name });
    }
    if (matches.length) {
      expect(matches).toHaveLength(1);
      await expect(matches[0].target).toBeVisible();
      prepared.push(matches[0]);
    }
  }
  expect(prepared.length).toBeGreaterThan(0);
  // Picking any observed eligible record is authorized because ranking ties are unspecified.
  return prepared[0];
}
