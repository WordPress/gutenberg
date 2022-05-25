# Introducing Attributes and Editable Fields

The example blocks so far are still not very interesting because they lack options to customize the appearance of the message. In this section, we will implement a RichText field allowing the user to specify their own message. Before doing so, it's important to understand how the state of a block (its "attributes") is maintained and changed over time.

## Attributes

Until now, the `edit` and `save` functions have returned a simple representation of a paragraph element. We also learned how these functions are responsible for _describing_ the structure of the block's appearance. If the user changes a block, this structure may need to change. To achieve this, the state of a block is maintained throughout the editing session as a plain JavaScript object, and when an update occurs, the `edit` function is invoked again. Put another way: **the output of a block is a function of its attributes**.

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

When registering a new block type, the `attributes` property describes the shape of the attributes object you'd like to receive in the `edit` and `save` functions. Each value is a [source function](/docs/reference-guides/block-api/block-attributes.md) to find the desired value from the markup of the block.

In the code snippet above, when loading the editor, the `content` value will be extracted from the HTML of the paragraph element in the saved post's markup.

## Components and the `RichText` Component

Earlier examples used the `createElement` function to create DOM nodes, but it's also possible to encapsulate this behavior into "components". This abstraction helps you share common behaviors and hide complexity in self-contained units.

There are a number of [components available](/docs/reference-guides/packages/packages-editor.md#components) to use in implementing your blocks. You can see one such component in the code below: the [`RichText` component](/docs/reference-guides/packages/packages-editor.md#richtext) is part of the `wp-editor` package.

The `RichText` component can be considered as a super-powered `textarea` element, enabling rich content editing including bold, italics, hyperlinks, etc.

To use the `RichText` component, and using ES5 code, remember to add `wp-block-editor` to the dependency array of registered script handles when calling `wp_register_script`.

```php
// automatically load dependencies and version
$asset_file = include( plugin_dir_path( __FILE__ ) . 'build/index.asset.php');

wp_register_script(
	'gutenberg-examples-03-esnext',
	plugins_url( 'build/index.js', __FILE__ ),
	$asset_file['dependencies'],
	$asset_file['version']
);
```

Do not forget to also update the `editor_script` handle in `register_block_type` to `gutenberg-examples-03-esnext`.

Implementing this behavior as a component enables you as the block implementer to be much more granular about editable fields. Your block may not need `RichText` at all, or it may need many independent `RichText` elements, each operating on a subset of the overall block state.

Because `RichText` allows for nested nodes, you'll most often use it in conjunction with the `html` attribute source when extracting the value from saved content. You'll also use `RichText.Content` in the `save` function to output RichText values.

Here is the complete block definition for Example 03.

{% codetabs %}
{% JSX %}

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';

registerBlockType( 'gutenberg-examples/example-03-editable-esnext', {
	apiVersion: 2,
	title: 'Example: Editable (esnext)',
	icon: 'universal-access-alt',
	category: 'design',
	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'p',
		},
	},
	example: {
		attributes: {
			content: 'Hello World',
		},
	},
	edit: ( props ) => {
		const {
			attributes: { content },
			setAttributes,
			className,
		} = props;
		const blockProps = useBlockProps();
		const onChangeContent = ( newContent ) => {
			setAttributes( { content: newContent } );
		};
		return (
			<RichText
				{ ...blockProps }
				tagName="p"
				onChange={ onChangeContent }
				value={ content }
			/>
		);
	},
	save: ( props ) => {
		const blockProps = useBlockProps.save();
		return (
			<RichText.Content
				{ ...blockProps }
				tagName="p"
				value={ props.attributes.content }
			/>
		);
	},
} );
```

{% Plain %}

```js
( function ( blocks, blockEditor, element ) {
	var el = element.createElement;
	var RichText = blockEditor.RichText;
	var useBlockProps = blockEditor.useBlockProps;

	blocks.registerBlockType( 'gutenberg-examples/example-03-editable', {
		apiVersion: 2,
		title: 'Example: Editable',
		icon: 'universal-access-alt',
		category: 'design',

		attributes: {
			content: {
				type: 'array',
				source: 'children',
				selector: 'p',
			},
		},
		example: {
			attributes: {
				content: 'Hello World',
			},
		},
		edit: function ( props ) {
			var blockProps = useBlockProps();
			var content = props.attributes.content;
			function onChangeContent( newContent ) {
				props.setAttributes( { content: newContent } );
			}

			return el(
				RichText,
				Object.assign( blockProps, {
					tagName: 'p',
					onChange: onChangeContent,
					value: content,
				} )
			);
		},

		save: function ( props ) {
			var blockProps = useBlockProps.save();
			return el(
				RichText.Content,
				Object.assign( blockProps, {
					tagName: 'p',
					value: props.attributes.content,
				} )
			);
		},
	} );
} )( window.wp.blocks, window.wp.blockEditor, window.wp.element );
```

{% end %}
