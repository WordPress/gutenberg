# Getting started with the Interactivity API

To get started with the Interactivity API, you can follow this [**Quick Start Guide**](#) by taking into account the [current requirements of the Interactivity API](#) (especially the need for Gutenberg 16.2 or superior).

## Quick Start Guide

### 1. Scaffold an interactive block

We can scaffold a WordPress plugin that registers an interactive block (using the Interactivity API) by using a [template](https://www.npmjs.com/package/@wordpress/create-block-interactive-template) with the `@wordpress/create-block` command.

```
npx @wordpress/create-block my-first-interactive-block --template @wordpress/create-block-interactive-template
```

### 2. Generate the build 

When the plugin folder is generated, we should launch the build process to get the final version of the interactive block that can be used from WordPress. 

```
cd my-first-interactive-block && npm start
```

### 3. Use it in your WordPress installation 

If you have a local WordPress installation already running, you can launch the commands above inside the `plugins` folder of that installation. If not, you can use [`wp-now`](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) to launch a WordPress site with the plugin installed by executing from the generated folder (and from a different terminal window or tab) the following command

```
npx @wp-now/wp-now start 
```

At this point you should be able to insert the "Example Interactive" block into any post, and see how it behaves in the frontent when published. 

## Requirements of the Interactivity API

To start working with the Interactivity API you'll need to have a [proper WordPress development environment for blocks](https://developer.wordpress.org/block-editor/getting-started/devenv/) which should include:

- A local WordPress installation
- Gutenberg 16.2 or superior
- Node v14

### A local WordPress installation

You can use [the tools to set your local WordPress environment](https://developer.wordpress.org/block-editor/getting-started/devenv/#wordpress-development-site) you feel more comfortable with. 

To get quickly started, [`wp-now`](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) is the easiest way to get a WordPress site up and running locally. 

### Gutenberg 16.2 or superior

The Interactivity API is currently only available as an experimental feature from Gutenberg 16.2, so you'll need to have the Gutenberg plugin with this version or a superior one, installed and activated in your WordPress installation.

### Node v14

Block development requires Node, so you also need to ensure you have [the proper version of Node](https://developer.wordpress.org/block-editor/getting-started/devenv/#node-development-tools) installed and running on your machine