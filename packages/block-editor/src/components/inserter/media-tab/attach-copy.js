import { __ } from '@wordpress/i18n';

/**
 * Copy for the media panel's attach/detach affordances.
 *
 * A media category that exposes `attach`/`detach` also supplies an `attachCopy`
 * object wording them for what the source actually is — "Attach images" to a
 * post, "Add images to folder" for a media folder. Those sources are defined in
 * the `editor` package, which knows the post type or folder in question; this
 * package stays generic and renders whatever copy it is handed.
 *
 * These defaults cover a source that opts into the capabilities without
 * supplying copy, so the panel never renders an empty label.
 */
export const DEFAULT_ATTACH_COPY = {
	attachButton: __( 'Attach images' ),
	attachedNotice: () => __( 'Images attached.' ),
	noneAttachedNotice: __( 'No images were attached.' ),
	attachErrorNotice: __( 'Could not attach images.' ),
	detachAction: __( 'Detach' ),
	detachModalTitle: __( 'Detach image' ),
	detachModalBody: __(
		'Detach this image? The image will remain in the Media Library.'
	),
	detachConfirmButton: __( 'Detach' ),
	detachedNotice: __( 'Image detached.' ),
	detachErrorNotice: __( 'Could not detach image.' ),
};

/**
 * Merges a category's `attachCopy` over the defaults, so a source can supply
 * only the strings it cares to override.
 *
 * @param {Object} category The inserter media category.
 * @return {Object} The resolved attach/detach copy.
 */
export function getAttachCopy( category ) {
	return { ...DEFAULT_ATTACH_COPY, ...category?.attachCopy };
}
