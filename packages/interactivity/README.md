# Interactivity API

> **Note**
> This package enables the API shared at [Proposal: The Interactivity API – A better developer experience in building interactive blocks](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/). As part of an [Open Source project](https://developer.wordpress.org/block-editor/getting-started/faq/#the-gutenberg-project), participation is encouraged in testing this API providing feedback at the [discussions in GitHub](https://github.com/WordPress/gutenberg/discussions/categories/interactivity-api).

The Interactivity API is available at WordPress Core from version 6.5: [Merge announcement](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/)

These Core blocks are already powered by the API:

- Search
- Query
- Navigation
- File

## Installation

> **Note**
> This step is only required if you are using this API outside of WordPress.
>
> Within WordPress, the package is already bundled in Core, so all you need to do to ensure it is loaded, by adding `@wordpress/interactivity` to the dependency array of the script module.
>
>This happens automatically when you use the dependency extraction Webpack plugin that is used in tools like wp-scripts.

Install the module:

```bash
npm install @wordpress/interactivity --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Quick Start Guide

### Table of Contents

- [Quick Start Guide](#quick-start-guide)
    - [1. Scaffold an interactive block](#1-scaffold-an-interactive-block)
    - [2. Generate the build](#2-generate-the-build)
    - [3. Use it in your WordPress installation ](#3-use-it-in-your-wordpress-installation)
- [Requirements of the Interactivity API](#requirements-of-the-interactivity-aPI)
    - [A local WordPress installation](#a-local-wordpress-installation)
    - [Latest vesion of Gutenberg](#latest-vesion-of-gutenberg)
    - [Node.js](#nodejs)
    - [Code requirements](#code-requirements)
        - [Add `interactivity` support to `block.json`](#add-interactivity-support-to-blockjson)
        - [Add `wp-interactive` directive to a DOM element](#add-wp-interactive-directive-to-a-dom-element)

#### 1. Scaffold an interactive block

A WordPress plugin that registers an interactive block (using the Interactivity API) by using a [template](https://www.npmjs.com/package/@wordpress/create-block-interactive-template) can be scaffolded with the `@wordpress/create-block` command.

```
npx @wordpress/create-block@latest my-first-interactive-block --template @wordpress/create-block-interactive-template
```

#### 2. Generate the build

When the plugin folder is generated, the build process needs to be launched to get a working version of the interactive block that can be used in WordPress.

```
cd my-first-interactive-block && npm start
```

#### 3. Use it in your WordPress installation

If you have a local WordPress installation already running, you can launch the commands above inside the `plugins` folder of that installation. If not, you can use [`wp-now`](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) to launch a WordPress site with the plugin installed by executing from the generated folder (and from a different terminal window or tab) the following command

```
npx @wp-now/wp-now start
```

At this point you should be able to insert the "My First Interactive Block" block into any post, and see how it behaves in the frontend when published.

### Requirements of the Interactivity API

To start working with the Interactivity API you'll need to have a [proper WordPress development environment for blocks](https://developer.wordpress.org/block-editor/getting-started/devenv/) and some specific code in your block, which should include:

#### A local 6.5 WordPress installation

You can use [the tools to set your local WordPress environment](https://developer.wordpress.org/block-editor/getting-started/devenv/#wordpress-development-site) you feel more comfortable with.

To get quickly started, [`wp-now`](https://www.npmjs.com/package/@wp-now/wp-now) is the easiest way to get a WordPress site up and running locally.

Interactivity API is included in Core in WordPress 6.5, for versions below, you'll need to have Gutenberg 17.5 or higher version installed and activated in your WordPress installation.

#### Node.js

Block development requires [Node](https://nodejs.org/en), so you'll need to have Node installed and running on your machine. Any version modern should work, but please check the minimum version requirements if you run into any issues with any of the Node.js tools used in WordPress development.

#### Code requirements

##### Add `interactivity` support to `block.json`

To indicate that the block [supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) the Interactivity API features, add `"interactivity": true` to the `supports` attribute of the block's `block.json`

```
"supports": {
    "interactivity": true
},
```

##### Add `wp-interactive` directive to a DOM element

To "activate" the Interactivity API in a DOM element (and its children), add the [`wp-interactive` directive](./docs/api-reference.md#wp-interactive) to it from `render.php` or `save.js`


```html
<div data-wp-interactive="myPlugin">
    <!-- Interactivity API zone -->
</div>
```

## API Reference

To take a deep dive in how the API works internally, the list of Directives, and how Store works, click [here](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity/packages-interactivity-api-reference/).

## Docs & Examples

Here you have some more resources to learn/read more about the Interactivity API:

- **[Interactivity API Discussions](https://github.com/WordPress/gutenberg/discussions/52882)**
- [Merge announcement](https://make.wordpress.org/core/2024/02/19/merge-announcement-interactivity-api/)
- [Proposal: The Interactivity API – A better developer experience in building interactive blocks](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/)
- Developer Hours sessions ([Americas](https://www.youtube.com/watch?v=RXNoyP2ZiS8&t=664s) & [APAC/EMEA](https://www.youtube.com/watch?v=6ghbrhyAcvA))
- [wpmovies.dev](http://wpmovies.dev/) demo and its [wp-movies-demo](https://github.com/WordPress/wp-movies-demo) repo

There's a Tracking Issue opened to ease the coordination of the work related to the Interactivity API Docs: **[Documentation for the Interactivity API - Tracking Issue #53296](https://github.com/WordPress/gutenberg/issues/53296)**


## Get Involved

As part of an [Open Source project](https://developer.wordpress.org/block-editor/getting-started/faq/#the-gutenberg-project) participation is encouraged in helping shape this API and its Docs. The [discussions](https://github.com/WordPress/gutenberg/discussions/categories/interactivity-api) and [issues](https://github.com/WordPress/gutenberg/labels/%5BFeature%5D%20Interactivity%20API) in GitHub are the best place to engage.

If you are willing to help with the documentation, please add a comment to [#51928](https://github.com/WordPress/gutenberg/discussions/51928) to coordinate everyone's efforts.


## License

Interactivity API proposal, as part of Gutenberg and the WordPress project is free software, and is released under the terms of the GNU General Public License version 2 or (at your option) any later version. See [LICENSE.md](https://github.com/WordPress/gutenberg/blob/trunk/LICENSE.md) for complete license.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
