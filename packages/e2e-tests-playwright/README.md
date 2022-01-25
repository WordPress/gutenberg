# E2E Tests

End-To-End (E2E) tests for WordPress.

## Installation

Install the module

```bash
npm install @wordpress/e2e-tests-playwright --save-dev
```

## Running tests

The following command is available on the Gutenberg repo:

```json
{
	"test-e2e:playwright": "playwright test --config packages/e2e-tests-playwright/playwright.config.ts"
}
```

### Run all available tests
```bash
npm run test-e2e:playwright
```

### Headed mode

```bash
npm run test-e2e:playwright -- --headed
```

### Run a specific test file
```bash
npm run test-e2e:playwright -- <path_to_test_file>
```
### Debugging

Makes e2e tests available to debug in Playwright Inspector.
```bash
npm run test-e2e:playwright -- --debug
```


**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
