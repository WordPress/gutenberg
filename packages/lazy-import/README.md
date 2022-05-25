# Lazy Import

Import an NPM module, even if not installed locally or defined as a dependency of the project. Uses a locally installed package if available. Otherwise, the package will be downloaded dynamically on-demand.

## Installation

Install the module

```bash
npm install @wordpress/lazy-import --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Requirements

NPM 6.9.0 or newer is required, since it uses the [package aliases feature](https://github.com/npm/rfcs/blob/latest/implemented/0001-package-aliases.md) to maintain multiple versions of the same package.

## Usage

Usage is intended to mimic the behavior of the [dynamic `import` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Dynamic_Imports), receiving the name (and optional version specifier) of an NPM package and returning a promise which resolves to the required module.

_**Note:** Currently, this alignment to `import` is superficial, and the module resolution still uses [CommonJS `require`](https://nodejs.org/docs/latest-v12.x/api/modules.html#modules_require_id), rather than the newer [ES Modules support](https://nodejs.org/docs/latest-v14.x/api/esm.html). Future versions of this package will likely support ES Modules, once an LTS release of Node.js including unflagged ES Modules support becomes available._

The string passed to `lazyImport` can be formatted exactly as you would provide to `npm install`, including an optional version specifier (including [version ranges](https://docs.npmjs.com/misc/semver#ranges)). If the version specifier is omitted, it will be treated as equivalent to `*`, using the version of a locally installed package if available, otherwise installing the latest available version.

```js
const lazyImport = require( '@wordpress/lazy-import' );

lazyImport( 'is-equal-shallow@^0.1.3' ).then( ( isEqualShallow ) => {
	console.log( isEqualShallow( { a: true, b: true }, { a: true, b: true } ) );
	// true
} );
```

If you're using Node v14.3.0 or newer, you can also take advantage of [top-level await](https://v8.dev/features/top-level-await) to simplify top-level imports:

```js
const lazyImport = require( '@wordpress/lazy-import' );

const isEqualShallow = await lazyImport( 'is-equal-shallow@^0.1.3' );
console.log( isEqualShallow( { a: true, b: true }, { a: true, b: true } ) );
// true
```

`lazyImport` optionally accepts a second argument, an options object:

```js
const lazyImport = require( '@wordpress/lazy-import' );

function onInstall() {
	console.log( 'Installing…' );
}

lazyImport( 'fbjs@^1.0.0', {
	localPath: './lib/shallowEqual',
	onInstall,
} ).then(/* ... */);
```

Note that `lazyImport` can throw an error when offline and unable to install the dependency using NPM. You may want to anticipate this and provide remediation steps for a failed install, such as logging a warning messsage:

```js
try {
	await lazyImport( 'is-equal-shallow@^0.1.3' );
} catch ( error ) {
	if ( error.code === 'ENOTFOUND' ) {
		console.log( 'Unable to connect to NPM registry!' );
	}
}
```

### Options

#### `localPath`

-   Type: `string`
-   Required: No

Local path pointing to a file or directory that can be used when other script that `main` needs to be imported.

#### `onInstall`

-   Type: `Function`
-   Required: No

Function to call if and when the module is being installed. Since installation can cause a delay in script execution, this can be useful to output logging information or display a spinner.

An installation can be assumed to finish once the returned promise is resolved.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
