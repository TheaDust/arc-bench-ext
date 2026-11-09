import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

export default defineConfig({
  testDir: '.',
  testMatch: '*contracts.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 5000,
  expect: { timeout: 350 },
  reporter: [['list'], ['json', { outputFile: resolve(__dirname, '.tmp', `contracts-${Date.now()}-${process.pid}.json`) }]],
  outputDir: 'contract-results',
  use: { browserName: 'chromium', actionTimeout: 1000 },
});
