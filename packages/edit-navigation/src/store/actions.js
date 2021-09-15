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
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './constants';
import { NAVIGATION_POST_KIND, NAVIGATION_POST_POST_TYPE } from '../constants';
import {
	addRecordIdToBlock,
	getRecordIdFromBlock,
	menuItemsQuery,
} from './utils';
import { blockToMenuItem } from './transform';

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
export const createMissingMenuItems = ( post ) => async ( {
	dispatch,
	registry,
} ) => {
	const menuId = post.meta.menuId;
	const lock = await registry
		.dispatch( coreDataStore )
		.__unstableAcquireStoreLock( STORE_NAME, [ 'savingMenu' ], {
			exclusive: false,
		} );
	try {
		// Ensure all the menu items are available before we start creating placeholders.
		await registry
			.resolveSelect( coreDataStore )
			.getMenuItems( { menus: menuId, per_page: -1 } );

		const blocks = blocksTreeToFlatList( post.blocks[ 0 ] );
		for ( const { block } of blocks ) {
			if ( block.name !== 'core/navigation-link' ) {
				continue;
			}
			if ( ! getRecordIdFromBlock( block ) ) {
				const menuItem = await dispatch(
					createPlaceholderMenuItem( menuId )
				);
				block.attributes = addRecordIdToBlock(
					block,
					menuItem.id
				).attributes;
			}
		}

		registry
			.dispatch( coreDataStore )
			.receiveEntityRecords( 'root', 'postType', post, undefined );
	} finally {
		registry.dispatch( coreDataStore ).__unstableReleaseStoreLock( lock );
	}
};

/**
 * Creates a single placeholder menu item.
 * Requests POST /wp/v2/menu-items once for every menu item created.
 *
 * @param {number} menuId Menu id to embed the placeholder in.
 * @return {Function} An action creator
 */
export const createPlaceholderMenuItem = ( menuId ) => async ( {
	registry,
} ) => {
	const existingMenuItems = await registry
		.select( coreDataStore )
		.getMenuItems( { menus: menuId, per_page: -1 } );

	const createdMenuItem = await apiFetch( {
		path: `/__experimental/menu-items`,
		method: 'POST',
		data: {
			title: 'Placeholder',
			url: 'Placeholder',
			menu_order: 1,
		},
	} );

	await registry
		.dispatch( coreDataStore )
		.receiveEntityRecords(
			'root',
			'menuItem',
			[ ...existingMenuItems, createdMenuItem ],
			menuItemsQuery( menuId ),
			false
		);

	return createdMenuItem;
};

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

		// Batch save menu items
		const oldMenuItems = await registry
			.resolveSelect( coreDataStore )
			.getMenuItems( { menus: post.meta.menuId, per_page: -1 } );

		await dispatch(
			batchSaveChanges(
				'root',
				'menuItem',
				oldMenuItems,
				getDesiredMenuItems( post, oldMenuItems )
			)
		);

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
			: __( 'Unable to save: An error o1curred.' );
		registry.dispatch( noticesStore ).createErrorNotice( errorMessage, {
			type: 'snackbar',
		} );
	} finally {
		registry.dispatch( coreDataStore ).__unstableReleaseStoreLock( lock );
	}
};

/**
 * Converts a post into a flat list of menu item entity records,
 * representing the desired state after the save is finished.
 *
 * @param {Object}   post         The post.
 * @param {Object[]} oldMenuItems The currently stored list of menu items.
 * @return {Function} An action creator
 */
const getDesiredMenuItems = ( post, oldMenuItems ) => {
	const blocksList = blocksTreeToFlatList( post.blocks[ 0 ] );
	const items = blocksList.map( ( { block, parentBlock }, idx ) =>
		blockToMenuItem(
			block,
			oldMenuItems.find(
				( record ) => record.id === getRecordIdFromBlock( block )
			),
			getRecordIdFromBlock( parentBlock ),
			idx,
			post.meta.menuId
		)
	);

	console.log( 'items', items );
	console.log( { oldMenuItems, blocksList } );

	return items;
};

/**
 * Persists the desiredEntityRecords while preserving IDs from oldEntityRecords.
 * The batch request contains the minimal number of requests necessary to go from
 * desiredEntityRecords to oldEntityRecords.
 *
 * @param {string}   kind                 Entity kind.
 * @param {string}   type                 Entity type.
 * @param {Object[]} oldEntityRecords     The entity records that are currently persisted.
 * @param {Object[]} desiredEntityRecords The entity records are to be persisted.
 * @return {Function} An action creator
 */
const batchSaveChanges = (
	kind,
	type,
	oldEntityRecords,
	desiredEntityRecords
) => async ( { dispatch, registry } ) => {
	const changeset = dispatch(
		prepareChangeset( kind, type, oldEntityRecords, desiredEntityRecords )
	);

	const results = await registry
		.dispatch( coreDataStore )
		.__experimentalBatch( changeset.map( ( { batchTask } ) => batchTask ) );

	const failures = dispatch(
		getFailedChanges( kind, type, changeset, results )
	);

	if ( failures.length ) {
		throw new Error(
			sprintf(
				/* translators: %s: List of numeric ids */
				__( 'Could not save the following records: %s.' ),
				failures.map( ( { id } ) => id ).join( ', ' )
			)
		);
	}

	return results;
};

/**
 * Filters the changeset for failed operations.
 *
 * @param {string}   kind       Entity kind.
 * @param {string}   entityType Entity type.
 * @param {Object[]} changeset  The changeset.
 * @param {Object[]} results    The results of persisting the changeset.
 * @return {Object[]} A list of failed changeset entries.
 */
const getFailedChanges = ( kind, entityType, changeset, results ) => ( {
	registry,
} ) => {
	const failedDeletes = zip( changeset, results )
		.filter(
			( [ change, result ] ) =>
				change.type === 'delete' &&
				! result?.hasOwnProperty( 'deleted' )
		)
		.map( ( [ change ] ) => change );

	const failedUpdates = changeset.filter(
		( change ) =>
			change.type === 'update' &&
			change.id &&
			registry
				.select( coreDataStore )
				.getLastEntitySaveError( kind, entityType, change.id )
	);

	return [ ...failedDeletes, ...failedUpdates ];
};

/**
 * Diffs oldEntityRecords and desiredEntityRecords, returning a list of
 * create, delete, and update tasks necessary to go from the former to the latter.
 *
 * @param {string}   kind                 Entity kind.
 * @param {string}   type                 Entity type.
 * @param {Object[]} oldEntityRecords     The entity records that are currently persisted.
 * @param {Object[]} desiredEntityRecords The entity records are to be persisted.
 * @return {Function} An action creator
 */
const prepareChangeset = (
	kind,
	type,
	oldEntityRecords,
	desiredEntityRecords
) => ( { registry } ) => {
	const deletedEntityRecordsIds = new Set(
		difference(
			oldEntityRecords.map( ( { id } ) => id ),
			desiredEntityRecords.map( ( { id } ) => id )
		)
	);

	const changes = [];
	// Enqueue updates
	for ( const entityRecord of desiredEntityRecords ) {
		if (
			! entityRecord?.id ||
			deletedEntityRecordsIds.has( entityRecord?.id )
		) {
			continue;
		}

		// Update an existing entity record.
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( kind, type, entityRecord.id, entityRecord, {
				undoIgnore: true,
			} );

		const hasEdits = registry
			.select( coreDataStore )
			.hasEditsForEntityRecord( kind, type, entityRecord.id );

		if ( ! hasEdits ) {
			continue;
		}

		changes.unshift( {
			type: 'update',
			id: entityRecord.id,
			batchTask: ( { saveEditedEntityRecord } ) =>
				saveEditedEntityRecord( kind, type, entityRecord.id ),
		} );
	}

	// Enqueue deletes
	for ( const entityRecordId of deletedEntityRecordsIds ) {
		changes.unshift( {
			type: 'delete',
			id: entityRecordId,
			batchTask: ( { deleteEntityRecord } ) =>
				deleteEntityRecord( kind, type, entityRecordId, {
					force: true,
				} ),
		} );
	}

	return changes;
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
