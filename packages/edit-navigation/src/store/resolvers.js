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

/**
 * Creates a "stub" navigation post reflecting the contents of menu with id=menuId. The
 * post is meant as a convenient to only exists in runtime and should never be saved. It
 * enables a convenient way of editing the navigation by using a regular post editor.
 *
 * Fetches all menu items, converts them into blocks, and hydrates a new post with them.
 *
 * @param {number} menuId The id of menu to create a post from
 * @return {void}
 */
export function* getNavigationPostForMenu( menuId ) {
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

/**
 * Converts an adjacency list of menuItems into a navigation block.
 *
 * @param {Array} menuItems a list of menu items
 * @return {Object} Navigation block
 */
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
