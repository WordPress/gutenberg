# Full Gutenberg PR audit verification plan

This is the release gate for the full, single-pass audit. The audit is not complete until every mandatory check below passes. Run destructive cleanup only after copying the final counts into `FULL_AUDIT_SUMMARY.md`, updating the skill, and rerunning the non-raw-data checks.

## Snapshot contract

The repository-wide GitHub API does not provide an atomic historical snapshot. Define the audit precisely instead of implying that it does:

- At initialization, record `audit_started_at`, the union connection's `totalCount`, state totals, and the last edge's PR number and `createdAt` as the population high-water mark.
- Crawl one `pullRequests(states: [OPEN, CLOSED, MERGED], orderBy: { field: CREATED_AT, direction: ASC })` connection. All connection arguments must have `first` or `last` in the range 1–100.
- Admit only PRs at or before the recorded high-water mark. PRs created later must not enter the database even if they appear before the crawl ends.
- Record `observed_at` for every PR. Metadata, reviews, and comments are the values observed during that PR's one collection pass; they are not an atomic repository-wide view. Overflow pagination is part of that same pass, not a later refresh.
- A state transition cannot remove a PR from this union connection. A deletion or an unstable cursor that prevents reaching the high-water mark is a hard failure requiring investigation, not a reason to adjust the expected count silently.
- The final provenance reports the observed state counts. They may differ from the initialization counts if a PR transitions while the crawl is running, but their sum must equal the frozen population total.

Observed preflight on 2026-07-21 (diagnostic only, not a hard-coded target): 47,037 total PRs = 35,914 merged + 8,651 closed-unmerged + 2,472 open. A small GraphQL probe also confirmed the expected timestamp shapes: merged has `mergedAt` and `closedAt`, closed-unmerged has only `closedAt`, and open has neither.

## API correctness gates

Before a long crawl, inspect the rendered GraphQL query and make these checks mechanically:

- The population query contains all three states and ascending creation order. It stores `state`, `isDraft`, `createdAt`, `updatedAt`, nullable `closedAt`, nullable `mergedAt`, and the per-connection `totalCount` values.
- Every nested connection exposes `totalCount`; every GraphQL connection explicitly requests `pageInfo { hasNextPage endCursor }` when it can be backfilled with GraphQL.
- Collection is single-threaded. Model analysis may be parallel, but GitHub requests must not be. Respect `Retry-After` and rate-limit reset headers, and checkpoint before a clean low-budget exit. GitHub applies secondary limits across REST and GraphQL even though the primary budgets differ.
- `gh api --paginate --slurp` returns an array of pages. Flatten exactly one level and reject a non-list page instead of treating it as records.
- Do not rely on the REST pull-files endpoint above 3,000 files: GitHub documents a hard 3,000-file response ceiling. Use per-PR GraphQL pagination for files, or stop with an explicit unsupported-overflow error. The REST review, review-comment, and issue-comment endpoints must follow pagination links through exhaustion.
- Store REST `node_id` as the canonical artifact ID and retain numeric IDs separately. For review comments, preserve and validate the parent review mapping (`pull_request_review_id`/review database ID).
- Use an UPSERT that updates in place. Avoid `INSERT OR REPLACE` on `pull_requests`: SQLite implements replacement as delete-plus-insert and can cascade-delete children before an interrupted refill.
- Treat null/deleted authors and empty bodies as valid collected records. Classification belongs in the ledger phase, not collection.
- Never infer completion from a short page alone when the API supplies `pageInfo` or `Link`; follow the server's pagination signal.

References: [GitHub GraphQL rate and node limits](https://docs.github.com/en/graphql/overview/rate-limits-and-node-limits-for-the-graphql-api), [REST pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api), and [pull-request files endpoint and its 3,000-file cap](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests-files).

## 1. Deterministic smoke test

Run the collector against an injectable fake transport and a temporary directory, never the pilot or production database. The fixture should contain at least these PRs:

| PR | State | Draft | `closedAt` | `mergedAt` | Purpose |
| --- | --- | --- | --- | --- | --- |
| 101 | `OPEN` | true | null | null | Open/draft/null timestamps |
| 102 | `CLOSED` | false | non-null | null | Closed-unmerged |
| 103 | `MERGED` | false | non-null | non-null | Merged |

Across the fixture, include a human review body, an empty review body, an issue comment, a review comment, a reply, a bot, a deleted/null author, a PR-author follow-up, and an exact low-signal approval. Use non-ASCII Markdown in one body. Assert:

- Exactly three PRs are stored with the expected timestamp nullability and state.
- Every review, review comment, and issue comment is stored before classification, including empty and excluded artifacts.
- Text round-trips as UTF-8, IDs retain their type/source mapping, and review-comment parents resolve.
- The manifest is atomically written, parses as JSON, names the union scope, and records the cutoff/high-water metadata.
- A run against an invalid fixture (missing node ID, count mismatch, or unknown state) exits nonzero without setting `completed_at`.

The test transport should count requests and return named pages so resume and pagination behavior can be asserted without spending API budget.

## 2. Interrupt, resume, and idempotence

Use a fixture with at least three top-level pages and two overflow pages.

1. Start a fresh temporary database and interrupt with `SIGINT` immediately after the first committed page.
2. Save the committed cursor, PR/artifact/file counts, and a deterministic logical checksum (sorted primary keys plus stored fields; do not hash the mutable SQLite/WAL bytes).
3. Resume with the same arguments. Assert that the first request starts at the saved cursor, the interrupted page is not skipped, and collection reaches the frozen high-water PR.
4. Compare the resumed database to an uninterrupted fixture run with `EXCEPT` queries in both directions for every table other than timestamp/rate metadata.
5. Run the completed collector again. It must make zero fixture API requests, preserve all logical checksums, and not create duplicate rows.
6. Interrupt once during an overflow backfill. Resume must either continue from its persisted child cursor or safely replace that one connection from page one; it must not combine partial and complete child sets.

Also simulate a crash after an API response but before the transaction commits. Replaying the page must produce the same database as the uninterrupted run.

## 3. Overflow and backfill coverage

Create deterministic fixture cases for every first-page boundary:

- 101 files on one PR.
- 101 reviews on one PR, including empty review bodies.
- 101 issue comments on one PR.
- One review with 205 review comments (three pages at `per_page=100`).
- Two overflowing child connections on the same PR to catch cursor cross-wiring.
- Duplicate IDs on adjacent API pages to verify idempotent insertion while still detecting an API/count inconsistency.

For every case, assert stored count equals declared `totalCount`, IDs are unique, no page is skipped, and the manifest's truncation count is zero. A response that exhausts pagination below `totalCount`, exceeds the observed expected count, or repeats a cursor must fail with PR number, connection kind, expected count, actual count, and cursor in the error.

Use PR #79816 as a non-destructive live sentinel for file pagination: the pilot observed `files_total = 239`. A targeted temporary run should collect 239 unique paths. This validates the real transport but does not replace the synthetic cases for reviews and comments. If any live PR reports more than 3,000 files, verify GraphQL pagination is used rather than the capped REST files endpoint.

## 4. SQLite integrity and corpus completeness

Run these checks on the frozen full database while its raw data still exists:

```sql
PRAGMA wal_checkpoint(TRUNCATE);
PRAGMA integrity_check;
PRAGMA foreign_key_check;

SELECT COUNT(*) AS pr_count,
       COUNT(DISTINCT number) AS distinct_pr_count
FROM pull_requests;

SELECT state, COUNT(*)
FROM pull_requests
GROUP BY state
ORDER BY state;

SELECT number, state, closed_at, merged_at
FROM pull_requests
WHERE state NOT IN ('OPEN', 'CLOSED', 'MERGED')
   OR (state = 'OPEN' AND (closed_at IS NOT NULL OR merged_at IS NOT NULL))
   OR (state = 'CLOSED' AND (closed_at IS NULL OR merged_at IS NOT NULL))
   OR (state = 'MERGED' AND (closed_at IS NULL OR merged_at IS NULL));

SELECT number
FROM pull_requests
WHERE observed_at IS NULL
   OR created_at > (SELECT value FROM meta WHERE key = 'snapshot_high_water_created_at');

SELECT a.id
FROM artifacts a
LEFT JOIN pull_requests p ON p.number = a.pr_number
WHERE p.number IS NULL;

SELECT parent_review_id, COUNT(*)
FROM artifacts
WHERE kind = 'review_comment'
GROUP BY parent_review_id
HAVING parent_review_id IS NULL
    OR NOT EXISTS (
        SELECT 1 FROM artifacts r
        WHERE r.id = artifacts.parent_review_id AND r.kind = 'review'
    );
```

Expected results:

- `integrity_check` returns exactly `ok`; `foreign_key_check` and every violation query return no rows.
- PR count equals distinct PR count, the frozen initialization total, and the sum of the three observed state counts.
- The recorded high-water PR is present, no later-created PR exists, and the oldest PR is #2 unless GitHub reports a repository-history change that is documented in the summary.
- `completed_at` is absent until population collection, every overflow backfill, and all integrity checks succeed.

For each connection, compare declared versus stored counts. Adapt column/table names to the finalized schema, but preserve these invariants:

```sql
SELECT p.number, 'files' AS kind, p.files_total AS expected, COUNT(f.path) AS actual
FROM pull_requests p LEFT JOIN files f ON f.pr_number = p.number
GROUP BY p.number HAVING actual != expected;

SELECT p.number, 'reviews' AS kind, p.reviews_total AS expected, COUNT(a.id) AS actual
FROM pull_requests p LEFT JOIN artifacts a
  ON a.pr_number = p.number AND a.kind = 'review'
GROUP BY p.number HAVING actual != expected;

SELECT p.number, 'issue_comments' AS kind,
       p.issue_comments_total AS expected, COUNT(a.id) AS actual
FROM pull_requests p LEFT JOIN artifacts a
  ON a.pr_number = p.number AND a.kind = 'issue_comment'
GROUP BY p.number HAVING actual != expected;

SELECT r.pr_number, r.id, r.comments_total AS expected, COUNT(c.id) AS actual
FROM artifacts r LEFT JOIN artifacts c
  ON c.parent_review_id = r.id AND c.kind = 'review_comment'
WHERE r.kind = 'review'
GROUP BY r.id HAVING actual != expected;
```

All four queries must return no rows. Also require the manifest's four truncation counters (`files`, `reviews`, `issue_comments`, and `review_comments`) to be exactly zero. Counts alone do not prove identity, so preserve unique canonical IDs and reject duplicate/cross-PR IDs during insertion.

## 5. Ledger coverage and exclusions

The ledger is the proof that every collected artifact received exactly one disposition. It must include excluded artifacts, not only actionable ones. Require a unique `artifact_id` and one of these outcomes:

- `actionable`, with exactly one analysis batch assignment.
- `excluded_bot`.
- `excluded_pr_author`.
- `excluded_empty`.
- `excluded_low_signal`, restricted to the explicit deterministic phrase/pattern allowlist.

Do not exclude by PR state, age, author association, path, or review state. Apply exclusion precedence deterministically and record the reason so a bot who is also the PR author is assigned once.

Mandatory assertions:

```sql
SELECT
  (SELECT COUNT(*) FROM artifacts) AS artifacts,
  (SELECT COUNT(*) FROM audit_ledger) AS ledger_rows,
  (SELECT COUNT(DISTINCT artifact_id) FROM audit_ledger) AS ledger_ids;

SELECT l.artifact_id
FROM audit_ledger l LEFT JOIN artifacts a ON a.id = l.artifact_id
WHERE a.id IS NULL
UNION ALL
SELECT a.id
FROM artifacts a LEFT JOIN audit_ledger l ON l.artifact_id = a.id
WHERE l.artifact_id IS NULL;

SELECT artifact_id, COUNT(*)
FROM batch_assignments
GROUP BY artifact_id
HAVING COUNT(*) != 1;
```

The three scalar counts must match, the missing/extra query must return no rows, and the assignment query must return no rows when restricted to actionable ledger rows. Separately assert that excluded rows have no batch assignment and actionable rows have no exclusion reason. Group ledger outcomes and actionable assignments by PR state; the state totals must reconcile to the artifact table, demonstrating that open, merged, and closed-unmerged evidence was handled by the same rules.

Batch generation must be deterministic: running it twice against the same frozen DB produces identical ordered artifact-ID lists and file checksums. No batch may exceed the configured character/token safety bound, except a documented single-artifact oversize batch that is split deterministically without losing its ID.

## 6. Worker result schema and reduction

Validate every worker JSONL line before reduction. A result should contain at least:

- `schema_version`, `artifact_id`, `batch_id`, `pr_number`, `pr_state`, `artifact_kind`, `reviewer`, and `url`.
- `assessment`: an enum such as `credible_finding`, `no_general_rule`, or `needs_context`.
- `categories` and `severity`.
- `proposed_rule` (required only for a credible finding).
- `current_validation_needed` plus a short rationale.
- Optional representative diff/code references added during validation, never invented by the worker.

Reject unknown fields if a strict schema is used, malformed JSON, missing IDs, duplicate artifact results, worker results for unassigned IDs, metadata that disagrees with the ledger, or a result count different from the actionable assignment count. A `needs_context` result is incomplete until the reducer resolves it with the comment's PR metadata or a targeted representative diff.

Reduction may deduplicate candidate rules, but never worker coverage. For every retained skill rule, the final evidence table should record supporting artifact IDs, PRs, reviewers, all represented PR states, current `origin/trunk` validation references, and the keep/merge/reject decision. Equal state weight means a credible finding is not discounted merely because its source PR was open or closed-unmerged.

Before writing the skill, assert:

- Every actionable artifact has exactly one valid worker result.
- Every `needs_context` item has a terminal reducer decision.
- Every retained rule has current-code/docs/tests validation, or is explicitly rejected as obsolete/era-specific.
- Links and artifact IDs in the concise summary resolve back to the frozen corpus.

## 7. Skill and summary acceptance

Save the pre-audit skill SHA-256. After the edit:

- The file is readable, nonempty, valid Markdown, and still contains its required skill front matter/name.
- Provenance gives exact frozen PR and artifact totals, state counts, exclusion/actionable counts, audit start/completion dates, and explicitly describes the non-atomic single-pass observation model.
- New or changed guidance is supported by the reducer evidence and current `origin/trunk`; obsolete or redundant advice is removed rather than archived by era.
- The skill remains concise enough to load as operational instructions. Raw comments, long evidence excerpts, and per-era history belong neither in the skill nor the retained summary.
- `FULL_AUDIT_SUMMARY.md` contains all counts needed to verify the audit after raw deletion, the final skill SHA-256, the exact `origin/trunk` commit used for current validation, and a note that all raw corpora were deleted after verification.

## 8. Destructive cleanup gate

Cleanup is permanently destructive and runs only after sections 1–7 pass and the skill and summary have been reread from disk. Record an allowlist of retained files before deletion. The intended retained set is the updated skill outside the workspace plus generalized collection/ledger scripts, `README.md`, `FULL_AUDIT_SUMMARY.md`, and this reusable test plan if desired.

Delete both the full-audit raw corpus and the old 500-PR pilot corpus, including:

- SQLite databases and `-wal`/`-shm` companions.
- Raw GraphQL/REST payloads and manifests that contain corpus data.
- Corpus and ledger JSONL, generated batches, worker outputs, candidate evidence, and temporary diff backfills.
- Pilot `reviews.sqlite*`, `analysis/`, `manifest.json`, and pilot-only evidence/report files once their needed provenance has been incorporated into the final summary.
- Temporary smoke databases, fixtures containing copied comments, and test output.

After deletion, run an allowlist-based check rather than only checking a few known names:

```bash
find .skills/gutenberg-pr-review/evals/audit -type f -print | sort
find .skills/gutenberg-pr-review/evals/audit -type f \
  \( -name '*.sqlite*' -o -name '*.jsonl' -o -name 'manifest.json' \) -print
git status --short
```

The first command must contain only the explicit retained allowlist; the second must print nothing. `git status --short` must show no tracked Gutenberg changes caused by the audit. Finally, reread and hash the skill and `FULL_AUDIT_SUMMARY.md`; their values must match the summary's recorded hashes. Raw-data-dependent checks cannot be rerun after this point, which is why their exact results and counts must already be in the retained summary.

## Final go/no-go checklist

- [ ] Deterministic all-state smoke test passes, including null timestamps and deleted authors.
- [ ] Interrupt/resume and completed-run idempotence pass.
- [ ] All four overflow paths pass synthetic pagination tests; PR #79816 returns 239 files live.
- [ ] Frozen population count equals the initialization total and reaches the recorded high-water PR.
- [ ] SQLite integrity/FK checks pass and all declared/stored connection counts match.
- [ ] Every artifact has one ledger disposition; every actionable artifact has one worker result.
- [ ] Every context-needed result is resolved and every retained rule is current-validated.
- [ ] Updated skill and concise summary pass content/hash checks.
- [ ] Raw full and pilot corpora are deleted; only the retained allowlist remains.
- [ ] Gutenberg's tracked worktree is clean with respect to this audit.
