/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE } from '../utils/constants';

/**
 * Extracts navigation menu ref IDs from template part content.
 *
 * @param {string} content - Raw content of the template part.
 * @return {number[]} Array of menu IDs referenced in the content.
 */
function extractNavigationRefs( content ) {
	if ( ! content ) {
		return [];
	}
	const refPattern = /<!-- wp:navigation[^>]*"ref"[^:]*:\s*["']?(\d+)["']?/gi;
	const refs = [];
	let match;
	while ( ( match = refPattern.exec( content ) ) !== null ) {
		refs.push( parseInt( match[ 1 ], 10 ) );
	}
	return refs;
}

/**
 * Hook that returns the set of navigation menu IDs that are used in at least one template part,
 * and a map of menu ID to location count.
 *
 * @return {Object} { activeMenuIds: Set<number>, menuLocationCounts: Map<number, number>, isResolving: boolean }
 */
export default function useMenuIdsWithActiveLocations() {
	const { records } = useEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, {
		per_page: -1,
		status: [ 'publish', 'draft' ],
	} );

	const { activeMenuIds, menuLocationCounts } = useMemo( () => {
		const set = new Set();
		const counts = new Map();
		if ( ! records ) {
			return { activeMenuIds: set, menuLocationCounts: counts };
		}
		for ( const tp of records ) {
			const refs = extractNavigationRefs( tp.content?.raw );
			const uniqueRefs = [ ...new Set( refs ) ];
			uniqueRefs.forEach( ( id ) => {
				set.add( id );
				counts.set( id, ( counts.get( id ) ?? 0 ) + 1 );
			} );
		}
		return { activeMenuIds: set, menuLocationCounts: counts };
	}, [ records ] );

	return {
		activeMenuIds,
		menuLocationCounts,
		isResolving: ! records,
	};
}
