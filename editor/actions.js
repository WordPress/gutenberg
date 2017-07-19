/**
 * External Dependencies
 */
import uuid from 'uuid/v4';
import { partial } from 'lodash';

/**
 * Returns an action object used in signalling that the block with the
 * specified UID has been updated.
 *
 * @param  {String} uid        Block UID
 * @param  {Object} attributes Block attributes to be merged
 * @return {Object}            Action object
 */
export function updateBlockAttributes( uid, attributes ) {
	return {
		type: 'UPDATE_BLOCK_ATTRIBUTES',
		uid,
		attributes,
	};
}

export function focusBlock( uid, config ) {
	return {
		type: 'UPDATE_FOCUS',
		uid,
		config,
	};
}

export function deselectBlock( uid ) {
	return {
		type: 'TOGGLE_BLOCK_SELECTED',
		selected: false,
		uid,
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

export function replaceBlocks( uids, blocks ) {
	return {
		type: 'REPLACE_BLOCKS',
		uids,
		blocks,
	};
}

export function insertBlock( block, after ) {
	return insertBlocks( [ block ], after );
}

export function insertBlocks( blocks, after ) {
	return {
		type: 'INSERT_BLOCKS',
		blocks,
		after,
	};
}

export function showInsertionPoint() {
	return {
		type: 'SHOW_INSERTION_POINT',
	};
}

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
 * @return {Object} Action object
 */
export function autosave() {
	return {
		type: 'AUTOSAVE',
	};
}

/**
 * Returns an action object used in signalling that the post should be queued
 * for autosave after a delay.
 *
 * @return {Object} Action object
 */
export function queueAutosave() {
	return {
		type: 'QUEUE_AUTOSAVE',
	};
}

/**
 * Returns an action object used in signalling that undo history should
 * restore last popped state.
 *
 * @return {Object} Action object
 */
export function redo() {
	return { type: 'REDO' };
}

/**
 * Returns an action object used in signalling that undo history should pop.
 *
 * @return {Object} Action object
 */
export function undo() {
	return { type: 'UNDO' };
}

/**
 * Returns an action object used in signalling that the blocks
 * corresponding to the specified UID set are to be removed.
 *
 * @param  {String[]} uids Block UIDs
 * @return {Object}        Action object
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
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function removeBlock( uid ) {
	return removeBlocks( [ uid ] );
}

/**
 * Returns an action object used in signalling that the user has begun to type.
 *
 * @return {Object}     Action object
 */
export function startTyping() {
	return {
		type: 'START_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @return {Object}     Action object
 */
export function stopTyping() {
	return {
		type: 'STOP_TYPING',
	};
}

/**
 * Returns an action object used to create a notice
 *
 * @param {String}     status   The notice status
 * @param {WPElement}  content  The notice content
 * @param {String}     id       The notice id
 *
 * @return {Object}             Action object
 */
export function createNotice( status, content, id = uuid() ) {
	return {
		type: 'CREATE_NOTICE',
		notice: {
			id,
			status,
			content,
		},
	};
}

/**
 * Returns an action object used to remove a notice
 *
 * @param {String}  id  The notice id
 *
 * @return {Object}     Action object
 */
export function removeNotice( id ) {
	return {
		type: 'REMOVE_NOTICE',
		noticeId: id,
	};
}

export const createSuccessNotice = partial( createNotice, 'success' );
export const createErrorNotice = partial( createNotice, 'error' );
export const createWarningNotice = partial( createNotice, 'warning' );
