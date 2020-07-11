# Create Block Tutorial

Let's get you started creating your first block for the WordPress Block Editor. We will create a simple block that allows the user to type a message and styles it.

The tutorial includes setting up your development environment, tools, and getting comfortable with the new development model. If you are already comfortable, try the quick start below, otherwise step through whatever part of the tutorial you need.

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

1. [Development Environment](devenv.md)
2. [WordPress Plugin](wp-plugin.md)
3. [Anatomy of a Block](block-anatomy.md)
4. [Block Attributes](block-attributes.md)
5. [Code Implementation](block-code.md)
6. [Authoring Experience](author-experience.md)
7. [Finishing Touches](finishing.md)
