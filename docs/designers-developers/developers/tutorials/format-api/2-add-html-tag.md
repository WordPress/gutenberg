# Addd the `<samp>` tag to the selected text

So far, your custom button doesn't modify the text selected, it only renders a message in the console. Let's change that.

The [rich-text package](/packages/rich-text/README.md) offers a few utilities to work with formats: [applyFormat](/packages/rich-text/README.md#applyFormat), [removeFormat](/packages/rich-text/README.md#removeFormat), and [toggleFormat](/packages/rich-text/README.md#toggleFormat). In this particular example, the format you want to apply (the `<samp>` tag) may be considered binary, either a text selection is within the tag or isn't, there is no more formatting info. The `toggleFormat` primitive is very convenient in this case.

```js
( function( wp ) {
	var MyCustomButton = function( props ) {
		return wp.element.createElement(
			wp.editor.RichTextToolbarButton, {
				icon: 'editor-code',
				title: 'Sample output',
				onClick: function() {
					props.onChange( wp.richText.toggleFormat(
						props.value,
						{ type: 'my-custom-format/sample-output' }
					) );
				},
				isActive: props.isActive,
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

Update the JavaScript file with this code and check that is working as intended: make a selection, click the button, and then change to HTML view to confirm that the tag was effectively applied.

The expected behavior is that the format will be toggled, meaning that the text selected will be wrapped by a `<samp>` tag if it isn't yet, or the tag will be removed if the selection is already wrapped with the tag. Notice that the button renders a different style depending on whether the selection has the tag or not as well - this is controlled by the `isActive` property of the `RichTextToolbarButton` component.

Probably your browser has already displayed the selection differently once the tag was applied. You may want to use a special style for it, though. So far, you can only target the `samp` element in your CSS to do so. Another option that you have is to add a class to the format using the `className` option in [`registerFormatType`](/packages/rich-text/README.md#registerFormatType).

That's it. This is all that is necessary to create a custom format. From here, you may want to check out other [tutorials](/docs/designers-developers/developers/tutorials/) or apply your new knowledge to your next plugin!
