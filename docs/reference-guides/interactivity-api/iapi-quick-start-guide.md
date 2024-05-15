# Quick start guide

This guide will help you build a basic block that demonstrates the Interactivity API in WordPress.

## Scaffold an interactive block

Start by ensuring you have Node.js and `npm` installed on your computer. Review the [Node.js development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/nodejs-development-environment/) guide if not.

Next, use the [`@wordpress/create-block`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) package and the [`@wordpress/create-block-interactive-template`](https://www.npmjs.com/package/@wordpress/create-block-interactive-template) template to scaffold the complete “My First Interactive Block” plugin.

Choose the folder where you want to create the plugin, and then execute the following command in the terminal from within that folder:

```
npx @wordpress/create-block@latest my-first-interactive-block --template @wordpress/create-block-interactive-template
```

The slug provided (`my-first-interactive-block`) defines the folder name for the scaffolded plugin and the internal block name.

## Basic usage

With the plugin activated, you can explore how the block works. Use the following command to move into the newly created plugin folder and start the development process.

```
cd my-first-interactive-block && npm start
```

When `create-block` scaffolds the block, it installs `wp-scripts` and adds the most common scripts to the block’s `package.json` file. Refer to the [Get started with wp-scripts](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/) article for an introduction to this package.

The `npm start` command will start a development server and watch for changes in the block’s code, rebuilding the block whenever modifications are made.

When you are finished making changes, run the `npm run build` command. This optimizes the block code and makes it production-ready.

## View the block in action

If you have a local WordPress installation already running, you can launch the commands above inside the `plugins` folder of that installation. If not, you can use [`wp-now`](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) to launch a WordPress site with the plugin installed by executing the following command from the plugin's folder (`my-first-interactive-block`).

```
npx @wp-now/wp-now start
```

You should be able to insert the "My First Interactive Block" block into any post and see how it behaves in the front end when published.
