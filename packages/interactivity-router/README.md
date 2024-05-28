# `@wordpress/interactivity-router`

The package `@wordpress/interactivity-router` defines an Interactivity API store with the `core/router` namespace, exposing state and actions like `navigate` and `prefetch` to handle client-side navigations.

This package was [introduced in WordPress Core in v6.5](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/). This means this package is already bundled in Core in any version of WordPress higher than v6.5.

<div class="callout callout-info">
    Check the <a href="https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/">Interactivity API Reference docs in the Block Editor handbook</a> to learn more about the Interactivity API.
</div>



## Usage

The package is intended to be imported dynamically in the `view.js` files of interactive blocks.

```js


import { store } from '@wordpress/interactivity-router';

store( 'myblock', {
	actions: {
		*navigate( e ) {
			e.preventDefault();
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
		},
	},
} );
```

## Installation

Install the module:

```bash
npm install @wordpress/interactivity --save
```

This step is only required if you use the Interactivity API outside WordPress.

Within WordPress, the package is already bundled in Core. To ensure it's loaded, add `@wordpress/interactivity` to the dependency array of the script module. This process is often done automatically with tools like [`wp-scripts`](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/).

Furthermore, this package assumes your code will run in an **ES2015+** environment. If you're using an environment with limited or no support for such language features and APIs, you should include the polyfill shipped in [`@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code.


## License

Interactivity API proposal, as part of Gutenberg and the WordPress project is free software, and is released under the terms of the GNU General Public License version 2 or (at your option) any later version. See [LICENSE.md](https://github.com/WordPress/gutenberg/blob/trunk/LICENSE.md) for complete license.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>