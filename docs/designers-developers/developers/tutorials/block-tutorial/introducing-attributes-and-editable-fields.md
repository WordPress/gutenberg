# Introducing Attributes and Editable Fields

Our example block is still not very interesting because it lacks options to customize the appearance of the message. In this section, we will implement a RichText field allowing the user to specify their own message. Before doing so, it's important to understand how the state of a block (its "attributes") is maintained and changed over time.

## Attributes

Until now, the `edit` and `save` functions have returned a simple representation of a paragraph element. We also learned how these functions are responsible for _describing_ the structure of the block's appearance. If the user changes a block, this structure may need to change. To achieve this, the state of a block is maintained throughout the editing session as a plain JavaScript object, and when an update occurs, the `edit` function is invoked again. Put another way: __the output of a block is a function of its attributes__.

One challenge of maintaining the representation of a block as a JavaScript object is that we must be able to extract this object again from the saved content of a post. This is achieved with the block type's `attributes` property:

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	RichText = wp.editor.RichText;

registerBlockType( 'gutenberg-boilerplate-es5/hello-world-step-03', {
	title: 'Hello World (Step 3)',

	icon: 'universal-access-alt',

	category: 'layout',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'p',
		}
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
		var content = props.attributes.content;

		return el( RichText.Content, {
			tagName: 'p',
			className: props.className,
			value: content
		} );
	},
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { RichText } = wp.editor;

registerBlockType( 'gutenberg-boilerplate-esnext/hello-world-step-03', {
	title: 'Hello World (Step 3)',

	icon: 'universal-access-alt',

	category: 'layout',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'p',
		},
	},

	edit( { attributes, className, setAttributes } ) {
		const { content } = attributes;

		function onChangeContent( newContent ) {
			setAttributes( { content: newContent } );
		}

		return (
			<RichText
				tagName="p"
				className={ className }
				onChange={ onChangeContent }
				value={ content }
			/>
		);
	},

	save( { attributes } ) {
		const { content } = attributes;

		return (
			<RichText.Content
				tagName="p"
				value={ content }
			/>
		);
	},
} );
```
{% end %}

When registering a new block type, the `attributes` property describes the shape of the attributes object you'd like to receive in the `edit` and `save` functions. Each value is a [source function](../../../../../docs/designers-developers/developers/block-api/block-attributes.md) to find the desired value from the markup of the block.

In the code snippet above, when loading the editor, we will extract the `content` value as the HTML of the paragraph element in the saved post's markup.

## Components and the `RichText` Component

Earlier examples used the `createElement` function to create DOM nodes, but it's also possible to encapsulate this behavior into ["components"](). This abstraction helps as a pattern to share common behaviors and to hide complexity into self-contained units. There are a number of components available to use in implementing your blocks. You can see one such component in the snippet above: the [`RichText` component]().

The `RichText` component can be considered as a super-powered `textarea` element, enabling rich content editing including bold, italics, hyperlinks, etc. It is not too much unlike the single editor region of the legacy post editor, and is in fact powered by the same TinyMCE library.

To use the `RichText` component, add `wp-editor` to the array of registered script handles when calling `wp_register_script`.

```php
wp_register_script(
	'gutenberg-boilerplate-es5-step03',
	plugins_url( 'step-03/block.js', __FILE__ ),
	array( 
		'wp-blocks', 
		'wp-element', 
		'wp-editor', // Note the addition of wp-editor to the dependencies
	)
);
```

Implementing this behavior as a component enables you as the block implementer to be much more granular about editable fields. Your block may not need `RichText` at all, or it may need many independent `RichText` elements, each operating on a subset of the overall block state.

Because `RichText` allows for nested nodes, you'll most often use it in conjunction with the `html` attribute source when extracting the value from saved content. You'll also use `RichText.Content` in the `save` function to output RichText values.
