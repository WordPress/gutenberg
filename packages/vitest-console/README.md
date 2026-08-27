# Vitest Console

Custom [Vitest](https://vitest.dev/) matchers for the
[Console](https://developer.mozilla.org/docs/Web/API/Console) object.

The package spies on `console.error`, `console.info`, `console.log`, and
`console.warn`. A test fails when one of those methods is called without a
corresponding assertion, which helps expose unexpected warnings and errors.

## Installation

```bash
npm install --save-dev @wordpress/vitest-console vitest
```

Add the package to a Vitest setup file:

```js
import '@wordpress/vitest-console';
```

```js
import { expect, test } from 'vitest';

test( 'reports an invalid value', () => {
	validateValue( 'invalid' );
	expect( console ).toHaveErroredWith( 'Invalid value.' );
} );
```

The available matcher pairs are:

-   `toHaveErrored()` and `toHaveErroredWith()`
-   `toHaveInformed()` and `toHaveInformedWith()`
-   `toHaveLogged()` and `toHaveLoggedWith()`
-   `toHaveWarned()` and `toHaveWarnedWith()`

## Contributing

This package is part of the Gutenberg monorepo. See the
[contributor guide](https://github.com/WordPress/gutenberg/blob/HEAD/CONTRIBUTING.md).
