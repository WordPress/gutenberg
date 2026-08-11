---
name: testing
description: Use when writing, running, or debugging tests in the Gutenberg repository — JavaScript unit tests (Jest), PHP tests (PHPUnit), or end-to-end tests (Playwright).
---

# Testing

## Plan the tests with the author first

Before writing any test bodies, draft the test names — behavior from the user's perspective, one behavior per case (see [Describing tests](../../../docs/contributors/code/testing-overview.md#describing-tests)) — and confirm the list with the author. Every proposed case must trace to the behavior being added or changed; do not pad the list with adjacent or unrelated coverage. If working unattended, put the proposed list in your summary for review instead.

## Never make a failing test pass by weakening it

No loosened assertions, no added waits or timeouts, no skipped cases without saying so. Diagnose the root cause, or report the failure honestly.

## Never make a failing test pass by changing the production code unless the production code is the source of a bug

The e2e test passing is not the final task success criteria. The core goal is to verify that the production code works as expected.

## By test type

-   **JavaScript unit and integration tests (Jest)**: read [references/jest.md](references/jest.md).
-   **PHP tests (PHPUnit)**: read [references/php.md](references/php.md).
-   **E2e tests (Playwright)**: read [references/e2e.md](references/e2e.md).
