/**
 * Internal dependencies
 */
import { select, dispatch, apiFetch } from '../controls';
import {
	MODULE_KEY,
	SAVE_POST_NOTICE_ID,
	TRASH_POST_NOTICE_ID,
} from '../constants';
import {
	getNotificationArgumentsForSaveSuccess,
	getNotificationArgumentsForSaveFail,
	getNotificationArgumentsForTrashFail,
} from './utils/notice-builder';

/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Action generator for saving the current post in the editor.
 *
 * @param {Object} options
 */
export function* savePost( options = {} ) {
	const isEditedPostSaveable = yield select(
		MODULE_KEY,
		'isEditedPostSaveable'
	);
	if ( ! isEditedPostSaveable ) {
		return;
	}
	let edits = yield select(
		MODULE_KEY,
		'getPostEdits'
	);
	const isAutosave = !! options.isAutosave;

	if ( isAutosave ) {
		edits = pick( edits, [ 'title', 'content', 'excerpt' ] );
	}

	const isEditedPostNew = yield select(
		MODULE_KEY,
		'isEditedPostNew',
	);

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
	if ( isEditedPostNew ) {
		edits = { status: 'draft', ...edits };
	}

	const post = yield select(
		MODULE_KEY,
		'getCurrentPost'
	);

	const editedPostContent = yield select(
		MODULE_KEY,
		'getEditedPostContent'
	);

	let toSend = {
		...edits,
		content: editedPostContent,
		id: post.id,
	};

	const currentPostType = yield select(
		MODULE_KEY,
		'getCurrentPostType'
	);

	const postType = yield select(
		'core',
		'getPostType',
		currentPostType
	);

	yield dispatch(
		MODULE_KEY,
		'__experimentalRequestPostUpdateStart',
		options,
	);

	// Optimistically apply updates under the assumption that the post
	// will be updated. See below logic in success resolution for revert
	// if the autosave is applied as a revision.
	yield dispatch(
		MODULE_KEY,
		'__experimentalOptimisticUpdatePost',
		toSend
	);

	let path = `/wp/v2/${ postType.rest_base }/${ post.id }`;
	let method = 'PUT';
	if ( isAutosave ) {
		const autoSavePost = yield select(
			MODULE_KEY,
			'getAutosave',
		);
		// Ensure autosaves contain all expected fields, using autosave or
		// post values as fallback if not otherwise included in edits.
		toSend = {
			...pick( post, [ 'title', 'content', 'excerpt' ] ),
			...autoSavePost,
			...toSend,
		};
		path += '/autosaves';
		method = 'POST';
	} else {
		yield dispatch(
			'core/notices',
			'removeNotice',
			SAVE_POST_NOTICE_ID,
		);
		yield dispatch(
			'core/notices',
			'removeNotice',
			'autosave-exists',
		);
	}

	try {
		const newPost = yield apiFetch( {
			path,
			method,
			data: toSend,
		} );
		const resetAction = isAutosave ? 'resetAutosave' : 'resetPost';

		yield dispatch( MODULE_KEY, resetAction, newPost );

		yield dispatch(
			MODULE_KEY,
			'__experimentalRequestPostUpdateSuccess',
			{
				previousPost: post,
				post: newPost,
				options,
				postType,
				// An autosave may be processed by the server as a regular save
				// when its update is requested by the author and the post was
				// draft or auto-draft.
				isRevision: newPost.id !== post.id,
			}
		);

		const notifySuccessArgs = getNotificationArgumentsForSaveSuccess( {
			previousPost: post,
			post: newPost,
			postType,
			options,
		} );
		if ( notifySuccessArgs.length > 0 ) {
			yield dispatch(
				'core/notices',
				'createSuccessNotice',
				...notifySuccessArgs
			);
		}
	} catch ( error ) {
		yield dispatch(
			MODULE_KEY,
			'__experimentalRequestPostUpdateFailure',
			{ post, edits, error, options }
		);
		const notifyFailArgs = getNotificationArgumentsForSaveFail( {
			post,
			edits,
			error,
		} );
		if ( notifyFailArgs.length > 0 ) {
			yield dispatch(
				'core/notices',
				'createErrorNotice',
				...notifyFailArgs
			);
		}
	}
}

/**
 * Action generator used in signalling that the post should autosave.
 *
 * @param {Object?} options Extra flags to identify the autosave.
 */
export function* autosave( options ) {
	yield* actions.savePost( { isAutosave: true, ...options } );
}

/**
 * Action generator for trashing the current post in the editor.
 */
export function* trashPost() {
	const postTypeSlug = yield select(
		MODULE_KEY,
		'getCurrentPostType'
	);
	const postType = yield select(
		'core',
		'getPostType',
		postTypeSlug
	);
	yield dispatch(
		'core/notices',
		'removeNotice',
		TRASH_POST_NOTICE_ID
	);
	try {
		const post = yield select(
			MODULE_KEY,
			'getCurrentPost'
		);
		yield apiFetch(
			{
				path: `/wp/v2/${ postType.rest_base }/${ post.id }`,
				method: 'DELETE',
			}
		);

		// TODO: This should be an updatePost action (updating subsets of post
		// properties), but right now editPost is tied with change detection.
		yield dispatch(
			MODULE_KEY,
			'resetPost',
			{ ...post, status: 'trash' }
		);
	} catch ( error ) {
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			...getNotificationArgumentsForTrashFail( { error } ),
		);
	}
}

/**
 * Action generator for handling refreshing the current post.
 */
export function* refreshPost() {
	const post = yield select(
		MODULE_KEY,
		'getCurrentPost'
	);
	const postTypeSlug = yield select(
		MODULE_KEY,
		'getCurrentPostType'
	);
	const postType = yield select(
		'core',
		'getPostType',
		postTypeSlug
	);
	const newPost = yield apiFetch(
		{
			// Timestamp arg allows caller to bypass browser caching, which is
			// expected for this specific function.
			path: `/wp/v2/${ postType.rest_base }/${ post.id }?context=edit&_timestamp=${ Date.now() }`,
		}
	);
	yield dispatch(
		MODULE_KEY,
		'resetPost',
		newPost
	);
}

const actions = {
	savePost,
	autosave,
	trashPost,
	refreshPost,
};

export default actions;
