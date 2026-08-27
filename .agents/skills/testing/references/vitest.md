# Vitest tests: agent rules and routing

Agent-specific guidance for JavaScript unit and integration tests.

-   **Run**: `npm run test:unit <path_to_test_directory>` or `npm run test:unit -- --testNamePattern="<TestName>"`; `npm test` runs all JS tests plus lint. No wp-env needed.
-   **Runner APIs**: import `describe`, `expect`, `it`, and `vi` from `vitest`; do not rely on globals. Use `vi` for mocks and fake timers.
-   **Files**: use `.jsx` or `.tsx` for tests containing JSX. The repository lint rejects JSX in `.js` files.
-   **Environment**: Node.js is the default. Use `*.jsdom.test.*` for DOM suites and `*.browser.test.*` only for behavior that needs a real browser.
-   **DOM tests**: keep using Testing Library and `@testing-library/jest-dom/vitest`. Prefer semantic queries and user-observable behavior.
-   **Prefer integration tests over e2e for block UI** — they render blocks in a real block editor instance and are faster and more reliable; see [Integration testing for block UI](../../../../docs/contributors/code/testing-overview.md#integration-testing-for-block-ui).
-   **Depth** (mocking, user interactions, snapshots): [Testing Overview](../../../../docs/contributors/code/testing-overview.md).
