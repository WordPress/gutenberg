/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry } from '@wordpress/data';
import { isShallowEqual } from '@wordpress/is-shallow-equal';

/**
 * Returns a callback that invalidates every cached `getEntityRecords`
 * resolution for `postType / <entityName>` when `prev` and `next` differ
 * as sets, leaving other entity types untouched.
 *
 * Used to keep post type and taxonomy list views in sync: they share a
 * server-side source of truth (the taxonomy's `_wp_user_taxonomy_object_type`
 * meta), so saving or deleting on one side leaves the opposite list cache
 * stale.
 */
export function useMaybeInvalidateContentTypeCache() {
	const registry = useRegistry();
	return useCallback(
		( prev: string[], next: string[], entityName: string ) => {
			if ( isShallowEqual( [ ...prev ].sort(), [ ...next ].sort() ) ) {
				return;
			}
			const resolvers = registry.select( coreStore ).getCachedResolvers();

			const cache = resolvers.getEntityRecords as
				| Map< unknown[], { status: string } >
				| undefined;

			cache?.forEach( ( _value, args ) => {
				if ( args[ 0 ] === 'postType' && args[ 1 ] === entityName ) {
					registry
						.dispatch( coreStore )
						.invalidateResolution( 'getEntityRecords', args );
				}
			} );
		},
		[ registry ]
	);
}
