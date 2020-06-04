
# Create Block Tutorial

The goal of this tutorial is to get you started creating your first block for the WordPress Block Editor. We will create a simple block that allows the user to type a message and styles it.

The tutorial includes setting up your development environment, tools, and getting comfortable with the new development model. If you are already comfortable, try the quick start below, otherwise step through whatever part of the tutorial you need.

## Quick Start

The `@wordpress/create-block` package exists to create the necessary block scaffolding to get you started. See [create-block package documentation](https://www.npmjs.com/package/@wordpress/create-block) for additional features. This quick start assumes you have a development environment with node installed, and a WordPress site. From your plugins directory, to create your block run:

```bash
npx @wordpress/create-block starter-block
cd starter-block
npm run build
```

The above commands create a new directory called `starter-block`, installs the necessary files and builds the block plugin.

If you ran from within your WordPress sites plugin directory, you can add and activate it from your WordPress site. After activated, go to the block editor and use the inserter to search and add your new block.

## Table of Contents

1. [Development Environment](devenv.md)
2. [WordPress Plugin](wp-plugin.md)
3. [ESNext Syntax](esnext-js.md)
4. [Block Anatomy ](block-anatomy.md)
5. [Block Attributes & Data](block-attributes.md)
6. [Block Code](block-code.md)
7. [Author Experience](author-experience.md)
8. [Finishing Touches](finishing.md)
