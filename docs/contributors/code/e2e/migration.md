# Migration guide

This document outlines a typical flow of migrating a Jest + Puppeteer test to Playwright. Note that the migration process is also a good opportunity to refactor or rewrite parts of the tests. Please read the [best practices](https://github.com/WordPress/gutenberg/tree/HEAD/docs/contributors/code/e2e/README.md#best-practices) guide before starting the migration.

## Migration steps for tests

1. Choose a test suite to migrate in `packages/e2e-tests/specs`, rename `.test.js` into `.spec.js` and put it in the same folder structure inside `test/e2e/specs`.
2. Require the test helpers from `@wordpress/e2e-test-utils-playwright`:
    ```js
    const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
    ```
3. Change all occurrences of `describe`, `beforeAll`, `beforeEach`, `afterEach` and `afterAll` with the `test.` prefix. For instance, `describe` turns into `test.describe`.
4. Use the [fixtures API](https://playwright.dev/docs/test-fixtures) to require previously global variables like `page` and `browser`.
5. Delete all the imports of `e2e-test-utils`. Instead, use the fixtures API to directly get the `admin`, `editor`, `pageUtils` and `requestUtils`. (However, `admin`, `editor` and `pageUtils` are not allowed in `beforeAll` and `afterAll`, rewrite them using `requestUtils` instead.)
6. If there's a missing util, try to inline the operations directly in the test if there are only a few steps. If you think it deserves to be implemented as a test util, then follow the [guide](#migration-steps-for-test-utils) below.
7. Manually migrate other details in the tests following the proposed [best practices](https://github.com/WordPress/gutenberg/tree/HEAD/docs/contributors/code/e2e/README.md#best-practices). Note that even though the differences in the API of Playwright and Puppeteer are similar, some manual changes are still required.

## Migration steps for test utils

Before migrating a test utility function, think twice about whether it's necessary. Playwright offers a lot of readable and powerful APIs which make a lot of the utils obsolete. Try implementing the same thing inline directly in the test first. Only follow the below guide if that doesn't work for you. Some examples of utils that deserve to be implemented in the `e2e-test-utils-playwright` package include complex browser APIs (like `pageUtils.dragFiles` and `pageUtils.pressKeyWithModifier`) and APIs that set states (`requestUtils.*`).

> **Note**
> The `e2e-test-utils-playwright` package is not meant to be a drop-in replacement of the Jest + Puppeteer's `e2e-test-utils` package. Some utils are only created to ease the migration process, but they are not necessarily required.

Playwright utilities are organized a little differently from those in the `e2e-test-utils` package. The `e2e-test-utils-playwright` package has the following folders that utils are divided up into:
- `admin` - Utilities related to WordPress admin or WordPress admin's user interface (e.g. `visitAdminPage`).
- `editor` - Utilities for the block editor (e.g. `clickBlockToolbarButton`).
- `pageUtils` - General utilities for interacting with the browser (e.g. `pressKeyWithModifier`).
- `requestUtils` - Utilities for making REST API requests (e.g. `activatePlugin`). These utilities are used for setup and teardown of tests.

1. Copy the existing file in `e2e-test-utils` and paste it in the `admin`, `editor`, `page` or `request` folder in `e2e-test-utils-playwright` depending on the type of util.
2. Update any parts of the util that need to be rewritten:
    - The `page` and `browser` variables are available in `admin`, `editor` and `pageUtils` as `this.page` and `this.browser`.
    - All the other utils in the same class are available in `this` and bound to the same instance. You can remove any `import` statements and use `this` to access them.
    - Consider updating the util to use TypeScript if you're comfortable doing so.
3. Import the newly migrated util in `index.ts` and put it inside the `Admin`/`Editor`/`PageUtils`/`RequestUtils` class as an instance field.
