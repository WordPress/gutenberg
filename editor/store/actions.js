/**
 * External Dependencies
 */
import uuid from 'uuid/v4';
import { partial, castArray } from 'lodash';

/**
 * Returns an action object used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post     Post object.
 * @param {Object} settings Editor settings object.
 *
 * @returns {Object} Action object.
 */
export function setupEditor( post, settings ) {
	return {
		type: 'SETUP_EDITOR',
		post,
		settings,
	};
}

/**
 * Returns an action object used in signalling that the latest version of the
 * post has been received, either by initialization or save.
 *
 * @param {Object} post Post object.
 *
 * @returns {Object} Action object.
 */
export function resetPost( post ) {
	return {
		type: 'RESET_POST',
		post,
	};
}

/**
 * Returns an action object used in signalling that editor has initialized as a
 * new post with specified edits which should be considered non-dirtying.
 *
 * @param {Object} edits Edited attributes object.
 *
 * @returns {Object} Action object.
 */
export function setupNewPost( edits ) {
	return {
		type: 'SETUP_NEW_POST',
		edits,
	};
}

/**
 * Returns an action object used in signalling that blocks state should be
 * reset to the specified array of blocks, taking precedence over any other
 * content reflected as an edit in state.
 *
 * @param {Array} blocks Array of blocks.
 *
 * @returns {Object} Action object.
 */
export function resetBlocks( blocks ) {
	return {
		type: 'RESET_BLOCKS',
		blocks,
	};
}

/**
 * Returns an action object used in signalling that the block attributes with
 * the specified UID has been updated.
 *
 * @param {string} uid        Block UID.
 * @param {Object} attributes Block attributes to be merged.
 *
 * @returns {Object} Action object.
 */
export function updateBlockAttributes( uid, attributes ) {
	return {
		type: 'UPDATE_BLOCK_ATTRIBUTES',
		uid,
		attributes,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified UID has been updated.
 *
 * @param {string} uid     Block UID.
 * @param {Object} updates Block attributes to be merged.
 *
 * @returns {Object} Action object.
 */
export function updateBlock( uid, updates ) {
	return {
		type: 'UPDATE_BLOCK',
		uid,
		updates,
	};
}

export function focusBlock( uid, config ) {
	return {
		type: 'UPDATE_FOCUS',
		uid,
		config,
	};
}

export function selectBlock( uid ) {
	return {
		type: 'SELECT_BLOCK',
		uid,
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

 * @returns {Object} Action object.
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
 * @param {(String|String[])} uids   Block UID(s) to replace.
 * @param {(Object|Object[])} blocks Replacement block(s).
 *
 * @returns {Object} Action object.
 */
export function replaceBlocks( uids, blocks ) {
	return {
		type: 'REPLACE_BLOCKS',
		uids: castArray( uids ),
		blocks: castArray( blocks ),
	};
}

/**
 * Returns an action object signalling that a single block should be replaced
 * with one or more replacement blocks.
 *
 * @param {(String|String[])} uid   Block UID(s) to replace.
 * @param {(Object|Object[])} block Replacement block(s).
 *
 * @returns {Object} Action object.
 */
export function replaceBlock( uid, block ) {
	return replaceBlocks( uid, block );
}

export function insertBlock( block, position ) {
	return insertBlocks( [ block ], position );
}

export function insertBlocks( blocks, position ) {
	return {
		type: 'INSERT_BLOCKS',
		blocks: castArray( blocks ),
		position,
	};
}

/**
 * Returns an action object showing the insertion point at a given index.
 *
 * @param {Number?} index Index of the insertion point.
 *
 * @returns {Object} Action object.
 */
export function showInsertionPoint( index ) {
	return {
		type: 'SHOW_INSERTION_POINT',
		index,
	};
}

/**
 * Returns an action object hiding the insertion point.
 *
 * @returns {Object} Action object.
 */
export function hideInsertionPoint() {
	return {
		type: 'HIDE_INSERTION_POINT',
	};
}

export function editPost( edits ) {
	return {
		type: 'EDIT_POST',
		edits,
	};
}

export function savePost() {
	return {
		type: 'REQUEST_POST_UPDATE',
	};
}

export function trashPost( postId, postType ) {
	return {
		type: 'TRASH_POST',
		postId,
		postType,
	};
}

export function mergeBlocks( blockA, blockB ) {
	return {
		type: 'MERGE_BLOCKS',
		blocks: [ blockA, blockB ],
	};
}

/**
 * Returns an action object used in signalling that the post should autosave.
 *
 * @returns {Object} Action object.
 */
export function autosave() {
	return {
		type: 'AUTOSAVE',
	};
}

/**
 * Returns an action object used in signalling that undo history should
 * restore last popped state.
 *
 * @returns {Object} Action object.
 */
export function redo() {
	return { type: 'REDO' };
}

/**
 * Returns an action object used in signalling that undo history should pop.
 *
 * @returns {Object} Action object.
 */
export function undo() {
	return { type: 'UNDO' };
}

/**
 * Returns an action object used in signalling that the blocks
 * corresponding to the specified UID set are to be removed.
 *
 * @param {string[]} uids Block UIDs.
 *
 * @returns {Object} Action object.
 */
export function removeBlocks( uids ) {
	return {
		type: 'REMOVE_BLOCKS',
		uids,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified UID is to be removed.
 *
 * @param {string} uid Block UID.
 *
 * @returns {Object} Action object.
 */
export function removeBlock( uid ) {
	return removeBlocks( [ uid ] );
}

/**
 * Returns an action object used to toggle the block editing mode (visual/html).
 *
 * @param {string} uid Block UID.
 *
 * @returns {Object} Action object.
 */
export function toggleBlockMode( uid ) {
	return {
		type: 'TOGGLE_BLOCK_MODE',
		uid,
	};
}

/**
 * Returns an action object used in signalling that the user has begun to type.
 *
 * @returns {Object} Action object.
 */
export function startTyping() {
	return {
		type: 'START_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @returns {Object} Action object.
 */
export function stopTyping() {
	return {
		type: 'STOP_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user toggled the
 * sidebar.
 *
 * @param {string}   sidebar     Name of the sidebar to toggle
 *                               (desktop, mobile or publish).
 * @param {Boolean?} forcedValue Force a sidebar state.
 *
 * @returns {Object} Action object.
 */
export function toggleSidebar( sidebar, forcedValue ) {
	return {
		type: 'TOGGLE_SIDEBAR',
		sidebar,
		forcedValue,
	};
}

/**
 * Returns an action object used in signalling that the user switched the active
 * sidebar tab panel.
 *
 * @param {string} panel The panel name.
 *
 * @returns {Object} Action object.
 */
export function setActivePanel( panel ) {
	return {
		type: 'SET_ACTIVE_PANEL',
		panel,
	};
}

/**
 * Returns an action object used in signalling that the user toggled a
 * sidebar panel.
 *
 * @param {string} panel The panel name.
 *
 * @returns {Object} Action object.
 */
export function toggleSidebarPanel( panel ) {
	return {
		type: 'TOGGLE_SIDEBAR_PANEL',
		panel,
	};
}

/**
 * Returns an action object used to create a notice.
 *
 * @param {string}    status  The notice status.
 * @param {WPElement} content The notice content.
 * @param {?Object}   options The notice options.  Available options:
 *                              `id` (string; default auto-generated)
 *                              `isDismissible` (boolean; default `true`).
 *
 * @returns {Object} Action object.
 */
export function createNotice( status, content, options = {} ) {
	const {
		id = uuid(),
		isDismissible = true,
		spokenMessage,
	} = options;
	return {
		type: 'CREATE_NOTICE',
		notice: {
			id,
			status,
			content,
			isDismissible,
			spokenMessage,
		},
	};
}

/**
 * Returns an action object used to remove a notice.
 *
 * @param {string} id The notice id.
 *
 * @returns {Object} Action object.
 */
export function removeNotice( id ) {
	return {
		type: 'REMOVE_NOTICE',
		noticeId: id,
	};
}

/**
 * Returns an action object used to check the state of meta boxes at a location.
 *
 * This should only be fired once to initialize meta box state. If a meta box
 * area is empty, this will set the store state to indicate that React should
 * not render the meta box area.
 *
 * Example: metaBoxes = { side: true, normal: false }.
 *
 * This indicates that the sidebar has a meta box but the normal area does not.
 *
 * @param {Object} metaBoxes Whether meta box locations are active.
 *
 * @returns {Object} Action object.
 */
export function initializeMetaBoxState( metaBoxes ) {
	return {
		type: 'INITIALIZE_META_BOX_STATE',
		metaBoxes,
	};
}

/**
 * Returns an action object used to signify that a meta box finished reloading.
 *
 * @param {string} location Location of meta box: 'normal', 'side'
 *                          or 'advanced'.
 *
 * @returns {Object} Action object.
 */
export function handleMetaBoxReload( location ) {
	return {
		type: 'HANDLE_META_BOX_RELOAD',
		location,
	};
}

/**
 * Returns an action object used to signify that a meta box finished loading.
 *
 * @param {string} location Location of meta box: 'normal', 'side'
 *                          or 'advanced'.
 *
 * @returns {Object} Action object.
 */
export function metaBoxLoaded( location ) {
	return {
		type: 'META_BOX_LOADED',
		location,
	};
}

/**
 * Returns an action object used to request meta box update.
 *
 * @param {Array} locations Locations of meta boxes: ['normal', 'side',
 *                          'advanced' ].
 *
 * @returns {Object} Action object.
 */
export function requestMetaBoxUpdates( locations ) {
	return {
		type: 'REQUEST_META_BOX_UPDATES',
		locations,
	};
}

/**
 * Returns an action object used to set meta box state changed.
 *
 * @param {string}  location   Location of meta box: 'normal', 'side'
 *                             or 'advanced'.
 * @param {boolean} hasChanged Whether the meta box has changed.
 *
 * @returns {Object} Action object.
 */
export function metaBoxStateChanged( location, hasChanged ) {
	return {
		type: 'META_BOX_STATE_CHANGED',
		location,
		hasChanged,
	};
}

/**
 * Returns an action object used to toggle a feature flag.
 *
 * @param {string} feature Featurre name.
 *
 * @returns {Object} Action object.
 */
export function toggleFeature( feature ) {
	return {
		type: 'TOGGLE_FEATURE',
		feature,
	};
}

export const createSuccessNotice = partial( createNotice, 'success' );
export const createInfoNotice = partial( createNotice, 'info' );
export const createErrorNotice = partial( createNotice, 'error' );
export const createWarningNotice = partial( createNotice, 'warning' );

/**
 * Returns an action object used to fetch a single reusable block or all
 * reusable blocks from the REST API into the store.
 *
 * @param {?string} id If given, only a single reusable block with this ID will
 *                     be fetched.
 *
 * @returns {Object} Action object.
 */
export function fetchReusableBlocks( id ) {
	return {
		type: 'FETCH_REUSABLE_BLOCKS',
		id,
	};
}

/**
 * Returns an action object used to insert or update a reusable block into
 * the store.
 *
 * @param {Object} id            The ID of the reusable block to update.
 * @param {Object} reusableBlock The new reusable block object. Any omitted keys
 *                               are not changed.
 *
 * @returns {Object} Action object.
 */
export function updateReusableBlock( id, reusableBlock ) {
	return {
		type: 'UPDATE_REUSABLE_BLOCK',
		id,
		reusableBlock,
	};
}

/**
 * Returns an action object used to save a reusable block that's in the store
 * to the REST API.
 *
 * @param {Object} id The ID of the reusable block to save.
 *
 * @returns {Object} Action object.
 */
export function saveReusableBlock( id ) {
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
 * @returns {Object} Action object.
 */
export function deleteReusableBlock( id ) {
	return {
		type: 'DELETE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used to convert a reusable block into a static
 * block.
 *
 * @param {Object} uid The ID of the block to attach.
 *
 * @returns {Object} Action object.
 */
export function convertBlockToStatic( uid ) {
	return {
		type: 'CONVERT_BLOCK_TO_STATIC',
		uid,
	};
}

/**
 * Returns an action object used to convert a static block into a reusable
 * block.
 *
 * @param {Object} uid The ID of the block to detach.
 *
 * @returns {Object} Action object.
 */
export function convertBlockToReusable( uid ) {
	return {
		type: 'CONVERT_BLOCK_TO_REUSABLE',
		uid,
	};
}

export function appendDefaultBlock() {
	return {
		type: 'APPEND_DEFAULT_BLOCK',
	};
}

export function switchEditorMode( mode ) {
	return {
		type: 'SWITCH_MODE',
		mode,
	};
}
