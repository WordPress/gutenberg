/**
 * WordPress dependencies
 */
import { createBlock, switchToBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name as listItemName } from './block.json';
import { name as listName } from '../list/block.json';
import { name as paragraphName } from '../paragraph/block.json';

export function createListItem( listItemAttributes, listAttributes, children ) {
	return createBlock(
		listItemName,
		listItemAttributes,
		! children?.length
			? []
			: [ createBlock( listName, listAttributes, children ) ]
	);
}

function convertBlockToList( block ) {
	const list = switchToBlockType( block, listName );
	if ( list ) return list;
	const paragraph = switchToBlockType( block, paragraphName );
	if ( paragraph ) return switchToBlockType( paragraph, listName );
	return null;
}

export function convertToListItems( blocks ) {
	const listItems = [];

	for ( let block of blocks ) {
		if ( block.name === listItemName ) {
			listItems.push( block );
		} else if ( block.name === listName ) {
			listItems.push( ...block.innerBlocks );
		} else if ( ( block = convertBlockToList( block ) ) ) {
			for ( const { innerBlocks } of block ) {
				listItems.push( ...innerBlocks );
			}
		}
	}

	return listItems;
}
