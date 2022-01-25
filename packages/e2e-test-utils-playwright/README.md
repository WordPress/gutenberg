# E2E Test Utils

End-To-End (E2E) test utils for WordPress.

_It works properly with the minimum version of Gutenberg `9.2.0` or the minimum version of WordPress `5.6.0`._

## Installation

Install the module

```bash
npm install @wordpress/e2e-test-utils-playwright --save-dev
```

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

## API

### TestUtils

Create the test utils instance of the current page.

```js
const testUtils = new TestUtils( browser, page );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
