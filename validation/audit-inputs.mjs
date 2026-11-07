import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const revision = JSON.parse(await readFile(resolve(root, 'revision.json'), 'utf8'));
const collectionPath = process.argv[2];
const reportPath = process.argv[3];
const collected = new Map();
if (collectionPath) {
  const collection = JSON.parse((await readFile(resolve(collectionPath), 'utf8')).replace(/^\uFEFF/, ''));
  assert.equal(collection.errors?.length ?? 0, 0, 'Playwright collection has errors');
  const visit = (suite, task) => {
    const owner = task || (revision.tasks[suite.title] ? suite.title : undefined);
    for (const spec of suite.specs ?? []) {
      const id = /^(REQ-[\d.]+):/.exec(spec.title)?.[1];
      assert.ok(id, `Test must identify its requirement: ${spec.title}`);
      for (const test of spec.tests) {
        const task = test.projectName || owner;
        assert.ok(revision.tasks[task], `Missing task for ${spec.title}`);
        const key = `${task}:${id}`;
        collected.set(key, (collected.get(key) ?? 0) + 1);
      }
    }
    for (const child of suite.suites ?? []) visit(child, owner);
  };
  visit(collection);
}

const summary = { tasks: {}, atomicRequirements: 0, scenarios: 0, collectionChecked: !!collectionPath };
for (const [task, expected] of Object.entries(revision.tasks)) {
  const directory = resolve(root, 'arc-bench', task, 'requirements');
  const source = await readFile(resolve(directory, 'requirements.yaml'), 'utf8');
  const document = parseDocument(source, { uniqueKeys: true });
  assert.equal(document.errors.length, 0, `${task}: invalid YAML: ${document.errors}`);
  const requirements = document.toJS();
  const ids = new Set();
  const images = new Map();
  const references = [];
  let atoms = 0;
  let scenarios = 0;
  const identity = (id, kind) => {
    assert.equal(typeof id, 'string', `${task}: missing ${kind} ID`);
    assert.ok(!ids.has(id), `${task}: duplicate identity ${id}`);
    ids.add(id);
  };
  const walk = async node => {
    identity(node.id, 'requirement');
    const description = typeof node.description === 'string' ? node.description : node.description?.text ?? '';
    for (const image of node.description?.image ?? []) {
      const path = resolve(directory, image.reference);
      const within = relative(directory, path);
      assert.ok(within && !isAbsolute(within) && !within.startsWith('..'), `${task}: image escapes requirements`);
      assert.ok((await stat(path)).isFile(), `${task}: missing image ${image.reference}`);
      const prior = images.get(image.id);
      assert.ok(!prior || prior === image.reference, `${task}: conflicting image identity ${image.id}`);
      images.set(image.id, image.reference);
    }
    const children = node.children ?? [];
    if (!children.length) {
      atoms++;
      assert.ok(node.scenarios?.length, `${task}: leaf ${node.id} has no scenario`);
      if (collectionPath) {
        assert.equal(collected.get(`${task}:${node.id}`), node.scenarios.length,
          `${task}: ${node.id} requirement/scenario vs collected-test coverage differs`);
        collected.delete(`${task}:${node.id}`);
      }
    } else assert.equal(node.scenarios?.length ?? 0, 0, `${task}: non-leaf scenarios are unsupported`);
    for (const scenario of node.scenarios ?? []) {
      identity(scenario.id, 'scenario');
      scenarios++;
      const phases = new Set();
      for (const step of scenario.steps ?? []) {
        identity(step.id, 'step');
        for (const phase of ['Given', 'When', 'Then', 'And', 'But']) {
          if (step[phase] !== undefined) {
            assert.ok(typeof step[phase] === 'string' && step[phase].trim(), `${task}: empty ${phase} in ${step.id}`);
            phases.add(phase);
          }
        }
        references.push(...(step.references ?? []));
      }
      for (const phase of ['Given', 'When', 'Then']) assert.ok(phases.has(phase), `${task}: ${scenario.id} missing ${phase}`);
    }
    references.push(...description.matchAll(/\\ref\[(?:requirement|image)\]\([^)]+\)/g));
    for (const child of children) await walk(child);
  };
  await walk(requirements);
  for (const raw of references) {
    const text = typeof raw === 'string' ? raw : raw[0];
    const match = /\\ref\[(requirement|image)\]\(([^)]+)\)/.exec(text);
    assert.ok(match, `${task}: malformed reference ${text}`);
    assert.ok((match[1] === 'image' ? images : ids).has(match[2]), `${task}: unresolved reference ${text}`);
  }
  assert.equal(atoms, expected.atomicRequirements, `${task}: atomic requirement count changed`);
  assert.equal(scenarios, expected.scenarios, `${task}: scenario count changed`);
  summary.tasks[task] = { atomicRequirements: atoms, scenarios, images: images.size };
  summary.atomicRequirements += atoms;
  summary.scenarios += scenarios;
}
assert.equal(collected.size, 0, `Collected tests have no matching atomic requirement: ${[...collected.keys()]}`);
for (const [name, expected] of Object.entries(revision.files)) {
  const data = await readFile(resolve(root, name));
  assert.equal(createHash('sha256').update(data).digest('hex'), expected, `Frozen file changed: ${name}`);
}
const template = await readFile(resolve(root, 'validation/public-controls.ts'), 'utf8');
for (const task of Object.keys(revision.tasks).filter(task => task !== 'keep')) {
  assert.equal(await readFile(resolve(root, 'arc-bench', task, 'tests/support/public-controls.ts'), 'utf8'), template,
    `${task}: standalone public controls diverged from the validated template`);
}
console.log(JSON.stringify(summary, null, 2));
if (reportPath) await writeFile(resolve(reportPath), JSON.stringify(summary, null, 2) + '\n');
