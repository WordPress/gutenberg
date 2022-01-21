# Create a basic block

This guide takes you through creating a basic block to display a message in a post. This message will be fixed, we won't allow the user to edit the message, the goal of the guide is to show how to register and load a block.

## Overview

There are two main types of blocks: static and dynamic, this guide focuses on static blocks. A static block is used to insert HTML content into the post and save it with the post. A dynamic block builds the content on the fly when rendered on the front end, see the [dynamic blocks guide](/docs/how-to-guides/block-tutorial/creating-dynamic-blocks.md).

This guide focuses on just the block, see the [Create a Block tutorial](/docs/getting-started/create-block/README.md) for a complete setup.

## Before you start

Static blocks are implemented in JavaScript, so a basic level of JavaScript is helpful, see the [Getting Started with JavaScript](/docs/how-to-guides/javascript/README.md) for a refresher.

Blocks are added to WordPress using plugins, so you will need:

-   WordPress development environment, see [setup guide](/docs/getting-started/devenv/README.md)
-   JavaScript build tools (node/npm) if using JSX example

## Step-by-step guide

### Step 1: Configure block.json

The functions of a static block is defined in JavaScript, however the settings and other metadata should be defined in a block.json file.

Here are the basic settings:

-   `apiVersion`: Block API version
-   `title`: Block title shown in inserter
-   `name`: Unique name defines your block
-   `category`: Category in inserter (text, media, design, widgets, theme, embed)
-   `icon`: Dashicon icon displayed for block
-   `editorScript`: JavaScript file to load for block

The `block.json` file should be added to your plugin. To start a new plugin, create a directory in `/wp-content/plugins/` in your WordPress.

Create a basic `block.json` file there:

{% codetabs %}
{% JSX %}

```json
{
	"apiVersion": 2,
	"name": "gutenberg-examples/example-01-basic-esnext",
	"title": "Example: Basic (ESNext)",
	"icon": "universal-access-alt",
	"category": "layout",
	"editorScript": "file:./build/index.js"
}
```

{% Plain %}

```json
{
	"apiVersion": 2,
	"title": "Example: Basic",
	"name": "gutenberg-examples/example-01-basic",
	"category": "layout",
	"icon": "universal-access-alt",
	"editorScript": "file:./block.js"
}
```

{% end %}

### Step 2: Register block in plugin

With the `block.json` in place, the registration for the block is a single function call in PHP, this will setup the block and JavaScript file specified in the `editorScript` property to load in the editor.

Create a full plugin file, `index.php` like the following, the same PHP code works for both JSX and Plain code.

```php
<?php
/**
 * Plugin Name: Gutenberg examples 01
 */
function gutenberg_examples_01_register_block() {
	register_block_type( __DIR__ );
}
add_action( 'init', 'gutenberg_examples_01_register_block' );
```

### Step 3: Block edit and save functions

The `editorScript` entry is enqueued automatically in the block editor. This file contains the JavaScript portion of the block registration and defines two important functions for the block, the `edit` and `save` functions.

The `edit` function is a component that is shown in the editor when the block is inserted.

The `save` function is a component that defines the final markup returned by the block and saved in `post_content`.

{% codetabs %}
{% JSX %}

Add the following in `src/index.js`

```jsx
/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

// Register the block
registerBlockType( 'gutenberg-examples/example-01-basic-esnext', {
	edit: function () {
		return <p> Hello world (from the editor)</p>;
	},
	save: function () {
		return <p> Hola mundo (from the frontend) </p>;
	},
} );
```

{% Plain %}

Add the following to `block.js`

```js
( function ( blocks, element ) {
	var el = element.createElement;

	blocks.registerBlockType( 'gutenberg-examples/example-01-basic', {
		edit: function () {
			return el( 'p', {}, 'Hello World (from the editor).' );
		},
		save: function () {
			return el( 'p', {}, 'Hola mundo (from the frontend).' );
		},
	} );
} )( window.wp.blocks, window.wp.element );
```

{% end %}

NOTE: If using the JSX version, you need to run `pnpm build` and it will create the JavaScript file that is loaded in the editor at `build/index.js`

### Step 4: Confirm

Open your editor and try adding your new block. It will show in the inserter using the `title`.
When inserted you will see the `Hello World (from the editor)` message.

When you save the post and view it published, you will see the `Hola mundo (from the frontend)` message.

**Troubleshooting** - If you run into any issues, here are a few things to try:

-   Check the filenames are correct and loading properly,
-   Check the developer console in your browser for errors,
-   If using JSX remember to build after each change

## Conclusion

This shows the most basic static block. The [gutenberg-examples](https://github.com/WordPress/gutenberg-examples) repository has complete examples for both.

-   [Basic example with JSX build](https://github.com/WordPress/gutenberg-examples/tree/trunk/01-basic-esnext)

-   [Basic example plain JavaScript](https://github.com/WordPress/gutenberg-examples/tree/trunk/01-basic),

**NOTE:** The examples include a more complete block setup with translation features included, it is recommended to follow those examples for a production block. The internationalization features were left out of this guide for simplicity and focusing on the very basics of a block.

### Additional

A couple of things to note when creating your blocks:

-   A block name must be prefixed with a namespace specific to your plugin. This helps prevent conflicts when more than one plugin registers a block with the same name. In this example, the namespace is `gutenberg-examples`.

-   Block names _must_ include only lowercase alphanumeric characters or dashes and start with a letter. Example: `my-plugin/my-custom-block`.

### Resources

-   block.json [metadata reference](/docs/reference-guides/block-api/block-metadata.md) documentation

-   Block [edit and save function reference](/docs/reference-guides/block-api/block-edit-save.md)

-   [Dashicons icon set](https://developer.wordpress.org/resource/dashicons/)
