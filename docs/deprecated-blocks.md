# Deprecated Blocks

When updating static blocks markup and attributes, block authors need to consider existing posts using the old versions of their block. In order to provide a good upgrade path, you can choose one of the following strategies:

 - Do not deprecate the block and create a new one (a different name)
 - Provide a "deprecated" version of the block allowing users opening these blocks in Gutenberg to edit them using the updated block.

A block can have several deprecated versions, Gutenberg will try them one after another until finding the one that matches the saved markup.

To declare a "deprecated version", you need to copy the old `attributes`, `support` and `save` properties from the previous old definition to the `deprecated` property of the udpated block.

### Example:

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType;

registerBlockType( 'gutenberg/block-with-deprecated-version', {

	// ... other block properties go here

	attributes: {
		text: {
			type: 'string',
			default: 'some random value',
		}
	},

	save: function( props ) {
		return el( 'div', {}, props.attributes.text );
	},

	deprecated: [
		{
			attributes: {
				text: {
					type: 'string'
				}
			},

			save: function( props ) {
				return el( 'p', {}, props.attributes.text );
			},
		}
	]
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;

registerBlockType( 'gutenberg/block-with-deprecated-version', {

	// ... other block properties go here

	attributes: {
		text: {
			type: 'string',
			default: 'some random value',
		}
	},

	save: function( props ) {
		return <div>{ props.attributes.text }</div>;
	},

	deprecated: [
		{
			attributes: {
				text: {
					type: 'string'
				}
			},

			save: function( props ) {
				return <p>{ props.attributes.text }</p>;
			},
		}
	]
} );
```
{% end %}

In the example above we updated the markup of the block to use a `div` instead of `p` and we added a default value to the `text` attribute.
