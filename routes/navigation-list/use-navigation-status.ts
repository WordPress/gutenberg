/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';

const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

/**
 * Returns a map of navigation menu IDs to their usage count in template parts.
 *
 * Fetches all template parts and the fallback navigation menu, then
 * client-side parses each template part's content to check for
 * core/navigation blocks with matching ref attributes.
 *
 * @return {Object} Object with statusMap (menuId -> count) and isResolving boolean.
 */
export default function useNavigationStatus() {
	const { records: templateParts, isResolving: isResolvingParts } =
		useEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, {
			per_page: -1,
		} );

	const { records: fallbackMenus, isResolving: isResolvingFallback } =
		useEntityRecords( 'postType', 'wp_navigation', {
			per_page: 1,
			orderby: 'date',
			order: 'desc',
			status: 'publish',
			_fields: 'id',
		} );

	const fallbackMenuId = ( fallbackMenus as any )?.[ 0 ]?.id;

	const statusMap = useMemo( () => {
		if ( ! templateParts ) {
			return {};
		}

		const counts: { [ key: number ]: number } = {};

		( templateParts as any[] ).forEach( ( part ) => {
			if ( ! part?.content?.raw ) {
				return;
			}
			const blocks = parse( part.content.raw ) as any[];

			// Find all navigation blocks in this template part
			const stack: any[] = [ ...blocks ];
			while ( stack.length ) {
				const current = stack.shift();
				if ( ! current ) {
					continue;
				}
				const innerBlocks = current.innerBlocks;
				if ( innerBlocks && Array.isArray( innerBlocks ) ) {
					stack.unshift( ...innerBlocks );
				}
				if ( current.name === 'core/navigation' ) {
					const ref = current.attributes?.ref;
					if ( ref ) {
						// Explicit reference
						counts[ ref ] = ( counts[ ref ] || 0 ) + 1;
					} else if ( ! innerBlocks?.length && fallbackMenuId ) {
						// Unbound navigation blocks count toward fallback menu
						counts[ fallbackMenuId ] =
							( counts[ fallbackMenuId ] || 0 ) + 1;
					}
				}
			}
		} );

		return counts;
	}, [ templateParts, fallbackMenuId ] );

	return {
		statusMap,
		isResolving: isResolvingParts || isResolvingFallback,
	};
}
