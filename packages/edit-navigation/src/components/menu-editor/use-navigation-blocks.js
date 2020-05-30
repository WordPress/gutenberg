/**
 * External dependencies
 */
import { groupBy, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { useState, useRef, useEffect } from '@wordpress/element';

export default function useNavigationBlocks( menuItems ) {
	const [ blocks, setBlocks ] = useState( [] );
	const menuItemsRef = useRef( {} );

	// Refresh our model whenever menuItems change
	useEffect( () => {
		const [ innerBlocks, clientIdToMenuItemMapping ] = menuItemsToBlocks(
			menuItems,
			blocks[ 0 ]?.innerBlocks,
			menuItemsRef.current
		);

		const navigationBlock = blocks[ 0 ]
			? { ...blocks[ 0 ], innerBlocks }
			: createBlock( 'core/navigation', {}, innerBlocks );

		setBlocks( [ navigationBlock ] );
		menuItemsRef.current = clientIdToMenuItemMapping;
	}, [ menuItems ] );

	return {
		blocks,
		setBlocks,
		menuItemsRef,
	};
}

const menuItemsToBlocks = ( menuItems ) => {
	const itemsByParentID = groupBy( menuItems, 'parent' );
	const clientIdToMenuItemMapping = {};
	const menuItemsToTreeOfBlocks = ( items ) => {
		const innerBlocks = [];
		if ( ! items ) {
			return;
		}

		const sortedItems = sortBy( items, 'menu_order' );
		for ( const item of sortedItems ) {
			let menuItemInnerBlocks = [];
			if ( itemsByParentID[ item.id ]?.length ) {
				menuItemInnerBlocks = menuItemsToTreeOfBlocks(
					itemsByParentID[ item.id ]
				);
			}
			const linkBlock = menuItemToLinkBlock( item, menuItemInnerBlocks );
			clientIdToMenuItemMapping[ linkBlock.clientId ] = item;
			innerBlocks.push( linkBlock );
		}
		return innerBlocks;
	};

	// menuItemsToTreeOfLinkBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
	const blocks = menuItemsToTreeOfBlocks( itemsByParentID[ 0 ] || [] );
	return [ blocks, clientIdToMenuItemMapping ];
};

function menuItemToLinkBlock( menuItem, innerBlocks = [] ) {
	return createBlock(
		'core/navigation-link',
		{
			label: menuItem.title.rendered,
			url: menuItem.url,
		},
		innerBlocks
	);
}
