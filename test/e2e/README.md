# E2E Tests

End-To-End (E2E) tests for WordPress.

This directory is the new place for E2E tests in Gutenberg. We expect new tests to be placed here. We use [Playwright](https://playwright.dev/) and its test runner to run the tests in Chromium by default. [`@wordpress/e2e-test-utils-playwright`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/e2e-test-utils-playwright) is used as a helper package to simplify the usage. See the documentation of both for more information.

**The [guide](https://github.com/WordPress/gutenberg/tree/HEAD/docs/contributors/code/e2e/README.md) has been moved to the documentation folder.**

In CI, the tests are executed across multiple shards, and [@flakiness/playwright](https://github.com/flakiness/playwright) balances the shards using historical test-duration data, stored in `timings.json`. Once the shards become too unbalanced, the `timings.json` file should be updated with the following command:

```bash
npm run test:e2e:update-timings
```
