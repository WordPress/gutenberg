# Block API

Blocks are the fundamental element of the Gutenberg editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor. This document covers the main properties of block registration.

## Register Block Type

* **Type:** `Function`

Every block starts by registering a new block type definition. The function `registerBlockType` takes two arguments, a block `name` and a block configuration object.

### Block Name

* **Type:** `String`

The name for a block is a unique string that identifies a block. Names have to be structured as `namespace/block-name`, where namespace is the name of your plugin or theme.

```js
// Registering my block with a unique name
registerBlockType( 'my-plugin/book', {} );
```

*Note:* A block name can only contain lowercase alphanumeric characters and dashes, and must begin with a letter.

*Note:* This name is used on the comment delimiters as `<!-- wp:my-plugin/book -->`. Those blocks provided by core don't include a namespace when serialized.

### Block Configuration

* **Type:** `{ key: value }`

A block requires a few properties to be specified before it can be registered successfully. These are defined through a configuration object, which includes the following:

#### Title

* **Type:** `String`

This is the display title for your block, which can be translated with our translation functions. The block inserter will show this name.

```js
// Our data object
title: 'Book'
```

#### Description (optional)

* **Type:** `String`

This is a short description for your block, which can be translated with our translation functions. This will be shown in the block inspector.

```js
description: 'Block showing a Book card.'
```

#### Category

* **Type:** `String [ common | formatting | layout | widgets | embed ]`

Blocks are grouped into categories to help users browse and discover them. The core provided categories are `common`, `formatting`, `layout`, `widgets`, and `embed`.

```js
// Assigning to the 'layout' category
category: 'widgets',
```

#### Icon (optional)

An icon property should be specified to make it easier to identify a block. These can be any of [WordPress' Dashicons](https://developer.wordpress.org/resource/dashicons/), or a custom `svg` element.

```js
// Specifying a dashicon for the block
icon: 'book-alt',
```

#### Keywords (optional)

Sometimes a block could have aliases that help users discover it while searching. For example, an `image` block could also want to be discovered by `photo`. You can do so by providing an array of terms (which can be translated). It is only allowed to add as much as three terms per block.

```js
// Make it easier to discover a block with keyword aliases
keywords: [ __( 'read' ) ],
```

#### Attributes (optional)

* **Type:** `{ attr: {} }`

Attributes provide the structured data needs of a block. They can exist in different forms when they are serialized, but they are declared together under a common interface.

```js
// Specifying my block attributes
attributes: {
	cover: {
		type: 'string',
		source: 'attribute',
		selector: 'img',
		attribute: 'src',
	},
	author: {
		type: 'string',
		source: 'children',
		selector: '.book-author',
	},
	pages: {
		type: 'number',
	},
},
```

* **See: [Attributes](https://wordpress.org/gutenberg/handbook/reference/attributes/).**

#### Transforms (optional)

Work in progress...

#### useOnce (optional)

* **Type:** `Bool`
* **Default:** `false`

Whether a block can only be used once per post.

```js
// Use the block just once per post
useOnce: true,
```

#### supports (optional)

* **Type:** `Object`

Optional block extended support features. The following options are supported, and should be specified as a boolean `true` or `false` value:

- `anchor` (default `false`): Anchors let you link directly to a specific block on a page. This property adds a field to define an id for the block and a button to copy the direct link.

```js
// Add the support for an anchor link.
anchor: true,
```

- `customClassName` (default `true`): This property adds a field to define a custom className for the block's wrapper.

```js
// Remove the support for a the custom className .
customClassName: false,
```

- `className` (default `true`): By default, Gutenberg adds a class with the form `.wp-block-your-block-name` to the root element of your saved markup. This helps having a consistent mechanism for styling blocks that themes and plugins can rely on. If for whatever reason a class is not desired on the markup, this functionality can be disabled.

```js
// Remove the support for a the generated className .
className: false,
```

- `html` (default `true`): By default, Gutenberg will allow a block's markup to be edited individually. To disable this behavior, set `html` to `false`.

```js
// Remove support for an HTML mode.
html: false,
```

## Edit and Save

The `edit` and `save` functions define the editor interface with which a user would interact, and the markup to be serialized back when a post is saved. They are the heart of how a block operates, so they are [covered separately](https://wordpress.org/gutenberg/handbook/block-edit-save/).
