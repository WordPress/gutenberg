# Block Transforms

Block Transforms is the API that allows a block to converted to and from other entities. Existing entities from which blocks can be transformed include blocks, shortshortcodes, files, regular expressions, or raw DOM nodes.

## Transforms: to and from

Under the `transforms` key within the [block configuration](insert link here) you can find the `to` and `from` subkeys representing the list of available transforms for a block.

What happens when a block declares `to`? Is the transform also visible in the other block?

## Transforms Types

### `block`

**Parameters**

- type
- blocks
- transform
- isMatch (optional)
- priority (optional)

**Example**

For example, a Paragraph block can be transformed into a Heading block. This uses the `createBlock` function from the [`wp-blocks` package](/packages/blocks/README.md#createBlock).

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

**Paragraph to Heading**

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

**Blocks that have InnerBlocks**

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

**isMatch**

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

**priority**

To control the priority with which a transform is applied, define a `priority` numeric property on your transform object, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

### `shortcode`

**Parameters**

- type
- tag
- attributes
- isMatch (optional)
- priority (optional)

**Example**

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

**isMatch**

In the case of shortcode transforms, `isMatch` receives shortcode attributes per the [Shortcode API](https://codex.wordpress.org/Shortcode_API):

{% codetabs %}
{% ES5 %}

```js
isMatch: function( attributes ) {
	return attributes.named.id === 'my-id';
},
```

{% ESNext %}

```js
isMatch( { named: { id } } ) {
	return id === 'my-id';
},
```

{% end %}

### `files`

**Parameters**

- type
- transform
- isMatch (optional)
- priority (optional)

**Example**

A file can be dropped into the editor and converted into a block with a matching transform.

{% codetabs %}
{% ES5 %}

```js
transforms: {
	from: [
		{
			type: 'files',
			isMatch: function( files ) {
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
	];
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
	];
}
```

{% end %}

### `prefix`

**Parameters**

- type
- isMatch (optional)
- priority (optional)

**Example**

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
	];
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
	];
}
```

{% end %}

### `raw`

TODO

### `enter`

TODO
