import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const parent = JSON.parse(await readFile(resolve(root, 'revision.json'), 'utf8'));
const results = {};
for (const task of Object.keys(parent.tasks)) {
  const doc = parseDocument(await readFile(resolve(root, 'arc-bench', task, 'requirements/requirements.yaml'), 'utf8'), { uniqueKeys: true });
  assert.equal(doc.errors.length, 0, `${task}: invalid YAML`);
  const scenarios = new Map();
  const leaves = new Set();
  const visit = node => {
    if (!(node.children ?? []).length) leaves.add(node.id);
    for (const scenario of node.scenarios ?? []) {
      assert.ok(!scenarios.has(scenario.id), `${task}: duplicate scenario`);
      scenarios.set(scenario.id, { requirementId: node.id, scenario });
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(doc.toJS());
  const report = JSON.parse(await readFile(resolve(directory, `${task}.json`), 'utf8'));
  assert.equal(report.task, task);
  assert.equal(report.reviewedRequirements, leaves.size, `${task}: reviewed requirement count`);
  assert.equal(report.reviewedScenarios, scenarios.size, `${task}: reviewed scenario count`);
  assert.equal(report.scenarios.length, scenarios.size);
  const seen = new Set();
  for (const row of report.scenarios) {
    assert.ok(!seen.has(row.scenarioId), `${task}: duplicate review row ${row.scenarioId}`);
    seen.add(row.scenarioId);
    const original = scenarios.get(row.scenarioId);
    assert.ok(original, `${task}: unknown scenario ${row.scenarioId}`);
    assert.equal(row.requirementId, original.requirementId);
    assert.ok(row.coverage && JSON.stringify(row.coverage).length >= 40, `${task}: missing clause coverage`);
    for (const phase of ['Given', 'When', 'Then']) {
      const current = original.scenario.steps.filter(step => step[phase] !== undefined).map(step => step[phase]);
      const copied = row.coverage[phase.toLowerCase()];
      assert.deepEqual(copied, current, `${task}: stale ${phase} source in ${row.scenarioId}`);
    }
    assert.ok(row.disposition, `${task}: missing disposition`);
    assert.ok(Array.isArray(row.findings), `${task}: missing per-case findings`);
    assert.ok(row.testFile && !row.testFile.includes('..'), `${task}: invalid test path`);
    await access(resolve(root, row.testFile));
  }
  assert.equal(seen.size, scenarios.size);
  assert.ok(Array.isArray(report.findings));
  results[task] = { requirements: leaves.size, scenarios: scenarios.size, findings: report.findings.length,
    changedFiles: report.changedFiles, limitations: report.limitations };
}
const result = { check: 'review identity, completeness and nonempty coverage fields; not a semantic correctness proof', tasks: results,
  requirements: Object.values(results).reduce((sum, x) => sum + x.requirements, 0),
  scenarios: Object.values(results).reduce((sum, x) => sum + x.scenarios, 0) };
await writeFile(resolve(directory, 'coverage-check.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
