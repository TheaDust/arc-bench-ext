import { test, expect } from '@playwright/test';
import { action, notice, expectNotice } from '../arc-bench/keep/tests/helpers';

for (const named of [false, true]) {
  for (const wrapped of [false, true]) {
    test(`Keep accepts ${wrapped ? 'wrapped' : 'direct'} status text with ${named ? 'an explicit' : 'no'} accessible name`, async ({ page }) => {
      await page.setContent(`<div role="status" ${named ? 'aria-label="Note deleted"' : ''}>
        ${wrapped ? '<span>Note deleted</span>' : 'Note deleted'}<button>Undo</button><button>Dismiss notification</button>
      </div>`);
      await expectNotice(page, 'Note deleted');
      await expect(action(notice(page, 'Note deleted'), 'Undo')).toBeVisible();
      await expect(action(notice(page, 'Note deleted'), 'Dismiss notification')).toBeVisible();
    });
  }
}

test('Keep rejects a status name or message substring instead of the exact visible message', async ({ page }) => {
  await page.setContent(`<div role="status" aria-label="Note deleted"><span>Note archived</span></div>
    <div role="status"><span>Note deleted permanently</span></div>`);
  await expect(notice(page, 'Note deleted')).toHaveCount(0);
});

test('Keep rejects wrong-role, hidden-status and hidden-message notifications', async ({ page }) => {
  await page.setContent(`<div role="alert"><span>Note deleted</span></div>
    <div role="status" hidden><span>Note deleted</span></div>
    <div role="status"><span hidden>Note deleted</span><span>Note archived</span></div>`);
  await expect(notice(page, 'Note deleted')).toHaveCount(0);
});

test('Keep rejects duplicate notification identities', async ({ page }) => {
  await page.setContent(`<div role="status"><span>Note deleted</span><button>Undo</button></div>
    <div role="status"><span>Note deleted</span><button>Undo</button></div>`);
  await expect(expectNotice(page, 'Note deleted')).rejects.toThrow();
});

test('Keep scopes notification actions to the matching message', async ({ page }) => {
  await page.setContent(`<div role="status"><span>Note deleted</span></div>
    <div role="status"><span>Note archived</span><button>Undo</button></div>`);
  await expectNotice(page, 'Note deleted');
  await expect(action(notice(page, 'Note deleted'), 'Undo')).toHaveCount(0);
  await expect(action(notice(page, 'Note archived'), 'Undo')).toHaveCount(1);
});
