---
sidebar_position: 1
---

# Your first block type

In addition to the built-in block types, Gutenberg offers a flexible API to build any kind of block type you can imagine.

The `registerBlockType` function registers the block we are going to create and specifies the block type settings.

```js
import { createElement } from 'react';
import { registerBlockType } from '@wordpress/blocks';

registerBlockType( 'create-block/gutenpride', {
	// This is just a flag that tells the block editor that this block
	// is using the API version 3 (the latest block type API).
	apiVersion: 3,

	// This is the display title for your block type.
	title: 'Gutenpride',

	// This is the category this block type will be listed in.
	// Default categories include: text, media, design, widgets, theme and embed.
	category: 'widgets',

	// This is a short description for your block type.
	// It will be shown in various places in the Gutenberg user interface.
	description: 'Example static block scaffolded with Create Block tool.',

	// This is an icon for your block type.
	icon: (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path d="M16.7 7.1l-6.3 8.5-3.3-2.5-.9 1.2 4.5 3.4L17.9 8z" />
		</svg>
	),

	edit() {
		return <p>Hello from the editor!</p>;
	},

	save() {
		return <p>Hello from the saved content!</p>;
	},
} );
```

The first parameter in the **registerBlockType** function is the block name. It's composed of two segments: a namespace and a specific name. The namespace is used to avoid collisions with other block types from different sources. The specific name is the name of the block type. The namespace and the specific name are separated by a slash.

The second parameter to the function is the block type object. Two common object properties are **edit** and **save** — these are the key parts of a block.

The result of the edit function is what the editor will render to the editor page when the block is inserted.

The result of the save function is what the editor will produce as HTML when calling the `serialize` function.

The `create-block/gutenpride` block type produces a static block at the moment, in the following sections of the tutorial, we will see how to make it editable.
