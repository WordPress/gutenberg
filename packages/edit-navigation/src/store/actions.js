/**
 * External dependencies
 */
import { zip, difference } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './constants';
import { getRecordIdFromBlock } from './utils';
import { blockToMenuItem, menuItemToBlockAttributes } from './transform';

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
 * Converts all the blocks into menu items and submits a batch request to save everything at once.
 *
 * @param {Object} post A navigation post to process
 * @return {Function} An action creator
 */
export const saveNavigationPost = ( post ) => async ( {
	registry,
	dispatch,
} ) => {
	const lock = await registry
		.dispatch( coreDataStore )
		.__unstableAcquireStoreLock( STORE_NAME, [ 'savingMenu' ], {
			exclusive: true,
		} );
	try {
		const menuId = post.meta.menuId;

		await registry
			.dispatch( coreDataStore )
			.saveEditedEntityRecord( 'root', 'menu', menuId );

		const error = registry
			.select( coreDataStore )
			.getLastEntitySaveError( 'root', 'menu', menuId );

		if ( error ) {
			throw new Error( error.message );
		}

		// Make sure all the existing menu items are available before proceeding
		const oldMenuItems = await registry
			.resolveSelect( coreDataStore )
			.getMenuItems( { menus: post.meta.menuId, per_page: -1 } );

		const annotatedBlocks = blocksTreeToFlatList(
			post.blocks[ 0 ]
		).filter( ( { block: { name } } ) => isSupportedBlock( name ) );

		await dispatch( batchInsertPlaceholderMenuItems( annotatedBlocks ) );
		await dispatch( batchUpdateMenuItems( annotatedBlocks, menuId ) );

		// Delete menu items
		const deletedIds = difference(
			oldMenuItems.map( ( { id } ) => id ),
			annotatedBlocks.map( ( { block } ) =>
				getRecordIdFromBlock( block )
			)
		);
		await dispatch( batchDeleteMenuItems( deletedIds ) );

		// Clear "stub" navigation post edits to avoid a false "dirty" state.
		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'root', 'postType', post, undefined );

		registry
			.dispatch( noticesStore )
			.createSuccessNotice( __( 'Navigation saved.' ), {
				type: 'snackbar',
			} );
	} catch ( saveError ) {
		const errorMessage = saveError
			? sprintf(
					/* translators: %s: The text of an error message (potentially untranslated). */
					__( "Unable to save: '%s'" ),
					saveError.message
			  )
			: __( 'Unable to save: An error ocurred.' );
		registry.dispatch( noticesStore ).createErrorNotice( errorMessage, {
			type: 'snackbar',
		} );
	} finally {
		registry.dispatch( coreDataStore ).__unstableReleaseStoreLock( lock );
	}
};

/**
 * Creates a menu item for every block that doesn't have an associated menuItem.
 * Requests POST /wp/v2/menu-items once for every menu item created.
 *
 * @param {Object[]} annotatedBlocks Blocks to create menu items for.
 * @return {Function} An action creator
 */
const batchInsertPlaceholderMenuItems = ( annotatedBlocks ) => async ( {
	registry,
} ) => {
	const tasks = annotatedBlocks
		.filter( ( { block } ) => ! getRecordIdFromBlock( block ) )
		.map( ( { block } ) => async ( { saveEntityRecord } ) => {
			const record = await saveEntityRecord( 'root', 'menuItem', {
				title: __( 'Menu item' ),
				url: '#placeholder',
				menu_order: 1,
			} );
			block.attributes.__internalRecordId = record.id;
			return record;
		} );

	return await registry
		.dispatch( coreDataStore )
		.__experimentalBatch( tasks );
};

const batchUpdateMenuItems = ( annotatedBlocks, menuId ) => async ( {
	registry,
	dispatch,
} ) => {
	const desiredMenuItems = annotatedBlocks.map(
		( { block, parentBlock }, idx ) =>
			blockToMenuItem(
				block,
				registry
					.select( coreDataStore )
					.getMenuItem( getRecordIdFromBlock( block ) ),
				getRecordIdFromBlock( parentBlock ),
				idx,
				menuId
			)
	);

	const updateBatch = zip( desiredMenuItems, annotatedBlocks )
		.filter( ( [ menuItem ] ) =>
			dispatch( applyEdits( menuItem.id, menuItem ) )
		)
		.map(
			( [ menuItem, block ] ) => async ( { saveEditedEntityRecord } ) => {
				await saveEditedEntityRecord( 'root', 'menuItem', menuItem.id );
				// @TODO failures should be thrown in core-data
				const failure = registry
					.select( coreDataStore )
					.getLastEntitySaveError( 'root', 'menuItem', menuItem.id );
				if ( failure ) {
					throw new Error( failure );
				}
				block.attributes = menuItemToBlockAttributes(
					registry.select( coreDataStore ).getMenuItem( menuItem.id )
				);
			}
		);
	return await registry
		.dispatch( coreDataStore )
		.__experimentalBatch( updateBatch );
};

const isSupportedBlock = ( name ) =>
	[ 'core/navigation-link', 'core/navigation-submenu' ].includes( name );

const applyEdits = ( id, edits ) => ( { registry } ) => {
	// Update an existing entity record.
	registry
		.dispatch( coreDataStore )
		.editEntityRecord( 'root', 'menuItem', id, edits, {
			undoIgnore: true,
		} );

	return registry
		.select( coreDataStore )
		.hasEditsForEntityRecord( 'root', 'menuItem', id );
};

const batchDeleteMenuItems = ( deletedIds ) => async ( { registry } ) => {
	const deleteBatch = deletedIds.map(
		( id ) => async ( { deleteEntityRecord } ) => {
			const success = await deleteEntityRecord( 'root', 'menuItem', id, {
				force: true,
			} );
			// @TODO failures should be thrown in core-data
			if ( ! success ) {
				throw new Error( id );
			}
			return success;
		}
	);

	return await registry
		.dispatch( coreDataStore )
		.__experimentalBatch( deleteBatch );
};

/**
 * Turns a recursive list of blocks into a flat list of blocks.
 *
 * @param {Object} parentBlock A parent block to flatten
 * @return {Object} A flat list of blocks, annotated by their index and parent ID, consisting
 * 							    of all the input blocks and all the inner blocks in the tree.
 */
function blocksTreeToFlatList( parentBlock ) {
	return ( parentBlock.innerBlocks || [] ).flatMap( ( innerBlock, index ) =>
		[ { block: innerBlock, parentBlock, childIndex: index } ].concat(
			blocksTreeToFlatList( innerBlock )
		)
	);
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
