# Deprecation

When updating static blocks markup and attributes, block authors need to consider existing posts using the old versions of their block. To provide a good upgrade path, you can choose one of the following strategies:

-   Do not deprecate the block and create a new one (a different name)
-   Provide a "deprecated" version of the block allowing users opening these in the block editor to edit them using the updated block.

A block can have several deprecated versions. A deprecation will be tried if the current state of a parsed block is invalid, or if the deprecation defines an `isEligible` function that returns true.

Deprecations do not operate as a chain of updates in the way other software data updates, like database migrations, do. At first glance, it is easy to think that each deprecation is going to make the required changes to the data and then hand this new form of the block onto the next deprecation to make its changes. What happens instead is:

1. If the current `save` method does not produce a valid block the first deprecation in the deprecations array is passed the original saved content.
2. If its `save` method produces valid content this deprecation is used to parse the block attributes. If it has a `migrate` method it will also be run using the attributes parsed by the deprecation.
3. If the first deprecation's `save` method does not produce a valid block the subsequent deprecations in the array are tried until one producing a valid block is encountered.
4. The attributes, and any innerBlocks, from the first deprecation to generate a valid block are then passed back to the current `save` method to generate new valid content for the block.
5. At this point the current block should now be in a valid state and the deprecations workflow stops.

It is important to note that if a deprecation's `save` method does not produce a valid block then it is skipped completely, including its `migrate` method, even if `isEligible` would return true for the given attributes. This means that if you have several deprecations for a block and want to perform a new migration, like moving content to `InnerBlocks`, you may need to update the `migrate` methods in multiple deprecations in order for the required changes to be applied to all previous versions of the block.

It is also important to note that if a deprecations `save` method imports additional methods you may want to add a snapshot copy of these methods to the deprecations file instead of importing them in order to avoid future changes to these methods inadvertently breaking the deprecations.

For blocks with multiple deprecations, it may be easier to save each deprecation to a constant with the version of the block it applies to, and then add each of these to the block's `deprecated` array. The deprecations in the array should be in reverse chronological order. This allows the block editor to attempt to apply the most recent and likely deprecations first, avoiding unnecessary and expensive processing.

### Example:

```js
const v1 = {};
const v2 = {};
const v3 = {};
const deprecated = [ v3, v2, v1 ];
```

It is also recommended to keep [fixtures](https://github.com/WordPress/gutenberg/blob/HEAD/test/integration/fixtures/blocks/README.md) which contain the different versions of the block content to allow you to easily test that new deprecations and migrations are working across all previous versions of the block.

Deprecations are defined on a block type as its `deprecated` property, an array of deprecation objects where each object takes the form:

-   `attributes` (Object): The [attributes definition](/docs/reference-guides/block-api/block-attributes.md) of the deprecated form of the block.
-   `supports` (Object): The [supports definition](/docs/reference-guides/block-api/block-registration.md) of the deprecated form of the block.
-   `save` (Function): The [save implementation](/docs/reference-guides/block-api/block-edit-save.md) of the deprecated form of the block.
-   `migrate` (Function, Optional): A function which, given the old attributes and inner blocks is expected to return either the new attributes or a tuple array of `[ attributes, innerBlocks ]` compatible with the block. As mentioned above, a deprecation's `migrate` will not be run if its `save` function does not return a valid block so you will need to make sure your migrations are available in all the deprecations where they are relevant.
-   `isEligible` (Function, Optional): A function which, given the attributes and inner blocks of the parsed block, returns true if the deprecation can handle the block migration even if the block is valid. This is particularly useful in cases where a block is technically valid even once deprecated, but still requires updates to its attributes or inner blocks. This function is not called when the results of all previous deprecations' `save` functions were invalid.

It's important to note that `attributes`, `supports`, and `save` are not automatically inherited from the current version, since they can impact parsing and serialization of a block, so they must be defined on the deprecated object in order to be processed during a migration.

### Example:

{% codetabs %}
{% JSX %}

```js
const { registerBlockType } = wp.blocks;
const attributes = {
	text: {
		type: 'string',
		default: 'some random value',
	},
};

registerBlockType( 'gutenberg/block-with-deprecated-version', {
	// ... other block properties go here

	attributes,

	save( props ) {
		return <div>{ props.attributes.text }</div>;
	},

	deprecated: [
		{
			attributes,

			save( props ) {
				return <p>{ props.attributes.text }</p>;
			},
		},
	],
} );
```

{% Plain %}

```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	attributes = {
		text: {
			type: 'string',
			default: 'some random value',
		},
	};

registerBlockType( 'gutenberg/block-with-deprecated-version', {
	// ... other block properties go here

	attributes: attributes,

	save: function ( props ) {
		return el( 'div', {}, props.attributes.text );
	},

	deprecated: [
		{
			attributes: attributes,

			save: function ( props ) {
				return el( 'p', {}, props.attributes.text );
			},
		},
	],
} );
```

{% end %}

In the example above we updated the markup of the block to use a `div` instead of `p`.

## Changing the attributes set

Sometimes, you need to update the attributes set to rename or modify old attributes.

### Example:

{% codetabs %}
{% JSX %}

```js
const { registerBlockType } = wp.blocks;

registerBlockType( 'gutenberg/block-with-deprecated-version', {
	// ... other block properties go here

	attributes: {
		content: {
			type: 'string',
			default: 'some random value',
		},
	},

	save( props ) {
		return <div>{ props.attributes.content }</div>;
	},

	deprecated: [
		{
			attributes: {
				text: {
					type: 'string',
					default: 'some random value',
				},
			},

			migrate( { text } ) {
				return {
					content: text,
				};
			},

			save( props ) {
				return <p>{ props.attributes.text }</p>;
			},
		},
	],
} );
```

{% Plain %}

```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType;

registerBlockType( 'gutenberg/block-with-deprecated-version', {
	// ... other block properties go here

	attributes: {
		content: {
			type: 'string',
			default: 'some random value',
		},
	},

	save: function ( props ) {
		return el( 'div', {}, props.attributes.content );
	},

	deprecated: [
		{
			attributes: {
				text: {
					type: 'string',
					default: 'some random value',
				},
			},

			migrate: function ( attributes ) {
				return {
					content: attributes.text,
				};
			},

			save: function ( props ) {
				return el( 'p', {}, props.attributes.text );
			},
		},
	],
} );
```

{% end %}

In the example above we updated the markup of the block to use a `div` instead of `p` and rename the `text` attribute to `content`.

## Changing the innerBlocks

Situations may exist where when migrating the block we may need to add or remove innerBlocks.
E.g: a block wants to migrate a title attribute to a paragraph innerBlock.

### Example:

{% codetabs %}
{% JSX %}

```js
const { registerBlockType } = wp.blocks;
const { omit } = lodash;

registerBlockType( 'gutenberg/block-with-deprecated-version', {
	// ... block properties go here

	save( props ) {
		return <p>{ props.attributes.title }</p>;
	},

	deprecated: [
		{
			attributes: {
				title: {
					type: 'string',
					source: 'html',
					selector: 'p',
				},
			},

			migrate( attributes, innerBlocks ) {
				return [
					omit( attributes, 'title' ),
					[
						createBlock( 'core/paragraph', {
							content: attributes.title,
							fontSize: 'large',
						} ),
						...innerBlocks,
					],
				];
			},

			save( props ) {
				return <p>{ props.attributes.title }</p>;
			},
		},
	],
} );
```

{% Plain %}

```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	omit = lodash.omit;

registerBlockType( 'gutenberg/block-with-deprecated-version', {
	// ... block properties go here

	deprecated: [
		{
			attributes: {
				title: {
					type: 'string',
					source: 'html',
					selector: 'p',
				},
			},

			migrate: function ( attributes, innerBlocks ) {
				return [
					omit( attributes, 'title' ),
					[
						createBlock( 'core/paragraph', {
							content: attributes.title,
							fontSize: 'large',
						} ),
					].concat( innerBlocks ),
				];
			},

			save: function ( props ) {
				return el( 'p', {}, props.attributes.title );
			},
		},
	],
} );
```

{% end %}

In the example above we updated the block to use an inner Paragraph block with a title instead of a title attribute.

_Above are example cases of block deprecation. For more, real-world examples, check for deprecations in the [core block library](https://github.com/WordPress/gutenberg/tree/HEAD/packages/block-library/src). Core blocks have been updated across releases and contain simple and complex deprecations._
