# Vitest migration routing

The migration manifest in `test-migration.json` keeps every JavaScript unit and
integration test assigned to exactly one runner while the repository moves from
Jest to Vitest.

The routing validator derives the current test inventory from both runners and
the repository's static test-file patterns. It does not depend on a fixed test
count, so unrelated test additions and removals do not require migration
metadata updates.

When changing test ownership:

-   Add individual tests to `vitest.files`, or use `vitest.directories` when an
    entire directory can move as one independently revertible unit.
-   New Jest tests require no migration metadata; runner discovery picks them up
    automatically.
-   Run `npm run test:unit:routing` together with both active runner partitions.

The routing validator fails when a test is missing, owned by both runners, or
not assigned to the expected Vitest migration entry. It also rejects invalid
manifest entries and static/executable discovery mismatches.
