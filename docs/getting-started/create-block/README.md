# Create a Block Tutorial

Let's get you started creating your first block for the WordPress Block Editor. We will create a simple block that allows the user to type a message and style it.

The tutorial includes setting up your development environment, tools, and getting comfortable with the new development model. If you are already comfortable, try the quick start below, otherwise step through whatever part of the tutorial you need.

## Prerequisites

The first thing you need is a development environment and tools. This includes setting up your WordPress environment, Node, NPM, and your code editor. If you need help, see the [setting up your development environment documentation](/docs/getting-started/devenv/README.md).

## Quick Start

The `@wordpress/create-block` package exists to create the necessary block scaffolding to get you started. See [create-block package documentation](https://www.npmjs.com/package/@wordpress/create-block) for additional features. This quick start assumes you have a development environment with node installed, and a WordPress site.

From your plugins directory, to create your block run:

```sh
npx @wordpress/create-block gutenpride
```

The [npx command](https://docs.npmjs.com/cli/v8/commands/npx) runs a command from a remote package, in this case our create-block package that will create a new directory called `gutenpride`, installs the necessary files, and builds the block plugin. If you want an interactive mode that prompts you for details, run the command without the `gutenpride` name.

You now need to activate the plugin from inside wp-admin plugins page.

After activated, go to the block editor and use the inserter to search and add your new block.

## Table of Contents

The create a block tutorials breaks down to the following sections.

1. [WordPress Plugin](/docs/getting-started/create-block/wp-plugin.md)
2. [Anatomy of a Gutenberg Block ](/docs/getting-started/create-block/block-anatomy.md)
3. [Block Attributes](/docs/getting-started/create-block/attributes.md)
4. [Code Implementation](/docs/getting-started/create-block/block-code.md)
5. [Authoring Experience](/docs/getting-started/create-block/author-experience.md)
6. [Finishing Touches](/docs/getting-started/create-block/finishing.md)
7. [Share your Block with the World](/docs/getting-started/create-block/submitting-to-block-directory.md)
