/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Source discriminator for "images attached to the post" — the only dynamic
 * source implemented so far. Kept as a named constant since it's referenced from
 * several call sites (the query builder, the descriptor, and the entry points
 * that switch a gallery into dynamic mode).
 */
export const ATTACHED_MEDIA = 'core/attached-media';

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
 * Per-source copy, keyed by the `source` discriminator in a gallery's
 * `dynamicContent`. Adding a dynamic source means adding an entry here; the
 * editor components read these strings instead of hardcoding source-specific
 * wording. The fields also map onto a future "Choose source" control: `title`
 * becomes an option label, `description` its help text, and `emptyMessage` the
 * canvas preview when the source resolves to nothing.
 */
const DYNAMIC_SOURCES = {
	[ ATTACHED_MEDIA ]: {
		// Short label for the entry affordance / future source chooser. Mirrors
		// the "Attached images" media inserter category name.
		title: __( 'Use attached images' ),
		// Help text shown beneath the Source controls.
		description: __( 'Images attached to the post.' ),
		// Empty-state copy for the canvas preview.
		emptyMessage: __( 'Images attached to the post will appear here.' ),
	},
};

/**
 * Returns the descriptor for a dynamic source, or `undefined` for an unknown or
 * not-yet-implemented source.
 *
 * @param {?string} source The `dynamicContent.source` discriminator.
 * @return {?Object} The source descriptor (`title`, `description`, `emptyMessage`).
 */
export function getDynamicSource( source ) {
	return DYNAMIC_SOURCES[ source ];
}

/**
 * Upper bound on the number of images a dynamic source resolves, until the
 * gallery supports pagination. Kept in sync with the `posts_per_page` cap in
 * `block_core_gallery_resolve_dynamic_source()`.
 */
export const MAX_IMAGES = 100;

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
		case ATTACHED_MEDIA:
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
				// params. Unexpected values (only reachable via hand-edited
				// markup) are coerced back to the defaults — mirroring the server
				// resolver's allow list — so the editor preview stays in step with
				// the frontend instead of issuing an invalid REST query.
				orderby:
					args.orderBy === 'date' || args.orderBy === 'title'
						? args.orderBy
						: DEFAULT_ORDERBY,
				order:
					args.order === 'asc' || args.order === 'desc'
						? args.order
						: DEFAULT_ORDER,
			};
	}

	// Unknown or not-yet-implemented source.
	return null;
}
