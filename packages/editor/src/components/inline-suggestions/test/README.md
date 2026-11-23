# Inline suggestion tests

Tests for the inline suggestion formats, operations and overlap model. The model itself is described under [Overlapping suggestions](/docs/explanations/architecture/suggestions.md#overlapping-suggestions) in the architecture guide. Paths below are relative to this directory unless they start with a package or `phpunit/`.

## Overlap fixtures

One set of JSON fixtures drives every layer, so a combination is written once and checked everywhere:

- `fixtures/overlaps/*.json` describe a base text, the users, and each suggestion (`kind`, `text` and `at`, or `range`, `added` / `removed`, `inside`), with the two preview views (`all-accepted`, `all-rejected`) pinned. Every other expectation is computed.
- `fixtures/overlap-oracle.ts` expands a fixture into per-character id lists and deltas and derives the published text for any set of decisions, the outdated set, and the accept/reject orders to check: every order up to four suggestions, 200 seeded samples above.
- Vitest checks the oracle against itself (`overlap-model.ts`), replays every order through the real operations (`overlap-oracle.jsdom.test.ts`), and fuzzes random fixtures with a printed, replayable seed (`fixtures/overlap-fuzz.ts`).
- `overlap-fixtures-generated.ts` writes `fixtures/overlaps/generated/*.json` (the paragraph HTML, each note's payload, the views, and every order up to three suggestions or 24 seeded samples above) and fails when they are stale. Regenerate with `UPDATE_OVERLAP_FIXTURES=1 npm run test:unit -- packages/editor/src/components/inline-suggestions/test/overlap-fixtures-generated.ts`.
- PHPUnit (`phpunit/tests/suggestion-overlap-fixtures-test.php`) renders each generated state through `gutenberg_strip_inline_suggestion_markers` and `gutenberg_get_inline_suggestion_view()` and compares it with the oracle.
- Playwright seeds a fixture through REST with one user per author (`suggestion-mode-overlap-utils.ts`), performs each gesture of the matrix as another author (`suggestion-mode-overlap.spec.ts`), and drives stored orders through the sidebar (`suggestion-mode-overlap-orders.spec.ts`; `OVERLAP_FIXTURE=four-same-kind` runs one fixture, `OVERLAP_ORDERS=all` every stored order).

Each fixture names the delivery phase it belongs to. `LANDED_PHASES` in `fixtures/overlap-phases.ts`, `suggestion-mode-overlap-utils.ts` and the PHPUnit test lists the phases that run; `OVERLAP_PHASES=C` forces a phase on for one run.

## Convergence fuzz

A seeded Vitest fuzz (`marker-convergence.jsdom.test.ts`) interleaves concurrent marker writes and decisions across in-process peers through a model of the HTML-string merge (`fixtures/html-string-merge.ts`), applies the guard, and checks that the peers converge on one serialization. `OVERLAP_CONVERGENCE_RUNS=10000` runs more interleavings, `OVERLAP_CONVERGENCE_SEED=<n>` replays one, and `OVERLAP_CONVERGENCE_REPORT=1` / `OVERLAP_CONVERGENCE_TRACE=1` print the outcome counts and each round. `collaboration-suggestion-mode-overlap.spec.ts` has two pages suggest deleting overlapping words at the same time and checks both deletions land and the peers settle on one value.
