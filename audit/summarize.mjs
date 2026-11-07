import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(resolve(directory, 'parent-revision.json'), 'utf8'));
const tasks = {};
const findings = [];
for (const task of Object.keys(manifest.tasks)) {
  const report = JSON.parse(await readFile(resolve(directory, `${task}.json`), 'utf8'));
  const statusCounts = {};
  for (const item of report.findings) {
    const status = item.status ?? 'unspecified';
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
    findings.push({ task, ...item, status });
  }
  tasks[task] = { requirements: report.reviewedRequirements, scenarios: report.reviewedScenarios,
    findings: report.findings.length, statusCounts,
    requirementsChanged: report.requirementsChanged ?? null,
    changedFiles: report.changedFiles, limitations: report.limitations };
}
const result = { revision: '2026-11-07-per-task-semantic-review',
  scope: 'Source-to-test review and targeted oracle contracts; no complete real-application rerun or empirical zero-error claim',
  tasks, findings };
await writeFile(resolve(directory, 'summary.json'), JSON.stringify(result, null, 2) + '\n');
const columns = ['task', 'id', 'severity', 'category', 'status', 'explanation', 'resolution', 'source', 'test', 'validation'];
const csv = value => `"${(typeof value === 'string' ? value : JSON.stringify(value ?? '')).replaceAll('"', '""')}"`;
await writeFile(resolve(directory, 'findings.csv'), '\uFEFF' + columns.join(',') + '\n' + findings.map(item => columns.map(key => csv(item[key])).join(',')).join('\n') + '\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(tasks).map(([task, info]) => [task, { findings: info.findings, statusCounts: info.statusCounts }])), null, 2));
