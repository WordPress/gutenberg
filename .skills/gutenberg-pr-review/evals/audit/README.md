# Gutenberg PR review audit

This gitignored workspace contains the resumable tooling used to audit every
`WordPress/gutenberg` pull request and update
`.skills/gutenberg-pr-review/SKILL.md` from review evidence.

## Scope and snapshot

`full_collect.py` freezes the union of open, merged, and closed-unmerged PRs at
startup using the total and last edge from one oldest-first GraphQL connection.
It then records each PR as observed during a single serial pass. This is an
exact population snapshot, but review content and state are per-PR observations
rather than an atomic repository-wide point-in-time view.

Nested connections are reconciled to their declared counts. Reviews, inline
review comments, and issue comments use fully paginated REST fallbacks when
their first 100 entries overflow. File overflow uses cursor-paginated GraphQL so
it is not subject to the REST endpoint's 3,000-file cap. The SQLite cursor and
manifest are checkpointed after every top-level page.

```bash
python3 .skills/gutenberg-pr-review/evals/audit/full_collect.py \
  --db .skills/gutenberg-pr-review/evals/audit/full_reviews.sqlite \
  --batch-size 20
```

Exit status 75 means the collector stopped cleanly near a rate-limit boundary;
rerun the same command after the recorded reset. A completed rerun is
idempotent. For the full multi-reset crawl, the scheduler performs only that
resume loop and stops on any non-rate-limit failure:

```bash
python3 .skills/gutenberg-pr-review/evals/audit/run_full_collection.py
```

## Exhaustive comment ledger

The analysis stage streams the database, gives every collected artifact one
ledger disposition, and creates bounded batches. Exclusions are deterministic
and applied in this order: bot, PR-author follow-up, empty body, exact
low-signal approval/thanks. Every other artifact is assigned exactly once,
without filtering by PR state, age, author association, path, or review state.

```bash
python3 .skills/gutenberg-pr-review/evals/audit/full_analyze.py build \
  --db .skills/gutenberg-pr-review/evals/audit/full_reviews.sqlite \
  --output .skills/gutenberg-pr-review/evals/audit/full-analysis

python3 .skills/gutenberg-pr-review/evals/audit/full_analyze.py validate \
  --db .skills/gutenberg-pr-review/evals/audit/full_reviews.sqlite \
  --output .skills/gutenberg-pr-review/evals/audit/full-analysis
```

`run_audit_workers.py` runs one isolated Codex context per batch, with three
workers by default. It validates exact ordered IDs and ledger metadata before
atomically accepting an output and is safe to resume.

```bash
python3 .skills/gutenberg-pr-review/evals/audit/run_audit_workers.py \
  --analysis .skills/gutenberg-pr-review/evals/audit/full-analysis \
  --output .skills/gutenberg-pr-review/evals/audit/full-worker-results \
  --concurrency 3

python3 .skills/gutenberg-pr-review/evals/audit/full_analyze.py validate-workers \
  --analysis .skills/gutenberg-pr-review/evals/audit/full-analysis \
  --workers .skills/gutenberg-pr-review/evals/audit/full-worker-results
```

The accepted result is reduced into candidate guidance only after exhaustive
worker coverage passes. Candidate rules are then checked against the current
`origin/trunk` code, tests, and documentation before the skill is edited.

## Retention

`FULL_AUDIT_TEST_PLAN.md` is the release and cleanup gate. After the skill and
`FULL_AUDIT_SUMMARY.md` are verified, raw full-audit and old 500-PR pilot data
are permanently removed. The generalized scripts, shared prompt, README, test
plan, concise summary, and updated skill are retained.
