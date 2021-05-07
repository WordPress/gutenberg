/**
 * External dependencies
 */
import { groupBy, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { parse, createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { menuItemToBlockAttributes } from './map-menu-items-to-blocks';

/**
 * Convert a flat menu item structure to a nested blocks structure.
 *
 * @param {Object[]} menuItems An array of menu items.
 *
 * @return {WPBlock[]} An array of blocks.
 */
export default function convertMenuItemsToBlocks( menuItems ) {
	if ( ! menuItems ) {
		return null;
	}

	// const menuTree = createDataTree( menuItems );
	// return mapMenuItemsToBlocks( menuTree );
	const { innerBlocks } = mapMenuItemsToBlocks( menuItems );

	return innerBlocks;
}

// COPIED FROM packages/edit-navigation/src/store/resolvers.js
export function mapMenuItemsToBlocks( menuItems ) {
	if ( ! menuItems ) {
		return null;
	}
	const itemsByParentID = groupBy( menuItems, 'parent' );
	const menuItemIdToClientId = {};
	const menuItemsToTreeOfBlocks = ( items ) => {
		const innerBlocks = [];
		const sortedItems = sortBy( items, 'menu_order' );

		for ( const item of sortedItems ) {
			let menuItemInnerBlocks = [];
			if ( itemsByParentID[ item.id ]?.length ) {
				menuItemInnerBlocks = menuItemsToTreeOfBlocks(
					itemsByParentID[ item.id ]
				);
			}
			const block = convertMenuItemToBlock( item, menuItemInnerBlocks );
			menuItemIdToClientId[ item.id ] = block.clientId;
			innerBlocks.push( block );
		}
		return innerBlocks;
	};

	// menuItemsToTreeOfBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
	const innerBlocks = menuItemsToTreeOfBlocks( itemsByParentID[ 0 ] || [] );
	return { innerBlocks, menuItemIdToClientId };
}

function convertMenuItemToBlock( menuItem, innerBlocks = [] ) {
	if ( menuItem.type === 'block' ) {
		const [ block ] = parse( menuItem.content.raw );

		if ( ! block ) {
			return createBlock( 'core/freeform', {
				originalContent: menuItem.content.raw,
			} );
		}

		return createBlock( block.name, block.attributes, innerBlocks );
	}

	const attributes = menuItemToBlockAttributes( menuItem );

	return createBlock( 'core/navigation-link', attributes, innerBlocks );
}
// END COPIED FROM packages/edit-navigation/src/store/resolvers.js
