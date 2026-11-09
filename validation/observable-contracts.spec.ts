import { test, expect, type Locator, type Page } from '@playwright/test';
import * as keep from '../arc-bench/keep/tests/helpers';
import * as bookstack from '../arc-bench/bookstack/tests/helpers';

interface LiveHelpers {
  visibleMessage(scope: Page | Locator, message: string): Locator;
  notice(scope: Page | Locator, message: string): Locator;
  alertMessage(scope: Page | Locator, message: string): Locator;
  expectNotice(scope: Page | Locator, message: string): Promise<Locator>;
  expectAlert(scope: Page | Locator, message: string): Promise<Locator>;
}

const tasks: Record<string, LiveHelpers> = { keep, bookstack };

for (const [task, helpers] of Object.entries(tasks)) {
  test(`${task}: live message identity is the exact visible text, not an accessible name`, async ({ page }) => {
    await page.setContent('<div role="status">Note deleted<button>Undo</button></div>');
    await expect(helpers.notice(page, 'Note deleted')).toHaveCount(1);
    await helpers.expectNotice(page, 'Note deleted');
  });

  for (const named of [false, true]) {
    for (const wrapped of [false, true]) {
      test(`${task}: accepts ${wrapped ? 'wrapped' : 'direct'} text with ${named ? 'an explicit' : 'no'} accessible name`, async ({ page }) => {
        await page.setContent(`<div role="status" ${named ? 'aria-label="Note deleted"' : ''}>
          ${wrapped ? '<span>Note deleted</span>' : 'Note deleted'}<button>Undo</button></div>`);
        await helpers.expectNotice(page, 'Note deleted');
      });
    }
  }

  test(`${task}: an accessible name cannot replace a wrong or hidden visible message`, async ({ page }) => {
    await page.setContent(`<div role="status" aria-label="Note deleted"><span>Note archived</span></div>
      <div role="status" aria-label="Note deleted"><span hidden>Note deleted</span><span>Note archived</span></div>
      <div role="status"><span>Note deleted permanently</span></div>
      <div role="status" hidden><span>Note deleted</span></div>`);
    await expect(helpers.notice(page, 'Note deleted')).toHaveCount(0);
    await expect(helpers.expectNotice(page, 'Note deleted')).rejects.toThrow();
  });

  test(`${task}: repeated feedback satisfies presence without defining a unique notification`, async ({ page }) => {
    await page.setContent(`<div role="status"><span>Note deleted</span><button>Undo</button></div>
      <div role="status"><span>Note deleted</span><button>Undo</button></div>`);
    await expect(helpers.notice(page, 'Note deleted')).toHaveCount(2);
    await helpers.expectNotice(page, 'Note deleted');
  });

  test(`${task}: status and alert remain distinct roles with the same visible-message rule`, async ({ page }) => {
    await page.setContent('<div role="alert">Page deleted</div><div role="status">Page deleted</div>');
    await helpers.expectAlert(page, 'Page deleted');
    await expect(helpers.alertMessage(page, 'Page deleted')).toHaveCount(1);
    await expect(helpers.notice(page, 'Page deleted')).toHaveCount(1);
    await expect(helpers.expectAlert(page, 'Page deleted elsewhere')).rejects.toThrow();
  });

  for (const role of ['status', 'alert'] as const) {
    test(`${task}: ${role} accepts inline message fragments and excludes controls and hidden suffixes`, async ({ page }) => {
      await page.setContent(`<div role="${role}"><span>Note</span> <strong>deleted</strong><span hidden> permanently</span><button>Undo</button></div>`);
      const message = role === 'status' ? helpers.notice : helpers.alertMessage;
      await expect(message(page, 'Note deleted')).toHaveCount(1);
      await expect(message(page, 'Note')).toHaveCount(0);
    });

    test(`${task}: ${role} rejects aria-hidden message fragments and ancestors`, async ({ page }) => {
      await page.setContent(`<div role="${role}"><span aria-hidden="true">Note deleted</span></div>
        <div role="${role}"><span>Note </span><span aria-hidden="true">deleted</span></div>
        <div aria-hidden="true"><div role="${role}">Note deleted</div></div>
        <div role="${role}"><span style="display:none">Note deleted</span></div>
        <div role="${role}"><span inert>Note deleted</span></div>`);
      const message = role === 'status' ? helpers.notice : helpers.alertMessage;
      await expect(message(page, 'Note deleted')).toHaveCount(0);
    });
  }

  test(`${task}: split text cannot turn a longer message into an exact match`, async ({ page }) => {
    await page.setContent('<div role="status"><span>Note</span> <strong>deleted permanently</strong></div>');
    await expect(helpers.notice(page, 'Note deleted')).toHaveCount(0);
  });

  test(`${task}: direct message text survives a separate explanation without borrowing button text`, async ({ page }) => {
    await page.setContent('<div role="alert">Page <strong>deleted</strong><p>Your input is preserved.</p><button>Back to book</button></div>');
    await helpers.expectAlert(page, 'Page deleted');
    await expect(helpers.alertMessage(page, 'Back to book')).toHaveCount(0);
  });

  test(`${task}: message matching stays inside a locator scope and follows DOM updates`, async ({ page }) => {
    await page.setContent('<section aria-label="Target"><div role="status">Note archived</div></section><div role="status">Note deleted</div>');
    const scope = page.getByRole('region', { name: 'Target', exact: true });
    const message = helpers.notice(scope, 'Note deleted');
    await expect(message).toHaveCount(0);
    await scope.getByRole('status').evaluate(element => { element.innerHTML = '<span>Note</span> <strong>deleted</strong>'; });
    await expect(message).toHaveCount(1);
  });
}
