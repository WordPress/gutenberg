# Registration

Block registration API reference.

<div class="callout callout-alert">
You can use the functions documented on this page to register a block with JavaScript only on the client, but the recommended method is to register new block types also with PHP on the server using the `block.json` metadata file. See <a href="https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/">metadata documentation for complete information</a>
<br/>
<a href="https://developer.wordpress.org/block-editor/getting-started/create-block/">Learn how to create your first block</a> for the WordPress block editor. From setting up your development environment, tools, and getting comfortable with the new development model, this tutorial covers all you need to know to get started with creating blocks.
</div>

## `registerBlockType`

-   **Type:** `Function`

Every block starts by registering a new block type definition. To register, you use the `registerBlockType` function from the [`wp-blocks` package](/packages/blocks/README.md#registerBlockType). The function takes two arguments, a block `name` and a block configuration object.

### Block Name

-   **Type:** `String`

The name for a block is a unique string that identifies a block. Names have to be structured as `namespace/block-name`, where namespace is the name of your plugin or theme.

```js
// Registering my block with a unique name
registerBlockType( 'my-plugin/book', {} );
```

_Note:_ A block name can only contain lowercase alphanumeric characters and dashes, and must begin with a letter.

_Note:_ This name is used on the comment delimiters as `<!-- wp:my-plugin/book -->`. Those blocks provided by core don't include a namespace when serialized.

### Block configuration

-   **Type:** `Object` [ `{ key: value }` ]

A block requires a few properties to be specified before it can be registered successfully. These are defined through a configuration object, which includes the following:

#### title

-   **Type:** `String`

This is the display title for your block, which can be translated with our translation functions. The title will display in the Inserter and in other areas of the editor.

```js
// Our data object
title: __( 'Book' );
```

_Note:_ To keep your block titles readable and accessible in the UI, try to avoid very long titles.

#### description (optional)

-   **Type:** `String`

This is a short description for your block, which can be translated with our translation functions. This will be shown in the Block Tab in the Settings Sidebar.

```js
description: __( 'Block showing a Book card.' );
```

#### category

-   **Type:** `String` [ text | media | design | widgets | theme | embed ]

Blocks are grouped into categories to help users browse and discover them.

The core provided categories are:

-   text
-   media
-   design
-   widgets
-   theme
-   embed

```js
// Assigning to the 'widgets' category
category: 'widgets',
```

Plugins and Themes can also register [custom block categories](/docs/reference-guides/filters/block-filters.md#managing-block-categories).

#### icon (optional)

-   **Type:** `String` | `Object`

An icon property should be specified to make it easier to identify a block. These can be any of [WordPress' Dashicons](https://developer.wordpress.org/resource/dashicons/), or a custom `svg` element.

```js
// Specifying a dashicon for the block
icon: 'book-alt',

// Specifying a custom svg for the block
icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M19 13H5v-2h14v2z" /></svg>,
```

**Note:** Custom SVG icons are automatically wrapped in the [`wp.primitives.SVG` component](/packages/primitives/README.md) to add accessibility attributes (`aria-hidden`, `role`, and `focusable`).

An object can also be passed as icon, in this case, icon, as specified above, should be included in the src property.

Besides src the object can contain background and foreground colors, these colors will appear with the icon when they are applicable e.g.: in the inserter.

```js
icon: {
	// Specifying a background color to appear with the icon e.g.: in the inserter.
	background: '#7e70af',
	// Specifying a color for the icon (optional: if not set, a readable color will be automatically defined)
	foreground: '#fff',
	// Specifying an icon for the block
	src: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M19 13H5v-2h14v2z" /></svg>,
} ,
```

#### keywords (optional)

-   **Type:** `Array`

Sometimes a block could have aliases that help users discover it while searching. For example, an `image` block could also want to be discovered by `photo`. You can do so by providing an array of terms (which can be translated).

```js
// Make it easier to discover a block with keyword aliases.
// These can be localised so your keywords work across locales.
keywords: [ __( 'image' ), __( 'photo' ), __( 'pics' ) ],
```

#### styles (optional)

-   **Type:** `Array`

Block styles can be used to provide alternative styles to block. It works by adding a class name to the block’s wrapper. Using CSS, a theme developer can target the class name for the block style if it is selected.

```js
// Register block styles.
styles: [
	// Mark style as default.
	{
		name: 'default',
		label: __( 'Rounded' ),
		isDefault: true
	},
	{
		name: 'outline',
		label: __( 'Outline' )
	},
	{
		name: 'squared',
		label: __( 'Squared' )
	},
],
```

Plugins and Themes can also register [custom block styles](/docs/reference-guides/block-api/block-styles.md) for existing blocks.

#### attributes (optional)

-   **Type:** `Object`

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
		source: 'html',
		selector: '.book-author',
	},
	pages: {
		type: 'number',
	},
},
```

-   **See: [Attributes](/docs/reference-guides/block-api/block-attributes.md).**

#### example (optional)

-   **Type:** `Object`

Example provides structured example data for the block. This data is used to construct a preview for the block to be shown in the Inspector Help Panel when the user mouses over the block and in the Styles panel when the block is selected.

The data provided in the example object should match the attributes defined. For example:

```js
example: {
	attributes: {
		cover: 'https://example.com/image.jpg',
		author: 'William Shakespeare',
		pages: 500
	},
},
```

If `example` is not defined, the preview will not be shown. So even if no attributes are defined, setting an empty example object `example: {}` will trigger the preview to show.

It's also possible to extend the block preview with inner blocks via `innerBlocks`. For example:

```js
example: {
	attributes: {
		cover: 'https://example.com/image.jpg',
	},
	innerBlocks: [
		{
			name: 'core/paragraph',
			attributes: {
				/* translators: example text. */
				content: __(
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent et eros eu felis.'
				),
			},
		},
	],
},
```

It's also possible to define the width of the preview container in pixels via `viewportWidth`. For example:

```js
example: {
	attributes: {
		cover: 'https://example.com/image.jpg',
	},
	viewportWidth: 800
},
```

#### variations (optional)

-   **Type:** `Object[]`
-   **Since**: `WordPress 5.9.0`

Similarly to how the block's styles can be declared, a block type can define block variations that the user can pick from. The difference is that, rather than changing only the visual appearance, this field provides a way to apply initial custom attributes and inner blocks at the time when a block is inserted. See the [Block Variations API](/docs/reference-guides/block-api/block-variations.md) for more details.

#### supports (optional)

-   **_Type:_** `Object`

Supports contains a set of options to control features used in the editor. See [the `supports` documentation](/docs/reference-guides/block-api/block-supports.md) for more details.

#### transforms (optional)

-   **Type:** `Object`

Transforms provide rules for what a block can be transformed from and what it can be transformed to. A block can be transformed from another block, a shortcode, a regular expression, a file, or a raw DOM node. Take a look at the [Block Transforms API](/docs/reference-guides/block-api/block-transforms.md) for more info about each available transformation.

#### parent (optional)

-   **Type:** `Array`

Blocks are able to be inserted into blocks that use [`InnerBlocks`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md) as nested content. Sometimes it is useful to restrict a block so that it is only available as a nested block. For example, you might want to allow an 'Add to Cart' block to only be available within a 'Product' block.

Setting `parent` lets a block require that it is only available when nested within the specified blocks.

```js
// Only allow this block when it is nested in a Columns block
parent: [ 'core/columns' ],
```

#### ancestor (optional)

-   **Type:** `Array`
-   **Since**: `WordPress 6.0.0`

The `ancestor` property makes a block available inside the specified block types at any position of the ancestor block subtree. That allows, for example, to place a 'Comment Content' block inside a 'Column' block, as long as 'Column' is somewhere within a 'Comment Template' block. In comparison to the `parent` property, blocks that specify their `ancestor` can be placed anywhere in the subtree whilst blocks with a specified `parent` need to be direct children.

```js
// Only allow this block when it is nested at any level in a Columns block.
ancestor: [ 'core/columns' ],
```

#### allowedBlocks (optional)

-   **Type:** `Array`
-   **Since**: `WordPress 6.5.0`

Setting the `allowedBlocks` property will limit which block types can be nested as direct children of the block.

```js
// Only allow the Columns block to be nested as direct child of this block
allowedBlocks: [ 'core/columns' ],
```

#### blockHooks (optional)

-   **Type:** `Object`
-   **Since**: `WordPress 6.4.0`

Block Hooks is an API that allows a block to automatically insert itself next to all instances of a given block type, in a relative position also specified by the "hooked" block. That is, a block can opt to be inserted before or after a given block type, or as its first or last child (i.e. to be prepended or appended to the list of its child blocks, respectively). Hooked blocks will appear both on the frontend and in the editor (to allow for customization by the user).

The key is the name of the block (`string`) to hook into, and the value is the position to hook into (`string`). Allowed target values are:

-   `before` – inject before the target block.
-   `after` - inject after the target block.
-   `firstChild` - inject before the first inner block of the target container block.
-   `lastChild` - inject after the last inner block of the target container block.

```js
{
	blockHooks: {
		'core/verse': 'before',
		'core/spacer': 'after',
		'core/column': 'firstChild',
		'core/group': 'lastChild',
	}
}
```

It’s crucial to emphasize that the Block Hooks feature is only designed to work with _static_ block-based templates, template parts, and patterns. For patterns, this includes those provided by the theme, from [Block Pattern Directory](https://wordpress.org/patterns/), or from calls to [`register_block_pattern`](https://developer.wordpress.org/reference/functions/register_block_pattern/).

Block Hooks will not work with post content or patterns crafted by the user, such as synced patterns, or theme templates and template parts that have been modified by the user.

## Block collections

## `registerBlockCollection`

-   **Type:** `Function`

Blocks can be added to collections, grouping together all blocks from the same origin

`registerBlockCollection` takes two parameters, `namespace` and an object of settings including `title` and `icon`.

### Namespace

-   **Type:** `String`

This should match the namespace declared in the block name; the name of your plugin or theme.

### Settings

#### Title

-   **Type:** `String`

This will display in the block inserter section, which will list all blocks in this collection.

#### Icon

-   **Type:** `Object`

(Optional) An icon to display alongside the title in the block inserter.

```js
// Registering a block collection
registerBlockCollection( 'my-plugin', { title: 'My Plugin' } );
```
