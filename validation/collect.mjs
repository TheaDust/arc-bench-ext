import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const cli = resolve(dirname(fileURLToPath(import.meta.resolve('@playwright/test/package.json'))), 'cli.js');
const output = execFileSync(process.execPath, [cli, 'test', '--config', resolve(directory, 'collection.config.ts'), '--list', '--reporter=json'],
  { cwd: root, encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
const report = resolve(directory, 'collection-report.json');
JSON.parse(output);
writeFileSync(report, output);
execFileSync(process.execPath, [resolve(directory, 'audit-inputs.mjs'), report, resolve(directory, 'inputs.json')],
  { cwd: root, stdio: 'inherit', windowsHide: true });
