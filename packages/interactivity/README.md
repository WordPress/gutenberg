# Interactivity API

The Interactivity API, [introduced in WordPress 6.5](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/), provides a standard way for developers to add interactions to the front end of their blocks. The API is also used in many Core WordPress blocks, including Search, Query, Navigation, and File. 

This standard makes it easier for developers to create rich, interactive user experiences, from simple counters or pop-ups to more complex features like instant page navigation, instant search, shopping carts, or checkouts.

Blocks can share data, actions, and callbacks between them. This makes communication between blocks simpler and less error-prone. For example, clicking on an “add to cart” block can seamlessly update a separate “cart” block.

For more information about the genesis of the Interactivity API, check out the [original proposal](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/). You can also review the [merge announcement](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/), the [status update post](https://make.wordpress.org/core/2023/08/15/status-update-on-the-interactivity-api/), and the official [Trac ticket](https://core.trac.wordpress.org/ticket/60356).

## Installation

Install the Interactivity API using the command:

```bash
npm install @wordpress/interactivity --save
```

This step is only required if you use the Interactivity API outside WordPress.

Within WordPress, the package is already bundled in Core. To ensure it's loaded, add `@wordpress/interactivity` to the dependency array of the script module. This process is often done automatically with tools like [`wp-scripts`](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/).

Furthermore, this package assumes your code will run in an **ES2015+** environment. If you're using an environment with limited or no support for such language features and APIs, you should include the polyfill shipped in [`@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code.

## Quick start guide

This guide will help you build a basic block that demonstrates the Interactivity API in WordPress.

### Scaffold an interactive block

Start by ensuring you have Node.js and `npm` installed on your computer. Review the [Node.js development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/nodejs-development-environment/) guide if not.

Next, use the [`@wordpress/create-block`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) package and the [`@wordpress/create-block-interactive-template`](https://www.npmjs.com/package/@wordpress/create-block-interactive-template) template to scaffold the complete “My First Interactive Block” plugin.

Choose the folder where you want to create the plugin, and then execute the following command in the terminal from within that folder:

```
npx @wordpress/create-block@latest my-first-interactive-block --template @wordpress/create-block-interactive-template
```

The slug provided (`my-first-interactive-block`) defines the folder name for the scaffolded plugin and the internal block name.

### Basic usage

With the plugin activated, you can explore how the block works. Use the following command to move into the newly created plugin folder and start the development process.

```
cd my-first-interactive-block && npm start
```

When `create-block` scaffolds the block, it installs `wp-scripts` and adds the most common scripts to the block’s `package.json` file. Refer to the [Get started with wp-scripts](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/) article for an introduction to this package.

The `npm start` command will start a development server and watch for changes in the block’s code, rebuilding the block whenever modifications are made.

When you are finished making changes, run the `npm run build` command. This optimizes the block code and makes it production-ready.

### View the block in action

If you have a local WordPress installation already running, you can launch the commands above inside the `plugins` folder of that installation. If not, you can use [`wp-now`](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) to launch a WordPress site with the plugin installed by executing the following command from the plugin's folder (`my-first-interactive-block`).

```
npx @wp-now/wp-now start
```

You should be able to insert the "My First Interactive Block" block into any post and see how it behaves in the front end when published.

## Requirements of the Interactivity API

Interactivity API is included in Core in WordPress 6.5. For versions below, you'll need Gutenberg 17.5 or higher installed and activated in your WordPress installation.

It’s also important to highlight that the block creation workflow doesn’t change, and all the [prerequisites](https://developer.wordpress.org/block-editor/getting-started/devenv/) remain the same. These include: 

- [Code editor](https://developer.wordpress.org/block-editor/getting-started/devenv/#code-editor)
- [Node.js development tools](https://developer.wordpress.org/block-editor/getting-started/devenv/#node-js-development-tools)
- [Local WordPress environment (site)](https://developer.wordpress.org/block-editor/getting-started/devenv/#local-wordpress-environment)

You can start creating interactions once you set up a block development environment and are running WordPress 6.5+ (or Gutenberg 17.5+).

### Code requirements

#### Add `interactivity` support to `block.json`

To indicate that the block [supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) the Interactivity API features, add `"interactivity": true` to the `supports` attribute of the block's `block.json` file.

```
"supports": {
    "interactivity": true
},
```

#### Add `wp-interactive` directive to a DOM element

To "activate" the Interactivity API in a DOM element (and its children), add the [`wp-interactive`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity/packages-interactivity-api-reference/#wp-interactive) directive to the element in the block's `render.php` or `save.js` files.


```html
<div data-wp-interactive="myPlugin">
    <!-- Interactivity API zone -->
</div>
```

## API Reference

To take a deep dive into how the API works internally, the list of Directives, and how Store works, visit the [API reference](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity/packages-interactivity-api-reference/).

## Docs & Examples

Here you have some more resources to learn/read more about the Interactivity API:

- [WordPress 6.5 Dev Note](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/)
- [Merge announcement](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/)
- [Proposal: The Interactivity API – A better developer experience in building interactive blocks](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/)
- [Interactivity API Discussions](https://github.com/WordPress/gutenberg/discussions/52882)
- Developer Hours sessions ([Americas](https://www.youtube.com/watch?v=RXNoyP2ZiS8&t=664s) & [APAC/EMEA](https://www.youtube.com/watch?v=6ghbrhyAcvA))
- [wpmovies.dev](http://wpmovies.dev/) demo and its [wp-movies-demo](https://github.com/WordPress/wp-movies-demo) repo

There's a Tracking Issue opened to ease the coordination of the work related to the Interactivity API Docs: **[Documentation for the Interactivity API - Tracking Issue #53296](https://github.com/WordPress/gutenberg/issues/53296)**


## License

Interactivity API proposal, as part of Gutenberg and the WordPress project is free software, and is released under the terms of the GNU General Public License version 2 or (at your option) any later version. See [LICENSE.md](https://github.com/WordPress/gutenberg/blob/trunk/LICENSE.md) for complete license.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
