# E2e tests: agent rules and routing

Agent-specific guidance for Playwright e2e tests. They require the wp-env test environment: check `npm run wp-env-test status` first, and run `npm run wp-env-test start` only if it is not already running.

## Procedure for writing tests

Plan the test list with the author first — see "Plan the tests with the author first" in [SKILL.md](../SKILL.md). Then:

1. **Read the [End-to-End Testing guide](../../../docs/contributors/code/e2e/README.md) first** — locators, Page Object Model, assertions, cross-browser tags. Do not propose or write tests before reading it.
2. **Check for an existing spec** in `test/e2e/specs/<area>/` that already covers the surface, and extend it rather than adding a parallel file.
3. **Write the bodies for the confirmed list** — all of it. If a case proves infeasible, say so rather than silently omitting it.
4. **Verify**: the spec passes scoped and headless, and is stable across repeats (`npm run test:e2e -- <path_to_spec> --repeat-each=3`).

## Rules

-   **Stay headless** (the default). Do not use `--headed`, `--ui`, or `--debug` — the human docs recommend them, but they open a GUI and block an agent session.
-   **Run a scoped subset** (`npm run test:e2e -- <path_to_test_file.spec.js>`), scoped to the specs affected by the change. The full suite takes a long time — if asked to run the e2e tests with no scope, confirm which specs matter before launching everything; when working unattended, scope to the affected areas and say so in your summary.

## Routing

-   **Fixtures**: use [`@wordpress/e2e-test-utils-playwright`](../../../packages/e2e-test-utils-playwright/README.md) (`admin`, `editor`, `pageUtils`, `requestUtils`). The editor canvas is iframed — interact with it via `editor.canvas`.
