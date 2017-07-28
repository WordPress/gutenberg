/**
 * External Dependencies
 */
import uuid from 'uuid/v4';
import { partial } from 'lodash';

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
