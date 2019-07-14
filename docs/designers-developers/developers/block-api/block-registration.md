# Block Registration

## `register_block_type`

* **Type:** `Function`

Every block starts by registering a new block type definition. To register, you use the `registerBlockType` function from the [`wp-blocks` package](/packages/blocks/README.md#registerBlockType). The function takes two arguments, a block `name` and a block configuration object.

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

* **Type:** `Object` [ `{ key: value }` ]

A block requires a few properties to be specified before it can be registered successfully. These are defined through a configuration object, which includes the following:

#### Title

* **Type:** `String`

This is the display title for your block, which can be translated with our translation functions. The block inserter will show this name.

```js
// Our data object
title: __( 'Book' )
```

#### Description (optional)

* **Type:** `String`

This is a short description for your block, which can be translated with our translation functions. This will be shown in the Block Tab in the Settings Sidebar.

```js
description: __( 'Block showing a Book card.' )
```

#### Category

* **Type:** `String` [ common | formatting | layout | widgets | embed ]

Blocks are grouped into categories to help users browse and discover them.

The core provided categories are:
* common
* formatting
* layout
* widgets
* embed

```js
// Assigning to the 'widgets' category
category: 'widgets',
```

Plugins and Themes can also register [custom block categories](/docs/designers-developers/developers/filters/block-filters.md#managing-block-categories).

#### Icon (optional)

* **Type:** `String` | `Object`

An icon property should be specified to make it easier to identify a block. These can be any of [WordPress' Dashicons](https://developer.wordpress.org/resource/dashicons/), or a custom `svg` element.

```js
// Specifying a dashicon for the block
icon: 'book-alt',

// Specifying a custom svg for the block
icon: <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z" /><path d="M19 13H5v-2h14v2z" /></svg>,
```

**Note:** Custom SVG icons are automatically wrapped in the [`wp.components.SVG` component](/packages/components/src/primitives/svg/) to add accessibility attributes (`aria-hidden`, `role`, and `focusable`).

An object can also be passed as icon, in this case, icon, as specified above, should be included in the src property.
Besides src the object can contain background and foreground colors, this colors will appear with the icon
when they are applicable e.g.: in the inserter.

```js

icon: {
	// Specifying a background color to appear with the icon e.g.: in the inserter.
	background: '#7e70af',
	// Specifying a color for the icon (optional: if not set, a readable color will be automatically defined)
	foreground: '#fff',
	// Specifying a dashicon for the block
	src: 'book-alt',
} ,
```

#### Keywords (optional)

* **Type:** `Array`

Sometimes a block could have aliases that help users discover it while searching. For example, an `image` block could also want to be discovered by `photo`. You can do so by providing an array of terms (which can be translated).

```js
// Make it easier to discover a block with keyword aliases.
// These can be localised so your keywords work across locales.
keywords: [ __( 'image' ), __( 'photo' ), __( 'pics' ) ],
```

#### Styles (optional)

* **Type:** `Array`

Block styles can be used to provide alternative styles to block. It works by adding a class name to the block’s wrapper. Using CSS, a theme developer can target the class name for the style variation if it is selected.

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

Plugins and Themes can also register [custom block style](/docs/designers-developers/developers/filters/block-filters.md#block-style-variations) for existing blocks.

#### Attributes (optional)

* **Type:** `Object`

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

* **See: [Attributes](/docs/designers-developers/developers/block-api/block-attributes.md).**

#### Transforms (optional)

* **Type:** `Array`

Transforms provide rules for what a block can be transformed from and what it can be transformed to. A block can be transformed from another block, a shortcode, a regular expression, a file or a raw DOM node.

For example, a Paragraph block can be transformed into a Heading block. This uses the `createBlock` function from the [`wp-blocks` package](/packages/blocks/README.md#createBlock)

{% codetabs %}
{% ES5 %}
```js
transforms: {
    from: [
        {
            type: 'block',
            blocks: [ 'core/paragraph' ],
            transform: function ( attributes ) {
                return createBlock( 'core/heading', {
                    content: attributes.content,
                } );
            },
        },
    ]
},
```
{% ESNext %}
```js
transforms: {
    from: [
        {
            type: 'block',
            blocks: [ 'core/paragraph' ],
            transform: ( { content } ) => {
                return createBlock( 'core/heading', {
                    content,
                } );
            },
        },
    ]
},
```
{% end %}

An existing shortcode can be transformed into its block counterpart.

{% codetabs %}
{% ES5 %}
```js
transforms: {
    from: [
        {
            type: 'shortcode',
            // Shortcode tag can also be an array of shortcode aliases
            tag: 'caption',
            attributes: {
                // An attribute can be source from a tag attribute in the shortcode content
                url: {
                    type: 'string',
                    source: 'attribute',
                    attribute: 'src',
                    selector: 'img',
                },
                // An attribute can be source from the shortcode attributes
                align: {
                    type: 'string',
                    shortcode: function( attributes ) {
                        var align = attributes.named.align ? attributes.named.align : 'alignnone';
                        return align.replace( 'align', '' );
                    },
                },
            },
        },
    ]
},
```
{% ESNext %}
```js
transforms: {
    from: [
        {
            type: 'shortcode',
            // Shortcode tag can also be an array of shortcode aliases
            tag: 'caption',
            attributes: {
                // An attribute can be source from a tag attribute in the shortcode content
                url: {
                    type: 'string',
                    source: 'attribute',
                    attribute: 'src',
                    selector: 'img',
                },
                // An attribute can be source from the shortcode attributes
                align: {
                    type: 'string',
                    shortcode: ( { named: { align = 'alignnone' } } ) => {
                        return align.replace( 'align', '' );
                    },
                },
            },
        },
    ]
},

```
{% end %}

A block can also be transformed into another block type. For example, a Heading block can be transformed into a Paragraph block.

{% codetabs %}
{% ES5 %}
```js
transforms: {
    to: [
        {
            type: 'block',
            blocks: [ 'core/paragraph' ],
            transform: function( attributes ) {
                return createBlock( 'core/paragraph', {
                    content: attributes.content,
                } );
            },
        },
    ],
},
```
{% ESNext %}
```js
transforms: {
    to: [
        {
            type: 'block',
            blocks: [ 'core/paragraph' ],
            transform: ( { content } ) => {
                return createBlock( 'core/paragraph', {
                    content,
                } );
            },
        },
    ],
},
```
{% end %}

In addition to accepting an array of known block types, the `blocks` option also accepts a "wildcard" (`"*"`). This allows for transformations which apply to _all_ block types (eg: all blocks can transform into `core/group`):

{% codetabs %}
{% ES5 %}
```js
transforms: {
    from: [
        {
            type: 'block',
            blocks: [ '*' ], // wildcard - match any block
            transform: function( attributes, innerBlocks ) {
                // transform logic here
            },
        },
    ],
},
```
{% ESNext %}
```js
transforms: {
    from: [
        {
            type: 'block',
            blocks: [ '*' ], // wildcard - match any block
            transform: ( attributes, innerBlocks ) => {
                // transform logic here
            },
        },
    ],
},
```
{% end %}


A block with InnerBlocks can also be transformed from and to another block with InnerBlocks.

{% codetabs %}
{% ES5 %}
```js
transforms: {
    to: [
        {
            type: 'block',
            blocks: [ 'some/block-with-innerblocks' ],
            transform: function( attributes, innerBlocks ) {
                return createBlock( 'some/other-block-with-innerblocks', attributes, innerBlocks );
            },
        },
    ],
},
```
{% ESNext %}
```js
transforms: {
    to: [
        {
            type: 'block',
            blocks: [ 'some/block-with-innerblocks' ],
            transform: ( attributes, innerBlocks ) => {
                return createBlock( 'some/other-block-with-innerblocks', attributes, innerBlocks);
            },
        },
    ],
},
```
{% end %}

An optional `isMatch` function can be specified on a transform object. This provides an opportunity to perform additional checks on whether a transform should be possible. Returning `false` from this function will prevent the transform from being displayed as an option to the user.

{% codetabs %}
{% ES5 %}
```js
transforms: {
    to: [
        {
            type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: function( attributes ) {
				return attributes.isText;
			},
            transform: function( attributes ) {
                return createBlock( 'core/paragraph', {
                    content: attributes.content,
                } );
            },
        },
    ],
},
```
{% ESNext %}
```js
transforms: {
    to: [
        {
            type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { isText } ) => isText,
            transform: ( { content } ) => {
                return createBlock( 'core/paragraph', {
                    content,
                } );
            },
        },
    ],
},
```
{% end %}

To control the priority with which a transform is applied, define a `priority` numeric property on your transform object, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

A file can be dropped into the editor and converted into a block with a matching transform.

{% codetabs %}
{% ES5 %}
```js
transforms: {
	from: [
		{
			type: 'files',
			isMatch: function ( files ) {
				return files.length === 1;
			},
			// We define a lower priority (higher number) than the default of 10. This
			// ensures that the File block is only created as a fallback.
			priority: 15,
			transform: function( files ) {
				var file = files[ 0 ];
				var blobURL = createBlobURL( file );

				// File will be uploaded in componentDidMount()
				return createBlock( 'core/file', {
					href: blobURL,
					fileName: file.name,
					textLinkHref: blobURL,
				} );
			},
		},
	]
}
```
{% ESNext %}
```js
transforms: {
	from: [
		{
			type: 'files',
			isMatch: ( files ) => files.length === 1,
			// We define a lower priority (higher number) than the default of 10. This
			// ensures that the File block is only created as a fallback.
			priority: 15,
			transform: ( files ) => {
				const file = files[ 0 ];
				const blobURL = createBlobURL( file );

				// File will be uploaded in componentDidMount()
				return createBlock( 'core/file', {
					href: blobURL,
					fileName: file.name,
					textLinkHref: blobURL,
				} );
			},
		},
	]
}
```
{% end %}

A prefix transform is a transform that will be applied if the user prefixes some text in e.g. the Paragraph block with a given pattern and a trailing space.

{% codetabs %}
{% ES5 %}
```js
transforms: {
    from: [
        {
            type: 'prefix',
            prefix: '?',
            transform: function( content ) {
                return createBlock( 'my-plugin/question', {
                    content,
                } );
            },
        },
    ]
}
```
{% ESNext %}
```js
transforms: {
    from: [
        {
            type: 'prefix',
            prefix: '?',
            transform( content ) {
                return createBlock( 'my-plugin/question', {
                    content,
                } );
            },
        },
    ]
}
```
{% end %}


#### parent (optional)

* **Type:** `Array`

Blocks are able to be inserted into blocks that use [`InnerBlocks`](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/inner-blocks/README.md) as nested content. Sometimes it is useful to restrict a block so that it is only available as a nested block. For example, you might want to allow an 'Add to Cart' block to only be available within a 'Product' block.

Setting `parent` lets a block require that it is only available when nested within the specified blocks.

```js
// Only allow this block when it is nested in a Columns block
parent: [ 'core/columns' ],
```

#### supports (optional)

*Some [block supports](#supports-optional) — for example, `anchor` or `className` — apply their attributes by adding additional props on the element returned by `save`. This will work automatically for default HTML tag elements (`div`, etc). However, if the return value of your `save` is a custom component element, you will need to ensure that your custom component handles these props in order for the attributes to be persisted.*

* **Type:** `Object`

Optional block extended support features. The following options are supported:

- `align` (default `false`): This property adds block controls which allow to change block's alignment. _Important: It doesn't work with dynamic blocks yet._

```js
// Add the support for block's alignment (left, center, right, wide, full).
align: true,
// Pick which alignment options to display.
align: [ 'left', 'right', 'full' ],
```
When supports align is used the block attributes definition is extended to include an align attribute with a string type.
By default, no alignment is assigned to the block.
The block can apply a default alignment by specifying its own align attribute with a default e.g.:
```
attributes: {
	...
	align: {
		type: 'string',
		default: 'right'
	},
	...
}
```

- `alignWide` (default `true`): This property allows to enable [wide alignment](/docs/designers-developers/developers/themes/theme-support.md#wide-alignment) for your theme. To disable this behavior for a single block, set this flag to `false`.

```js
// Remove the support for wide alignment.
alignWide: false,
```

- `anchor` (default `false`): Anchors let you link directly to a specific block on a page. This property adds a field to define an id for the block and a button to copy the direct link.

```js
// Add the support for an anchor link.
anchor: true,
```

- `customClassName` (default `true`): This property adds a field to define a custom className for the block's wrapper.

```js
// Remove the support for the custom className.
customClassName: false,
```

- `className` (default `true`): By default, the class `.wp-block-your-block-name` is added to the root element of your saved markup. This helps having a consistent mechanism for styling blocks that themes and plugins can rely on. If for whatever reason a class is not desired on the markup, this functionality can be disabled.

```js
// Remove the support for the generated className.
className: false,
```

- `html` (default `true`): By default, a block's markup can be edited individually. To disable this behavior, set `html` to `false`.

```js
// Remove support for an HTML mode.
html: false,
```

- `inserter` (default `true`): By default, all blocks will appear in the inserter. To hide a block so that it can only be inserted programmatically, set `inserter` to `false`.

```js
// Hide this block from the inserter.
inserter: false,
```

- `multiple` (default `true`): A non-multiple block can be inserted into each post, one time only. For example, the built-in 'More' block cannot be inserted again if it already exists in the post being edited. A non-multiple block's icon is automatically dimmed (unclickable) to prevent multiple instances.

```js
// Use the block just once per post
multiple: false,
```

- `reusable` (default `true`): A block may want to disable the ability of being converted into a reusable block.
By default all blocks can be converted to a reusable block. If supports reusable is set to false, the option to convert the block into a reusable block will not appear.

```js
// Don't allow the block to be converted into a reusable block.
reusable: false,
```

