/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SAVE_POST_NOTICE_ID, TRASH_POST_NOTICE_ID } from '../constants';

/**
 * External dependencies
 */
import { get, includes } from 'lodash';

/**
 * Builds the arguments for a success notification dispatch.
 *
 * @param {Object} data Incoming data to build the arguments from.
 *
 * @return {Array} Arguments for dispatch. An empty array signals no
 *                 notification should be sent.
 */
export function getNotificationArgumentsForSaveSuccess( data ) {
	const { previousPost, post, postType } = data;
	// Autosaves are neither shown a notice nor redirected.
	if ( get( data.options, [ 'isAutosave' ] ) ) {
		return [];
	}

	const publishStatus = [ 'publish', 'private', 'future' ];
	const isPublished = includes( publishStatus, previousPost.status );
	const willPublish = includes( publishStatus, post.status );

	let noticeMessage;
	let shouldShowLink = get( postType, [ 'viewable' ], false );

	// Always should a notice, which will be spoken for accessibility.
	if ( ! isPublished && ! willPublish ) {
		// If saving a non-published post, don't show notice.
		noticeMessage = __( 'Draft saved' );
		shouldShowLink = false;
	} else if ( isPublished && ! willPublish ) {
		// If undoing publish status, show specific notice
		noticeMessage = postType.labels.item_reverted_to_draft;
		shouldShowLink = false;
	} else if ( ! isPublished && willPublish ) {
		// If publishing or scheduling a post, show the corresponding
		// publish message
		noticeMessage = {
			publish: postType.labels.item_published,
			private: postType.labels.item_published_privately,
			future: postType.labels.item_scheduled,
		}[ post.status ];
	} else {
		// Generic fallback notice
		noticeMessage = postType.labels.item_updated;
	}

	const actions = [];
	if ( shouldShowLink ) {
		actions.push( {
			label: postType.labels.view_item,
			url: post.link,
		} );
	}
	return [
		noticeMessage,
		{
			id: SAVE_POST_NOTICE_ID,
			type: 'snackbar',
			actions,
		},
	];
}

/**
 * Builds the fail notification arguments for dispatch.
 *
 * @param {Object} data Incoming data to build the arguments with.
 *
 * @return {Array} Arguments for dispatch. An empty array signals no
 *                 notification should be sent.
 */
export function getNotificationArgumentsForSaveFail( data ) {
	const { post, edits, error } = data;
	if ( error && 'rest_autosave_no_changes' === error.code ) {
		// Autosave requested a new autosave, but there were no changes. This shouldn't
		// result in an error notice for the user.
		return [];
	}

	const publishStatus = [ 'publish', 'private', 'future' ];
	const isPublished = publishStatus.indexOf( post.status ) !== -1;
	// If the post was being published, we show the corresponding publish error message
	// Unless we publish an "updating failed" message
	const messages = {
		publish: __( 'Publishing failed.' ),
		private: __( 'Publishing failed.' ),
		future: __( 'Scheduling failed.' ),
	};
	let noticeMessage =
		! isPublished && publishStatus.indexOf( edits.status ) !== -1
			? messages[ edits.status ]
			: __( 'Updating failed.' );

	// Check if message string contains HTML. Notice text is currently only
	// supported as plaintext, and stripping the tags may muddle the meaning.
	if ( error.message && ! /<\/?[^>]*>/.test( error.message ) ) {
		noticeMessage = [ noticeMessage, error.message ].join( ' ' );
	}
	return [
		noticeMessage,
		{
			id: SAVE_POST_NOTICE_ID,
		},
	];
}

/**
 * Builds the trash fail notification arguments for dispatch.
 *
 * @param {Object} data
 *
 * @return {Array} Arguments for dispatch.
 */
export function getNotificationArgumentsForTrashFail( data ) {
	return [
		data.error.message && data.error.code !== 'unknown_error'
			? data.error.message
			: __( 'Trashing failed' ),
		{
			id: TRASH_POST_NOTICE_ID,
		},
	];
}
