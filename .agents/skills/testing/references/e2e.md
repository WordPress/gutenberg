# E2e tests: agent rules and routing

Agent-specific guidance for Playwright e2e tests. They require the wp-env test environment: check `npm run wp-env-test status` first, and run `npm run wp-env-test start` only if it is not already running.

## Procedure for writing tests

Plan the test list with the author first — see "Plan the tests with the author first" in [SKILL.md](../SKILL.md). Then:

1. **Read the [End-to-End Testing guide](../../../../docs/contributors/code/e2e/README.md) first** — locators, Page Object Model, assertions, cross-browser tags. Do not propose or write tests before reading it.
2. **Check for an existing spec** in `test/e2e/specs/<area>/` that already covers the surface, and extend it rather than adding a parallel file.
3. **Write the bodies for the confirmed list** — all of it. If a case proves infeasible, say so rather than silently omitting it.
4. **Verify**: the spec passes scoped without a visible GUI, and is stable across repeats (`npm run test:e2e -- <path_to_spec> --repeat-each=3`). Check the browser mode as described below.

## Rules

-   **Avoid a visible GUI**. Stay headless by default. Check `test/e2e/playwright.config.ts` before running WebKit on Linux. If it configures WebKit headed, use `xvfb-run --auto-servernum -- npm run test:e2e -- <spec> --project=webkit` to provide a virtual display. If it configures WebKit headless, run directly without `xvfb-run`. Do not add `--headed`, `--ui`, or `--debug`; they can open a GUI and block an agent session.
-   **Run a scoped subset** (`npm run test:e2e -- <path_to_test_file.spec.js>`), scoped to the specs affected by the change. The full suite takes a long time — if asked to run the e2e tests with no scope, confirm which specs matter before launching everything; when working unattended, scope to the affected areas and say so in your summary.

## Investigating failures

1. **Start with the failing run's evidence.** Read the error, browser, attempt number, and whether the failure is in setup, the test body, or cleanup. For a rare CI-only failure that does not reproduce locally, inspect the available trace, screenshot, and blob/HTML report before scheduling more local repeats. Use timings and the shard's test order to identify the conditions worth reproducing. A failed setup can cause later retries to fail differently; do not assume every retry has the same cause.
2. **Keep the conditions that matter.** Reproduce the failing browser with `--project=chromium`, `--project=firefox`, or `--project=webkit`. The Firefox and WebKit projects select tests whose titles or ancestor suite titles contain lowercase `@firefox` or `@webkit`; selecting the project alone does not make an untagged test run. Follow the checked-out WebKit browser mode on Linux, using a virtual display only when it is configured headed as described above. If a test fails only after another test, keep that predecessor and their order. Run the whole file when the dependency is within that file; a dependency across files can require the recorded shard's test set and order.
3. **Make each run answer a question.** Choose repetition counts from the observed failure frequency and available time. `--repeat-each=3` above checks a new test's stability; it is not a general reproduction threshold. Passing local repeats does not rule out a CI-only race. Local retries default to zero, while CI retries twice; use `--trace=retain-on-failure` when reproducing locally if a trace is needed, since this repository normally records traces only on the first retry. Do not raise retries or timeouts, add sleeps, skip tests, or weaken assertions to hide the failure.
4. **Investigate persistent setup failures before repeating test bodies.** For errors such as `socket hang up` followed by `existing_user_login` on retries, inspect the `beforeAll` requests and cleanup timing for partially created server data or requests that were still in flight. Confirm the cause from the evidence before proposing a fix.

## Routing

-   **Fixtures**: use [`@wordpress/e2e-test-utils-playwright`](../../../../packages/e2e-test-utils-playwright/README.md) (`admin`, `editor`, `pageUtils`, `requestUtils`). The editor canvas is iframed — interact with it via `editor.canvas`.
