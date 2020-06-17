/**
 * External dependencies
 */
import { groupBy, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { resolveMenuItems, dispatch } from './controls';
import { KIND, POST_TYPE, buildNavigationPostId } from './utils';

export function* getNavigationPost( menuId ) {
	// Ensure an empty post to start with
	yield persistPost(
		createStubPost( menuId, [], {
			isResolving: true,
		} )
	);

	// Now let's create a proper one hydrated with actual menu items
	const menuItems = yield resolveMenuItems( menuId );
	yield persistPost( createStubPost( menuId, menuItems ) );
}

const persistPost = ( post ) =>
	dispatch(
		'core',
		'receiveEntityRecords',
		KIND,
		POST_TYPE,
		post,
		{ id: post.id },
		false
	);

const createStubPost = ( menuId, menuItems, meta ) => {
	const [ navigationBlock, menuItemIdToClientId ] = createNavigationBlock(
		menuItems
	);
	const id = buildNavigationPostId( menuId );
	return {
		id,
		slug: id,
		status: 'draft',
		type: 'page',
		blocks: [ navigationBlock ],
		meta: {
			...meta,
			menuId,
			menuItemIdToClientId,
		},
	};
};

function createNavigationBlock( menuItems ) {
	const itemsByParentID = groupBy( menuItems, 'parent' );
	const menuItemIdToClientId = {};
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
			const linkBlock = convertMenuItemToLinkBlock(
				item,
				menuItemInnerBlocks
			);
			menuItemIdToClientId[ item.id ] = linkBlock.clientId;
			innerBlocks.push( linkBlock );
		}
		return innerBlocks;
	};

	// menuItemsToTreeOfLinkBlocks takes an array of top-level menu items and recursively creates all their innerBlocks
	const innerBlocks = menuItemsToTreeOfBlocks( itemsByParentID[ 0 ] || [] );
	const navigationBlock = createBlock( 'core/navigation', {}, innerBlocks );
	return [ navigationBlock, menuItemIdToClientId ];
}

function convertMenuItemToLinkBlock( menuItem, innerBlocks = [] ) {
	const attributes = {
		label: menuItem.title.rendered,
		url: menuItem.url,
	};

	return createBlock( 'core/navigation-link', attributes, innerBlocks );
}
