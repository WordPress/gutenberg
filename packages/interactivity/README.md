# Interactivity API

## Installation

Install the module:

```bash
npm install @wordpress/interactivity --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

```js
import { store } from '@wordpress/interactivity';

store( {
	effects: {
		core: {
			navigation: {
				initMenu: ( { context, selectors, ref } ) => {
					// ... some magic happens with this effect
                }
			},
		},
	},
	selectors: {
		core: {
			navigation: {
                isMenuOpen: ( { context } ) => {
                    // ... some magic info is returned with this selector
                }
			},
		},
	},
	actions: {
		core: {
			navigation: {
				openMenuOnHover( args ) {
					// ... some magic happens on this action
			},
		},
	},
} );
```

## Docs & Examples

Interactivity API is a recent proposal and its Documentation is still in progress. In the meantime, here you have these resources to learn/read more about the Interactivity API:

- [Proposal: The Interactivity API – A better developer experience in building interactive blocks](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/)
- [“Interactivity API” category](https://github.com/WordPress/gutenberg/discussions/categories/interactivity-api) in Gutenberg repo discussions
block-interactivity-experiments repo and its discussions section
- Developer Hours sessions ([Americas](https://www.youtube.com/watch?v=RXNoyP2ZiS8&t=664s) & [APAC/EMEA](https://www.youtube.com/watch?v=6ghbrhyAcvA))
- [wpmovies.dev](http://wpmovies.dev/) demo and its [wp-movies-demo](https://github.com/WordPress/wp-movies-demo) repo

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
