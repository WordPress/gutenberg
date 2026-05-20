/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Block bindings source for resolving entity properties from explicit entity args.
 *
 * This is intentionally **not** tied to the current editor context (e.g. the post being edited).
 * Consumers must pass the entity identifiers via `args`.
 *
 * Supported args:
 * - `key`: Currently only supports `url`
 * - `kind`: `post-type` | `taxonomy`
 * - `type`: post type slug (e.g. `page`) or taxonomy slug (e.g. `category`, `post_tag`)
 * - `id`: entity ID
 *
 * @type {WPBlockBindingsSource}
 */
export default {
	name: 'core/entity',
	label: __( 'Entity' ),
	getValues( { select, bindings } ) {
		const entityBinding = bindings?.url;
		const key = entityBinding?.args?.key;
		const kind = entityBinding?.args?.kind;
		const type = entityBinding?.args?.type;
		const id = entityBinding?.args?.id;

		// Validate required args.
		if ( key !== 'url' || ! kind || ! type || ! id ) {
			return {};
		}

		// Only support `post-type` and `taxonomy` for now.
		if ( kind !== 'post-type' && kind !== 'taxonomy' ) {
			return {};
		}

		const { getEntityRecord } = select( coreDataStore );

		if ( kind === 'post-type' ) {
			const post = getEntityRecord( 'postType', type, id );
			const url = post?.link || '';
			return url ? { url } : {};
		}

		// Taxonomy entities.
		const taxonomySlug = type === 'tag' ? 'post_tag' : type;
		const term = getEntityRecord( 'taxonomy', taxonomySlug, id );
		const url = term?.link || '';
		return url ? { url } : {};
	},
	canUserEditValue() {
		// Read-only; the URL is derived from entity data.
		return false;
	},
};
