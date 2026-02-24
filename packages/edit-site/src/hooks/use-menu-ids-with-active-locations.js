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
 * Hook that returns the set of navigation menu IDs that are used in at least one template part.
 *
 * @return {Object} { activeMenuIds: Set<number>, isResolving: boolean }
 */
export default function useMenuIdsWithActiveLocations() {
	const { records } = useEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, {
		per_page: -1,
		status: [ 'publish', 'draft' ],
	} );

	const activeMenuIds = useMemo( () => {
		const set = new Set();
		if ( ! records ) {
			return set;
		}
		for ( const tp of records ) {
			const refs = extractNavigationRefs( tp.content?.raw );
			refs.forEach( ( id ) => set.add( id ) );
		}
		return set;
	}, [ records ] );

	return {
		activeMenuIds,
		isResolving: ! records,
	};
}
