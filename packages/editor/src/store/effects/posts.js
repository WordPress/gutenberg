/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { get, pick, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
// TODO: Ideally this would be the only dispatch in scope. This requires either
// refactoring editor actions to yielded controls, or replacing direct dispatch
// on the editor store with action creators (e.g. `REQUEST_POST_UPDATE_START`).
import { dispatch as dataDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	resetAutosave,
	resetPost,
	updatePost,
} from '../actions';
import {
	getCurrentPost,
	getPostEdits,
	getEditedPostContent,
	getAutosave,
	getCurrentPostType,
	isEditedPostSaveable,
	isEditedPostNew,
	POST_UPDATE_TRANSACTION_ID,
} from '../selectors';
import { resolveSelector } from './utils';

/**
 * Module Constants
 */
export const SAVE_POST_NOTICE_ID = 'SAVE_POST_NOTICE_ID';
const TRASH_POST_NOTICE_ID = 'TRASH_POST_NOTICE_ID';

/**
 * Request Post Update Effect handler
 *
 * @param {Object} action  the fetchReusableBlocks action object.
 * @param {Object} store   Redux Store.
 */
export const requestPostUpdate = async ( action, store ) => {
	const { dispatch, getState } = store;
	const state = getState();
	const post = getCurrentPost( state );
	const isAutosave = !! action.options.isAutosave;

	// Prevent save if not saveable.
	// We don't check for dirtiness here as this can be overriden in the UI.
	if ( ! isEditedPostSaveable( state ) ) {
		return;
	}

	let edits = getPostEdits( state );
	if ( isAutosave ) {
		edits = pick( edits, [ 'title', 'content', 'excerpt' ] );
	}

	// New posts (with auto-draft status) must be explicitly assigned draft
	// status if there is not already a status assigned in edits (publish).
	// Otherwise, they are wrongly left as auto-draft. Status is not always
	// respected for autosaves, so it cannot simply be included in the pick
	// above. This behavior relies on an assumption that an auto-draft post
	// would never be saved by anyone other than the owner of the post, per
	// logic within autosaves REST controller to save status field only for
	// draft/auto-draft by current user.
	//
	// See: https://core.trac.wordpress.org/ticket/43316#comment:88
	// See: https://core.trac.wordpress.org/ticket/43316#comment:89
	if ( isEditedPostNew( state ) ) {
		edits = { status: 'draft', ...edits };
	}

	let toSend = {
		...edits,
		content: getEditedPostContent( state ),
		id: post.id,
	};

	const postType = await resolveSelector( 'core', 'getPostType', getCurrentPostType( state ) );

	dispatch( {
		type: 'REQUEST_POST_UPDATE_START',
		optimist: { type: BEGIN, id: POST_UPDATE_TRANSACTION_ID },
		options: action.options,
	} );

	// Optimistically apply updates under the assumption that the post
	// will be updated. See below logic in success resolution for revert
	// if the autosave is applied as a revision.
	dispatch( {
		...updatePost( toSend ),
		optimist: { id: POST_UPDATE_TRANSACTION_ID },
	} );

	let request;
	if ( isAutosave ) {
		// Ensure autosaves contain all expected fields, using autosave or
		// post values as fallback if not otherwise included in edits.
		toSend = {
			...pick( post, [ 'title', 'content', 'excerpt' ] ),
			...getAutosave( state ),
			...toSend,
		};

		request = apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ post.id }/autosaves`,
			method: 'POST',
			data: toSend,
		} );
	} else {
		dataDispatch( 'core/notices' ).removeNotice( SAVE_POST_NOTICE_ID );
		dataDispatch( 'core/notices' ).removeNotice( 'autosave-exists' );

		request = apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ post.id }`,
			method: 'PUT',
			data: toSend,
		} );
	}

	try {
		const newPost = await request;
		const reset = isAutosave ? resetAutosave : resetPost;
		dispatch( reset( newPost ) );

		// An autosave may be processed by the server as a regular save
		// when its update is requested by the author and the post was
		// draft or auto-draft.
		const isRevision = newPost.id !== post.id;

		dispatch( {
			type: 'REQUEST_POST_UPDATE_SUCCESS',
			previousPost: post,
			post: newPost,
			optimist: {
				// Note: REVERT is not a failure case here. Rather, it
				// is simply reversing the assumption that the updates
				// were applied to the post proper, such that the post
				// treated as having unsaved changes.
				type: isRevision ? REVERT : COMMIT,
				id: POST_UPDATE_TRANSACTION_ID,
			},
			options: action.options,
			postType,
		} );
	} catch ( error ) {
		dispatch( {
			type: 'REQUEST_POST_UPDATE_FAILURE',
			optimist: { type: REVERT, id: POST_UPDATE_TRANSACTION_ID },
			post,
			edits,
			error,
			options: action.options,
		} );
	}
};

/**
 * Request Post Update Success Effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const requestPostUpdateSuccess = ( action ) => {
	const { previousPost, post, postType } = action;

	// Autosaves are neither shown a notice nor redirected.
	if ( get( action.options, [ 'isAutosave' ] ) ) {
		return;
	}

	const publishStatus = [ 'publish', 'private', 'future' ];
	const isPublished = includes( publishStatus, previousPost.status );
	const willPublish = includes( publishStatus, post.status );

	let noticeMessage;
	let shouldShowLink = get( postType, [ 'viewable' ], false );

	if ( ! isPublished && ! willPublish ) {
		// If saving a non-published post, don't show notice.
		noticeMessage = null;
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

	if ( noticeMessage ) {
		const actions = [];
		if ( shouldShowLink ) {
			actions.push( {
				label: postType.labels.view_item,
				url: post.link,
			} );
		}

		dataDispatch( 'core/notices' ).createSuccessNotice(
			noticeMessage,
			{
				id: SAVE_POST_NOTICE_ID,
				actions,
			}
		);
	}
};

/**
 * Request Post Update Failure Effect handler
 *
 * @param {Object} action  action object.
 */
export const requestPostUpdateFailure = ( action ) => {
	const { post, edits, error } = action;

	if ( error && 'rest_autosave_no_changes' === error.code ) {
		// Autosave requested a new autosave, but there were no changes. This shouldn't
		// result in an error notice for the user.
		return;
	}

	const publishStatus = [ 'publish', 'private', 'future' ];
	const isPublished = publishStatus.indexOf( post.status ) !== -1;
	// If the post was being published, we show the corresponding publish error message
	// Unless we publish an "updating failed" message
	const messages = {
		publish: __( 'Publishing failed' ),
		private: __( 'Publishing failed' ),
		future: __( 'Scheduling failed' ),
	};
	const noticeMessage = ! isPublished && publishStatus.indexOf( edits.status ) !== -1 ?
		messages[ edits.status ] :
		__( 'Updating failed' );

	dataDispatch( 'core/notices' ).createErrorNotice( noticeMessage, {
		id: SAVE_POST_NOTICE_ID,
	} );
};

/**
 * Trash Post Effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const trashPost = async ( action, store ) => {
	const { dispatch, getState } = store;
	const { postId } = action;
	const postTypeSlug = getCurrentPostType( getState() );
	const postType = await resolveSelector( 'core', 'getPostType', postTypeSlug );

	dataDispatch( 'core/notices' ).removeNotice( TRASH_POST_NOTICE_ID );
	try {
		await apiFetch( { path: `/wp/v2/${ postType.rest_base }/${ postId }`, method: 'DELETE' } );
		const post = getCurrentPost( getState() );

		// TODO: This should be an updatePost action (updating subsets of post properties),
		// But right now editPost is tied with change detection.
		dispatch( resetPost( { ...post, status: 'trash' } ) );
	} catch ( error ) {
		dispatch( {
			...action,
			type: 'TRASH_POST_FAILURE',
			error,
		} );
	}
};

/**
 * Trash Post Failure Effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const trashPostFailure = ( action ) => {
	const message = action.error.message && action.error.code !== 'unknown_error' ? action.error.message : __( 'Trashing failed' );
	dataDispatch( 'core/notices' ).createErrorNotice( message, {
		id: TRASH_POST_NOTICE_ID,
	} );
};

/**
 * Refresh Post Effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const refreshPost = async ( action, store ) => {
	const { dispatch, getState } = store;

	const state = getState();
	const post = getCurrentPost( state );
	const postTypeSlug = getCurrentPostType( getState() );
	const postType = await resolveSelector( 'core', 'getPostType', postTypeSlug );
	const newPost = await apiFetch( {
		// Timestamp arg allows caller to bypass browser caching, which is expected for this specific function.
		path: `/wp/v2/${ postType.rest_base }/${ post.id }?context=edit&_timestamp=${ Date.now() }`,
	} );
	dispatch( resetPost( newPost ) );
};
