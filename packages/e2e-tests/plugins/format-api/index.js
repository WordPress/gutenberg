( function() {
	wp.richText.registerFormatType(
		'my-plugin/link', {
			title: 'Custom Link',
			tagName: 'a',
			attributes: {
				url: 'href',
			},
			className: 'my-plugin-link',
			edit: function( props ) {
				return wp.element.createElement(
					wp.blockEditor.RichTextToolbarButton, {
						icon: 'admin-links',
						title: 'Custom Link',
						onClick: function() {
							props.onChange(
								wp.richText.toggleFormat(
									props.value, {
										type: 'my-plugin/link',
										attributes: {
											url: 'https://example.com',
										}
									}
								)
							);
						},
						isActive: props.isActive,
					}
				);
			}
		}
	);
} )();
