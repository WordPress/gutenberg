/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';
// @ts-expect-error - No type declarations available for @wordpress/blocks
import { parse } from '@wordpress/blocks';

const TEMPLATE_PART_POST_TYPE = 'wp_template_part';

/**
 * Searches a block tree for a core/navigation block that references menuId.
 *
 * Matching rules:
 *  1. Explicit ref: block.attributes.ref === menuId
 *  2. Unbound block (no ref, no inner blocks) when menuId is the fallback
 *     menu — WordPress resolves these to the most recently created published
 *     navigation menu at render time.
 *
 * @param {Array}   blocks         Array of block objects to search.
 * @param {number}  menuId         Navigation menu ID to match.
 * @param {boolean} isFallbackMenu Whether menuId is the site's fallback menu.
 * @return {boolean} True if a matching navigation block was found.
 */
function blocksReferenceMenu(
	blocks: any[],
	menuId: number,
	isFallbackMenu: boolean
): boolean {
	const stack = [ ...blocks ];
	while ( stack.length ) {
		const { innerBlocks, ...block } = stack.shift();
		if ( innerBlocks ) {
			stack.unshift( ...innerBlocks );
		}
		if ( block.name === 'core/navigation' ) {
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
 * Returns template parts that reference a given navigation menu.
 *
 * Fetches all template parts and the fallback navigation menu, then
 * client-side parses each template part's content to check for
 * core/navigation blocks with a matching ref attribute.
 *
 * @param {number} menuId Navigation menu ID to find usages for.
 * @return {Object} Object with templateParts array and isResolving boolean.
 */
export default function useMenuUsedInTemplateParts( menuId: number ) {
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
	const isFallbackMenu = menuId === fallbackMenuId;

	const matchingParts = useMemo( () => {
		if ( ! templateParts || ! menuId ) {
			return [];
		}

		return ( templateParts as any[] ).filter( ( part ) => {
			if ( ! part?.content?.raw ) {
				return false;
			}
			const blocks = parse( part.content.raw );
			return blocksReferenceMenu( blocks, menuId, isFallbackMenu );
		} );
	}, [ templateParts, menuId, isFallbackMenu ] );

	return {
		templateParts: matchingParts,
		isResolving: isResolvingParts || isResolvingFallback,
	};
}
