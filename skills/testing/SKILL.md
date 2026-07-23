---
name: testing
description: Use when writing, running, or debugging tests in the Gutenberg repository — JavaScript unit tests (Jest), PHP tests (PHPUnit), or end-to-end tests (Playwright).
---

# Testing

## Environment

PHP and e2e tests require the wp-env test environment. Check `npm run wp-env-test status` first; run `npm run wp-env-test start` only if it is not already running.

## Plan the tests with the author first

Before writing any test bodies, draft the test names — behavior from the user's perspective, one behavior per case (see [Describing tests](../../docs/contributors/code/testing-overview.md#describing-tests)) — and confirm the list with the author. Every proposed case must trace to the behavior being added or changed; do not pad the list with adjacent or unrelated coverage. If working unattended, put the proposed list in your summary for review instead.

## Never make a failing test pass by weakening it

No loosened assertions, no added waits or timeouts, no skipped cases without saying so. Diagnose the root cause, or report the failure honestly.

## By test type

-   **JavaScript unit and integration tests (Jest)**: read [references/jest.md](references/jest.md).
-   **PHP tests (PHPUnit)**: read [references/php.md](references/php.md).
-   **E2e tests (Playwright)**: read [references/e2e.md](references/e2e.md).
