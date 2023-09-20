/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import TemplatePartNavigationMenus from './template-part-navigation-menus';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../lock-unlock';

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
	const selectedCoreStore = useSelect( coreStore );

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

	const { getNavigationFallbackId } = unlock( selectedCoreStore );
	const navigationMenuIds = navigationBlocks?.map( ( block ) => {
		// There are three different states the block can be in:
		// 1. The bloch is synced which means it had a ref attribute:
		if ( block.attributes.ref ) {
			return block.attributes.ref;
		}

		// 2. The block has defined inner blocks:
		if ( block.innerBlocks.length > 0 ) {
			return null;
		}

		// 3. The block has no inner blocks and no ref attribute, in which case
		//	we use the fallback navigation menu id:
		return getNavigationFallbackId();
	} );

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
