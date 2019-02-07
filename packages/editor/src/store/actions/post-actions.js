/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

/**
 * Internal dependencies
 */
import { POST_UPDATE_TRANSACTION_ID } from '../constants';

/**
 * Optimistic action for requesting post update start.
 *
 * @param {Object} options
 * @return {Object} An action object
 */
export function requestPostUpdateStart( options = {} ) {
	return {
		type: 'REQUEST_POST_UPDATE_START',
		optimist: { type: BEGIN, id: POST_UPDATE_TRANSACTION_ID },
		options,
	};
}

/**
 * Optimistic action for requesting post update success.
 *
 * @param {Object} previousPost The previous post prior to update.
 * @param {Object} post	The new post after update
 * @param {boolean} isRevision Whether the post is a revision or not.
 * @param {Object} options Options passed through from the original action
 * dispatch.
 * @param {Object} postType The post type object.
 * @return {Object} Action object.
 */
export function requestPostUpdateSuccess( {
	previousPost,
	post,
	isRevision,
	options,
	postType,
} ) {
	return {
		type: 'REQUEST_POST_UPDATE_SUCCESS',
		previousPost,
		post,
		optimist: {
			// Note: REVERT is not a failure case here. Rather, it
			// is simply reversing the assumption that the updates
			// were applied to the post proper, such that the post
			// treated as having unsaved changes.
			type: isRevision ? REVERT : COMMIT,
			id: POST_UPDATE_TRANSACTION_ID,
		},
		options,
		postType,
	};
}

/**
 * Optimistic action for requesting post update failure.
 *
 * @param {Object} post The post that failed updating.
 * @param {Object} edits The fields that were being updated.
 * @param {*} error  The error from the failed call.
 * @param {Object} options  Options passed through from the original action
 * dispatch.
 * @return {Object} An action object
 */
export function requestPostUpdateFailure( {
	post,
	edits,
	error,
	options,
} ) {
	return {
		type: 'REQUEST_POST_UPDATE_FAILURE',
		optimist: { type: REVERT, id: POST_UPDATE_TRANSACTION_ID },
		post,
		edits,
		error,
		options,
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
 * Returns action object produced by the updatePost creator augmented by
 * an optimist option that signals optimistically applying updates.
 *
 * @param {Object} edits  Updated post fields.
 * @return {Object} Action object.
 */
export function optimisticUpdatePost( edits ) {
	return {
		...updatePost( edits ),
		optimist: { id: POST_UPDATE_TRANSACTION_ID },
	};
}
