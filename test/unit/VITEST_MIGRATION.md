# Vitest migration routing

The migration manifest in `test-migration.json` keeps every JavaScript unit and
integration test assigned to exactly one runner while the repository moves from
Jest to Vitest.

The baseline count and hash were captured from executable Jest discovery with
`jest --listTests`, then reconciled with the repository's static test-file
patterns. Do not update the baseline when moving tests between runners.

When changing test ownership:

-   Add individual tests to `vitest.files`, or use `vitest.directories` when an
    entire directory can move as one independently revertible unit.
-   Add tests created during the migration to the matching `added.jest` or
    `added.vitest` list.
-   Add removed baseline tests to `retired` only when their removal is intentional
    and explained in the pull request.
-   Run `npm run test:unit:routing` together with both active runner partitions.

The routing validator fails when a baseline test is missing, owned by both
runners, or retired without removing its file. It also rejects invalid manifest
entries, untracked new tests, static/executable discovery mismatches, and
orphaned snapshots.
