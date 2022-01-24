/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { NAVIGATION_POST_KIND, NAVIGATION_POST_POST_TYPE } from '../constants';
import { buildNavigationPostId, menuItemsQuery } from './utils';
import { menuItemsToBlocks } from './transform';

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
export const getNavigationPostForMenu = ( menuId ) => async ( {
	registry,
	dispatch,
} ) => {
	if ( ! menuId ) {
		return;
	}

	const stubPost = createStubPost( menuId );
	// Persist an empty post to warm up the state
	dispatch( persistPost( stubPost ) );

	// Dispatch startResolution to skip the execution of the real getEntityRecord resolver - it would
	// issue an http request and fail.
	const args = [
		NAVIGATION_POST_KIND,
		NAVIGATION_POST_POST_TYPE,
		stubPost.id,
	];
	registry.dispatch( coreStore ).startResolution( 'getEntityRecord', args );

	// Now let's create a proper one hydrated using actual menu items
	const menuItems = await registry
		.resolveSelect( coreStore )
		.getMenuItems( menuItemsQuery( menuId ) );

	const navigationBlock = createNavigationBlock( menuItems );
	// Persist the actual post containing the navigation block
	const builtPost = createStubPost( menuId, navigationBlock );
	dispatch( persistPost( builtPost ) );

	// Dispatch finishResolution to conclude startResolution dispatched earlier
	registry.dispatch( coreStore ).finishResolution( 'getEntityRecord', args );
};

const createStubPost = ( menuId, navigationBlock = null ) => {
	const id = buildNavigationPostId( menuId );
	return {
		id,
		slug: id,
		status: 'draft',
		type: 'page',
		blocks: navigationBlock ? [ navigationBlock ] : [],
		meta: {
			menuId,
		},
	};
};

const persistPost = ( post ) => ( { registry } ) => {
	registry
		.dispatch( coreStore )
		.receiveEntityRecords(
			NAVIGATION_POST_KIND,
			NAVIGATION_POST_POST_TYPE,
			post,
			{ id: post.id },
			false
		);
};

/**
 * Converts an adjacency list of menuItems into a navigation block.
 *
 * @param {Array} menuItems a list of menu items
 * @return {Object} Navigation block
 */
function createNavigationBlock( menuItems ) {
	const innerBlocks = menuItemsToBlocks( menuItems );

	return createBlock(
		'core/navigation',
		{
			orientation: 'vertical',
		},
		innerBlocks
	);
}
