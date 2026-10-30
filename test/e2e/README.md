# E2E Tests

End-To-End (E2E) tests for WordPress.

This directory is the new place for E2E tests in Gutenberg. We expect new tests to be placed here. We use [Playwright](https://playwright.dev/) and its test runner to run the tests in Chromium by default. [`@wordpress/e2e-test-utils-playwright`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/e2e-test-utils-playwright) is used as a helper package to simplify the usage. See the documentation of both for more information.

**The [guide](https://github.com/WordPress/gutenberg/tree/HEAD/docs/contributors/code/e2e/README.md) has been moved to the documentation folder.**

In CI, the tests are executed across multiple shards, and [@flakiness/playwright](https://github.com/flakiness/playwright) balances the shards using historical test-duration data, stored in `timings.json`. Once the shards become too unbalanced, the `timings.json` file should be updated with the following command:

```bash
npm run test:e2e:update-timings
```

## Site editor v2 (extensible site editor)

The site editor specs also run against the extensible site editor — the
`routes/*` + `@wordpress/boot` based rewrite behind the
`gutenberg-extensible-site-editor` experiment — via a dedicated config:

```bash
npm run test:e2e:site-editor-v2
```

The config (`playwright.site-editor-v2.config.ts`) sets the
`GUTENBERG_E2E_SITE_EDITOR_V2` environment variable, which makes
`admin.visitSiteEditor()` navigate to `admin.php?page=site-editor-v2` routes
instead of `site-editor.php`, and its global setup enables the experiment on
the test site. Specs can read the same variable when an assertion legitimately
differs between the two editors.

Tests covering behavior that intentionally has no equivalent in the extensible
site editor carry the `@site-editor-v1-only` tag in their title, along with a
comment explaining the gap; the v2 config excludes them via `grepInvert`. When
adding a site editor feature or spec, make sure it works in both editors or
tag and document the difference explicitly.
