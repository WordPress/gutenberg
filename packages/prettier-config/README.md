# Prettier Config

WordPress Prettier shareable config for [Prettier](https://prettier.io).

## Installation

Install the module

```shell
$ npm install @wordpress/prettier-config --save-dev
```

**Note**: This package requires Node.js 14.0.0 or later. It is not compatible with older versions.

## Usage

Add this to your `package.json` file:

```json
"prettier": "@wordpress/prettier-config"
```

Alternatively, add this to `.prettierrc` file:

```
"@wordpress/prettier-config"
```

Or add this to `.prettierrc.js` file:

```js
module.exports = require( '@wordpress/prettier-config' );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
