# Formatting Toolbar API

## Overview

The Format API makes it possible for developers to add custom buttons to the formatting toolbar and have them apply a _format_ to a text selection. Bold is an example of a standard button in the formatting toolbar.

![Format API Toolbar animated example](https://developer.wordpress.org/files/2021/12/format-api-example.gif)

In WordPress lingo, a _format_ is a [HTML tag with text-level semantics](https://www.w3.org/TR/html5/textlevel-semantics.html#text-level-semantics-usage-summary) used to give some special meaning to a text selection. For example, in this tutorial, the button to be hooked into the format toolbar will wrap a particular text selection with the `<samp>` HTML tag.

## Before you start

This guide assumes you are already familiar with WordPress plugins and loading JavaScript with them, see the [Plugin Handbook](https://developer.wordpress.org/plugins/) or [JavaScript Tutorial](/docs/how-to-guides/javascript/README.md) to brush up.

You will need:

-   WordPress development environment
-   A minimal plugin activated and setup ready to edit
-   JavaScript setup for building and enqueuing

The [complete format-api example](https://github.com/WordPress/gutenberg-examples/tree/trunk/format-api) is available that you can use as a reference for your setup.

## Step-by-step guide

The guide will refer to `src/index.js` as the JavaScript file where the changes are made. After each step, running `npm run build` creates `build/index.js` that is then loaded on the post editor screen.

### Step 1: Register a new format

The first step is to register the new format, add `src/index.js` with the following:

```js
import { registerFormatType } from '@wordpress/rich-text';

registerFormatType( 'my-custom-format/sample-output', {
	title: 'Sample output',
	tagName: 'samp',
	className: null,
} );
```

The list of available format types is maintained in the `core/rich-text` store. You can query the store to check that your custom format is now available.

Run this code in your browser's console to confirm:

```js
wp.data.select( 'core/rich-text' ).getFormatTypes();
```

It'll return an array containing the format types, including your own.

### Step 2: Add a button to the toolbar

With the format available, the next step is to add a button to the UI by registering a component for the edit property.

Using the `RichTextToolbarButton` component, update `src/index.js`:

```js
import { registerFormatType } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';

const MyCustomButton = ( props ) => {
	return (
		<RichTextToolbarButton
			icon="editor-code"
			title="Sample output"
			onClick={ () => {
				console.log( 'toggle format' );
			} }
		/>
	);
};

registerFormatType( 'my-custom-format/sample-output', {
	title: 'Sample output',
	tagName: 'samp',
	className: null,
	edit: MyCustomButton,
} );
```

Let's check that everything is working as expected. Build and reload and then select a text block. Confirm the new button was added to the format toolbar.

![Toolbar with custom button](https://developer.wordpress.org/files/2021/12/format-api-toolbar.png)

Click the button and check the console.log for the "toggle format" message.

If you do not see the button or message, double check you are building and loading the JavScript properly; and check the console.log for any errors.

### Step 3: Apply a format when clicked

Next is to update the button to apply a format when clicked.

For our example, the `<samp>` tag format is binary - either a text selection has the tag or not, so we can use the `toggleFormat` method from the RichText package.

Update `src/index.js` changing the `onClick` action:

```js
import { registerFormatType, toggleFormat } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';

const MyCustomButton = ( { isActive, onChange, value } ) => {
	return (
		<RichTextToolbarButton
			icon="editor-code"
			title="Sample output"
			onClick={ () => {
				onChange(
					toggleFormat( value, {
						type: 'my-custom-format/sample-output',
					} )
				);
			} }
			isActive={ isActive }
		/>
	);
};

registerFormatType( 'my-custom-format/sample-output', {
	title: 'Sample output',
	tagName: 'samp',
	className: null,
	edit: MyCustomButton,
} );
```

Confirm it is working: first build and reload, then make a text selection and click the button. Your browser will likely display that selection differently than the surrounding text.

You can also confirm by switching to HTML view (Code editor Ctrl+Shift+Alt+M) and see the text selection wrapped with `<samp>` HTML tags.

Use the `className` option when registering to add your own custom class to the tag. You can use that class and custom CSS to target that element and style as you wish.

### Step 4: Show the button only for specific blocks (Optional)

By default, the button is rendered on every rich text toolbar (image captions, buttons, paragraphs, etc). You can render the button only on blocks of a certain type by using `wp.data.withSelect` together with `wp.compose.ifCondition`.

Here is an example that only shows the button for Paragraph blocks:

```js
import { registerFormatType } from '@wordpress/rich-text';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

function ConditionalButton( { isActive, onChange, value } ) {
	const selectedBlock = useSelect( ( select ) => {
		return select( 'core/block-editor' ).getSelectedBlock();
	}, [] );

	if ( selectedBlock && selectedBlock.name !== 'core/paragraph' ) {
		return null;
	}

	return (
		<RichTextToolbarButton
			icon="editor-code"
			title="Sample output"
			onClick={ () => {
				onChange(
					toggleFormat( value, {
						type: 'my-custom-format/sample-output',
					} )
				);
			} }
			isActive={ isActive }
		/>
	);
}

registerFormatType( 'my-custom-format/sample-output', {
	title: 'Sample output',
	tagName: 'samp',
	className: null,
	edit: ConditionalButton,
} );
```

## Troubleshooting

If you run into errors:

-   Double check that you run `npm run build` first.
-   Confirm no syntax errors or issues in build process.
-   Confirm the JavaScript is loading in the editor.
-   Check for any console error messages.

## Additional Resources

Reference documentation used in this guide:

-   RichText: [`registerFormatType`](/packages/rich-text/README.md#registerformattype)
-   Components: [`RichTextToolbarButton`](/packages/block-editor/src/components/rich-text#richtexttoolbarbutton)
-   RichText: [`applyFormat`](/packages/rich-text/README.md#applyformat)
-   RichText: [`removeFormat`](/packages/rich-text/README.md#removeformat)
-   RichText: [`toggleFormat`](/packages/rich-text/README.md#toggleformat)

## Conclusion

The guide showed you how to add a button to the toolbar and have it apply a format to the selected text. Try it out and see what you can build with it in your next plugin.

Download the [format-api example](https://github.com/WordPress/gutenberg-examples/tree/trunk/format-api) from the [gutenberg-examples](https://github.com/WordPress/gutenberg-examples) repository.
