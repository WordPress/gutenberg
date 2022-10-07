/**
 * WordPress dependencies
 */
import { createBlock, switchToBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { name as listItemName } from './block.json';
import { name as listName } from '../list/block.json';

export function createListItem( listItemAttributes, listAttributes, children ) {
	return createBlock(
		listItemName,
		listItemAttributes,
		! children?.length
			? []
			: [ createBlock( listName, listAttributes, children ) ]
	);
}

export function convertToListItems( blocks ) {
	const listItems = [];

	for ( let block of blocks ) {
		if ( block.name === listItemName ) {
			listItems.push( block );
		} else if ( block.name === listName ) {
			listItems.push( ...block.innerBlocks );
		} else if ( ( block = switchToBlockType( block, listName ) ) ) {
			for ( const { innerBlocks } of block ) {
				listItems.push( ...innerBlocks );
			}
		}
	}

	return listItems;
}
