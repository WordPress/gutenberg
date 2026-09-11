( function () {
	const el = wp.element.createElement;
	const Fragment = wp.element.Fragment;

	// Wraps the media picker with a marker exposing the prop plugins use to
	// recognize the featured image.
	wp.hooks.addFilter(
		'editor.MediaUpload',
		'gutenberg-test/media-upload-filter',
		function ( MediaUpload ) {
			return function ( props ) {
				return el(
					Fragment,
					{},
					el( MediaUpload, props ),
					el(
						'div',
						{
							className: 'e2e-media-upload-filter',
							'data-featured-image-flow': String(
								!! props.unstableFeaturedImageFlow
							),
						},
						'Media upload filter'
					)
				);
			};
		}
	);
} )();
