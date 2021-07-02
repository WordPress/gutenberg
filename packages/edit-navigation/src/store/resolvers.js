/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { NAVIGATION_POST_KIND, NAVIGATION_POST_POST_TYPE } from '../constants';

import { resolveMenuItems, dispatch } from './controls';
import { buildNavigationPostId, extractColorsFromClasses } from './utils';
import menuItemsToBlocks from './menu-items-to-blocks';
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
	if ( ! menuId ) {
		return;
	}

	const stubPost = createStubPost( menuId );
	// Persist an empty post to warm up the state
	yield persistPost( stubPost );

	// Dispatch startResolution to skip the execution of the real getEntityRecord resolver - it would
	// issue an http request and fail.
	const args = [
		NAVIGATION_POST_KIND,
		NAVIGATION_POST_POST_TYPE,
		stubPost.id,
	];
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

const persistPost = ( post ) =>
	dispatch(
		'core',
		'receiveEntityRecords',
		NAVIGATION_POST_KIND,
		NAVIGATION_POST_POST_TYPE,
		post,
		{ id: post.id },
		false
	);

/**
 * Given an array of menu items, finds the colors to apply to the main navigation block
 *
 * @param {Array} menuItems a list of menu items.
 * @return {Object} color attributes for Navigation block
 */
function findColorsFromMenuItems( menuItems ) {
	const colorAttrs = {};
	// Colors should be set on all menu items so we can just use the first we
	// find. If this isn't true, we'll need to search through the menuItems for
	// ones with classes like has-color
	const topLevelItem = menuItems.find( ( i ) => i.parent === 0 );
	if ( topLevelItem ) {
		const { colors } = extractColorsFromClasses( topLevelItem.classes );
		colorAttrs.textColor = colors?.textColor;
		colorAttrs.backgroundColor = colors?.backgroundColor;
	}

	const subMenuItem = menuItems.find( ( i ) => i.parent !== 0 );
	if ( subMenuItem ) {
		const { colors: overlayColors } = extractColorsFromClasses(
			subMenuItem.classes
		);
		colorAttrs.overlayTextColor = overlayColors?.textColor;
		colorAttrs.overlayBackgroundColor = overlayColors?.backgroundColor;
	}

	return colorAttrs;
}

/**
 * Converts an adjacency list of menuItems into a navigation block.
 *
 * @param {Array} menuItems a list of menu items
 * @return {Object} Navigation block
 */
function createNavigationBlock( menuItems ) {
	const { innerBlocks, mapping: menuItemIdToClientId } = menuItemsToBlocks(
		menuItems
	);

	const colors = findColorsFromMenuItems( menuItems );

	const navigationBlock = createBlock(
		'core/navigation',
		{
			orientation: 'vertical',
			...colors,
		},
		innerBlocks
	);
	return [ navigationBlock, menuItemIdToClientId ];
}
