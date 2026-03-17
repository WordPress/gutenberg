/**
 * Hook for invalidating all cached `getEntityRecords` resolutions for the
 * attachment post type.
 *
 * After a file upload completes the media grid needs to refresh, but
 * `invalidateResolution` only clears the exact query that is passed to it.
 * If the user is on page 2, page 1 (where the new upload would appear) stays
 * stale. Using `invalidateResolutionForStoreSelector` would work but is too
 * broad — it clears every `getEntityRecords` resolution, potentially
 * triggering unnecessary refetches for unrelated entity types.
 *
 * This hook provides a middle ground: it iterates over every cached
 * resolution for `getEntityRecords` and invalidates only the entries where
 * the first two arguments match `['postType', 'attachment']`.
 */

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';

/**
 * Returns a stable callback that invalidates all cached `getEntityRecords`
 * resolutions for `postType / attachment`, leaving every other entity type
 * untouched.
 */
export function useInvalidateAttachmentResolutions() {
	const registry = useRegistry();

	return useCallback( () => {
		const resolvers = registry.select( coreStore ).getCachedResolvers();

		// getCachedResolvers() is typed as Record<string, unknown> but the
		// values are EquivalentKeyMap instances (Map-like). Cast the same
		// way the resolvers-cache-middleware does internally.
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
	}, [ registry ] );
}
