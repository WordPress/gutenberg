# Jest Preset Default

Default [Jest](https://jestjs.io/) preset for WordPress development.

## Installation

Install the module

```bash
npm install @wordpress/jest-preset-default --save-dev
```

**Note**: This package requires Node.js 14.0.0 or later. It is not compatible with older versions.

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
-   `testMatch`- includes `/test/` subfolder in addition to the glob patterns Jest uses to detect test files. It detects only test files containing `.js`, `.jsx`, `.ts` and `.tsx` suffix. It doesn't match files with `.spec.js` suffix.
-   `timers` - use of [fake timers](https://jestjs.io/docs/en/timer-mocks.html) for functions such as `setTimeout` is enabled.
-   `transform` - keeps the default [babel-jest](https://github.com/facebook/jest/tree/HEAD/packages/babel-jest) transformer.
-   `verbose` - each individual test won't be reported during the run.

#### Using enzyme

Historically, this package used to use `enzyme`, but support was dropped in favor of `@testing-library/react`, primary reason being unblocking the upgrade to React 18.

If you wish to use `enzyme`, you can still use it by manually providing the React 17 adapter, by following the steps below.

To install the enzyme dependency, run:

```bash
npm install --save enzyme
```

To install the React 17 adapter dependency, run:

```bash
npm install --save @wojtekmaj/enzyme-adapter-react-17
```

To use the React 17 adapter, use this in your [`setupFilesAfterEnv`](https://jestjs.io/docs/configuration#setupfilesafterenv-array) configuration:

```javascript
// It "mocks" enzyme, so that we can delay loading of
// the utility functions until enzyme is imported in tests.
// Props to @gdborton for sharing this technique in his article:
// https://medium.com/airbnb-engineering/unlocking-test-performance-migrating-from-mocha-to-jest-2796c508ec50.
let mockEnzymeSetup = false;

jest.mock( 'enzyme', () => {
	const actualEnzyme = jest.requireActual( 'enzyme' );
	if ( ! mockEnzymeSetup ) {
		mockEnzymeSetup = true;

		// Configure enzyme 3 for React, from docs: http://airbnb.io/enzyme/docs/installation/index.html
		const Adapter = jest.requireActual(
			'@wojtekmaj/enzyme-adapter-react-17'
		);
		actualEnzyme.configure( { adapter: new Adapter() } );
	}
	return actualEnzyme;
} );
```

If you also use snapshot tests with `enzyme`, you might want to add support for serializing them, through the `enzyme-to-json` package.

To install the dependency, run:

```bash
npm install --save enzyme-to-json
```

Finally, you should add `enzyme-to-json/serializer` to the array of [`snapshotSerializers`](https://jestjs.io/docs/configuration#snapshotserializers-arraystring):

```javascript
{
	snapshotSerializers: [ 'enzyme-to-json/serializer' ]
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
