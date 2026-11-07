import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 10_000,
  expect: { timeout: 400 },
  use: { browserName: 'chromium', actionTimeout: 1500, baseURL: 'https://github-oracle.test' },
  reporter: [['list'], ['json', { outputFile: resolve(__dirname, '../contract-results.json') }]],
  outputDir: '../browser-artifacts',
});
