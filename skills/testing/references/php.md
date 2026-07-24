# PHP tests: agent rules and routing

Agent-specific guidance for PHPUnit tests. They require the wp-env test environment: check `npm run wp-env-test status` first, and run `npm run wp-env-test start` only if it is not already running.

-   **Run**: `composer test` (all PHP tests), or `vendor/bin/phpunit <path_to_test_file.php>` (specific file or directory).
-   **Depth**: [Testing Overview – PHP testing](../../../docs/contributors/code/testing-overview.md#php-testing), including [Testing prefixed functions](../../../docs/contributors/code/testing-overview.md#testing-prefixed-functions) — the prefixing rule itself is in the root `AGENTS.md` pitfalls.
