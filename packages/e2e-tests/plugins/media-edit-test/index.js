( function () {
	const { addAction } = wp.hooks;
	const { __ } = wp.i18n;
	const { MediaEdit } = wp.mediaUtils;

	/**
	 * Override featured_media field to test MediaEdit with multiple file support.
	 * Stores data in meta.featured_media_test as an array instead of the standard
	 * single featured_media property.
	 */
	const featuredMediaOverride = {
		id: 'featured_media',
		type: 'media',
		label: __( 'Featured Image Test' ),
		Edit: ( props ) =>
			wp.element.createElement( MediaEdit, {
				...props,
				allowedTypes: [ 'image', 'audio' ],
				placeholder: __( 'Add files…' ),
				multiple: true,
			} ),
		getValue: ( { item } ) => item.meta?.featured_media_test ?? [],
		setValue: ( { item, value } ) => ( {
			...item,
			meta: { ...item.meta, featured_media_test: value },
		} ),
		enableSorting: false,
		filterBy: false,
	};

	/**
	 * Override the featured_media field for pages when the schema is registered.
	 * The hook fires AFTER built-in fields are registered, so we can override.
	 */
	addAction(
		'core.registerPostTypeSchema',
		'gutenberg-test/media-edit',
		( postType ) => {
			if ( postType === 'page' ) {
				wp.editor?.unregisterEntityField?.(
					'postType',
					'page',
					'featured_media'
				);
				wp.editor?.registerEntityField?.(
					'postType',
					'page',
					featuredMediaOverride
				);
			}
		}
	);
} )();
