import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const controller = resolve(root, '../..');
const digest = data => createHash('sha256').update(data).digest('hex');
const parentBytes = await readFile(resolve(directory, 'parent-revision.json'));
const parent = JSON.parse(parentBytes);
const original = JSON.parse(await readFile(resolve(directory, 'parent-files.json'), 'utf8'));
const coverage = JSON.parse(await readFile(resolve(directory, 'coverage-check.json'), 'utf8'));
assert.equal(coverage.requirements, 408);
assert.equal(coverage.scenarios, 714);
const files = { ...parent.files };
const inputPaths = new Set(Object.keys(files));
async function addTree(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const full = resolve(path, item.name);
    if (item.isDirectory()) await addTree(full);
    else inputPaths.add(relative(root, full).replaceAll('\\', '/'));
  }
}
await addTree(resolve(root, 'arc-bench'));
await addTree(resolve(directory, 'validation'));
await addTree(resolve(directory, 'controller-source'));
for (const name of ['README.md', 'QUALITY.md', 'CONSISTENCY.md', 'CHANGES.md',
  'audit/README.md', 'audit/PROTOCOL.md', 'audit/check-review.mjs', 'audit/freeze.mjs', 'audit/summarize.mjs',
  'audit/summary.json', 'audit/findings.csv', 'audit/controller-review.json', 'audit/tsconfig.json',
  'audit/build-patch.py', 'audit/finalize-contracts.mjs', 'audit/contracts-reuse.json',
  'audit/validated-inputs.json', 'audit/input-identity.json', 'review.patch']) inputPaths.add(name);
for (const task of Object.keys(parent.tasks)) for (const extension of ['md', 'json']) inputPaths.add(`audit/${task}.${extension}`);
for (const name of inputPaths) files[name] = digest(await readFile(resolve(root, name)));
const revision = { ...parent, version: parent.version + 1,
  revision: '2026-11-07-per-task-semantic-review', parentRevision: parent.revision,
  parentManifestSha256: digest(parentBytes), reviewedAt: '2026-11-07',
  qualityStatus: 'all-scenarios-source-reviewed-with-explicit-limitations',
  consistencyReview: 'audit/README.md',
  review: { protocol: 'audit/PROTOCOL.md', requirements: 408, scenarios: 714,
    generatedApplicationsConsulted: false, generatedApplicationsChanged: false,
    allBusinessScenariosExecuted: false, evidence: 'audit/README.md' },
  files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) };
for (const task of Object.keys(revision.tasks)) {
  const prefix = `arc-bench/${task}/`;
  const changed = Object.keys(files).filter(name => name.startsWith(prefix) && original.files[name] !== files[name]);
  revision.tasks[task] = { ...revision.tasks[task],
    changedFiles: [...new Set([...revision.tasks[task].changedFiles, ...changed])].sort(),
    changedFilesSinceParent: changed.sort(),
    requirementsChangedSinceParent: changed.some(name => name.endsWith('requirements.yaml')),
    review: `audit/${task}.json` };
}
// Preserve reviewed executor provenance despite a concurrent reporting-only edit.
const controllerReview = JSON.parse(await readFile(resolve(directory, 'controller-review.json'), 'utf8'));
revision.evaluation = { ...parent.evaluation, controllerFiles: { ...parent.evaluation.controllerFiles },
  compatibilityReview: 'audit/controller-review.json' };
for (const name of Object.keys(revision.evaluation.controllerFiles)) {
  const actual = digest(await readFile(resolve(controller, name)));
  if (actual !== parent.evaluation.controllerFiles[name]) {
    const change = controllerReview.changedFiles[name];
    assert.equal(change?.parent, parent.evaluation.controllerFiles[name], `Unreviewed executor change: ${name}`);
    assert.equal(change.current, actual, `Executor changed since review: ${name}`);
    assert.equal(change.classification, 'reporting-only');
    revision.evaluation.controllerFiles[name] = actual;
  }
}
await writeFile(resolve(root, 'revision.json'), JSON.stringify(revision, null, 2) + '\n');
console.log(revision.revision, Object.keys(files).length, 'frozen input/source files');
