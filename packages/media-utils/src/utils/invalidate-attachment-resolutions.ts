/**
 * WordPress dependencies
 */
import type { DataRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Invalidates every cached `getEntityRecords` resolution for the `attachment`
 * post type, so components listing media attached to the current post (e.g. the
 * Gallery block's dynamic mode) re-resolve against the server after an upload.
 *
 * `invalidateResolution` only clears the exact query passed to it — on a
 * paginated grid, page 1 (where a new upload lands) would stay stale — while
 * `invalidateResolutionForStoreSelector` clears every `getEntityRecords`
 * resolution, unrelated entity types included. This walks the cached
 * resolutions and invalidates only the `['postType', 'attachment', …]` entries.
 *
 * @param registry A `@wordpress/data` registry (`useRegistry()`), or the
 *                 default-registry `{ select, dispatch }` exports.
 */
export function invalidateAttachmentResolutions(
	registry: Pick< DataRegistry, 'select' | 'dispatch' >
) {
	const resolvers = registry.select( coreStore ).getCachedResolvers();

	// getCachedResolvers() is typed as Record<string, unknown> but the values
	// are EquivalentKeyMap instances (Map-like). Cast the same way the
	// resolvers-cache-middleware does internally.
	const entityRecordResolutions = resolvers.getEntityRecords as
		| Map< string[], { status: string } >
		| undefined;

	entityRecordResolutions?.forEach( ( _value, args ) => {
		if ( args[ 0 ] === 'postType' && args[ 1 ] === 'attachment' ) {
			registry
				.dispatch( coreStore )
				.invalidateResolution( 'getEntityRecords', args );
		}
	} );
}
