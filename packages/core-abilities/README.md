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

This package is designed to be loaded as a script module on WordPress admin pages. It exposes an `initialize()` function that, on first call:

1. Fetches all ability categories from `/wp-abilities/v1/categories` and registers them with `@wordpress/abilities`
2. Fetches all abilities from `/wp-abilities/v1/abilities` and registers them with a `callback` that handles execution via REST API

Initialization is lazy: importing the package does not trigger network requests. Call `initialize()` from the feature that needs abilities — for example, when the workflow palette opens. Repeated calls return the same in-flight or resolved promise, so the requests fire at most once.

```js
import { initialize } from '@wordpress/core-abilities';
import { getAbilities, executeAbility } from '@wordpress/abilities';

await initialize();

console.log( getAbilities() );
console.log( await executeAbility( 'core/get-site-info' ) );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
