# Interactivity API Reference

The Interactivity API, [introduced in WordPress 6.5](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/), provides a standard way for developers to add interactions to the front end of their blocks. The API is also used in many Core WordPress blocks, including Search, Query, Navigation, and File.

This standard makes it easier for developers to create rich, interactive user experiences, from simple counters or pop-ups to more complex features like instant page navigation, instant search, shopping carts, or checkouts.

Blocks can share data, actions, and callbacks between them. This makes communication between blocks simpler and less error-prone. For example, clicking on an “add to cart” block can seamlessly update a separate “cart” block.

For more information about the genesis of the Interactivity API, check out the [original proposal](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/). You can also review the [merge announcement](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/), the [status update post](https://make.wordpress.org/core/2023/08/15/status-update-on-the-interactivity-api/), and the official [Trac ticket](https://core.trac.wordpress.org/ticket/60356).

<div class="callout callout-info">
    The Interactivity API is supported by the package <a href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity/"><code>@wordpress/interactivity</code></a> which is bundled in WordPress Core from v6.5
</div>

## Navigating the Interactivity API docs

Use the following links to locate the topic you're interested in. If you have never worked with the Interactivity API before, consider reading through the following resources in the order listed.

-   **[Requirements](#requirements-of-the-interactivity-api):** Check this section before you start creating your interactive blocks with the Interactivity API.
-   **[Quick Start Guide](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/iapi-quick-start-guide/):** Get a custom block using the Interactivity API up and running in less than one minute.
-   **[Tutorial: A first look at the Interactivity API](https://developer.wordpress.org/news/2024/04/11/a-first-look-at-the-interactivity-api/)** This article from the [WordPress Developer Blog](https://developer.wordpress.org/news/) is a great way to get introduced to the Interactivity API.
-   **[Core Concepts](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/core-concepts/)** Gain a better understanding of concepts and mental models related to Interactivity API development from this section.
-   **[API Reference](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/):** To take a deep dive into how the API works internally, the list of Directives, and how the Store works.
-   **[Docs and Examples](#docs-examples):** Additional resources to learn/read more about the Interactivity API.

To get a deeper understanding of what the Interactivity API is or find answers to questions you may have about this standard, check the following resources:

-   **[About the Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/iapi-about/):** To learn more about the API Goals and the reasoning behind the use of a standard to add interactivity to blocks.
-   **[Frequently Asked Questions](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/iapi-faq/):** To find responses to some frequently asked questions about the technology behind and alternatives.

## Requirements of the Interactivity API

Interactivity API is included in Core in WordPress 6.5. For versions below, you'll need Gutenberg 17.5 or higher installed and activated in your WordPress installation.

It’s also important to highlight that the block creation workflow doesn’t change, and all the [prerequisites](https://developer.wordpress.org/block-editor/getting-started/devenv/) remain the same. These include:

-   [Code Editor](https://developer.wordpress.org/block-editor/getting-started/devenv/#code-editor)
-   [Node.js development tools](https://developer.wordpress.org/block-editor/getting-started/devenv/#node-js-development-tools)
-   [Local WordPress environment (site)](https://developer.wordpress.org/block-editor/getting-started/devenv/#local-wordpress-environment)

You can start creating interactions once you set up a block development environment and run WordPress 6.5+ (or Gutenberg 17.5+).

### Code requirements

#### Add `interactivity` to your project

Install the Interactivity API to your project with the following command:

```bash
npm install @wordpress/interactivity --save
```

Import the store into your `view.js`. Refer to the [store documentation](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/#the-store) for more information.

```js
import { store } from '@wordpress/interactivity';
```

#### Add `interactivity` support to `block.json`

To indicate that the block [supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) the Interactivity API features, add `"interactivity": true` to the `supports` attribute of the block's `block.json` file.

```json
// block.json
"supports": {
    "interactivity": true
},
```

Refer to the [`interactivity` support property docs](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/#interactivity) to get a more detailed description of this property.

#### Load Interactivity API JavaScript code with `viewScriptModule`

The Interactivity API provides the `@wordpress/interactivity` Script Module. JavaScript using the Interactivity API should be implemented as Script Modules so they can depend on `@wordpress/interactivity`. [Script Modules have been available since WordPress 6.5](https://make.wordpress.org/core/2024/03/04/script-modules-in-6-5/). Blocks can use [`viewScriptModule` block metadata](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/#view-script-module) to enqueue their Script Modules easily:

```json
// block.json
{
   ...
   "viewScriptModule": "file:./view.js"
}
```

The use of `viewScriptModule` also requires the `--experimental-modules` flag for both the [`build`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#build) and [`start`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/#start) scripts of `wp-scripts` to ensure a proper build of the Script Modules.

```json
// package.json
{
    "scripts": {
        ...
		"build": "wp-scripts build --experimental-modules",
		"start": "wp-scripts start --experimental-modules"
	}
```

#### Add `wp-interactive` directive to a DOM element

To "activate" the Interactivity API in a DOM element (and its children), add the [`wp-interactive`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity/packages-interactivity-api-reference/#wp-interactive) directive to the DOM element in the block's `render.php` or `save.js` files.

```html
<div data-wp-interactive="myPlugin">
	<!-- Interactivity API zone -->
</div>
```

Refer to the [`wp-interactive` documentation](https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/api-reference/#wp-interactive) for a more detailed description of this directive.

## Docs & Examples

Here you have some more resources to learn/read more about the Interactivity API:

-   [WordPress 6.5 Dev Note](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/)
-   [Merge announcement](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/)
-   [Proposal: The Interactivity API – A better developer experience in building interactive blocks](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/)
-   [Interactivity API Discussions](https://github.com/WordPress/gutenberg/discussions/52882), especially the [showcase](https://github.com/WordPress/gutenberg/discussions/55642#discussioncomment-9667164) discussions.
-   [wpmovies.dev](http://wpmovies.dev/) demo and its [wp-movies-demo](https://github.com/WordPress/wp-movies-demo) repo
-   Examples using the Interactivity API at [block-development-examples](https://github.com/WordPress/block-development-examples):
    -   [`interactivity-api-block-833d15`](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/interactivity-api-block-833d15)
    -   [`interactivity-api-countdown-3cd73e`](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/interactivity-api-countdown-3cd73e)
    -   [`interactivity-api-quiz-1835fa`](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/interactivity-api-quiz-1835fa)

<div class="callout">
    There's a Tracking Issue opened to ease the coordination of the work related to the Interactivity API Docs: <a href="https://github.com/WordPress/gutenberg/issues/53296">Documentation for the Interactivity API - Tracking Issue #53296</a>
</div>
