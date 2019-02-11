/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * Internal dependencies
 */
import { dispatch } from './controls';

/**
 * Returns an action object used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post      Post object.
 * @param {Object} edits     Initial edited attributes object.
 * @param {Array?} template  Block Template.
 *
 * @return {Object} Action object.
 */
export function setupEditor( post, edits, template ) {
	return {
		type: 'SETUP_EDITOR',
		post,
		edits,
		template,
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
 *
 * @return {Object} Action object.
 */
export function setupEditorState( post ) {
	return {
		type: 'SETUP_EDITOR_STATE',
		post,
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

/**
 * Returns an action object used to signal that the blocks have been updated.
 *
 * @param {Array}   blocks  Block Array.
 * @param {?Object} options Optional options.
 *
 * @return {Object} Action object
 */
export function resetEditorBlocks( blocks, options = {} ) {
	return {
		type: 'RESET_EDITOR_BLOCKS',
		blocks,
		shouldCreateUndoLevel: options.__unstableShouldCreateUndoLevel !== false,
	};
}

/**
 * Backward compatibility
 */

const getBlockEditorAction = ( name ) => function* ( ...args ) {
	yield dispatch( 'core/block-editor', name, ...args );
};

export const resetBlocks = getBlockEditorAction( 'resetBlocks' );
export const receiveBlocks = getBlockEditorAction( 'receiveBlocks' );
export const updateBlock = getBlockEditorAction( 'updateBlock' );
export const updateBlockAttributes = getBlockEditorAction( 'updateBlockAttributes' );
export const selectBlock = getBlockEditorAction( 'selectBlock' );
export const startMultiSelect = getBlockEditorAction( 'startMultiSelect' );
export const stopMultiSelect = getBlockEditorAction( 'stopMultiSelect' );
export const multiSelect = getBlockEditorAction( 'multiSelect' );
export const clearSelectedBlock = getBlockEditorAction( 'clearSelectedBlock' );
export const toggleSelection = getBlockEditorAction( 'toggleSelection' );
export const replaceBlocks = getBlockEditorAction( 'replaceBlocks' );
export const moveBlocksDown = getBlockEditorAction( 'moveBlocksDown' );
export const moveBlocksUp = getBlockEditorAction( 'moveBlocksUp' );
export const moveBlockToPosition = getBlockEditorAction( 'moveBlockToPosition' );
export const insertBlock = getBlockEditorAction( 'insertBlock' );
export const insertBlocks = getBlockEditorAction( 'insertBlocks' );
export const showInsertionPoint = getBlockEditorAction( 'showInsertionPoint' );
export const hideInsertionPoint = getBlockEditorAction( 'hideInsertionPoint' );
export const setTemplateValidity = getBlockEditorAction( 'setTemplateValidity' );
export const synchronizeTemplate = getBlockEditorAction( 'synchronizeTemplate' );
export const mergeBlocks = getBlockEditorAction( 'mergeBlocks' );
export const removeBlocks = getBlockEditorAction( 'removeBlocks' );
export const removeBlock = getBlockEditorAction( 'removeBlock' );
export const toggleBlockMode = getBlockEditorAction( 'toggleBlockMode' );
export const startTyping = getBlockEditorAction( 'startTyping' );
export const stopTyping = getBlockEditorAction( 'stopTyping' );
export const enterFormattedText = getBlockEditorAction( 'enterFormattedText' );
export const exitFormattedText = getBlockEditorAction( 'exitFormattedText' );
export const insertDefaultBlock = getBlockEditorAction( 'insertDefaultBlock' );
export const updateBlockListSettings = getBlockEditorAction( 'updateBlockListSettings' );
export const updateEditorSettings = getBlockEditorAction( 'updateEditorSettings' );
