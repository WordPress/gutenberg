/**
 * WordPress dependencies
 */
import { switchToBlockType } from '@wordpress/blocks';

async function convertBlockToList( block ) {
	const list = await switchToBlockType( block, 'core/list' );
	if ( list ) {
		return list;
	}
	const paragraph = await switchToBlockType( block, 'core/paragraph' );
	if ( ! paragraph ) {
		return null;
	}
	return await switchToBlockType( paragraph, 'core/list' );
}

export async function convertToListItems( blocks ) {
	const listItems = [];

	for ( let block of blocks ) {
		if ( block.name === 'core/list-item' ) {
			listItems.push( block );
		} else if ( block.name === 'core/list' ) {
			listItems.push( ...block.innerBlocks );
		} else if ( ( block = await convertBlockToList( block ) ) ) {
			for ( const { innerBlocks } of block ) {
				listItems.push( ...innerBlocks );
			}
		}
	}

	return listItems;
}
