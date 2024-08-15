# Interactivity Router

> **Note**
> This package is a extension of the API shared at [Proposal: The Interactivity API – A better developer experience in building interactive blocks](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/). As part of an [Open Source project](https://developer.wordpress.org/block-editor/getting-started/faq/#the-gutenberg-project) we encourage participation in helping shape this API and the [discussions in GitHub](https://github.com/WordPress/gutenberg/discussions/categories/interactivity-api) is the best place to engage.

This package defines an Interactivity API store with the `core/router` namespace, exposing state and actions like `navigate` and `prefetch` to handle client-side navigations.

## Usage

The package is intended to be imported dynamically in the `view.js` files of interactive blocks.

```js
import { store } from '@wordpress/interactivity';

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

## Frequently Asked Questions

At this point, some of the questions you have about the Interactivity API may be:

### What is this?

This is the base of a new standard to create interactive blocks. Read [the proposal](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/) to learn more about this.

### Can I use it?

You can test it, but it's still very experimental.

### How do I get started?

The best place to start with the Interactivity API is this [**Getting started guide**](https://github.com/WordPress/gutenberg/blob/trunk/packages/interactivity/docs/1-getting-started.md). There you'll will find a very quick start guide and the current requirements of the Interactivity API.

### Where can I ask questions?

The [“Interactivity API” category](https://github.com/WordPress/gutenberg/discussions/categories/interactivity-api) in Gutenberg repo discussions is the best place to ask questions about the Interactivity API.

### Where can I share my feedback about the API?

The [“Interactivity API” category](https://github.com/WordPress/gutenberg/discussions/categories/interactivity-api) in Gutenberg repo discussions is also the best place to share your feedback about the Interactivity API.

## Installation

Install the module:

```bash
npm install @wordpress/interactivity --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

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
