# E2E Test Utils

Experimental End-To-End (E2E) Playwright test utils for WordPress.

**This package is still experimental and breaking changes could be introduced in future minor versions (`v0.x`). Use it at your own risks.**

_It works properly with the minimum version of Gutenberg `9.2.0` or the minimum version of WordPress `5.6.0`._

## Installation

Install the module

```bash
npm install @wordpress/e2e-test-utils-playwright --save-dev
```

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

## API

### test

The extended Playwright's [test](https://playwright.dev/docs/api/class-test) module with the `pageUtils` and the `requestUtils` fixtures.

### expect

The Playwright/Jest's [expect](https://jestjs.io/docs/expect) function.

### PageUtils

Create a page utils instance of the current page.

```js
const pageUtils = new PageUtils( page );
```

### RequestUtils

Create a request utils instance.

```js
const requestUtils = await RequestUtils.setup( {
	user: {
		username: 'admin',
		password: 'password',
	},
} );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
