# Block Transforms

Block Transforms is the API that allows a block to be transformed _from_ and _to_ other entities. Existing entities that work with this API include blocks, shortshortcodes, files, regular expressions, or raw DOM nodes.

## Transform direction: `to` and `from`

A block declares which transformations it supports via the optional `transforms` key of the block configuration, whose subkeys `to` and `from` hold an array of available transforms for every direction. Example:

```js
export const settings = {
	title: 'My Block Title',
	description: 'My block description',
	/* ... */
	transforms: {
		from: [ /* supported from transforms */ ],
		to: [ /* supported to transforms */ ],
	}
}
```

## Transformations Types

This section goes through the existing types of transformations available.

### Type `block`

A transformation of type `block` is an object that takes the following parameters:

- **type** _(string)_: the value `block`.
- **blocks** _(array)_: a list of known block types. It also accepts the wildcard (`"*"`), meaning that the transform is available to _all_ block types (eg: all blocks can transform into `core/group`).
- **transform** _(function)_: the function that holds the transform behavior.
- **isMatch** _(function, optional)_: a predicate that allows performing additional checks on whether a transform should be possible. Returning `false` from this function will prevent the transform from being displayed as an option to the user.
- **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from Paragraph to Heading**

To declare this transformation we add the following transform into the heading block configuration, which uses the `createBlock` function from the [`wp-blocks` package](/packages/blocks/README.md#createBlock).

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

**Example: blocks that have InnerBlocks**

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

### Type `shortcode`

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

### Type `files`

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

### Type `prefix`

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

### Type `raw`

TODO

### Type `enter`

TODO
