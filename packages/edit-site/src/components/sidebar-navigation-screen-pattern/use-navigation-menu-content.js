/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import TemplatePartNavigationMenus from './template-part-navigation-menus';
import useEditedEntityRecord from '../use-edited-entity-record';

/**
 * Retrieves a list of specific blocks from a given tree of blocks.
 *
 * @param {string} targetBlockType The name of the block type to find.
 * @param {Array}  blocks          A list of blocks from a template part entity.
 *
 * @return {Array} A list of any navigation blocks found in the blocks.
 */
function getBlocksOfTypeFromBlocks( targetBlockType, blocks ) {
	if ( ! targetBlockType || ! blocks?.length ) {
		return [];
	}

	const findInBlocks = ( _blocks ) => {
		if ( ! _blocks ) {
			return [];
		}

		const navigationBlocks = [];

		for ( const block of _blocks ) {
			if ( block.name === targetBlockType ) {
				navigationBlocks.push( block );
			}

			if ( block?.innerBlocks ) {
				const innerNavigationBlocks = findInBlocks( block.innerBlocks );

				if ( innerNavigationBlocks.length ) {
					navigationBlocks.push( ...innerNavigationBlocks );
				}
			}
		}

		return navigationBlocks;
	};

	return findInBlocks( blocks );
}

export default function useNavigationMenuContent( postType, postId ) {
	const { record } = useEditedEntityRecord( postType, postId );

	// Only managing navigation menus in template parts is supported
	// to match previous behaviour. This could potentially be expanded
	// to patterns as well.
	if ( postType !== 'wp_template_part' ) {
		return;
	}

	const blocks =
		record?.content && typeof record.content !== 'function'
			? parse( record.content )
			: [];

	const navigationBlocks = getBlocksOfTypeFromBlocks(
		'core/navigation',
		blocks
	);

	if ( ! navigationBlocks.length ) {
		return;
	}

	const navigationMenuIds = navigationBlocks?.map(
		( block ) => block.attributes.ref
	);

	// Dedupe the Navigation blocks, as you can have multiple navigation blocks in the template.
	// Also, filter out undefined values, as blocks don't have an id when initially added.
	const uniqueNavigationMenuIds = [ ...new Set( navigationMenuIds ) ].filter(
		( menuId ) => menuId
	);

	if ( ! uniqueNavigationMenuIds?.length ) {
		return;
	}

	return <TemplatePartNavigationMenus menus={ uniqueNavigationMenuIds } />;
}
