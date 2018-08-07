/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { pick, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	resetAutosave,
	resetPost,
	updatePost,
	removeNotice,
	createSuccessNotice,
	createErrorNotice,
} from '../actions';
import {
	getCurrentPost,
	getPostEdits,
	getEditedPostContent,
	getAutosave,
	getCurrentPostType,
	isEditedPostAutosaveable,
	isEditedPostSaveable,
	isEditedPostNew,
	POST_UPDATE_TRANSACTION_ID,
} from '../selectors';
import { resolveSelector } from './utils';

/**
 * Module Constants
 */
const SAVE_POST_NOTICE_ID = 'SAVE_POST_NOTICE_ID';
export const AUTOSAVE_POST_NOTICE_ID = 'AUTOSAVE_POST_NOTICE_ID';
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
	const isAutosave = !! action.options.autosave;

	// Prevent save if not saveable.
	const isSaveable = isAutosave ? isEditedPostAutosaveable : isEditedPostSaveable;

	if ( ! isSaveable( state ) ) {
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
		isAutosave,
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
			parent: post.id,
		};

		request = apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ post.id }/autosaves`,
			method: 'POST',
			data: toSend,
		} );
	} else {
		dispatch( removeNotice( SAVE_POST_NOTICE_ID ) );
		dispatch( removeNotice( AUTOSAVE_POST_NOTICE_ID ) );

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
			isAutosave,
		} );
	} catch ( error ) {
		dispatch( {
			type: 'REQUEST_POST_UPDATE_FAILURE',
			optimist: { type: REVERT, id: POST_UPDATE_TRANSACTION_ID },
			post,
			edits,
			error,
		} );
	}
};

/**
 * Request Post Update Success Effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const requestPostUpdateSuccess = ( action, store ) => {
	const { previousPost, post, isAutosave } = action;
	const { dispatch, getState } = store;

	// TEMPORARY: If edits remain after a save completes, the user must be
	// prompted about unsaved changes. This should be refactored as part of
	// the `isEditedPostDirty` selector instead.
	//
	// See: https://github.com/WordPress/gutenberg/issues/7409
	if ( Object.keys( getPostEdits( getState() ) ).length ) {
		dispatch( { type: 'DIRTY_ARTIFICIALLY' } );
	}

	// Autosaves are neither shown a notice nor redirected.
	if ( isAutosave ) {
		return;
	}

	const publishStatus = [ 'publish', 'private', 'future' ];
	const isPublished = includes( publishStatus, previousPost.status );
	const willPublish = includes( publishStatus, post.status );

	let noticeMessage;
	let shouldShowLink = true;

	if ( ! isPublished && ! willPublish ) {
		// If saving a non-published post, don't show notice.
		noticeMessage = null;
	} else if ( isPublished && ! willPublish ) {
		// If undoing publish status, show specific notice
		noticeMessage = __( 'Post reverted to draft.' );
		shouldShowLink = false;
	} else if ( ! isPublished && willPublish ) {
		// If publishing or scheduling a post, show the corresponding
		// publish message
		noticeMessage = {
			publish: __( 'Post published!' ),
			private: __( 'Post published privately!' ),
			future: __( 'Post scheduled!' ),
		}[ post.status ];
	} else {
		// Generic fallback notice
		noticeMessage = __( 'Post updated!' );
	}

	if ( noticeMessage ) {
		dispatch( createSuccessNotice(
			<p>
				{ noticeMessage }
				{ ' ' }
				{ shouldShowLink && <a href={ post.link }>{ __( 'View post' ) }</a> }
			</p>,
			{ id: SAVE_POST_NOTICE_ID, spokenMessage: noticeMessage }
		) );
	}
};

/**
 * Request Post Update Failure Effect handler
 *
 * @param {Object} action  action object.
 * @param {Object} store   Redux Store.
 */
export const requestPostUpdateFailure = ( action, store ) => {
	const { post, edits, error } = action;

	if ( error && 'rest_autosave_no_changes' === error.code ) {
		// Autosave requested a new autosave, but there were no changes. This shouldn't
		// result in an error notice for the user.
		return;
	}

	const { dispatch } = store;

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

	const cloudflareDetailsLink = addQueryArgs(
		'post.php',
		{
			post: post.id,
			action: 'edit',
			'classic-editor': '',
			'cloudflare-error': '',
		} );

	const cloudflaredMessage = error && 'cloudflare_error' === error.code ?
		<p>
			{ noticeMessage }
			<br />
			{ __( 'Cloudflare is blocking REST API requests.' ) }
			{ ' ' }
			<a href={ cloudflareDetailsLink }>{ __( 'Learn More' ) } </a>
		</p> :
		noticeMessage;

	dispatch( createErrorNotice( cloudflaredMessage, { id: SAVE_POST_NOTICE_ID } ) );
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

	dispatch( removeNotice( TRASH_POST_NOTICE_ID ) );
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
export const trashPostFailure = ( action, store ) => {
	const message = action.error.message && action.error.code !== 'unknown_error' ? action.error.message : __( 'Trashing failed' );
	store.dispatch( createErrorNotice( message, { id: TRASH_POST_NOTICE_ID } ) );
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
		path: `/wp/v2/${ postType.rest_base }/${ post.id }`,
		data: { context: 'edit' },
	} );
	dispatch( resetPost( newPost ) );
};
