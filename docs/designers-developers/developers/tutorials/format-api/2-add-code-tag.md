# Add code tag

```js
( function( wp ) {
	wp.richText.registerFormatType(
		'my-custom-format/sample-output', {
			title: 'Sample output',
			tagName: 'samp',
			className: null,
			edit: function( props ) {
				return wp.element.createElement(
					wp.editor.RichTextToolbarButton, {
						icon: 'editor-code',
						title: 'Sample output',
						onClick: function() {
							props.onChange( wp.richText.toggleFormat(
								props.value,
								{
									type: 'my-custom-format/sample-output',
								}
							) );
						},
						isActive: props.isActive
					}
				);
			},
		}
	);
} )( window.wp );
```

Check that `samp` tag is added to the selection.