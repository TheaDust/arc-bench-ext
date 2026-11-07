"""Build the source/test patch only after verifying the original copy is intact."""
from pathlib import Path
import difflib
import hashlib
import json

root = Path(__file__).resolve().parent.parent
parent = json.loads((root / 'audit/parent-files.json').read_text(encoding='utf-8'))
source = Path(parent['source'])
drift = []
for name, expected in parent['files'].items():
    path = source / name
    if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        drift.append(name)
assert not drift, f'Parent source changed independently: {drift}'

patch = []
changed = []
paths = sorted(p for p in (root / 'arc-bench').rglob('*') if p.is_file())
paths += sorted((root / 'audit/validation').rglob('*.ts'))
for path in paths:
    name = path.relative_to(root).as_posix()
    old = source / name
    before = old.read_bytes() if old.is_file() else b''
    after = path.read_bytes()
    if before == after:
        continue
    # References are binary and must remain unchanged.
    assert path.suffix in {'.ts', '.yaml', '.json', '.md'}, name
    old_text = before.decode('utf-8-sig').splitlines(keepends=True)
    new_text = after.decode('utf-8-sig').splitlines(keepends=True)
    # Avoid line-ending-only noise in the review patch.
    normalize = lambda lines: [line.rstrip('\r\n') + '\n' for line in lines]
    delta = list(difflib.unified_diff(normalize(old_text), normalize(new_text),
        fromfile='a/' + name if old.is_file() else '/dev/null', tofile='b/' + name))
    if delta:
        changed.append(name)
        patch.extend(delta)

(root / 'review.patch').write_text(''.join(patch), encoding='utf-8', newline='\n')
result = {'parentFilesChecked': len(parent['files']), 'parentUnchanged': True,
          'patchScope': 'task requirements/tests plus new task-specific oracle contracts; use frozen copy for full manifest/docs',
          'changedFiles': changed, 'patchSha256': hashlib.sha256((root / 'review.patch').read_bytes()).hexdigest()}
(root / 'audit/patch-integrity.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'parentFilesChecked': len(parent['files']), 'changedFiles': len(changed), 'parentUnchanged': True}))
