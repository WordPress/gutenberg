# Migration guide

## Migration steps for tests

1. Choose a test suite to migrate in `packages/e2e-tests/specs`, rename `.test.js` into `.spec.js` and put it in the same folder structure inside `test/e2e/specs`.
2. Require the test helpers from `@wordpress/e2e-test-utils-playwright`:
    ```js
    const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
    ```
3. Change all occurrences of `describe`, `beforeAll`, `beforeEach`, `afterEach` and `afterAll` with the `test.` prefix. For instance, `describe` turns into `test.describe`.
4. Use the [fixtures API](https://playwright.dev/docs/test-fixtures) to require previously global variables like `page` and `browser`.
5. Delete all the imports of `e2e-test-utils`. Instead, use the fixtures API to directly get the `admin`, `editor`, `pageUtils` and `requestUtils`. (However, `admin`, `editor` and `pageUtils` are not allowed in `beforeAll` and `afterAll`, rewrite them using `requestUtils` instead.)
6. If tests are for the site editor, configure the editor utils to use an iframe:
    ```js
    const {
        test,
        expect,
        Editor,
    } = require( '@wordpress/e2e-test-utils-playwright' );

    test.use( {
        editor: async ( { page }, use ) => {
            await use( new Editor( { page, hasIframe: true } ) );
        },
    } );
    ```
7. If there's a missing util, go ahead and [migrate it](#migration-steps-for-test-utils).
8. Manually migrate other details in the tests following the proposed [best practices](https://github.com/WordPress/gutenberg/tree/HEAD/test/e2e/README.md#best-practices). Note that even though the differences in the API of Playwright and Puppeteer are similar, some manual changes are still required.

## Migration steps for test utils

Playwright utilities are organized a little differently to those in the `e2e-test-utils` package. The `e2e-test-utils-playwright` package has the following folders that utils are divided up into:
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
