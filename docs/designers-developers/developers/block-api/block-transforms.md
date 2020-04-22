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
- **transform** _(function)_: a callback that receives the attributes and inner blocks of the block being processed to operate on it.
- **isMatch** _(function, optional)_: a callback that receives the block attributes and should return a boolean. Returning `false` from this function will prevent the transform from being displayed as an option to the user.
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

A transformation of type `shortcode` is an object that takes the following parameters:

- **type** _(string)_: the value `shortcode`.
- **tag** _(string|array)_: the shortcode tag or list of shortcode aliases this transform can work with.
- **attributes** _(object)_: object representing where the block attributes should be sourced from.
- **isMatch** _(function, optional)_: a callback that receives the shortcode attributes per the [Shortcode API](https://codex.wordpress.org/Shortcode_API) and should return a boolean. Returning `false` from this function will prevent the transform from being displayed as an option to the user.
- **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from shortcode to block**

An existing shortcode can be transformed into its block counterpart.

{% codetabs %}
{% ES5 %}

```js
transforms: {
    from: [
        {
            type: 'shortcode',
            tag: 'caption',
            attributes: {
                url: {
                    type: 'string',
                    source: 'attribute',
                    attribute: 'src',
                    selector: 'img',
                },
                align: {
                    type: 'string',
                    shortcode: function( attributes ) {
                        var align = attributes.named.align ? attributes.named.align : 'alignnone';
                        return align.replace( 'align', '' );
                    },
                },
            },
            isMatch: function( attributes ) {
                return attributes.named.id === 'my-id';
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
            tag: 'caption',
            attributes: {
                url: {
                    type: 'string',
                    source: 'attribute',
                    attribute: 'src',
                    selector: 'img',
                },
                align: {
                    type: 'string',
                    shortcode: ( { named: { align = 'alignnone' } } ) => {
                        return align.replace( 'align', '' );
                    },
                },
            },
            isMatch( { named: { id } } ) {
                return id === 'my-id';
            },
        },
    ]
},
```

{% end %}

### Type `files`

A transformation of type `files` is an object that takes the following parameters:

- **type** _(string)_: the value `files`.
- **transform** _(function)_: a callback that receives the array of files being processed to operate on them.
- **isMatch** _(function, optional)_: a callback that receives the array of files being processed and should return a boolean. Returning `false` from this function will prevent the transform from being displayed as an option to the user.
- **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from file to block**

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
			// By defining a lower priority than the default of 10,
			// we make that the File block to be created as a fallback,
			// if no other transform is found.
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
			// By defining a lower priority than the default of 10,
			// we make that the File block to be created as a fallback,
			// if no other transform is found.
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

A prefix transform is a transform that will be applied if the user prefixes some text in e.g. the Paragraph block with a given pattern and a trailing space.

A transformation of type `prefix` is an object that takes the following parameters:

- **type** _(string)_: the value `files`.
- **prefix** _(string)_: the character or sequence of characters that match this transfrom.
- **transform** _(function)_: a callback that receives the content introduced to operate on it.
- **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from text to block**

We want to create a block the user types the question mark.

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

A transformation of type `raw` is an object that takes the following parameters:

- **type** _(string)_: the value `raw`.
- **schema** _(object|function, optional)_: TODO.
- **transform** _(function, optional)_: a callback that receives the node being processed to operate on it.
- **selector** _(string, optional)_: a CSS selector string to determine whether the element matches according to the [element.matches](https://developer.mozilla.org/en-US/docs/Web/API/Element/matches) method. The transform won't be executed if the element doesn't match. This is an alternative to using `isMatch`, which, if present, will take precedence.
- **isMatch** _(function, optional)_: a callback that receives the node being processed and should return a boolean. Returning `false` from this function will prevent the transform from being displayed as an option to the user.
- **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

### Type `enter`

A transformation of type `enter` is an object that takes the following parameters:

- **type** _(string)_: the value `enter`.
- **regExp** _(RegExp)_: the Regular Expression to use as a matcher. If the value matches, the transformation will be applied.
- **transform** _(function)_: a callback that receives the value to operate on it.
- **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.
