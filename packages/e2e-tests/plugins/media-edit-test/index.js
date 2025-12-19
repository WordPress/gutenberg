/**
 * These are hacky tests but useful to verify MediaEdit behavior with multiple files
 * and multiple file types.
 *
 * The reasons for the hacky approach are:
 * 1. There is no current usage in core that uses MediaEdit with multiple files and multiple file types.
 * 2. Quick edit fields (`PostEditForm` component) are hardcoded and we cannot extend them at this point.
 *    This should be addressed in the future when the field probably declare explicitly whether it supports
 *    quick edit or not.
 * 3. `fields` package is a bundled one so we cannot import MediaEdit from `wp` global.
 *
 * In order to address the above, we override (unregister/register) the `featured_media` field for `page`
 * post type to use a custom field that uses `MediaEdit` with multiple file support.
 * We re-export the component as a private one from `editor` package to be able to use it here.
 * We pretend to be `@wordpress/editor` package to unlock the private APIs.
 *
 */

( function () {
	const { addAction } = wp.hooks;
	const { __ } = wp.i18n;
	const { unlock } =
		wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
			'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
			'@wordpress/editor'
		);
	const { MediaEdit } = unlock( wp.editor.privateApis );

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
				allowedTypes: [],
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
