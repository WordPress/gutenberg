# Use styles and stylesheets

## Overview

A block typically inserts markup (HTML) into post content that you want to style in someway. This guides walks through a few different ways you can use CSS with the block editor and how to work with styles and stylesheets.

## Before you start

You will need a basic block and WordPress development environment to implement the examples shown in this guide. See the [create a basic block](/docs/how-to-guides/block-tutorial/writing-your-first-block-type.md) or [block tutorial](/docs/getting-started/create-block/README.md) to get setup.

## Methods to add style

The following are different methods you can use to add style to your block, either in the editor or when saved.

## Method 1: Inline style

The first method shows adding the style inline. This transforms the defined style into a property on the element inserted.

The `useBlockProps` React hook is used to set and apply properties on the block's wrapper element. The following example shows how:

{% codetabs %}
{% JSX %}

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'gutenberg-examples/example-02-stylesheets', {
	edit() {
		const greenBackground = {
			backgroundColor: '#090',
			color: '#fff',
			padding: '20px',
		};

		const blockProps = useBlockProps( { style: greenBackground } );

		return (
			<p { ...blockProps }>Hello World (from the editor, in green).</p>
		);
	},
	save() {
		const redBackground = {
			backgroundColor: '#900',
			color: '#fff',
			padding: '20px',
		};

		const blockProps = useBlockProps.save( { style: redBackground } );

		return (
			<p { ...blockProps }>Hello World (from the frontend, in red).</p>
		);
	},
} );
```

{% Plain %}

```js
( function ( blocks, element, blockEditor ) {
	var el = element.createElement;

	blocks.registerBlockType( 'gutenberg-examples/example-02-stylesheets', {
		edit: function ( props ) {
			const greenBackground = {
				backgroundColor: '#090',
				color: '#fff',
				padding: '20px',
			};
			const blockProps = blockEditor.useBlockProps( {
				style: greenBackground,
			} );
			return el(
				'p',
				blockProps,
				'Hello World (from the editor, in green).'
			);
		},
		save: function () {
			const redBackground = {
				backgroundColor: '#090',
				color: '#fff',
				padding: '20px',
			};
			const blockProps = blockEditor.useBlockProps.save( {
				style: redBackground,
			} );
			return el(
				'p',
				blockProps,
				'Hello World (from the frontend, in red).'
			);
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor );
```

{% end %}

## Method 2: Block classname

The inline style works well for a small amount of CSS to apply. If you have much more than the above you will likely find that it is easier to manage with them in a separate stylesheet file.

The `useBlockProps` hooks includes the classsname for the block automatically, it generates a name for each block using the block's name prefixed with `wp-block-`, replacing the `/` namespace separator with a single `-`.

For example the block name: `gutenberg-examples/example-02-stylesheets` would get the classname: `wp-block-gutenberg-examples-example-02-stylesheets`. It might be a bit long but best to avoid conflicts with other blocks.

{% codetabs %}
{% JSX %}

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps } from '@wordpress/block-editor';

registerBlockType( 'gutenberg-examples/example-02-stylesheets', {
	edit() {
		const blockProps = useBlockProps();

		return (
			<p { ...blockProps }>Hello World (from the editor, in green).</p>
		);
	},
	save() {
		const blockProps = useBlockProps.save();

		return (
			<p { ...blockProps }>Hello World (from the frontend, in red).</p>
		);
	},
} );
```

{% Plain %}

```js
( function ( blocks, element, blockEditor ) {
	var el = element.createElement;

	blocks.registerBlockType( 'gutenberg-examples/example-02-stylesheets', {
		edit: function ( props ) {
			var blockProps = blockEditor.useBlockProps();
			return el(
				'p',
				blockProps,
				'Hello World (from the editor, in green).'
			);
		},
		save: function () {
			var blockProps = blockEditor.useBlockProps.save();
			return el(
				'p',
				blockProps,
				'Hello World (from the frontend, in red).'
			);
		},
	} );
} )( window.wp.blocks, window.wp.element, window.wp.blockEditor );
```

{% end %}

### Enqueue stylesheets

Like scripts, you can enqueue your block's styles using the `block.json` file.

Use the `editorStyle` property to a CSS file you want to load in the editor view, and use the `style` property for a CSS file you want to load on the frontend when the block is used.

For example:

```json
{
	"apiVersion": 2,
	"name": "gutenberg-examples/example-02-stylesheets",
	"title": "Example: Stylesheets",
	"icon": "universal-access-alt",
	"category": "layout",
	"editorScript": "file:./block.js",
	"editorStyle": "file:./editor.css",
	"style": "file:./style.css"
}
```

So in your plugin directory, create an `editor.css` file to load in editor view:

```css
/* green background */
.wp-block-gutenberg-examples-example-02-stylesheets {
	background: #090;
	color: white;
	padding: 20px;
}
```

And a `style.css` file to load on the frontend:

```css
/* red background */
.wp-block-gutenberg-examples-example-02-stylesheets {
	background: #900;
	color: white;
	padding: 20px;
}
```

The files will automatically be enqueued when specified in the block.json.

**Note:** If you have multiple files to include, you can use standard `wp_enqueue_style` functions like any other plugin or theme. You will want to use the following hooks for the block editor:

-   `enqueue_block_editor_assets` - to load only in editor view
-   `enqueue_block_assets` - loads both on frontend and editor view

## Conclusion

This guide showed a couple of different ways to apply styles to your block, by either inline or in its own style sheet. Both of these methods use the `useBlockProps` hook, see the [block wrapper reference documentation](/docs/reference-guides/block-api/block-edit-save.md#block-wrapper-props) for additional details.

See the complete [example-02-stlyesheets](https://github.com/WordPress/gutenberg-examples/tree/trunk/02-stylesheets) code in the [gutenberg-examples repository](https://github.com/WordPress/gutenberg-examples).
