import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const [task, baseURL, ...args] = process.argv.slice(2);
if (!task || !baseURL) {
  console.error('Usage: node validation/run-task-suite.mjs <task> <base-url> [--grep <pattern>] [--output <directory>]');
  process.exit(2);
}
const taskDir = resolve(root, 'arc-bench', task);
try {
  await readFile(join(taskDir, 'requirements', 'requirements.yaml'));
} catch {
  console.error(`Unknown task or missing requirements: ${task}`);
  process.exit(2);
}
let parsed;
try {
  parsed = new URL(baseURL);
} catch {
  console.error(`Invalid base URL: ${baseURL}`);
  process.exit(2);
}
if (!['http:', 'https:'].includes(parsed.protocol)) {
  console.error(`Base URL must use http:// or https://: ${baseURL}`);
  process.exit(2);
}

const grepIndex = args.indexOf('--grep');
const grep = grepIndex >= 0 ? args[grepIndex + 1] : undefined;
const outputIndex = args.indexOf('--output');
if (outputIndex >= 0 && (!args[outputIndex + 1] || args[outputIndex + 1].startsWith('--'))) {
  console.error('--output requires a new directory path.');
  process.exit(2);
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(outputIndex >= 0 ? args[outputIndex + 1]
  : join(directory, 'suites', `${task}-${stamp}`));
await mkdir(dirname(output), { recursive: true });
try {
  await mkdir(output);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.error(`Output directory already exists; choose a new directory: ${output}`);
  process.exit(2);
}
await mkdir(join(output, 'tests'));
await cp(join(taskDir, 'tests'), join(output, 'tests'), { recursive: true });

let fixtures = '';
try {
  fixtures = await readFile(join(taskDir, 'tests', 'fixtures', 'data.ts'), 'utf8');
} catch {
  // Most tasks do not declare a benchmark clock fixture.
}
const timezone = fixtures.includes('+08:00') ? 'Asia/Shanghai' : 'UTC';
console.error(`Running ${task} tests against one shared application instance at ${parsed.href}.`);
console.error('This is a reference/targeted check, not the per-scenario isolation scoring protocol.');

const config = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: './artifacts',
  reporter: [['list'], ['json', { outputFile: './report.json' }]],
  use: {
    baseURL: ${JSON.stringify(parsed.href)},
    timezoneId: ${JSON.stringify(timezone)},
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
`;
await writeFile(join(output, 'playwright.config.ts'), config);

const cli = resolve(dirname(fileURLToPath(import.meta.resolve('@playwright/test/package.json'))), 'cli.js');
const run = spawnSync(process.execPath, [cli, 'test', '--config', join(output, 'playwright.config.ts'),
  ...(grep ? ['--grep', grep] : [])], { cwd: output, stdio: 'inherit', windowsHide: true });

let report;
try {
  report = JSON.parse(await readFile(join(output, 'report.json'), 'utf8'));
} catch {
  console.error(`No Playwright report was produced. Suite definition: ${output}`);
  process.exit(2);
}
const stats = report.stats ?? {};
const summary = {
  task,
  baseURL: parsed.href,
  suite: output,
  expected: stats.expected ?? 0,
  unexpected: stats.unexpected ?? 0,
  flaky: stats.flaky ?? 0,
  skipped: stats.skipped ?? 0,
  durationMs: stats.duration ?? 0,
};
console.log(JSON.stringify(summary, null, 2));
if (run.error) {
  console.error(run.error.message);
  process.exit(2);
}
process.exitCode = summary.unexpected ? 1 : (run.status ?? 2);
