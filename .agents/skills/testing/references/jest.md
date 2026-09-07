# Jest tests: agent rules and routing

Agent-specific guidance for JavaScript unit and integration tests.

-   **Run**: `npm run test:unit <path_to_test_directory>` or `npm run test:unit -- --testNamePattern="<TestName>"`; `npm test` runs all JS tests plus lint. No wp-env needed.
-   **Prefer integration tests over e2e for block UI** — they render blocks in a real block editor instance and are faster and more reliable; see [Integration testing for block UI](../../../../docs/contributors/code/testing-overview.md#integration-testing-for-block-ui).
-   **Depth** (mocking, user interactions, snapshots): [Testing Overview](../../../../docs/contributors/code/testing-overview.md).
