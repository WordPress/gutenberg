# Transforms

Block Transforms is the API that allows a block to be transformed _from_ and _to_ other blocks, as well as _from_ other entities. Existing entities that work with this API include shortcodes, files, regular expressions, and raw DOM nodes.

## Transform direction: `to` and `from`

A block declares which transformations it supports via the optional `transforms` key of the block configuration, whose subkeys `to` and `from` hold an array of available transforms for every direction. Example:

```js
export const settings = {
	title: 'My Block Title',
	description: 'My block description',
	/* ... */
	transforms: {
		from: [
			/* supported from transforms */
		],
		to: [
			/* supported to transforms */
		],
	},
};
```

## Transformations Types

This section goes through the existing types of transformations blocks support:

-   block
-   enter
-   files
-   prefix
-   raw
-   shortcode

### Block

This type of transformations support both _from_ and _to_ directions, allowing blocks to be converted into a different one. It has a corresponding UI control within the block toolbar.

A transformation of type `block` is an object that takes the following parameters:

-   **type** _(string)_: the value `block`.
-   **blocks** _(array)_: a list of known block types. It also accepts the wildcard value (`"*"`), meaning that the transform is available to _all_ block types (eg: all blocks can transform into `core/group`).
-   **transform** _(function)_: a callback that receives the attributes and inner blocks of the block being processed. It should return a block object or an array of block objects.
-   **isMatch** _(function, optional)_: a callback that receives the block attributes as the first argument and the block object as the second argument and should return a boolean. Returning `false` from this function will prevent the transform from being available and displayed as an option to the user.
-   **isMultiBlock** _(boolean, optional)_: whether the transformation can be applied when multiple blocks are selected. If true, the `transform` function's first parameter will be an array containing each selected block's attributes, and the second an array of each selected block's inner blocks. False by default.
-   **priority** _(number, optional)_: controls the priority with which a transformation is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from Paragraph block to Heading block**

To declare this transformation we add the following code into the heading block configuration, which uses the `createBlock` function from the [`wp-blocks` package](/packages/blocks/README.md#createBlock).

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

**Example: blocks that have InnerBlocks**

A block with InnerBlocks can also be transformed from and to another block with InnerBlocks.

```js
transforms: {
    to: [
        {
            type: 'block',
            blocks: [ 'some/block-with-innerblocks' ],
            transform: ( attributes, innerBlocks ) => {
                return createBlock(
                    'some/other-block-with-innerblocks',
                    attributes,
                    innerBlocks
                );
            },
        },
    ],
},
```

### Enter

This type of transformations support the _from_ direction, allowing blocks to be created from some content introduced by the user. They're applied in a new block line after the user has introduced some content and hit the ENTER key.

A transformation of type `enter` is an object that takes the following parameters:

-   **type** _(string)_: the value `enter`.
-   **regExp** _(RegExp)_: the Regular Expression to use as a matcher. If the value matches, the transformation will be applied.
-   **transform** _(function)_: a callback that receives the value that has been entered. It should return a block object or an array of block objects.
-   **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from --- to Separator block**

To create a separator block when the user types the hypen three times and then hits the ENTER key we can use the following code:

```js
transforms = {
	from: [
		{
			type: 'enter',
			regExp: /^-{3,}$/,
			transform: () => createBlock( 'core/separator' ),
		},
	],
};
```

### Files

This type of transformations support the _from_ direction, allowing blocks to be created from files dropped into the editor.

A transformation of type `files` is an object that takes the following parameters:

-   **type** _(string)_: the value `files`.
-   **transform** _(function)_: a callback that receives the array of files being processed. It should return a block object or an array of block objects.
-   **isMatch** _(function, optional)_: a callback that receives the array of files being processed and should return a boolean. Returning `false` from this function will prevent the transform from being applied.
-   **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from file to File block**

To create a File block when the user drops a file into the editor we can use the following code:

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

### Prefix

This type of transformations support the _from_ direction, allowing blocks to be created from some text typed by the user. They're applied when, in a new block line, the user types some text and then adds a trailing space.

A transformation of type `prefix` is an object that takes the following parameters:

-   **type** _(string)_: the value `prefix`.
-   **prefix** _(string)_: the character or sequence of characters that match this transfrom.
-   **transform** _(function)_: a callback that receives the content introduced. It should return a block object or an array of block objects.
-   **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from text to custom block**

If we want to create a custom block when the user types the question mark, we could use this code:

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

### Raw

This type of transformations support the _from_ direction, allowing blocks to be created from raw HTML nodes. They're applied when the user executes the "Convert to Blocks" action from within the block setting UI menu, as well as when some content is pasted or dropped into the editor.

A transformation of type `raw` is an object that takes the following parameters:

-   **type** _(string)_: the value `raw`.
-   **transform** _(function, optional)_: a callback that receives the node being processed. It should return a block object or an array of block objects.
-   **schema** _(object|function, optional)_: defines an [HTML content model](https://html.spec.whatwg.org/multipage/dom.html#content-models) used to detect and process pasted contents. See [below](#schemas-and-content-models).
-   **selector** _(string, optional)_: a CSS selector string to determine whether the element matches according to the [element.matches](https://developer.mozilla.org/en-US/docs/Web/API/Element/matches) method. The transform won't be executed if the element doesn't match. This is a shorthand and alternative to using `isMatch`, which, if present, will take precedence.
-   **isMatch** _(function, optional)_: a callback that receives the node being processed and should return a boolean. Returning `false` from this function will prevent the transform from being applied.
-   **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from URLs to Embed block**

If we want to create an Embed block when the user pastes some URL in the editor, we could use this code:

```js
transforms: {
    from: [
        {
            type: 'raw',
            isMatch: ( node ) =>
                node.nodeName === 'P' &&
                /^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ),
            transform: ( node ) => {
                return createBlock( 'core/embed', {
                    url: node.textContent.trim(),
                } );
            },
        },
    ],
}
```

<h4 id="schemas-and-content-models">Schemas and Content Models</h4>

When pasting content it's possible to define
a [content model](https://html.spec.whatwg.org/multipage/dom.html#content-models) that will be used to validate and
process pasted content. It's often the case that HTML pasted into the editor will contain a mixture of elements that _
should_ transfer as well as elements that _shouldn't_. For example, consider
pasting `<span class="time">12:04 pm</span>` into the editor. We want to copy `12:04 pm` and omit the `<span>` and
its `class` attribute because those won't carry the same meaning or structure as they originally did from where they
were copied.

When writing `raw` transforms you can control this by supplying a `schema` which describes allowable content and which
will be applied to clean up the pasted content before attempting to match with your block. The schemas are passed
into [`cleanNodeList` from `@wordpress/dom`](/packages/dom/src/dom/clean-node-list.js); check there for
a [complete description of the schema](/packages/dom/src/phrasing-content.js).

```js
schema = { span: { children: { '#text': {} } } }
```

**Example: a custom content model**

Suppose we want to match the following HTML snippet and turn it into some kind of custom post preview block.

 ```html
 <div data-post-id="13">
     <h2>The Post Title</h2>
     <p>Some <em>great</em> content.</p>
 </div>
 ```

We want to tell the editor to allow the inner `h2` and `p` elements. We do this by supplying the following schema. In
this example we're using the function form, which accepts an argument supplying `phrasingContentSchema` (as well as a
boolean `isPaste` indicating if the transformation operation started with pasting text). The `phrasingContentSchema` is
pre-defined to match HTML phrasing elements, such as `<strong>` and `<sup>` and `<kbd>`. Anywhere we expect
a `<RichText />` component is a good place to allow phrasing content otherwise we'll lose all text formatting on
conversion.

 ```js
 schema = ({ phrasingContentSchema }) => {
     div: {
         required: true,
         attributes: [ 'data-post-id' ],
         children: {
             h2: { children: phrasingContentSchema },
             p: { children: phrasingContentSchema }
         }
     }
 }
 ```

When we successfully match this content every HTML attribute will be stripped away except for `data-post-id` and if we
have other arrangements of HTML inside of a given `div` then it won't match our transformer. Likewise we'd fail to match
if we found an `<h3>` in there instead of an `<h2>`.

Schemas are most-important when wanting to match HTML snippets containing non-phrasing content, such as `<details>` with
a `<summary>`. Without declaring the custom schema the editor will skip over these other contructions before attempting
to run them through any block transforms.

### Shortcode

This type of transformations support the _from_ direction, allowing blocks to be created from shortcodes. It's applied as part of the `raw` transformation process.

A transformation of type `shortcode` is an object that takes the following parameters:

-   **type** _(string)_: the value `shortcode`.
-   **tag** _(string|array)_: the shortcode tag or list of shortcode aliases this transform can work with.
-   **attributes** _(object)_: object representing where the block attributes should be sourced from, according to the attributes shape defined by the [block configuration object](./block-registration.md). If a particular attribute contains a `shortcode` key, it should be a function that receives the shortcode attributes as the first arguments and the [WPShortcodeMatch](/packages/shortcode/README.md#next) as second, and returns a value for the attribute that will be sourced in the block's comment.
-   **isMatch** _(function, optional)_: a callback that receives the shortcode attributes per the [Shortcode API](https://codex.wordpress.org/Shortcode_API) and should return a boolean. Returning `false` from this function will prevent the shortcode to be transformed into this block.
-   **priority** _(number, optional)_: controls the priority with which a transform is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://codex.wordpress.org/Plugin_API#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: from shortcode to block**

An existing shortcode can be transformed into its block counterpart.

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
                    // The shortcode function will extract
                    // the shortcode atts into a value
                    // to be sourced in the block's comment.
                    shortcode: ( { named: { align = 'alignnone' } } ) => {
                        return align.replace( 'align', '' );
                    },
                },
            },
            // Prevent the shortcode to be converted
            // into this block when it doesn't
            // have the proper ID.
            isMatch( { named: { id } } ) {
                return id === 'my-id';
            },
        },
    ]
},
```
