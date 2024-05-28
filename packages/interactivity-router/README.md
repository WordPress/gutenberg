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


## Docs & Examples

**[Interactivity API Documentation](https://github.com/WordPress/gutenberg/tree/trunk/packages/interactivity/docs)** is the best place to learn about this proposal. Although it's still in progress, some key pages are already available:

-   **[Getting Started Guide](https://github.com/WordPress/gutenberg/blob/trunk/packages/interactivity/docs/1-getting-started.md)**: Follow this Getting Started guide to learn how to scaffold a new project and create your first interactive blocks.
-   **[API Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/interactivity/docs/2-api-reference.md)**: Check this page for technical detailed explanations and examples of the directives and the store.

Here you have some more resources to learn/read more about the Interactivity API:

-   **[Interactivity API Discussions](https://github.com/WordPress/gutenberg/discussions/52882)**
-   [Proposal: The Interactivity API – A better developer experience in building interactive blocks](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/)
-   Developer Hours sessions ([Americas](https://www.youtube.com/watch?v=RXNoyP2ZiS8&t=664s) & [APAC/EMEA](https://www.youtube.com/watch?v=6ghbrhyAcvA))
-   [wpmovies.dev](http://wpmovies.dev/) demo and its [wp-movies-demo](https://github.com/WordPress/wp-movies-demo) repo

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
