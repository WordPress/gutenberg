# Vitest migration routing

All repository JavaScript unit and integration tests run in Vitest. The retained
`test-migration.json` manifest has an empty `jest.files` list. The internal Jest runner uses the published preset. The explicit
`npm run test:unit:jest` compatibility check exits with no tests until final
retirement removes that command and the manifest.

The permanent [testing guide](/docs/contributors/code/testing-overview.md) covers
setup, commands, examples, and the filename-based environment conventions.

The routing validator derives the current test inventory from both runners and
the repository's static test-file patterns. It does not depend on a fixed test
count, so unrelated test additions and removals do not require migration
metadata updates.

When writing or migrating a test:

-   New Node, JSDOM, and Browser Mode tests run in Vitest automatically. They do
    not need migration metadata.
-   Do not add entries to `jest.files`. The validator rejects additions to the
    empty legacy allowlist.
-   Name tests `*.jsdom.test.*` to use JSDOM or `*.browser.test.*` to use Browser
    Mode.
-   Use Node for pure JavaScript, data, stores, schemas, build tooling, and
    server-side logic.
-   Use Browser Mode for real CSS, layout, geometry, viewport behavior, media
    queries, observers, animation, scrolling, native browser APIs, and
    browser-dependent interaction. In direct React Browser Mode tests, import
    and await `render` or `renderHook` from `vitest-browser-react`. Import
    `userEvent` from `vitest/browser`, and prefer locators for asynchronous
    browser state. Testing Library helpers can remain when Browser Mode has no
    direct equivalent, but do not use its React renderer. The shared
    `initializeEditor` integration helper is the remaining renderer exception;
    do not add another.
-   Use JSDOM for construction, parsing, serialization, accessibility
    structure, and deterministic DOM semantics, events, and state. Browser API
    exceptions require a concrete reason and must not remain after the
    exception is no longer needed.

    Prefer real browser behavior over an exception for component interaction
    and layout tests. Supplied rectangles, observer notifications, and timers
    can remain in JSDOM when they are deliberate inputs to algorithm or
    lifecycle tests. A browser API in test setup alone does not establish that
    the assertions need Browser Mode.

-   Before running Browser Mode tests locally for the first time, install
    Chromium with
    `npm exec --no --workspace @wordpress/unit-tests -- playwright install chromium`.
-   Do not use per-file Jest or Vitest environment overrides. The filename is
    the single source of truth.
-   Run `npm test` for the complete lint and unit-test suite. For focused
    migration validation, run `npm run test:unit:routing`,
    `npm run test:unit:conventions`, and `npm run test:unit` together.
    `npm run test:unit:jest` retains the empty legacy partition until retirement.

The required `All` CI check runs the routing validator. It fails when a test is
missing, owned by both runners, or does not match the exact legacy Jest
allowlist. It also rejects per-file environment overrides, invalid manifest
entries, and static/executable discovery mismatches. The convention validator
also rejects Vitest isolation opt-outs and global Vitest APIs.

`wpVitest` remains an explicit opt-in for jsdom suites that need hoist-safe
helpers inside `vi.hoisted()`.

Vitest clears mock call history, resets mock implementations, restores spies,
resets stubbed globals and environment variables, and restores real timers
between tests. Tests must configure required mock implementations in their own
setup hooks. Mutable state held by an imported module is not reset
automatically; reset it explicitly or use `vi.resetModules()` when a fresh
module instance is required.

## Verification and release gate

Run `npm run test:unit:consumers` from Gutenberg to pack the changed public
packages, install them outside the workspace, and run the documented configs.
Use `--vite=<version>` to select a supported Vite version and `--browser` to
include Chromium. `--node=/absolute/path/to/node` selects a consumer runtime.
The check reports the actual Node, Vite, Vitest, and build versions. To replay
a recorded dependency resolution, pass `--lockfile=/path/to/package-lock.json`
from an earlier consumer run. The changed packages are still repacked and installed.

Release and internal cleanup:

1. Publish scripts 36 and eslint-plugin 27 through the existing protected
   WordPress packages release workflow. Apply npm deprecation messages to
   `@wordpress/jest-preset-default` and `@wordpress/jest-console` through that
   process, linking to the permanent consumer guide. Keep their published
   versions available; do not unpublish them.
2. Run the isolated checks with `--scripts=<published-version>` and
   `--eslint-plugin=<published-version>` against the registry releases.
   Record the published versions and the Node/Vite results in the tooling PR.
3. Verify Node, jsdom, Browser Mode, generated CSS, config discovery, linting,
   and default/watch/debug/update commands. Preserve the Node 24/26 repository
   matrix, single Chromium job, timezone checks, and Storybook smoke coverage.
4. Only then remove the remaining internal Jest routing infrastructure. The
   public `test-unit-jest` adapter remains in maintenance mode with no scheduled
   removal. Its consumer checks use project-installed Jest and the published
   WordPress preset, independently of the repository runner.

Packed-source checks before publication do not satisfy the release gate.
