# Introducing Attributes and Editable Fields

The example blocks so far are still not very interesting because they lack options to customize the appearance of the message. In this section, we will implement a RichText field allowing the user to specify their own message. Before doing so, it's important to understand how the state of a block (its "attributes") is maintained and changed over time.

## Attributes

Until now, the `edit` and `save` functions have returned a simple representation of a paragraph element. We also learned how these functions are responsible for _describing_ the structure of the block's appearance. If the user changes a block, this structure may need to change. To achieve this, the state of a block is maintained throughout the editing session as a plain JavaScript object, and when an update occurs, the `edit` function is invoked again. Put another way: __the output of a block is a function of its attributes__.

One challenge of maintaining the representation of a block as a JavaScript object is that we must be able to extract this object again from the saved content of a post. This is achieved with the block type's `attributes` property:

```js
	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'p',
		},
	},
```

When registering a new block type, the `attributes` property describes the shape of the attributes object you'd like to receive in the `edit` and `save` functions. Each value is a [source function](/docs/designers-developers/developers/block-api/block-attributes.md) to find the desired value from the markup of the block.

In the code snippet above, when loading the editor, the `content` value will be extracted from the HTML of the paragraph element in the saved post's markup.

## Components and the `RichText` Component

Earlier examples used the `createElement` function to create DOM nodes, but it's also possible to encapsulate this behavior into "components". This abstraction helps you share common behaviors and hide complexity in self-contained units.

There are a number of [components available](/docs/designers-developers/developers/packages/packages-editor.md#components) to use in implementing your blocks. You can see one such component in the code below: the [`RichText` component](/docs/designers-developers/developers/packages/packages-editor.md#richtext).

The `RichText` component can be considered as a super-powered `textarea` element, enabling rich content editing including bold, italics, hyperlinks, etc.

To use the `RichText` component, add `wp-editor` to the dependency array of registered script handles when calling `wp_register_script`.

```php
wp_register_script(
	'gutenberg-examples-03',
	plugins_url( 'block.js', __FILE__ ),
	array(
		'wp-blocks',
		'wp-element',
		'wp-editor'    // Note the addition of wp-editor to the dependencies
	),
	filemtime( plugin_dir_path( __FILE__ ) . 'block.js' )
);
```

Do not forget to also update the `editor_script` handle in `register_block_type` to `gutenberg-examples-03`.

Implementing this behavior as a component enables you as the block implementer to be much more granular about editable fields. Your block may not need `RichText` at all, or it may need many independent `RichText` elements, each operating on a subset of the overall block state.

Because `RichText` allows for nested nodes, you'll most often use it in conjunction with the `html` attribute source when extracting the value from saved content. You'll also use `RichText.Content` in the `save` function to output RichText values.

Here is the complete block definition for Example 03.

{% codetabs %}
{% ES5 %}
```js
( function( blocks, editor, element ) {
	var el = element.createElement;
	var RichText = editor.RichText;

	blocks.registerBlockType( 'gutenberg-examples/example-03-editable', {
		title: 'Example: Editable',
		icon: 'universal-access-alt',
		category: 'layout',

		attributes: {
			content: {
				type: 'array',
				source: 'children',
				selector: 'p',
			},
		},

		edit: function( props ) {
			var content = props.attributes.content;
			function onChangeContent( newContent ) {
				props.setAttributes( { content: newContent } );
			}

			return el(
				RichText,
				{
					tagName: 'p',
					className: props.className,
					onChange: onChangeContent,
					value: content,
				}
			);
		},

		save: function( props ) {
			return el( RichText.Content, {
				tagName: 'p', value: props.attributes.content,
			} );
		},
	} );
}(
	window.wp.blocks,
	window.wp.editor,
	window.wp.element
) );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { RichText } = wp.editor;

registerBlockType( 'gutenberg-examples/example-03-editable-esnext', {
	title: 'Example: Editable (esnext)',
	icon: 'universal-access-alt',
	category: 'layout',
	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'p',
		},
	},
	edit: ( props ) => {
		const { attributes: { content }, setAttributes, className } = props;
		const onChangeContent = ( newContent ) => {
			setAttributes( { content: newContent } );
		};
		return (
			<RichText
				tagName="p"
				className={ className }
				onChange={ onChangeContent }
				value={ content }
			/>
		);
	},
	save: ( props ) => {
		return <RichText.Content tagName="p" value={ props.attributes.content } />;
	},
} );
```
{% end %}
