import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const root = resolve(directory, '..');
const policy = JSON.parse(await readFile(resolve(directory, 'oracle-policy.json'), 'utf8'));
const strict = new Set(policy.strictTasks);
const reportPath = resolve(directory, 'oracle-policy-report.json');

const rules = {
  'direct-navigation': {
    severity: 'error',
    test: line => /\bpage\.goto\(/.test(line),
    message: 'Use openUrl(page, url) for saved URLs: page.goto to an identical hash URL is a same-document navigation and does not reload.',
  },
  'timed-wait': {
    severity: 'error',
    test: line => /\bwaitForTimeout\s*\(/.test(line),
    message: 'Do not use elapsed-time waits; wait for the declared public state instead.',
  },
  'focused-test': {
    severity: 'error',
    test: line => /\b(?:test|describe|it)\.only\s*\(/.test(line),
    message: 'Focused tests hide the rest of the scenario suite; remove .only before freezing.',
  },
  'message-traceability': {
    severity: 'error',
    test: line => {
      const match = /\bexpect(?:Notice|Alert)\(\s*[^,]+,\s*(['"])(.*?)\1/.exec(line);
      return match ? match[2] : null;
    },
    message: message => `Notification message ${JSON.stringify(message)} does not appear in requirements.yaml.`,
  },
  'arbitrary-index': {
    severity: 'warning',
    test: line => /\.(?:first|last)\(\)/.test(line),
    message: 'Prefer semantic scoping; first()/last() can select an unrelated record.',
  },
};

async function specFiles(task) {
  const base = resolve(root, 'arc-bench', task, 'tests');
  const files = [];
  async function walk(path) {
    for (const item of await readdir(path, { withFileTypes: true })) {
      const full = join(path, item.name);
      if (item.isDirectory()) await walk(full);
      else if (item.name.endsWith('.spec.ts')) files.push(full);
    }
  }
  await walk(base);
  return files.sort();
}

const findings = [];
const summary = {};
for (const task of Object.keys(JSON.parse(await readFile(resolve(root, 'revision.json'), 'utf8')).tasks)) {
  const requirementSource = await readFile(resolve(root, 'arc-bench', task, 'requirements', 'requirements.yaml'), 'utf8');
  const taskFindings = [];
  for (const file of await specFiles(task)) {
    const text = await readFile(file, 'utf8');
    const lines = text.split(/\r?\n/);
    const relativeFile = relative(root, file).replaceAll('\\', '/');
    if (strict.has(task) && policy.rules['requirement-header']
      && !lines.slice(0, 5).some(line => line.startsWith('// requirement: REQ-'))) {
      taskFindings.push({
        task,
        file: relativeFile,
        line: 1,
        rule: 'requirement-header',
        severity: policy.rules['requirement-header'] === 'error' ? 'error' : 'warning',
        message: 'A scenario file must identify its requirement with "// requirement: REQ-...".',
        source: lines[0].trim(),
      });
    }
    if (policy.rules['live-region-name']) {
      const pattern = /getByRole\(\s*['"](?:status|alert)['"]\s*,\s*\{[\s\S]{0,300}?\bname\s*:/g;
      for (const match of text.matchAll(pattern)) {
        const severity = strict.has(task) && policy.rules['live-region-name'] === 'error' ? 'error' : 'warning';
        taskFindings.push({
          task,
          file: relativeFile,
          line: text.slice(0, match.index).split('\n').length,
          rule: 'live-region-name',
          severity,
          message: 'Live regions do not derive accessible names from content; match the exact visible message with expectNotice/expectAlert.',
          source: match[0].split('\n')[0].trim(),
        });
      }
    }
    lines.forEach((line, index) => {
      for (const [id, rule] of Object.entries(rules)) {
        const result = rule.test(line, index);
        if (!result) continue;
        const enabled = strict.has(task) ? policy.rules[id] : 'warning';
        if (!enabled) continue;
        if (id === 'message-traceability' && requirementSource.includes(result)) continue;
        const severity = enabled === 'error' ? 'error' : 'warning';
        taskFindings.push({
          task,
          file: relativeFile,
          line: index + 1,
          rule: id,
          severity,
          message: typeof rule.message === 'function' ? rule.message(result) : rule.message,
          source: line.trim(),
        });
      }
    });
  }
  findings.push(...taskFindings);
  summary[task] = {
    strict: strict.has(task),
    errors: taskFindings.filter(finding => finding.severity === 'error').length,
    warnings: taskFindings.filter(finding => finding.severity === 'warning').length,
  };
}

const errors = findings.filter(finding => finding.severity === 'error');
const report = {
  policy: 'validation/oracle-policy.json',
  strictTasks: policy.strictTasks,
  summary,
  errors: errors.length,
  warnings: findings.length - errors.length,
  findings,
};
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ summary, errors: report.errors, warnings: report.warnings, report: 'validation/oracle-policy-report.json' }, null, 2));
assert.equal(errors.length, 0, `Oracle policy violations: ${errors.length}`);
