/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Default ordering for a dynamic source. `menu_order` (the manual media-library
 * order) is intentionally not used: it isn't a valid `orderby` value on the
 * media REST endpoint, so the editor preview couldn't reproduce it. Both the
 * editor query and the server resolver default to the same REST-supported order
 * so the preview matches the frontend.
 */
export const DEFAULT_ORDERBY = 'date';
export const DEFAULT_ORDER = 'desc';

/**
 * Upper bound on the number of images a dynamic source resolves, so the editor
 * query and the server render stay bounded. Kept in sync with the
 * `posts_per_page` cap in `block_core_gallery_resolve_dynamic_source()`.
 */
const MAX_IMAGES = 100;

/**
 * Maps a gallery's `dynamicContent` attribute to a query for the `attachment`
 * entity (i.e. `/wp/v2/media` collection params), used to resolve the source to
 * a list of media in the editor.
 *
 * The `source` key is the dispatch discriminator and `args` holds the
 * source's parameters. This `{ source, args }` shape mirrors the Block
 * Bindings metadata shape (`metadata.bindings.<key> = { source, args }`) so
 * dynamic mode can migrate to an `innerBlocks` binding with minimal change.
 * `args` keys are camelCase (the block-attribute convention, as used by the
 * Query block's `query` attribute); each source's resolver maps them to the
 * REST/transport names it needs. `core/attached-media` is a context-relative anchor
 * resolved here to the REST `parent` param. The server-side counterpart is
 * `block_core_gallery_resolve_dynamic_source()` in `index.php`.
 *
 * @param {Object} dynamicContent The gallery's `dynamicContent` attribute.
 * @param {Object} context        Resolution context.
 * @param {number} context.postId The current post ID.
 * @return {Object|null} A `getEntityRecords` query, or `null` when the source
 *                       cannot be resolved (unknown source or missing context).
 */
export function getSourceQuery( dynamicContent, { postId } ) {
	const { source, args = {} } = dynamicContent ?? {};

	switch ( source ) {
		case 'core/attached-media':
			if ( ! postId ) {
				return null;
			}
			return {
				parent: postId,
				per_page: MAX_IMAGES,
				// The gallery only accepts images, so constrain the source to
				// image media (matching the server resolver). This keeps the
				// editor preview in step with the rendered output for posts
				// that also have non-image attachments.
				media_type: 'image',
				// Map the camelCase `args` to the REST-named media collection
				// params, falling back to the shared defaults.
				orderby: args.orderBy ?? DEFAULT_ORDERBY,
				order: args.order ?? DEFAULT_ORDER,
			};
	}

	// Unknown or not-yet-implemented source.
	return null;
}

/**
 * Returns a sentence describing a `dynamicContent`, for use as help text beneath
 * the Source controls.
 *
 * @param {Object} dynamicContent The gallery's `dynamicContent` attribute.
 * @return {string} A translated description.
 */
export function getSourceDescription( dynamicContent ) {
	switch ( dynamicContent?.source ) {
		case 'core/attached-media':
			return __( 'Images attached to the post.' );
	}

	return __( 'Dynamic images.' );
}
