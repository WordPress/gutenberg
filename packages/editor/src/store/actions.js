/**
 * External Dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { getDefaultBlockName, createBlock } from '@wordpress/blocks';

/**
 * Returns an action object used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post  Post object.
 * @param {Object} edits Initial edited attributes object.
 *
 * @return {Object} Action object.
 */
export function setupEditor( post, edits ) {
	return {
		type: 'SETUP_EDITOR',
		post,
		edits,
	};
}

/**
 * Returns an action object used in signalling that the latest version of the
 * post has been received, either by initialization or save.
 *
 * @param {Object} post Post object.
 *
 * @return {Object} Action object.
 */
export function resetPost( post ) {
	return {
		type: 'RESET_POST',
		post,
	};
}

/**
 * Returns an action object used in signalling that the latest autosave of the
 * post has been received, by initialization or autosave.
 *
 * @param {Object} post Autosave post object.
 *
 * @return {Object} Action object.
 */
export function resetAutosave( post ) {
	return {
		type: 'RESET_AUTOSAVE',
		post,
	};
}

/**
 * Returns an action object used in signalling that a patch of updates for the
 * latest version of the post have been received.
 *
 * @param {Object} edits Updated post fields.
 *
 * @return {Object} Action object.
 */
export function updatePost( edits ) {
	return {
		type: 'UPDATE_POST',
		edits,
	};
}

/**
 * Returns an action object used to setup the editor state when first opening an editor.
 *
 * @param {Object} post   Post object.
 * @param {Array}  blocks Array of blocks.
 *
 * @return {Object} Action object.
 */
export function setupEditorState( post, blocks ) {
	return {
		type: 'SETUP_EDITOR_STATE',
		post,
		blocks,
	};
}

/**
 * Returns an action object used in signalling that blocks state should be
 * reset to the specified array of blocks, taking precedence over any other
 * content reflected as an edit in state.
 *
 * @param {Array} blocks Array of blocks.
 *
 * @return {Object} Action object.
 */
export function resetBlocks( blocks ) {
	return {
		type: 'RESET_BLOCKS',
		blocks,
	};
}

/**
 * Returns an action object used in signalling that blocks have been received.
 * Unlike resetBlocks, these should be appended to the existing known set, not
 * replacing.
 *
 * @param {Object[]} blocks Array of block objects.
 *
 * @return {Object} Action object.
 */
export function receiveBlocks( blocks ) {
	return {
		type: 'RECEIVE_BLOCKS',
		blocks,
	};
}

/**
 * Returns an action object used in signalling that the block attributes with
 * the specified client ID has been updated.
 *
 * @param {string} clientId   Block client ID.
 * @param {Object} attributes Block attributes to be merged.
 *
 * @return {Object} Action object.
 */
export function updateBlockAttributes( clientId, attributes ) {
	return {
		type: 'UPDATE_BLOCK_ATTRIBUTES',
		clientId,
		attributes,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been updated.
 *
 * @param {string} clientId Block client ID.
 * @param {Object} updates  Block attributes to be merged.
 *
 * @return {Object} Action object.
 */
export function updateBlock( clientId, updates ) {
	return {
		type: 'UPDATE_BLOCK',
		clientId,
		updates,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been selected, optionally accepting a position
 * value reflecting its selection directionality. An initialPosition of -1
 * reflects a reverse selection.
 *
 * @param {string}  clientId        Block client ID.
 * @param {?number} initialPosition Optional initial position. Pass as -1 to
 *                                  reflect reverse selection.
 *
 * @return {Object} Action object.
 */
export function selectBlock( clientId, initialPosition = null ) {
	return {
		type: 'SELECT_BLOCK',
		initialPosition,
		clientId,
	};
}

export function startMultiSelect() {
	return {
		type: 'START_MULTI_SELECT',
	};
}

export function stopMultiSelect() {
	return {
		type: 'STOP_MULTI_SELECT',
	};
}

export function multiSelect( start, end ) {
	return {
		type: 'MULTI_SELECT',
		start,
		end,
	};
}

export function clearSelectedBlock() {
	return {
		type: 'CLEAR_SELECTED_BLOCK',
	};
}

/**
 * Returns an action object that enables or disables block selection.
 *
 * @param {boolean} [isSelectionEnabled=true] Whether block selection should
 *                                            be enabled.

 * @return {Object} Action object.
 */
export function toggleSelection( isSelectionEnabled = true ) {
	return {
		type: 'TOGGLE_SELECTION',
		isSelectionEnabled,
	};
}

/**
 * Returns an action object signalling that a blocks should be replaced with
 * one or more replacement blocks.
 *
 * @param {(string|string[])} clientIds Block client ID(s) to replace.
 * @param {(Object|Object[])} blocks    Replacement block(s).
 *
 * @return {Object} Action object.
 */
export function replaceBlocks( clientIds, blocks ) {
	return {
		type: 'REPLACE_BLOCKS',
		clientIds: castArray( clientIds ),
		blocks: castArray( blocks ),
		time: Date.now(),
	};
}

/**
 * Returns an action object signalling that a single block should be replaced
 * with one or more replacement blocks.
 *
 * @param {(string|string[])} clientId Block client ID to replace.
 * @param {(Object|Object[])} block    Replacement block(s).
 *
 * @return {Object} Action object.
 */
export function replaceBlock( clientId, block ) {
	return replaceBlocks( clientId, block );
}

/**
 * Higher-order action creator which, given the action type to dispatch creates
 * an action creator for managing block movement.
 *
 * @param {string} type Action type to dispatch.
 *
 * @return {Function} Action creator.
 */
function createOnMove( type ) {
	return ( clientIds, rootClientId ) => {
		return {
			clientIds: castArray( clientIds ),
			type,
			rootClientId,
		};
	};
}

export const moveBlocksDown = createOnMove( 'MOVE_BLOCKS_DOWN' );
export const moveBlocksUp = createOnMove( 'MOVE_BLOCKS_UP' );

/**
 * Returns an action object signalling that an indexed block should be moved
 * to a new index.
 *
 * @param  {?string} clientId         The client ID of the block.
 * @param  {?string} fromRootClientId Root client ID source.
 * @param  {?string} toRootClientId   Root client ID destination.
 * @param  {number}  index            The index to move the block into.
 *
 * @return {Object} Action object.
 */
export function moveBlockToPosition( clientId, fromRootClientId, toRootClientId, index ) {
	return {
		type: 'MOVE_BLOCK_TO_POSITION',
		fromRootClientId,
		toRootClientId,
		clientId,
		index,
	};
}

/**
 * Returns an action object used in signalling that a single block should be
 * inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object}  block            Block object to insert.
 * @param {?number} index            Index at which block should be inserted.
 * @param {?string} rootClientId     Optional root client ID of block list on which to insert.
 * @param {?boolean} updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to true.
 *
 * @return {Object} Action object.
 */
export function insertBlock( block, index, rootClientId, updateSelection = true ) {
	return insertBlocks( [ block ], index, rootClientId, updateSelection );
}

/**
 * Returns an action object used in signalling that an array of blocks should
 * be inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object[]} blocks          Block objects to insert.
 * @param {?number}  index           Index at which block should be inserted.
 * @param {?string}  rootClientId    Optional root client ID of block list on which to insert.
 * @param {?boolean} updateSelection If true block selection will be updated.  If false, block selection will not change. Defaults to true.
 *
 * @return {Object} Action object.
 */
export function insertBlocks( blocks, index, rootClientId, updateSelection = true ) {
	return {
		type: 'INSERT_BLOCKS',
		blocks: castArray( blocks ),
		index,
		rootClientId,
		time: Date.now(),
		updateSelection,
	};
}

/**
 * Returns an action object used in signalling that the insertion point should
 * be shown.
 *
 * @param {?string} rootClientId Optional root client ID of block list on
 *                               which to insert.
 * @param {?number} index        Index at which block should be inserted.
 *
 * @return {Object} Action object.
 */
export function showInsertionPoint( rootClientId, index ) {
	return {
		type: 'SHOW_INSERTION_POINT',
		rootClientId,
		index,
	};
}

/**
 * Returns an action object hiding the insertion point.
 *
 * @return {Object} Action object.
 */
export function hideInsertionPoint() {
	return {
		type: 'HIDE_INSERTION_POINT',
	};
}

/**
 * Returns an action object resetting the template validity.
 *
 * @param {boolean}  isValid  template validity flag.
 *
 * @return {Object} Action object.
 */
export function setTemplateValidity( isValid ) {
	return {
		type: 'SET_TEMPLATE_VALIDITY',
		isValid,
	};
}

/**
 * Returns an action object synchronize the template with the list of blocks
 *
 * @return {Object} Action object.
 */
export function synchronizeTemplate() {
	return {
		type: 'SYNCHRONIZE_TEMPLATE',
	};
}

/**
 * Returns an action object used in signalling that attributes of the post have
 * been edited.
 *
 * @param {Object} edits Post attributes to edit.
 *
 * @return {Object} Action object.
 */
export function editPost( edits ) {
	return {
		type: 'EDIT_POST',
		edits,
	};
}

/**
 * Returns an action object to save the post.
 *
 * @param {Object}  options          Options for the save.
 * @param {boolean} options.isAutosave Perform an autosave if true.
 *
 * @return {Object} Action object.
 */
export function savePost( options = {} ) {
	return {
		type: 'REQUEST_POST_UPDATE',
		options,
	};
}

export function refreshPost() {
	return {
		type: 'REFRESH_POST',
	};
}

export function trashPost( postId, postType ) {
	return {
		type: 'TRASH_POST',
		postId,
		postType,
	};
}

/**
 * Returns an action object used in signalling that two blocks should be merged
 *
 * @param {string} firstBlockClientId  Client ID of the first block to merge.
 * @param {string} secondBlockClientId Client ID of the second block to merge.
 *
 * @return {Object} Action object.
 */
export function mergeBlocks( firstBlockClientId, secondBlockClientId ) {
	return {
		type: 'MERGE_BLOCKS',
		blocks: [ firstBlockClientId, secondBlockClientId ],
	};
}

/**
 * Returns an action object used in signalling that the post should autosave.
 *
 * @param {Object?} options Extra flags to identify the autosave.
 *
 * @return {Object} Action object.
 */
export function autosave( options ) {
	return savePost( { isAutosave: true, ...options } );
}

/**
 * Returns an action object used in signalling that undo history should
 * restore last popped state.
 *
 * @return {Object} Action object.
 */
export function redo() {
	return { type: 'REDO' };
}

/**
 * Returns an action object used in signalling that undo history should pop.
 *
 * @return {Object} Action object.
 */
export function undo() {
	return { type: 'UNDO' };
}

/**
 * Returns an action object used in signalling that undo history record should
 * be created.
 *
 * @return {Object} Action object.
 */
export function createUndoLevel() {
	return { type: 'CREATE_UNDO_LEVEL' };
}

/**
 * Returns an action object used in signalling that the blocks corresponding to
 * the set of specified client IDs are to be removed.
 *
 * @param {string|string[]} clientIds      Client IDs of blocks to remove.
 * @param {boolean}         selectPrevious True if the previous block should be
 *                                         selected when a block is removed.
 *
 * @return {Object} Action object.
 */
export function removeBlocks( clientIds, selectPrevious = true ) {
	return {
		type: 'REMOVE_BLOCKS',
		clientIds: castArray( clientIds ),
		selectPrevious,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID is to be removed.
 *
 * @param {string}  clientId       Client ID of block to remove.
 * @param {boolean} selectPrevious True if the previous block should be
 *                                 selected when a block is removed.
 *
 * @return {Object} Action object.
 */
export function removeBlock( clientId, selectPrevious ) {
	return removeBlocks( [ clientId ], selectPrevious );
}

/**
 * Returns an action object used to toggle the block editing mode between
 * visual and HTML modes.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {Object} Action object.
 */
export function toggleBlockMode( clientId ) {
	return {
		type: 'TOGGLE_BLOCK_MODE',
		clientId,
	};
}

/**
 * Returns an action object used in signalling that the user has begun to type.
 *
 * @return {Object} Action object.
 */
export function startTyping() {
	return {
		type: 'START_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @return {Object} Action object.
 */
export function stopTyping() {
	return {
		type: 'STOP_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the caret has entered formatted text.
 *
 * @return {Object} Action object.
 */
export function enterFormattedText() {
	return {
		type: 'ENTER_FORMATTED_TEXT',
	};
}

/**
 * Returns an action object used in signalling that the user caret has exited formatted text.
 *
 * @return {Object} Action object.
 */
export function exitFormattedText() {
	return {
		type: 'EXIT_FORMATTED_TEXT',
	};
}

/**
 * Returns an action object used to lock the editor.
 *
 * @param {Object}  lock Details about the post lock status, user, and nonce.
 *
 * @return {Object} Action object.
 */
export function updatePostLock( lock ) {
	return {
		type: 'UPDATE_POST_LOCK',
		lock,
	};
}

/**
 * Returns an action object used to fetch a single reusable block or all
 * reusable blocks from the REST API into the store.
 *
 * @param {?string} id If given, only a single reusable block with this ID will
 *                     be fetched.
 *
 * @return {Object} Action object.
 */
export function __experimentalFetchReusableBlocks( id ) {
	return {
		type: 'FETCH_REUSABLE_BLOCKS',
		id,
	};
}

/**
 * Returns an action object used in signalling that reusable blocks have been
 * received. `results` is an array of objects containing:
 *  - `reusableBlock` - Details about how the reusable block is persisted.
 *  - `parsedBlock` - The original block.
 *
 * @param {Object[]} results Reusable blocks received.
 *
 * @return {Object} Action object.
 */
export function __experimentalReceiveReusableBlocks( results ) {
	return {
		type: 'RECEIVE_REUSABLE_BLOCKS',
		results,
	};
}

/**
 * Returns an action object used to save a reusable block that's in the store to
 * the REST API.
 *
 * @param {Object} id The ID of the reusable block to save.
 *
 * @return {Object} Action object.
 */
export function __experimentalSaveReusableBlock( id ) {
	return {
		type: 'SAVE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used to delete a reusable block via the REST API.
 *
 * @param {number} id The ID of the reusable block to delete.
 *
 * @return {Object} Action object.
 */
export function __experimentalDeleteReusableBlock( id ) {
	return {
		type: 'DELETE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used in signalling that a reusable block's title is
 * to be updated.
 *
 * @param {number} id    The ID of the reusable block to update.
 * @param {string} title The new title.
 *
 * @return {Object} Action object.
 */
export function __experimentalUpdateReusableBlockTitle( id, title ) {
	return {
		type: 'UPDATE_REUSABLE_BLOCK_TITLE',
		id,
		title,
	};
}

/**
 * Returns an action object used to convert a reusable block into a static block.
 *
 * @param {string} clientId The client ID of the block to attach.
 *
 * @return {Object} Action object.
 */
export function __experimentalConvertBlockToStatic( clientId ) {
	return {
		type: 'CONVERT_BLOCK_TO_STATIC',
		clientId,
	};
}

/**
 * Returns an action object used to convert a static block into a reusable block.
 *
 * @param {string} clientIds The client IDs of the block to detach.
 *
 * @return {Object} Action object.
 */
export function __experimentalConvertBlockToReusable( clientIds ) {
	return {
		type: 'CONVERT_BLOCK_TO_REUSABLE',
		clientIds: castArray( clientIds ),
	};
}
/**
 * Returns an action object used in signalling that a new block of the default
 * type should be added to the block list.
 *
 * @param {?Object} attributes   Optional attributes of the block to assign.
 * @param {?string} rootClientId Optional root client ID of block list on which
 *                               to append.
 * @param {?number} index        Optional index where to insert the default block
 *
 * @return {Object} Action object
 */
export function insertDefaultBlock( attributes, rootClientId, index ) {
	const block = createBlock( getDefaultBlockName(), attributes );

	return insertBlock( block, index, rootClientId );
}

/**
 * Returns an action object that changes the nested settings of a given block.
 *
 * @param {string} clientId Client ID of the block whose nested setting are
 *                          being received.
 * @param {Object} settings Object with the new settings for the nested block.
 *
 * @return {Object} Action object
 */
export function updateBlockListSettings( clientId, settings ) {
	return {
		type: 'UPDATE_BLOCK_LIST_SETTINGS',
		clientId,
		settings,
	};
}

/*
 * Returns an action object used in signalling that the editor settings have been updated.
 *
 * @param {Object} settings Updated settings
 *
 * @return {Object} Action object
 */
export function updateEditorSettings( settings ) {
	return {
		type: 'UPDATE_EDITOR_SETTINGS',
		settings,
	};
}

/**
 * Returns an action object used in signalling that the user has enabled the publish sidebar.
 *
 * @return {Object} Action object
 */
export function enablePublishSidebar() {
	return {
		type: 'ENABLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user has disabled the publish sidebar.
 *
 * @return {Object} Action object
 */
export function disablePublishSidebar() {
	return {
		type: 'DISABLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used to signal that post saving is locked.
 *
 * @param  {string} lockName The lock name.
 *
 * @return {Object} Action object
 */
export function lockPostSaving( lockName ) {
	return {
		type: 'LOCK_POST_SAVING',
		lockName,
	};
}

/**
 * Returns an action object used to signal that post saving is unlocked.
 *
 * @param  {string} lockName The lock name.
 *
 * @return {Object} Action object
 */
export function unlockPostSaving( lockName ) {
	return {
		type: 'UNLOCK_POST_SAVING',
		lockName,
	};
}
