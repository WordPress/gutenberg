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
-   Vitest tests run in Node by default. Name tests `*.jsdom.test.*` to opt into
    JSDOM or `*.browser.test.*` to opt into Browser Mode.
-   Use Node for pure JavaScript, data, stores, schemas, build tooling, and
    server-side logic.
-   Use Browser Mode for real CSS, layout, geometry, viewport behavior, media
    queries, observers, animation, scrolling, native browser APIs, and
    browser-dependent interaction. Import `userEvent` from `vitest/browser`,
    and prefer locators for asynchronous browser state.
-   Use JSDOM for construction, parsing, serialization, accessibility
    structure, and deterministic DOM semantics, events, and state. Browser API
    exceptions require a concrete reason and must not remain after the
    exception is no longer needed.
-   Before running Browser Mode tests locally for the first time, install
    Chromium with
    `npm exec --workspace @wordpress/unit-tests -- playwright install chromium`.
-   New Jest tests require no migration metadata; runner discovery picks them up
    automatically. Their filenames still select the environment: Node by
    default or JSDOM through `*.jsdom.test.*`. A new `*.browser.test.*` must be
    assigned to Vitest so it can run in Browser Mode.
-   Do not use per-file Jest or Vitest environment overrides. The filename is
    the single source of truth.
-   Run `npm test` for the complete lint and unit-test suite. For focused
    migration validation, run `npm run test:unit:routing`,
    `npm run test:unit:conventions`, `npm run test:unit`, and
    `npm run test:unit:vitest` together.

The routing validator fails when a test is missing, owned by both runners, or
not assigned to the expected Vitest migration entry. It also rejects per-file
environment overrides, invalid manifest entries, and static/executable
discovery mismatches.
