# E2e tests: agent rules and routing

Agent-specific guidance for Playwright e2e tests. Requires the wp-env test environment (see [SKILL.md](../SKILL.md)).

## Procedure for writing tests

Plan the test list with the author first — see "Plan the tests with the author first" in [SKILL.md](../SKILL.md). Then:

1. **Check for an existing spec** in `test/e2e/specs/<area>/` that already covers the surface, and extend it rather than adding a parallel file.
2. **Write the bodies for the confirmed list** — all of it. If a case proves infeasible, say so rather than silently omitting it.
3. **Verify**: the spec passes scoped and headless, and is stable across repeats (`npm run test:e2e -- <path_to_spec> --repeat-each=3`).

## Rules

-   **Stay headless** (the default). Do not use `--headed`, `--ui`, or `--debug` — the human docs recommend them, but they open a GUI and block an agent session.
-   **Run a scoped subset** (`npm run test:e2e -- <path_to_test_file.spec.js>`); the full suite is slow.

## Routing

-   **Authoring**: follow the [End-to-End Testing guide](../../../docs/contributors/code/e2e/README.md) — locators, Page Object Model, cross-browser tags.
-   **Fixtures**: use [`@wordpress/e2e-test-utils-playwright`](../../../packages/e2e-test-utils-playwright/README.md) (`admin`, `editor`, `pageUtils`, `requestUtils`). The editor canvas is iframed — interact with it via `editor.canvas`.
