# Vitest migration routing

Every new JavaScript unit and integration test runs in Vitest. The migration
manifest in `test-migration.json` contains the exact list of remaining legacy
Jest tests while the repository finishes moving them to Vitest.

The routing validator derives the current test inventory from both runners and
the repository's static test-file patterns. It does not depend on a fixed test
count, so unrelated test additions and removals do not require migration
metadata updates.

When writing or migrating a test:

-   New Node, JSDOM, and Browser Mode tests run in Vitest automatically. They do
    not need migration metadata.
-   When migrating a legacy Jest test, remove its exact path from `jest.files`.
-   When renaming or moving a directory that contains legacy Jest tests, migrate
    those tests to Vitest in the same pull request. The validator treats their
    new paths as additions to the Jest allowlist.
-   Do not add directories, glob patterns, or new files to `jest.files`. The
    routing validator compares it with the pull request base and accepts only
    removals.
-   Name tests `*.jsdom.test.*` to use JSDOM or `*.browser.test.*` to use Browser
    Mode.
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
-   Do not use per-file Jest or Vitest environment overrides. The filename is
    the single source of truth.
-   Run `npm test` for the complete lint and unit-test suite. For focused
    migration validation, run `npm run test:unit:routing`,
    `npm run test:unit:conventions`, `npm run test:unit`, and
    `npm run test:unit:vitest` together.

The required `All` CI check runs the routing validator. It fails when a test is
missing, owned by both runners, or does not match the exact legacy Jest
allowlist. It also rejects per-file environment overrides, invalid manifest
entries, and static/executable discovery mismatches. The convention validator
also rejects Vitest isolation opt-outs and global Vitest APIs.

`wpVitest` remains an explicit opt-in for jsdom suites that need hoist-safe
helpers inside `vi.hoisted()`.
