import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

const [task, directory] = process.argv.slice(2);
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const revision = await json(new URL('../revision.json', import.meta.url));
const extension = revision.extension.tasks[task];
if (!extension || !directory) {
  console.error('Usage: node validation/summarize-interactions.mjs <keep|bookstack> <evaluation directory>');
  process.exit(2);
}

const input = parse(await readFile(new URL(`../arc-bench/${task}/requirements/requirements.yaml`, import.meta.url), 'utf8'));
const extensionCases = new Map();
const walkRequirements = node => {
  if (extension.requirements.includes(node.id)) {
    for (const scenario of node.scenarios) {
      const group = extension.basicScenarios.includes(scenario.id) ? 'extensionBasic' : 'extensionInteractions';
      extensionCases.set(`${node.id}: ${scenario.name}`, { group, scenarioId: scenario.id });
    }
  }
  for (const child of node.children ?? []) walkRequirements(child);
};
walkRequirements(input);

const cases = await json(join(directory, 'cases.json'));
const byId = new Map(cases.map(item => [item.id, item]));
assert.equal(byId.size, cases.length, 'Duplicate cases');
assert.equal(cases.length, revision.tasks[task].scenarios, 'Report case count does not match this revision');
const observed = new Map();
const report = await json(join(directory, 'playwright.json'));
const walkSuites = suite => {
  for (const spec of suite.specs ?? []) {
    for (const result of spec.tests) {
      const id = JSON.stringify([spec.file.replaceAll('\\', '/'), spec.line, spec.column, spec.title, result.projectName]);
      assert.ok(byId.has(id) && !observed.has(id), `Report does not match the case catalog: ${spec.title}`);
      observed.set(id, result.results.at(-1)?.status ?? 'not_run');
    }
  }
  for (const child of suite.suites ?? []) walkSuites(child);
};
for (const suite of report.suites ?? []) walkSuites(suite);

const groups = { existing: [], extensionBasic: [], extensionInteractions: [] };
const added = new Set();
for (const item of cases) {
  const metadata = extensionCases.get(item.title);
  if (metadata) {
    assert.ok(!added.has(item.title), `Duplicate extension case: ${item.title}`);
    added.add(item.title);
  }
  groups[metadata?.group ?? 'existing'].push({ title: item.title, scenarioId: metadata?.scenarioId,
    status: observed.get(item.id) ?? 'not_run' });
}
assert.equal(added.size, extensionCases.size, 'Report is missing extension cases');

const summarize = rows => {
  const count = (...statuses) => rows.filter(row => statuses.includes(row.status)).length;
  const total = rows.length, passed = count('passed'), skipped = count('skipped'), notRun = count('not_run', 'interrupted');
  return { total, passed, failed: total - passed - skipped - notRun, skipped, notRun, passRate: passed / total };
};
console.log(JSON.stringify({
  revision: revision.revision, task,
  groups: Object.fromEntries(Object.entries(groups).map(([name, rows]) => [name, summarize(rows)])),
  extensionCases: [...groups.extensionBasic, ...groups.extensionInteractions],
}, null, 2));
