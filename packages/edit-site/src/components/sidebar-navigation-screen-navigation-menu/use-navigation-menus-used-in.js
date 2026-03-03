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

/**
 * Searches a block tree for a core/navigation block that matches menuId.
 *
 * Matching rules:
 *  1. Explicit ref: `block.attributes.ref === menuId` — always matches.
 *  2. Unbound block (no ref) with NO inner blocks AND the current menu is
 *     the fallback menu — the block has no inline content so WordPress will
 *     resolve it to the site's fallback navigation at render time.
 *  3. Unbound block WITH inner blocks — self-contained with hardcoded links,
 *     does not use any navigation menu, never matches.
 *
 * @param {Array}   blocks         Block tree to search.
 * @param {number}  menuId         Navigation menu ID to match.
 * @param {boolean} isFallbackMenu Whether menuId is the site's fallback menu.
 * @return {boolean} True if a matching navigation block was found.
 */
function findNavigationBlocksInBlocks( blocks, menuId, isFallbackMenu ) {
	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		if ( innerBlocks ) {
			stack.unshift( ...innerBlocks );
		}
		if ( block.name === 'core/navigation' ) {
			// eslint-disable-next-line no-console
			console.log(
				`[useNavigationMenusUsedIn] nav block: ref=${
					block.attributes?.ref
				} innerBlocks=${
					innerBlocks?.length ?? 0
				} menuId=${ menuId } isFallbackMenu=${ isFallbackMenu }`
			);
			if ( block.attributes?.ref === menuId ) {
				return true;
			}
			if (
				! block.attributes?.ref &&
				! innerBlocks?.length &&
				isFallbackMenu
			) {
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
 * @return {{ usageMap: Map<number, Object[]>, isResolving: boolean }} Map of menu IDs to the template parts that use each menu, and a loading flag.
 */
export default function useNavigationMenusUsedIn( menuIds ) {
	const { records: templateParts, isResolving: isResolvingParts } =
		useEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, {
			per_page: -1,
		} );

	// Identify the fallback navigation menu: WordPress resolves unbound
	// navigation blocks (no ref, no inner items) to the most recently
	// created published navigation menu at render time.
	const { records: fallbackMenus, isResolving: isResolvingFallback } =
		useEntityRecords( 'postType', 'wp_navigation', {
			per_page: 1,
			orderby: 'date',
			order: 'desc',
			status: 'publish',
			_fields: 'id',
		} );

	const fallbackMenuId = fallbackMenus?.[ 0 ]?.id;

	const usageMap = useMemo( () => {
		if ( ! templateParts || ! menuIds?.length ) {
			return new Map();
		}

		// eslint-disable-next-line no-console
		console.log(
			`[useNavigationMenusUsedIn] templateParts=${ templateParts.length } fallbackMenuId=${ fallbackMenuId }`
		);

		const map = new Map();
		for ( const menuId of menuIds ) {
			const isFallbackMenu = menuId === fallbackMenuId;
			const usedIn = templateParts.filter( ( templatePart ) => {
				if ( ! templatePart?.content?.raw ) {
					return false;
				}
				const blocks = parse( templatePart.content.raw );
				const matched = findNavigationBlocksInBlocks(
					blocks,
					menuId,
					isFallbackMenu
				);
				// eslint-disable-next-line no-console
				console.log(
					`[useNavigationMenusUsedIn] part=${ templatePart.slug } menuId=${ menuId } isFallbackMenu=${ isFallbackMenu } matched=${ matched }`
				);
				return matched;
			} );
			map.set( menuId, usedIn );
		}
		return map;
	}, [ templateParts, menuIds, fallbackMenuId ] );

	return {
		usageMap,
		isResolving: isResolvingParts || isResolvingFallback,
	};
}
