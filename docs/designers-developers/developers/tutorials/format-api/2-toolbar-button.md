# Add a Button to the Toolbar

Now that the format is available, the next step is to surface it to the UI. You can make use of the [`RichTextToolbarButton`](/packages/editor/src/components/rich-text/README.md#RichTextToolbarButton) component to extend the format toolbar.

Paste this code in `my-custom-format.js`:

```js
( function( wp ) {
	var MyCustomButton = function( props ) {
		return wp.element.createElement(
			wp.editor.RichTextToolbarButton, {
				icon: 'editor-code',
				title: 'Sample output',
				onClick: function() {
					console.log( 'toggle format' );
				},
			}
		);
	}
	wp.richText.registerFormatType(
		'my-custom-format/sample-output', {
			title: 'Sample output',
			tagName: 'samp',
			className: null,
			edit: MyCustomButton,
		}
	);
} )( window.wp );
```

**Important**: note that this code is using two new utilities (`wp.element.createElement`, and `wp.editor.RichTextToolbarButton`) so don't forget adding the corresponding `wp-element` and `wp-editor` packages to the dependencies array in the PHP file along with the existing `wp-rich-text`.

Let's check that everything is working as expected. Reload the post/page and select a text block. Make sure that the new button was added to the format toolbar, it uses the [editor-code dashicon](https://developer.wordpress.org/resource/dashicons/#editor-code), and the hover text is what you set in the title:

![Toolbar with custom button](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/assets/toolbar-with-custom-button.png)

You may also want to check that upon clicking the button the `toggle format` message is shown in your browser's console.

## Show the button only for specific blocks

By default, the button is rendered on every rich text toolbar (image captions, buttons, paragraphs, etc).
It is possible to render the button only on blocks of a certain type by using `wp.data.withSelect` together with `wp.compose.ifCondition`.
The following sample code renders the previously shown button only on Paragraph blocks:

```js
( function( wp ) {
	var withSelect = wp.data.withSelect;
	var ifCondition = wp.compose.ifCondition;
	var compose = wp.compose.compose;
	var MyCustomButton = function( props ) {
		return wp.element.createElement(
			wp.editor.RichTextToolbarButton, {
				icon: 'editor-code',
				title: 'Sample output',
				onClick: function() {
					console.log( 'toggle format' );
				},
			}
		);
	}
	var ConditionalButton = compose(
		withSelect( function( select ) {
			return {
				selectedBlock: select( 'core/editor' ).getSelectedBlock()
			}
		} ),
		ifCondition( function( props ) {
			return (
				props.selectedBlock &&
				props.selectedBlock.name === 'core/paragraph'
			);
		} )
	)( MyCustomButton );

	wp.richText.registerFormatType(
		'my-custom-format/sample-output', {
			title: 'Sample output',
			tagName: 'samp',
			className: null,
			edit: ConditionalButton,
		}
	);
} )( window.wp );
```

Don't forget adding `wp-compose` and `wp-data` to the dependencies array in the PHP script.

More advanced conditions can be used, e.g., only render the button depending on specific attributes of the block.
