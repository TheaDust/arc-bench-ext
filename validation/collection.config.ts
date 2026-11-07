import { defineConfig } from '@playwright/test';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');
const tasks = ['12306', 'bookstack', 'ctrip', 'github', 'keep', 'prestashop', 'sheet', 'stackoverflow'];

export default defineConfig({
  testMatch: '**/*.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 60_000,
  projects: tasks.map(name => ({ name, testDir: resolve(root, 'arc-bench', name, 'tests') })),
});
