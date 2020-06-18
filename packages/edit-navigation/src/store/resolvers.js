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
	const stubPost = createStubPost( menuId );
	// Persist an empty post to warm up the state
	yield persistPost( stubPost );

	// Dispatch startResolution to skip the execution of the real getEntityRecord resolver - it would
	// issue an http request and fail.
	const args = [ KIND, POST_TYPE, stubPost.id ];
	yield dispatch( 'core', 'startResolution', 'getEntityRecord', args );

	// Now let's create a proper one hydrated using actual menu items
	const menuItems = yield resolveMenuItems( menuId );
	const [ navigationBlock, menuItemIdToClientId ] = createNavigationBlock(
		menuItems
	);
	yield {
		type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
		postId: stubPost.id,
		mapping: menuItemIdToClientId,
	};
	// Persist the actual post containing the navigation block
	yield persistPost( createStubPost( menuId, navigationBlock ) );

	// Dispatch finishResolution to conclude startResolution dispatched earlier
	yield dispatch( 'core', 'finishResolution', 'getEntityRecord', args );
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

const createStubPost = ( menuId, navigationBlock ) => {
	const id = buildNavigationPostId( menuId );
	return {
		id,
		slug: id,
		status: 'draft',
		type: 'page',
		blocks: [ navigationBlock ],
		meta: {
			menuId,
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
