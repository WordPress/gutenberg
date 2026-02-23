/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';

function findNavigationBlocksInBlocks( blocks, menuId ) {
	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		if ( innerBlocks ) {
			stack.unshift( ...innerBlocks );
		}
		if ( block.name === 'core/navigation' ) {
			// Explicit ref match, or unbound block (no ref = uses the
			// site's default/fallback navigation menu).
			if ( block.attributes?.ref === menuId || ! block.attributes?.ref ) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Batch variant: returns Map<menuId, TemplatePart[]> for all given menu IDs.
 *
 * @param {number[]} menuIds Navigation menu IDs to search for.
 *
 * @return {Object} Object with usageMap (Map of menu IDs to template parts using each menu) and isResolving (whether template parts are loading).
 */
export default function useNavigationMenusUsedIn( menuIds ) {
	const { records: templateParts, isResolving } = useEntityRecords(
		'postType',
		TEMPLATE_PART_POST_TYPE,
		{ per_page: -1 }
	);

	const usageMap = useMemo( () => {
		if ( ! templateParts || ! menuIds?.length ) {
			return new Map();
		}

		const map = new Map();
		for ( const menuId of menuIds ) {
			const usedIn = templateParts.filter( ( templatePart ) => {
				if ( ! templatePart?.content?.raw ) {
					return false;
				}
				const blocks = parse( templatePart.content.raw );
				return findNavigationBlocksInBlocks( blocks, menuId );
			} );
			map.set( menuId, usedIn );
		}
		return map;
	}, [ templateParts, menuIds ] );

	return {
		usageMap,
		isResolving,
	};
}
