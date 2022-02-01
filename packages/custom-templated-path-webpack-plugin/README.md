# Custom Templated Path Webpack Plugin

Webpack plugin for creating custom path template tags. Extend the [default set of template tags](https://webpack.js.org/configuration/output/#output-filename) with your own custom behavior. Hooks into Webpack's compilation process to allow you to replace tags with a substitute value.

## Installation

Install the module

```bash
npm install @wordpress/custom-templated-path-webpack-plugin --save-dev
```

**Note**: This package requires Node.js 12.0.0 or later. It targets Webpack 4.0 and newer. It is not compatible with older versions.

## Usage

Construct an instance of `CustomTemplatedPathPlugin` in your Webpack configurations `plugins` entry, passing an object where keys correspond to the template tag name. The value for each key is a function passed the original intended path and data corresponding to the asset.

The following example creates a new `basename` tag to substitute the basename of each entry file in the build output file. When compiled, the built file will be output as `build-entry.js`.

```js
const { basename } = require( 'path' );
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );

module.exports = {
	// ...

	entry: './entry',

	output: {
		filename: 'build-[basename].js',
	},

	plugins: [
		new CustomTemplatedPathPlugin( {
			basename( path, data ) {
				let rawRequest;

				const entryModule = get( data, [ 'chunk', 'entryModule' ], {} );
				switch ( entryModule.type ) {
					case 'javascript/auto':
						rawRequest = entryModule.rawRequest;
						break;

					case 'javascript/esm':
						rawRequest = entryModule.rootModule.rawRequest;
						break;
				}

				if ( rawRequest ) {
					return basename( rawRequest );
				}

				return path;
			},
		} ),
	],
};
```

For more examples, refer to Webpack's own [`TemplatedPathPlugin.js`](https://github.com/webpack/webpack/blob/v4.1.1/lib/TemplatedPathPlugin.js), which implements the base set of template tags.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
