# `@wordpress/interactivity-router`

The package `@wordpress/interactivity-router` enables loading content from other pages without a full page reload. Currently, the only supported mode is "region-based". Full "client-side navigation" is still in experimental phase.

The package defines an Interactivity API store with the `core/router` namespace, exposing state and 2 actions: `navigate` and `prefetch` to handle client-side navigation.

The `@wordpress/interactivity-router` package was [introduced in WordPress Core in v6.5](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/). This means this package is already bundled in Core in any version of WordPress higher than v6.5.

<div class="callout callout-info">
    Check the <a href="https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/">Interactivity API Reference docs in the Block Editor handbook</a> to learn more about the Interactivity API.
</div>

## Usage

The package is intended to be imported dynamically in the `view.js` files of interactive blocks. This is done in in order to reduce the JS bundle size on the initial page load.

```js
/* view.js */

import { store } from '@wordpress/interactivity';

// This is how you would typically use the navigate() action in your block.
store( 'my-namespace/myblock', {
	actions: {
		*goToPage( e ) {
			e.preventDefault();

			// We import the package dynamically to reduce the initial JS bundle size.
			// Async actions are defined as generators so the import() must be called with `yield`.
			const { actions } = yield import(
				'@wordpress/interactivity-router'
			);
			yield actions.navigate( e.target.href );
		},
	},
} );
```

Now, you can call `actions.navigate()` in your block's `view.js` file to navigate to a different page or e.g. pass it to a `data-wp-on--click` attribute.

When loaded, this package [adds the following state and actions](https://github.com/WordPress/gutenberg/blob/ed7d78652526270b63976d7a970dba46a2bfcbb0/packages/interactivity-router/src/index.ts#L212) to the `core/router` store:

```js
const { state, actions } = store( 'core/router', {
	state: {
		url: window.location.href,
		navigation: {
			hasStarted: false,
			hasFinished: false,
			texts: {
				loading: '',
				loaded: '',
			},
			message: '',
		},
	},
	actions: {
		*navigate(href, options) {...},
		prefetch(url, options) {...},
	}
})
```

<div class="callout callout-tip">
    The core "Query Loop" block is <a href="https://github.com/WordPress/gutenberg/blob/cd701e94ceffea7ef2f423274a2f77025bcfa1a6/packages/block-library/src/query/view.js#L35">using this package</a> to provide the <a href="https://github.com/WordPress/gutenberg/blob/cd701e94ceffea7ef2f423274a2f77025bcfa1a6/packages/block-library/src/query/index.php#L33">region-based navigation</a>.
</div>

### Directives

#### `data-wp-router-region`

It defines a region that is updated on navigation. It requires a unique ID as the value and can only be used in root interactive elements, i.e., elements with `data-wp-interactive` that are not nested inside other elements with `data-wp-interactive`.

Example:

```html
<div data-wp-interactive="myblock" data-wp-router-region="main-list">
  <ul>
     <li><a href="/post-1">Post 1</a></li>
     <li><a href="/post-2">Post 2</a></li>
     <li><a href="/post-3">Post 3</a></li>
  </ul>
  <a data-wp-on--click="actions.navigate" href="/page/2">
</div>
```

### Actions

#### `navigate`

Navigates to the specified page.

This function normalizes the passed `href`, fetches the page HTML if needed, and updates any interactive regions whose contents have changed in the new page. It also creates a new entry in the browser session history.

**Params**

```js
navigate( href: string, options: NavigateOptions = {} )
```

-   `href`: The page `href`.
-   `options`: Options object.
    -   `force`: If `true`, it forces re-fetching the URL. `navigate()` always caches the page, so if the page has been navigated to before, it will be used. Default is `false`.
    -   `html`: HTML string to be used instead of fetching the requested URL.
    -   `replace`: If `true`, it replaces the current entry in the browser session history. Default is `false`.
    -   `timeout`: Time until the navigation is aborted, in milliseconds. Default is `10000`.
    -   `loadingAnimation`: Whether an animation should be shown while navigating. Default to `true`.
    -   `screenReaderAnnouncement`: Whether a message for screen readers should be announced while navigating. Default to `true`.

#### `prefetch`

Prefetches the page for the passed URL. The page is cached and can be used for navigation.

The function normalizes the URL and stores internally the fetch promise, to avoid triggering a second fetch for an ongoing request.

**Params**

```js
prefetch( url: string, options: PrefetchOptions = {} )
```

-   `url`: The page `url`.
-   `options`: Options object.

    -   `force`: If `true`, forces fetching the URL again.
    -   `html`: HTML string to be used instead of fetching the requested URL.

### State

`state.url` is a reactive property synchronized with the current URL.
Properties under `state.navigation` are meant for loading bar animations.

## Installation

Install the module:

```bash
npm install @wordpress/interactivity-router --save
```

This step is only required if you use the Interactivity API outside WordPress.

Within WordPress, the package is already bundled in Core. To ensure it's enqueued, add `@wordpress/interactivity-router` to the dependency array of the script module. This process is often done automatically with tools like [`wp-scripts`](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/).

Furthermore, this package assumes your code will run in an **ES2015+** environment. If you're using an environment with limited or no support for such language features and APIs, you should include the polyfill shipped in [`@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code.

## License

Interactivity API proposal, as part of Gutenberg and the WordPress project is free software, and is released under the terms of the GNU General Public License version 2 or (at your option) any later version. See [LICENSE.md](https://github.com/WordPress/gutenberg/blob/trunk/LICENSE.md) for complete license.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
