( function () {
	const el = wp.element.createElement;
	const Fragment = wp.element.Fragment;

	// Wraps the media picker with a marker exposing the prop plugins use to
	// recognize the featured image.
	wp.hooks.addFilter(
		'editor.MediaUpload',
		'gutenberg-test/media-upload-filter',
		function ( MediaUpload ) {
			return class FilteredMediaUpload extends MediaUpload {
				constructor( props ) {
					super( props );
					this.state = { customFlag: true };
				}

				render() {
					return el(
						Fragment,
						{},
						super.render(),
						el(
							'div',
							{
								className: 'e2e-media-upload-filter',
								'data-featured-image-flow': String(
									!! this.props.featuredImageFlow
								),
								'data-custom-state': String(
									this.state.customFlag
								),
							},
							'Media upload filter'
						)
					);
				}
			};
		}
	);
} )();
