/**
 * External dependencies
 */
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import { select, dispatch, apiFetch } from '../controls';
import { MODULE_KEY, SAVE_POST_NOTICE_ID } from '../constants';
import {
	getNotifyOnSuccessNotificationArguments,
	getNotifyOnFailNotificationArguments,
} from './utils/notice-builder';

/**
 * Action generator for saving a post.
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
		'requestPostUpdateStart',
		options,
	);

	// Optimistically apply updates under the assumption that the post
	// will be updated. See below logic in success resolution for revert
	// if the autosave is applied as a revision.
	yield dispatch(
		MODULE_KEY,
		'optimisticUpdatePost',
		toSend
	);

	let path = `/wp/v2/${ postType.rest_base }/${ post.id }`;
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
			method: 'PUT',
			data: toSend,
		} );
		const resetAction = isAutosave ? 'resetAutosave' : 'resetPost';

		yield dispatch( MODULE_KEY, resetAction, newPost );

		yield dispatch(
			MODULE_KEY,
			'requestPostUpdateSuccess',
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

		const notifySuccessArgs = getNotifyOnSuccessNotificationArguments( {
			previousPost: post,
			post: newPost,
			postType,
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
			'requestPostUpdateFailure',
			{ post, edits, error, options }
		);
		const notifyFailArgs = getNotifyOnFailNotificationArguments( {
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
