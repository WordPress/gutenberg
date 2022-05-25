# Library Export Default Webpack Plugin

> **DEPRECATED for webpack v5**: please use [`output.library.export`](https://webpack.js.org/configuration/output/#outputlibraryexport) instead.

Webpack plugin for exporting `default` property for selected libraries which use ES6 Modules. Implementation is based on the Webpack's core plugin [ExportPropertyMainTemplatePlugin](https://github.com/webpack/webpack/blob/51b0df77e4f366163730ee465f01458bfad81f34/lib/ExportPropertyMainTemplatePlugin.js). The only difference is that this plugin allows to include all entry point names where the default export of your entry point will be assigned to the library target.

## Installation

Install the module

```bash
npm install @wordpress/library-export-default-webpack-plugin --save
```

**Note**: This package requires Node.js 12.0.0 or later. It is not compatible with older versions. It works only with webpack v4.

## Usage

Construct an instance of `LibraryExportDefaultPlugin` in your Webpack configurations plugins entry, passing an array where values correspond to the entry point name.

The following example selects `boo` entry point to be updated by the plugin. When compiled, the built file will ensure that `default` value exported for the chunk will be assigned to the global variable `wp.boo`. `foo` chunk will remain untouched.

```js
const LibraryExportDefaultPlugin = require( '@wordpress/library-export-default-webpack-plugin' );

module.exports = {
	// ...

	entry: {
		boo: './packages/boo',
		foo: './packages/foo',
	},

	output: {
		filename: 'build/[name].js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this',
	},

	plugins: [ new LibraryExportDefaultPlugin( [ 'boo' ] ) ],
};
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
