( function () {
	wp.richText.registerFormatType( 'my-plugin/link', {
		title: 'Custom Link',
		tagName: 'a',
		attributes: {
			url: 'href',
		},
		className: 'my-plugin-link',
		edit( props ) {
			return wp.element.createElement(
				wp.blockEditor.RichTextToolbarButton,
				{
					icon: 'admin-links',
					title: 'Custom Link',
					onClick() {
						props.onChange(
							wp.richText.toggleFormat( props.value, {
								type: 'my-plugin/link',
								attributes: {
									url: 'https://example.com',
								},
							} )
						);
					},
					isActive: props.isActive,
				}
			);
		},
	} );

	// Format with an unregistered attribute (`data-test` is not listed in
	// `attributes`), used to test that manually applied formats merge with
	// their parsed counterparts when typing within them.
	wp.richText.registerFormatType( 'my-plugin/testing', {
		title: 'Testing',
		tagName: 'span',
		className: 'testing',
		edit( props ) {
			return wp.element.createElement(
				wp.blockEditor.RichTextToolbarButton,
				{
					icon: 'editor-code',
					title: 'Testing',
					onClick() {
						props.onChange(
							wp.richText.toggleFormat( props.value, {
								type: 'my-plugin/testing',
								attributes: {
									'data-test': 'hello',
								},
							} )
						);
						props.onFocus();
					},
					isActive: props.isActive,
				}
			);
		},
	} );
} )();
