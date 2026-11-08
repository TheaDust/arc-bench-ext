# Upstream

## Source

- Upstream repository: <https://github.com/code-philia/arc-bench>
- Imported source commit: `e59696bbc68578c3b3da1ad47f9a0ac07e581184`
- Imported on: 2026-11-07
- Current revision: `2026-11-08-keep-bookstack-lifecycle-interactions`
- Parent revision: `2026-11-07-bookstack-lifecycle`

## Relationship

This repository is an **independent derivative/extended benchmark**, not the official upstream ARC-Bench and not a GitHub fork.

The upstream snapshot was imported into a local working directory and then re-initialized under Git. As a result, this repository does **not** share Git history with upstream. That is intentional: the benchmark has diverged in requirements, public contracts, tests, and evaluation infrastructure, and should not be presented as an upstream patch series.

`revision.json` preserves the original authoring environment's `sourceRepository` path and the source commit. The canonical public upstream is the URL above.

## What changed

The current revision merges the Keep lifecycle extension with the Keep/BookStack interaction extension. It strengthens BookStack lifecycle observations, adds 2 Keep atomic requirements / 8 lifecycle scenarios, and adds 7 interaction requirements / 15 scenarios across Keep and BookStack. Including the earlier BookStack extension, the benchmark now has 419 atomic requirements and 751 scenarios. Inputs, collection, typecheck, and public contracts are verified; new business scenarios await candidate execution. It changes:

- requirement/test alignment and oracle assertions;
- public observation contracts where the original text was ambiguous;
- benchmark validation, scenario isolation, and reproducible evaluation infrastructure;
- documentation, audit records, and explicit limitations.

See [CHANGES.md](CHANGES.md), [audit/README.md](audit/README.md), and [QUALITY.md](QUALITY.md) for details.

## Syncing from upstream

Add upstream as a read-only remote:

```powershell
git remote add upstream https://github.com/code-philia/arc-bench.git
git fetch upstream
```

Inspect upstream changes:

```powershell
git log --oneline --decorate -10 upstream/main
git diff upstream/main..HEAD --stat
```

Because this repository has no common ancestor with upstream, **do not merge unrelated histories**. Prefer selective integration:

```powershell
git fetch upstream
git cherry-pick <upstream-commit>
```

Or apply a targeted patch:

```powershell
git diff upstream/main -- arc-bench/<task> > upstream-task.patch
git apply --3way upstream-task.patch
```

After integrating upstream changes, update `revision.json`, `CHANGES.md`, `validation.json`, and the affected audit records, then re-run the benchmark self-validation commands in [README.md](README.md).

## Reporting

When publishing results, always report:

- this repository and revision tag;
- the upstream repository and source commit;
- the exact application/candidate commit or artifact;
- the evaluation manifest and per-scenario evidence.

Do not compare scores across revisions that changed requirements or public contracts without an explicit compatibility note.
