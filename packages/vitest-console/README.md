# Vitest Console

Custom [Vitest](https://vitest.dev/) matchers for the
[Console](https://developer.mozilla.org/docs/Web/API/Console) object.

The package spies on `console.error`, `console.info`, `console.log`, and
`console.warn`. A test fails when one of those methods is called without a
corresponding assertion, which helps expose unexpected warnings and errors.

Calls are acknowledged per method and per test, as in `@wordpress/jest-console`. A matcher does not require every call to match. Tests that share these console spies must not run concurrently within a file.

## Installation

Requires Vitest 5 and Node `^22.12.0 || ^24.0.0 || >=26.0.0`.

```bash
npm install --save-dev @wordpress/vitest-console vitest@^5
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

The TypeScript declarations preserve synchronous `void` and asynchronous `Promise<void>` assertion results. Include this package in a TypeScript setup file or your `compilerOptions.types` when setup uses JavaScript. Await `.resolves`, `.rejects`, and `expect.poll` assertions.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
