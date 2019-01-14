# Add a button to the toolbar

Now that the format is avaible, the next step is to surface it to the UI. You can make use of the [`RichTextToolbarButton`](/packages/editor/src/components/rich-text/README.md#RichTextToolbarButton) component to extend the format toolbar.

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
