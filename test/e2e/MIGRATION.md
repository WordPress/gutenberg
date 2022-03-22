# Migration guide

## Migration steps for tests

1. Choose a test suite to migrate in `packages/e2e-tests/specs`, rename `.test.js` into `.spec.js` and put it in the same folder structure inside `test/e2e/specs`.
2. Require the test helpers from `@wordpress/e2e-test-utils-playwright`:
    ```js
    const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
    ```
3. Change all occurrences of `describe`, `beforeAll`, `beforeEach`, `afterEach` and `afterAll` with the `test.` prefix. For instance, `describe` turns into `test.describe`.
4. Use the [fixtures API](https://playwright.dev/docs/test-fixtures) to require previously global variables like `page` and `browser`.
5. Delete all the imports of `e2e-test-utils`. Instead, use the fixtures API to directly get the `pageUtils` and `requestUtils`. (However, `pageUtils` is not allowed in `beforeAll` and `afterAll`, rewrite them using `requestUtils` instead.)
6. If there's a missing util, go ahead and [migrate it](#migration-steps-for-test-utils).
7. Manually migrate other details in the tests following the proposed [best practices](https://github.com/WordPress/gutenberg/tree/HEAD/test/e2e/README.md#best-practices). Note that even though the differences in the API of Playwright and Puppeteer are similar, some manual changes are still required.

## Migration steps for test utils

1. Copy the existing file in `e2e-test-utils` and paste it in the `page` or `request` folder in `e2e-test-utils-playwright` depending on whether it's a page util or a request util. (If it sets or clears states, then it probably is a request util. If it can only be used when a page instance is available, it probably is a page util.)
2. Global `page` and `browser` are available in `pageUtils`'s `this.page` and `this.browser`. You can get autocomplete and type inference by adding `@this {import('./').PageUtils}` to the JSDoc.
3. All the other utils in the same class are available in `this` and bound to the same instance. You can remove the internal imports and use `this` to access them.
4. Import the newly migrated util in `index.ts` and put it inside the `PageUtils`/`RequestUtils` class as an instance field.
