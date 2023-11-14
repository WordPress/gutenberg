# Quick Start Guide

This guide is designed to demonstrate the basic principles of block development in WordPress using a hands-on approach. Following the steps below, you will create a custom block plugin that uses modern JavaScript (ESNext and JSX) in a matter of minutes. The example block displays the copyright symbol (©) and the current year, the perfect addition to any website's footer.

## Scaffold the block plugin

Start by ensuring you have Node.js and `npm` installed on your computer. Review the [Node.js development environment](https://developer.wordpress.org/block-editor/getting-started/devenv/nodejs-development-environment/) guide if not.

Next, use the [`@wordpress/create-block`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) package and the [`@wordpress/create-block-tutorial-template`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block-tutorial-template/) template to scaffold the complete “Copyright Date Block” plugin. 

<div class="callout callout-info">
    <p>You can use <code>create-block</code> to scaffold a block just about anywhere and then use <a href="https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/"><code>wp-env</code></a> inside the generated plugin folder. This will create a local WordPress development environment with your new block plugin installed and activated.</p>
    <p>If you already have your own <a href="https://developer.wordpress.org/block-editor/getting-started/devenv/#local-wordpress-environment">local WordPress development environment</a>, navigate to the <code>plugins/</code> folder using the terminal.</p>
</div>

Choose the folder where you want to create the plugin, and then execute the following command in the terminal from within that folder:

```sh
npx @wordpress/create-block copyright-date-block --template create-block-tutorial-template
```

The `slug` provided (`copyright-date-block`) defines the folder name for the scaffolded plugin and the internal block name.

Navigate to the Plugins page of your local WordPress installation and activate the “Copyright Date Block” plugin. The example block will then be available in the Editor.

## Basic usage

With the plugin activated, you can  explore how the block works. Use the following command to move into the newly created plugin folder and start the development process.

```sh
cd copyright-date-block && npm start
```

When `create-block` scaffolds the block, it installs `wp-scripts` and adds the most common scripts to the block’s `package.json` file. Refer to the [Get started with wp-scripts](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/) article for an introduction to this package.

The `npm start` command will start a development server and watch for changes in the block’s code, rebuilding the block whenever modifications are made. 

When you are finished making changes, run the `npm run build` command. This optimizes the block code and makes it production-ready.

## Additional resources

- [Get started with create-block](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-create-block/)
- [Get started with wp-scripts](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-scripts/)
- [Get started with wp-env](https://developer.wordpress.org/block-editor/getting-started/devenv/get-started-with-wp-env/)