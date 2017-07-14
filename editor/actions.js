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
 * Returns an action object used in signalling that the user has begun to type
 * within a block's editable field.
 *
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function startTypingInBlock( uid ) {
	return {
		type: 'START_TYPING',
		uid,
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing
 * within a block's editable field.
 *
 * @param  {String} uid Block UID
 * @return {Object}     Action object
 */
export function stopTypingInBlock( uid ) {
	return {
		type: 'STOP_TYPING',
		uid,
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

export const successNotice = partial( createNotice, 'success' );
export const errorNotice = partial( createNotice, 'error' );
export const warningNotice = partial( createNotice, 'warning' );
