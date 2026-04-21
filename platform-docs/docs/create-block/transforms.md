---
sidebar_position: 4
---

# Transforms

Block Transforms is the API that allows a block to be transformed _from_ and _to_ other blocks, as well as _from_ other entities. Existing entities that work with this API include shortcodes, files, regular expressions, and raw DOM nodes.

## Transform direction: `to` and `from`

A block declares which transformations it supports via the optional `transforms` key of the block configuration object passed to the `registerBlockType` function call, whose subkeys `to` and `from` hold an array of available transforms for every direction. Example:

```jsx
registerBlockType( 'create-block/gutenpride', {
	// ...
	transforms: {
		from: [
			/* supported from transforms */
		],
		to: [
			/* supported to transforms */
		],
	},
} );
```

## Transformations Types

### Block

This type of transformations support both _from_ and _to_ directions, allowing blocks to be converted into a different one. It has a corresponding UI control within the block toolbar.

A transformation of type `block` is an object that takes the following parameters:

-   **type** _(string)_: the value `block`.
-   **blocks** _(array)_: a list of known block types. It also accepts the wildcard value (`"*"`), meaning that the transform is available to _all_ block types (eg: all blocks can transform into `core/group`).
-   **transform** _(function)_: a callback that receives the attributes and inner blocks of the block being processed. It should return a block object or an array of block objects.
-   **isMatch** _(function, optional)_: a callback that receives the block attributes as the first argument and the block object as the second argument and should return a boolean. Returning `false` from this function will prevent the transform from being available and displayed as an option to the user.
-   **isMultiBlock** _(boolean, optional)_: whether the transformation can be applied when multiple blocks are selected. If `true`, the `transform` function's first parameter will be an array containing each selected block's attributes, and the second an array of each selected block's inner blocks. Returns `false` by default.
-   **priority** _(number, optional)_: controls the priority with which a transformation is applied, where a lower value will take precedence over higher values. This behaves much like a [WordPress hook](https://developer.wordpress.org/reference/#Hook_to_WordPress). Like hooks, the default priority is `10` when not otherwise set.

**Example: Let's declare a transform from our Gutenpride block to Heading block**

To declare this transformation we add the following code into our Gutenpride block configuration, which uses the `createBlock` function from the `@wordpress/blocks` package to create a new block:

```js
transforms: {
    from: [
      {
        type: "block",
        blocks: ["core/heading"],
        transform: ({ content }) => {
          return createBlock("create-block/gutenpride", {
            message: content,
          });
        },
      },
    ],
},
```

In the code above, the `transform` function receives the attributes of the block being processed as the first argument, and the inner blocks as the second. In this case, the `content` attribute of the heading block is used to set the `message` attribute of the `create-block/gutenpride` block.

In the exact same way we can declare a transform from the `core/heading` block to our `create-block/gutenpride` block:

```js
transforms: {
    to: [
        {
            type: 'block',
            blocks: [ 'core/heading' ],
            transform: ( { content } ) => {
                return createBlock( 'core/heading', {
                    content: message,
                } );
            },
        },
    ]
},
```

### Other transforms:

To cover other writing flows and interactions, the block editor also supports other transformations types for blocks:

    - Enter: transforms a block when the user presses the enter key.
    - Files: transforms a block when the user drags a file or multiple into the block editor.
    - Prefix: transforms a block when the user types a prefix.
    - Raw: transforms a block when the user pastes raw content.
    - Ungroup: transforms a block when the user ungroups a block.
