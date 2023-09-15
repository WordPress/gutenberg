# E2E Test Utils

End-To-End (E2E) Playwright test utils for WordPress.

_It works properly with the minimum version of Gutenberg `9.2.0` or the minimum version of WordPress `5.6.0`._

<div class="callout callout-alert">
This package is still under active development. Documentation might not be up-to-date, and the <code>v0.x</code> version can introduce breaking changes without a detailed migration guide. Early adopters are encouraged to use a <a href="https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json">lock file</a> to prevent unexpected breakages.
</div>

## Installation

Install the module

```bash
npm install @wordpress/e2e-test-utils-playwright --save-dev
```

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

## API

### test

The extended Playwright's [test](https://playwright.dev/docs/api/class-test) module with the `admin`, `editor`, `pageUtils` and the `requestUtils` fixtures.

### expect

The Playwright/Jest's [expect](https://jestjs.io/docs/expect) function.

### Admin

End to end test utilities for WordPress admin's user interface.

```js
const admin = new Admin( { page, pageUtils } );
await admin.visitAdminPage( 'options-general.php' );
```

### Editor

End to end test utilities for the WordPress Block Editor.

To use these utilities, instantiate them within each test file:
```js
test.use( {
	editor: async ( { page }, use ) => {
		await use( new Editor( { page } ) );
	},
} );
```

Within a test or test utility, use the `canvas` property to select elements within the iframe canvas:

```js
await editor.canvas.locator( 'role=document[name="Paragraph block"i]' )
```

### PageUtils

Generic Playwright utilities for interacting with web pages.

```js
const pageUtils = new PageUtils( { page } );
await pageUtils.pressKeys( 'primary+a' );
```

### RequestUtils

Playwright utilities for interacting with the WordPress REST API.

Create a request utils instance.

```js
const requestUtils = await RequestUtils.setup( {
	user: {
		username: 'admin',
		password: 'password',
	},
} );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
