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
    `npm run test:unit:conventions`, `npm run test:unit`, and
    `npm run test:unit:vitest` together.

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

## Additive public package release

`@wordpress/vitest-console` and `@wordpress/vitest-preset-default` provide the
public Vitest 5 setup. See the [preset migration guide](../../packages/vitest-preset-default/README.md).
They start at `1.0.0-prerelease` under the new-package policy. The release workflow
assigns the published versions. Existing Jest packages, public lint defaults,
and `wp-scripts test-unit-js` remain available.

The packed-consumer validator runs against Node 22.12.0, 24 and 26 with Vite 7
and 8 in `.github/workflows/vitest-packages.yml`. It verifies JSX and Emotion,
console matcher types and failure output, setup inheritance, native browser
values, CSS-module proxies, and rebuilt CSS-module and ordinary-CSS output.
The Node 24/Vite 8 combination also checks packed Jest tooling.

Before adopting these packages in released public tooling:

1. Publish `@wordpress/vitest-console`, then `@wordpress/vitest-preset-default`
   through the protected package-release workflow. Verify that their published
   exports, declarations and dependency versions match the reviewed artifacts.
2. Repeat isolated consumer verification using the actual published versions.
3. Use a published `@wordpress/build` containing #82154 and rebuild affected
   generated CSS. Published version `0.23.0` contains both browser-safe guards.
   No additional build-fix PR is planned.
4. Switch public commands and lint defaults only at the separately documented
   tooling release boundary. Retire active Jest support after that replacement
   has shipped and its supported consumers have migrated.

The September 11, 2026 audit found no advisories in the isolated install of the
two new packages with Vitest 5.0.0 and Vite 8.2.2. The repository audit found 47
advisories, unchanged from base `351883676c6`: 5 low, 27 moderate and 15 high.
The published-dependency audit found no undeclared imports in either package.
Refresh these checks before publication.
