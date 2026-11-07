import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const read = async name => JSON.parse((await readFile(resolve(directory, name), 'utf8')).replace(/^\uFEFF/, ''));
const integration = await read('contract-runs/integration-174.json');
const supplemental = await read('contract-runs/stackoverflow-final.json');
for (const report of [integration, supplemental]) {
  assert.equal(report.errors.length, 0);
  for (const key of ['skipped', 'unexpected', 'flaky']) assert.equal(report.stats[key], 0);
}
assert.equal(integration.stats.expected, 174);
assert.equal(supplemental.stats.expected, 25);
assert.ok(supplemental.suites.every(suite => suite.file === 'stackoverflow.spec.ts'));

const initial = await read('validated-inputs.json');
const current = {};
const changed = [];
for (const [name, expected] of Object.entries(initial)) {
  const actual = createHash('sha256').update(await readFile(resolve(root, name))).digest('hex');
  current[name] = actual;
  if (actual !== expected) changed.push(name);
}
const allowed = new Set([
  'arc-bench/stackoverflow/tests/helpers.ts', 'audit/validation/stackoverflow.spec.ts',
  ...['REQ-1.3', 'REQ-4.6', 'REQ-6.5', 'REQ-6.6'].map(id => `arc-bench/stackoverflow/tests/${id}.spec.ts`),
  'arc-bench/sheet/tests/REQ-1.3.1.spec.ts', 'arc-bench/sheet/tests/REQ-2.1.1.spec.ts',
]);
for (const name of changed) assert.ok(allowed.has(name), `Unvalidated source change: ${name}`);
await writeFile(resolve(directory, 'integration-inputs.json'), JSON.stringify(initial, null, 2) + '\n');
await writeFile(resolve(directory, 'validated-inputs.json'), JSON.stringify(current, null, 2) + '\n');

const suites = integration.suites.filter(suite => suite.file !== 'stackoverflow.spec.ts')
  .concat(supplemental.suites);
function count(suite) {
  return (suite.specs ?? []).reduce((n, spec) => n + spec.tests.length, 0)
    + (suite.suites ?? []).reduce((n, child) => n + count(child), 0);
}
assert.equal(suites.reduce((n, suite) => n + count(suite), 0), 175);
const provenance = {
  executionMode: 'integrated run plus targeted supplemental run, not one fresh 175-test execution',
  integratedRun: { report: 'contract-runs/integration-174.json', ...integration.stats },
  supplementalRun: { report: 'contract-runs/stackoverflow-final.json', ...supplemental.stats },
  uniqueTests: 175, unchangedOtherTaskTestsRetained: 150, replacedEarlierStackOverflowTests: 24,
  newStackOverflowTestsExecuted: 25, changedSourceFiles: changed,
  sourceEvidence: 'Seven other tasks retain identical contract/helper/shared inputs. Late formal-spec assertions were typechecked and collected; no formal business application scenarios were executed.',
};
await writeFile(resolve(directory, 'contracts-reuse.json'), JSON.stringify(provenance, null, 2) + '\n');
await writeFile(resolve(directory, 'contract-results.json'), JSON.stringify({
  ...integration, suites, stats: { ...integration.stats, expected: 175,
    duration: integration.stats.duration + supplemental.stats.duration }, provenance,
}, null, 2) + '\n');
console.log('175 unique oracle contracts passed; 150 unchanged + 25 supplemental.');
