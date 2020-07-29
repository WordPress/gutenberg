# Create a Block Tutorial

Let's get you started creating your first block for the WordPress Block Editor. We will create a simple block that allows the user to type a message and styles it.

The tutorial includes setting up your development environment, tools, and getting comfortable with the new development model. If you are already comfortable, try the quick start below, otherwise step through whatever part of the tutorial you need.

## Prerequisities

The first thing you need is a development enviornment and tools. This includes setting up your WordPress environment, Node, NPM, and your code editor. If you need help, see the [setting up your development environment documentation](/docs/designers-developers/developers/tutorials/devenv/readme.md).

## Quick Start

The `@wordpress/create-block` package exists to create the necessary block scaffolding to get you started. See [create-block package documentation](https://www.npmjs.com/package/@wordpress/create-block) for additional features. This quick start assumes you have a development environment with node installed, and a WordPress site.

From your plugins directory, to create your block run:

```sh
npx @wordpress/create-block starter-block
```

The above command creates a new directory called `starter-block`, installs the necessary files, and builds the block plugin. If you want an interactive mode that prompts you for details, run the command without the `starter-block` name.

You now need to activate the plugin from inside wp-admin plugins page.

After activated, go to the block editor and use the inserter to search and add your new block.

## Table of Contents

The create a block tutorials breaks down to the following sections.

1. [WordPress Plugin](/docs/designers-developers/developers/tutorials/create-block/wp-plugin.md)
2. [Anatomy of a Gutenberg Block ](/docs/designers-developers/developers/tutorials/create-block/block-anatomy.md)
3. [Block Attributes](/docs/designers-developers/developers/tutorials/create-block/block-attributes.md)
4. [Code Implementation](/docs/designers-developers/developers/tutorials/create-block/block-code.md)
5. [Authoring Experience](/docs/designers-developers/developers/tutorials/create-block/author-experience.md)
6. [Finishing Touches](/docs/designers-developers/developers/tutorials/create-block/finishing.md)
