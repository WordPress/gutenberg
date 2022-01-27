# Block Supports

A lot of blocks, including core blocks, offer similar customization options. Whether that is to change the background color, text color, or to add padding, margin customization options...

To avoid duplicating the same logic over and over in your blocks and to align the behavior of your block with core blocks, you can make use of the different `supports` properties.

Let's take the block we wrote in the previous chapter (example 3) and with just a single line of code, add support for text, link and background color customizations.

Here's the exact same code we used to register the block previously.

{% codetabs %}
{% JSX %}

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';

registerBlockType( 'gutenberg-examples/example-03-editable-esnext', {
	apiVersion: 2,
	title: 'Example: Basic with block supports',
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
		title: 'Example: Basic with block supports',
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

Now, let's alter the block.json file for that block, and add the supports key.

```json
{
	"apiVersion": 2,
	"name": "gutenberg-examples/example-03-editable-esnext",
	"title": "Example: Basic with block supports",
	"icon": "universal-access-alt",
	"category": "layout",
	"editorScript": "file:./build/index.js",
	"supports": {
		"color": {
			"text": true,
			"background": true,
			"link": true
		}
	}
}
```

And that's it, the addition of the "supports" key above, will automatically make the following changes to the block:

 - Add a `style` attribute to the block to store the link, text and background colors.
 - Add a "Colors" panel to the sidebar of the block editor to allow users to tweak the text, link and background colors.
 - Automatically use the `theme.json` config: allow disabling colors, inherit palettes...
 - Automatically inject the right styles and apply them to the block wrapper when the user make changes to the colors.

To learn more about the block supports and see all the available properties that you can enable for your own blocks, please refer to [the supports documentation](/docs/reference-guides/block-api/block-supports.md).
