import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: '../../arc-bench/github/tests',
  testMatch: ['REQ-2.3.spec.ts','REQ-3.4.spec.ts','REQ-4.4.spec.ts','REQ-5.3.1.spec.ts','REQ-6.3.3.spec.ts'],
  grep: /Scenario 1$/,
  retries: 0, workers: 1, timeout: 8000,
  expect: { timeout: 500 },
  use: { baseURL: process.env.ORACLE_BASE_URL, actionTimeout: 1500 },
  reporter: [['json']],
  outputDir: './oracle-results',
});
