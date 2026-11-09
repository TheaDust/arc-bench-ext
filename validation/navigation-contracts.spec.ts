import { test, expect } from '@playwright/test';
import { openUrl, reopen } from '../arc-bench/bookstack/tests/helpers';

const document = '<!doctype html><title>route</title><main>route</main>';

async function routedPage(page: import('@playwright/test').Page) {
  let loads = 0;
  await page.route('http://benchmark.test/**', async route => {
    loads++;
    await route.fulfill({ body: document, contentType: 'text/html' });
  });
  await page.goto('http://benchmark.test/#/page');
  return () => loads;
}

test('openUrl reloads an already-current hash URL instead of a same-document navigation', async ({ page }) => {
  const loads = await routedPage(page);
  expect(loads()).toBe(1);

  await openUrl(page, 'http://benchmark.test/#/page');
  expect(loads()).toBe(2);
  expect(page.url()).toBe('http://benchmark.test/#/page');
});

test('openUrl reloads after a hash-only route change', async ({ page }) => {
  const loads = await routedPage(page);
  await openUrl(page, 'http://benchmark.test/#/other');
  expect(loads()).toBe(2);
  expect(page.url()).toBe('http://benchmark.test/#/other');
});

test('openUrl still navigates when the URL differs and preserves fragment identity', async ({ page }) => {
  const loads = await routedPage(page);
  await openUrl(page, 'http://benchmark.test/other#/detail');
  expect(loads()).toBe(2);
  expect(page.url()).toBe('http://benchmark.test/other#/detail');
});

test('reopen is an explicit reload even when the URL is unchanged', async ({ page }) => {
  const loads = await routedPage(page);
  await reopen(page);
  expect(loads()).toBe(2);
  await reopen(page);
  expect(loads()).toBe(3);
});

test('openUrl resolves relative URLs against the current document', async ({ page }) => {
  const loads = await routedPage(page);
  await openUrl(page, '/relative#/page');
  expect(loads()).toBe(2);
  expect(page.url()).toBe('http://benchmark.test/relative#/page');
});
