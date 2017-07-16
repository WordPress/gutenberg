# Snapshot tests

The goal of these snapshots tests is to verify that stylelint and styeleint-config-wordpress work as expected. They are another line of defense against regressions, after the unit tests and integration tests.

Each of these snapshots tests assert that we end up with some expected output, given a configuration and a stylesheet.

These tests are not meant to be comprehensive and systematic. They are meant to reproduce real use-cases (of which there are an infinite variety) and verify that those use-cases work as expected. The more cases we add, the more effective these tests will be.

## Jest snapshots

These tests use Jest snapshots, so we can easily assert against potentially large objects and strings, and so we can easily update expectations as needed.

## The pattern

-   Add a test-case folder to `__tests__/__snapshot_tests__` incrementing the number from existing test cases.
-   Add a configuration file and a stylesheet.
-   Setup the test following the format established by existing tests, and using the `systemTestUtils`.
-   Take a snapshot of the JSON `results` array.
