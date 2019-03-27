# Apply the Format When the Button Is Clicked

So far, your custom button doesn't modify the text selected, it only renders a message in the console. Let's change that.

The [rich-text package](/packages/rich-text/README.md) offers a few utilities to work with formats: [applyFormat](/packages/rich-text/README.md#applyFormat), [removeFormat](/packages/rich-text/README.md#removeFormat), and [toggleFormat](/packages/rich-text/README.md#toggleFormat). In this particular example, the format you want to apply (the `<samp>` tag) may be considered binary - either a text selection has the tag or not. Taking that into account, the `toggleFormat` primitive seems more convenient.

Update `my-custom-format.js` with this new code:

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

Now, let's check that is working as intended: reload the post/page, make a text selection, click the button, and then change to HTML view to confirm that the tag was effectively applied.

The expected behavior is that the format will be toggled, meaning that the text selected will be wrapped by a `<samp>` tag if it isn't yet, or the tag will be removed if the selection is already wrapped with the tag. Notice that the button renders a different style depending on whether the selection has the tag or not as well - this is controlled by the `isActive` property of the `RichTextToolbarButton` component.

Your browser may have already displayed the selection differently once the tag was applied, but you may want to use a special style of your own. You can use the `className` option in [`registerFormatType`](/packages/rich-text/README.md#registerFormatType) to target the new element by class name: if `className` is set, it'll be added to the new element.

That's it. This is all that is necessary to make a custom format available in the new editor. From here, you may want to check out other [tutorials](/docs/tutorials/) or apply your new knowledge to your next plugin!
