/**
 * WordPress dependencies
 */
import { switchToBlockType } from '@wordpress/blocks';

function convertBlockToList( block ) {
	const list = switchToBlockType( block, 'core/list' );
	if ( list ) {
		return list;
	}
	const paragraph = switchToBlockType( block, 'core/paragraph' );
	if ( ! paragraph ) {
		return null;
	}
	return switchToBlockType( paragraph, 'core/list' );
}

export function convertToListItems( blocks ) {
	const listItems = [];

	for ( let block of blocks ) {
		if ( block.name === 'core/list-item' ) {
			listItems.push( block );
		} else if ( block.name === 'core/list' ) {
			listItems.push( ...block.innerBlocks );
		} else if ( ( block = convertBlockToList( block ) ) ) {
			for ( const { innerBlocks } of block ) {
				listItems.push( ...innerBlocks );
			}
		}
	}

	return listItems;
}
