/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

/**
 * Internal dependencies
 */
import { POST_UPDATE_TRANSACTION_ID } from '../constants';

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
 * Optimistic action for dispatching that a post update request has started.
 *
 * @param {Object} options
 * @return {Object} An action object
 */
export function __experimentalRequestPostUpdateStart( options = {} ) {
	return {
		type: 'REQUEST_POST_UPDATE_START',
		optimist: { type: BEGIN, id: POST_UPDATE_TRANSACTION_ID },
		options,
	};
}

/**
 * Optimistic action for indicating that the request post update has completed
 * successfully.
 *
 * @param {Object} previousPost The previous post prior to update.
 * @param {Object} post	The new post after update
 * @param {boolean} isRevision Whether the post is a revision or not.
 * @param {Object} options Options passed through from the original action
 * dispatch.
 * @param {Object} postType The post type object.
 * @return {Object} Action object.
 */
export function __experimentalRequestPostUpdateSuccess( {
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
 * Optimistic action for indicating that the request post update has completed
 * with a failure.
 *
 * @param {Object} post The post that failed updating.
 * @param {Object} edits The fields that were being updated.
 * @param {*} error  The error from the failed call.
 * @param {Object} options  Options passed through from the original action
 * dispatch.
 * @return {Object} An action object
 */
export function __experimentalRequestPostUpdateFailure( {
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
 * Returns action object produced by the updatePost creator augmented by
 * an optimist option that signals optimistically applying updates.
 *
 * @param {Object} edits  Updated post fields.
 * @return {Object} Action object.
 */
export function __experimentalOptimisticUpdatePost( edits ) {
	return {
		...updatePost( edits ),
		optimist: { id: POST_UPDATE_TRANSACTION_ID },
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
