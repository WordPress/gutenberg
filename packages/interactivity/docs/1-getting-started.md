# Getting started with the Interactivity API

To get started with the Interactivity API, you can follow this [**Quick Start Guide**](#quick-start-guide) by taking into account the [current requirements of the Interactivity API](#requirements-of-the-interactivity-api) (especially the need for Gutenberg 16.2 or later).

## Table of Contents

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

## Quick Start Guide

#### 1. Scaffold an interactive block

We can scaffold a WordPress plugin that registers an interactive block (using the Interactivity API) by using a [template](https://www.npmjs.com/package/@wordpress/create-block-interactive-template) with the `@wordpress/create-block` command.

```
npx @wordpress/create-block my-first-interactive-block --template @wordpress/create-block-interactive-template
```

#### 2. Generate the build 

When the plugin folder is generated, we should launch the build process to get the final version of the interactive block that can be used from WordPress. 

```
cd my-first-interactive-block && npm start
```

#### 3. Use it in your WordPress installation 

If you have a local WordPress installation already running, you can launch the commands above inside the `plugins` folder of that installation. If not, you can use [`wp-now`](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) to launch a WordPress site with the plugin installed by executing from the generated folder (and from a different terminal window or tab) the following command

```
npx @wp-now/wp-now start 
```

At this point you should be able to insert the "My First Interactive Block" block into any post, and see how it behaves in the frontend when published. 

> **Note**
> We recommend you to also check the [API Reference](./2-api-reference.md) docs for your first exploration of the Interactivity API

## Requirements of the Interactivity API

To start working with the Interactivity API you'll need to have a [proper WordPress development environment for blocks](https://developer.wordpress.org/block-editor/getting-started/devenv/)  and some specific code in your block, which should include:

#### A local WordPress installation

You can use [the tools to set your local WordPress environment](https://developer.wordpress.org/block-editor/getting-started/devenv/#wordpress-development-site) you feel more comfortable with. 

To get quickly started, [`wp-now`](https://www.npmjs.com/package/@wp-now/wp-now) is the easiest way to get a WordPress site up and running locally. 

#### Latest vesion of Gutenberg

The Interactivity API is currently only available as an experimental feature from Gutenberg 16.2, so you'll need to have Gutenberg 16.2 or higher version installed and activated in your WordPress installation.

#### Node.js

Block development requires [Node](https://nodejs.org/en), so you'll need to have Node installed and running on your machine. Any version modern should work, but please check the minimum version requirements if you run into any issues with any of the Node.js tools used in WordPress development.

#### Code requirements 

##### Add `interactivity` support to `block.json`

To indicate that our block [supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) the Interactivity API features, we do so by adding `"interactivity": true` to the `supports` attribute of our block's `block.json`

```
"supports": {
    "interactivity": true
},
```

##### Add `wp-interactive` directive to a DOM element

To "activate" the Interactivity API in a DOM element (and its children) we add the [`wp-interactive` directive](./2-api-reference.md#wp-interactive) to it from our `render.php` or `save.js`


```html
<div data-wp-interactive>
    <!-- Interactivity API zone -->
</div>
```