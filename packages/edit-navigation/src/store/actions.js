/**
 * External dependencies
 */
import { invert, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { serialize } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	getMenuItemToClientIdMapping,
	resolveMenuItems,
	dispatch as registryDispatch,
	select as registrySelect,
	apiFetch as apiFetchControl,
} from './controls';
import { NAVIGATION_POST_KIND, NAVIGATION_POST_POST_TYPE } from '../constants';
import {
	menuItemsQuery,
	serializeProcessing,
	blockAttributesToMenuItem,
} from './utils';

/**
 * Returns an action object used to select menu.
 *
 * @param {number} menuId The menu ID.
 * @return {Object} Action object.
 */
export function setSelectedMenuId( menuId ) {
	return {
		type: 'SET_SELECTED_MENU_ID',
		menuId,
	};
}

/**
 * Creates a menu item for every block that doesn't have an associated menuItem.
 * Requests POST /wp/v2/menu-items once for every menu item created.
 *
 * @param {Object} post A navigation post to process
 * @return {Function} An action creator
 */
export const createMissingMenuItems = serializeProcessing( function* ( post ) {
	const menuId = post.meta.menuId;

	const mapping = yield getMenuItemToClientIdMapping( post.id );
	const clientIdToMenuId = invert( mapping );

	const stack = [ post.blocks[ 0 ] ];
	while ( stack.length ) {
		const block = stack.pop();
		if ( ! ( block.clientId in clientIdToMenuId ) ) {
			const menuItem = yield apiFetchControl( {
				path: `/__experimental/menu-items`,
				method: 'POST',
				data: {
					title: 'Placeholder',
					url: 'Placeholder',
					menu_order: 1,
				},
			} );

			mapping[ menuItem.id ] = block.clientId;
			const menuItems = yield resolveMenuItems( menuId );
			yield registryDispatch(
				'core',
				'receiveEntityRecords',
				'root',
				'menuItem',
				[ ...menuItems, menuItem ],
				menuItemsQuery( menuId ),
				false
			);
		}
		stack.push( ...block.innerBlocks );
	}

	yield {
		type: 'SET_MENU_ITEM_TO_CLIENT_ID_MAPPING',
		postId: post.id,
		mapping,
	};
} );

/**
 * Converts all the blocks into menu items and submits a batch request to save everything at once.
 *
 * @param {Object} post A navigation post to process
 * @return {Function} An action creator
 */
export const saveNavigationPost = serializeProcessing( function* ( post ) {
	const menuId = post.meta.menuId;
	const menuItemsByClientId = mapMenuItemsByClientId(
		yield resolveMenuItems( menuId ),
		yield getMenuItemToClientIdMapping( post.id )
	);

	try {
		// Save edits to the menu, like the menu name.
		yield registryDispatch(
			'core',
			'saveEditedEntityRecord',
			'root',
			'menu',
			menuId
		);

		const error = yield registrySelect(
			'core',
			'getLastEntitySaveError',
			'root',
			'menu',
			menuId
		);

		if ( error ) {
			throw new Error( error.message );
		}

		// saveEntityRecord for each menu item with block-based data
		// saveEntityRecord for each deleted menu item
		// Save blocks as menu items.
		const batchSaveResponse = yield* batchSave(
			menuId,
			menuItemsByClientId,
			post.blocks[ 0 ]
		);

		if ( ! batchSaveResponse.success ) {
			throw new Error( batchSaveResponse.data.message );
		}

		// Clear "stub" navigation post edits to avoid a false "dirty" state.
		yield registryDispatch(
			'core',
			'receiveEntityRecords',
			NAVIGATION_POST_KIND,
			NAVIGATION_POST_POST_TYPE,
			[ post ],
			undefined
		);

		yield registryDispatch(
			noticesStore,
			'createSuccessNotice',
			__( 'Navigation saved.' ),
			{
				type: 'snackbar',
			}
		);
	} catch ( saveError ) {
		const errorMessage = saveError
			? sprintf(
					/* translators: %s: The text of an error message (potentially untranslated). */
					__( "Unable to save: '%s'" ),
					saveError.message
			  )
			: __( 'Unable to save: An error ocurred.' );
		yield registryDispatch(
			noticesStore,
			'createErrorNotice',
			errorMessage,
			{
				type: 'snackbar',
			}
		);
	}
} );

function mapMenuItemsByClientId( menuItems, clientIdsByMenuId ) {
	const result = {};
	if ( ! menuItems || ! clientIdsByMenuId ) {
		return result;
	}
	for ( const menuItem of menuItems ) {
		const clientId = clientIdsByMenuId[ menuItem.id ];
		if ( clientId ) {
			result[ clientId ] = menuItem;
		}
	}
	return result;
}

function* batchSave( menuId, menuItemsByClientId, navigationBlock ) {
	const blocksList = blocksTreeToFlatList( navigationBlock.innerBlocks );

	const batchTasks = [];
	// Enqueue updates
	for ( const { block, parentId, position } of blocksList ) {
		const menuItem = getMenuItemForBlock( block );

		// Update an existing navigation item.
		yield registryDispatch(
			'core',
			'editEntityRecord',
			'root',
			'menuItem',
			menuItem.id,
			blockToEntityRecord( block, parentId, position ),
			{ undoIgnore: true }
		);

		const hasEdits = yield registrySelect(
			'core',
			'hasEditsForEntityRecord',
			'root',
			'menuItem',
			menuItem.id
		);

		if ( ! hasEdits ) {
			continue;
		}

		batchTasks.push( ( { saveEditedEntityRecord } ) =>
			saveEditedEntityRecord( 'root', 'menuItem', menuItem.id )
		);
	}
	return yield registryDispatch( 'core', '__experimentalBatch', batchTasks );

	// Enqueue deletes
	// @TODO

	// Create an object like { "nav_menu_item[12]": {...}} }
	// const computeKey = ( item ) => `nav_menu_item[${ item.id }]`;
	// const dataObject = keyBy( dataList, computeKey );
	//
	// // Deleted menu items should be sent as false, e.g. { "nav_menu_item[13]": false }
	// for ( const clientId in menuItemsByClientId ) {
	// 	const key = computeKey( menuItemsByClientId[ clientId ] );
	// 	if ( ! ( key in dataObject ) ) {
	// 		dataObject[ key ] = false;
	// 	}
	// }

	function blockToEntityRecord( block, parentId, position ) {
		const menuItem = omit( getMenuItemForBlock( block ), 'menus', 'meta' );

		let attributes;

		if ( block.name === 'core/navigation-link' ) {
			attributes = blockAttributesToMenuItem( block.attributes );
		} else {
			attributes = {
				type: 'block',
				content: serialize( block ),
			};
		}

		return {
			...menuItem,
			...attributes,
			position,
			nav_menu_term_id: menuId,
			menu_item_parent: parentId,
			status: 'publish',
			_invalid: false,
		};
	}

	function blocksTreeToFlatList( innerBlocks, parentId = 0 ) {
		return innerBlocks.flatMap( ( block, index ) =>
			[ { block, parentId, position: index + 1 } ].concat(
				blocksTreeToFlatList(
					block.innerBlocks,
					getMenuItemForBlock( block )?.id
				)
			)
		);
	}

	function getMenuItemForBlock( block ) {
		return omit( menuItemsByClientId[ block.clientId ] || {}, '_links' );
	}
}

/**
 * Returns an action object used to open/close the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 *
 * @return {Object} Action object.
 */
export function setIsInserterOpened( value ) {
	return {
		type: 'SET_IS_INSERTER_OPENED',
		value,
	};
}
