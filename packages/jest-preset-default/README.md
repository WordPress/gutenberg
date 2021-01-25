# Jest Preset Default

Default [Jest](https://jestjs.io/) preset for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/jest-preset-default --save-dev
```

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions.

## Setup

### Via `jest.config.json` or `jest` field in `package.json`

```json
{
	"preset": "@wordpress/jest-preset-default"
}
```

### Usage

#### Brief explanations of options included

-   `moduleNameMapper` - all `css` and `scss` files containing CSS styles will be stubbed out.
-   `modulePaths` - the root dir of the project is used as a location to search when resolving modules.
-   `setupFiles` - runs code before each test which sets up global variables required in the testing environment.
-   `setupFilesAfterEnv` - runs code which adds improved support for `Console` object and `React` components to the testing framework before each test.
-   `snapshotSerializers` - makes it possible to use snapshot tests on `Enzyme` wrappers.
-   `testMatch`- includes `/test/` subfolder in addition to the glob patterns Jest uses to detect test files. It detects only test files containing `.js` (or `.ts`) suffix. It doesn't match files with `.spec.js` suffix.
-   `timers` - use of [fake timers](https://jestjs.io/docs/en/timer-mocks.html) for functions such as `setTimeout` is enabled.
-   `transform` - keeps the default [babel-jest](https://github.com/facebook/jest/tree/HEAD/packages/babel-jest) transformer.
-   `verbose` - each individual test won't be reported during the run.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
