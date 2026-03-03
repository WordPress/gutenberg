# Core Abilities

WordPress core abilities integration for the Abilities API.

This package provides the integration layer between the `@wordpress/abilities` package and WordPress REST API. It fetches and registers all abilities and categories from the WordPress server.

## Installation

Install the module:

```bash
npm install @wordpress/core-abilities --save
```

_This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for such language features and/or APIs, you should include the polyfill shipped in `@wordpress/babel-preset-default` in your code._

## Usage

This package is designed to be loaded as a script module on WordPress admin pages. When loaded, it automatically:

1. Fetches all ability categories from `/wp-abilities/v1/categories`
2. Registers them with `@wordpress/abilities`
3. Fetches all abilities from `/wp-abilities/v1/abilities`
4. Registers them with a `callback` that handles execution via REST API

Simply import the package to initialize the WordPress abilities:

```js
import '@wordpress/core-abilities';
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
