/**
 * External dependencies
 */
import { castArray, pick, mapValues, has } from 'lodash';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	dispatch,
	select,
	resolveSelect,
	apiFetch,
} from './controls';
import {
	getPostRawValue,
} from './reducer';
import {
	STORE_KEY,
	POST_UPDATE_TRANSACTION_ID,
	SAVE_POST_NOTICE_ID,
	TRASH_POST_NOTICE_ID,
	AUTOSAVE_PROPERTIES,
} from './constants';
import {
	getNotificationArgumentsForSaveSuccess,
	getNotificationArgumentsForSaveFail,
	getNotificationArgumentsForTrashFail,
} from './utils/notice-builder';

/**
 * WordPress dependencies
 */
import {
	parse,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';

/**
 * Returns an action generator used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post      Post object.
 * @param {Object} edits     Initial edited attributes object.
 * @param {Array?} template  Block Template.
 */
export function* setupEditor( post, edits, template ) {
	yield {
		type: 'SETUP_EDITOR',
		post,
		edits,
		template,
	};

	// In order to ensure maximum of a single parse during setup, edits are
	// included as part of editor setup action. Assume edited content as
	// canonical if provided, falling back to post.
	let content;
	if ( has( edits, [ 'content' ] ) ) {
		content = edits.content;
	} else {
		content = post.content.raw;
	}

	let blocks = parse( content );

	// Apply a template for new posts only, if exists.
	const isNewPost = post.status === 'auto-draft';
	if ( isNewPost && template ) {
		blocks = synchronizeBlocksWithTemplate( blocks, template );
	}

	yield resetEditorBlocks( blocks );
	yield setupEditorState( post );
}

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
 * @deprecated since 5.3. Callers should use the `receiveAutosaves( postId, autosave )`
 * 			   selector from the '@wordpress/core-data' package.
 *
 * @param {Object} newAutosave Autosave post object.
 *
 * @return {Object} Action object.
 */
export function* resetAutosave( newAutosave ) {
	deprecated( 'resetAutosave action (`core/editor` store)', {
		alternative: 'receiveAutosaves action (`core` store)',
		plugin: 'Gutenberg',
	} );

	const postId = yield select( STORE_KEY, 'getCurrentPostId' );
	yield dispatch( 'core', 'receiveAutosaves', postId, newAutosave );

	return { type: '__INERT__' };
}

/**
 * Optimistic action for dispatching that a post update request has started.
 *
 * @param {Object} options
 *
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
 * @param {Object}  data                The data for the action.
 * @param {Object}  data.previousPost   The previous post prior to update.
 * @param {Object}  data.post           The new post after update
 * @param {boolean} data.isRevision     Whether the post is a revision or not.
 * @param {Object}  data.options        Options passed through from the original
 *                                      action dispatch.
 * @param {Object}  data.postType       The post type object.
 *
 * @return {Object}	Action object.
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
 * @param {Object}  data          The data for the action
 * @param {Object}  data.post     The post that failed updating.
 * @param {Object}  data.edits    The fields that were being updated.
 * @param {*}       data.error    The error from the failed call.
 * @param {Object}  data.options  Options passed through from the original
 *                                action dispatch.
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
 * Returns an action object used to setup the editor state when first opening
 * an editor.
 *
 * @param {Object} post   Post object.
 *
 * @return {Object} Action object.
 */
export function setupEditorState( post ) {
	return {
		type: 'SETUP_EDITOR_STATE',
		post,
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
 *
 * @return {Object} Action object.
 */
export function __experimentalOptimisticUpdatePost( edits ) {
	return {
		...updatePost( edits ),
		optimist: { id: POST_UPDATE_TRANSACTION_ID },
	};
}

/**
 * Action generator for saving the current post in the editor.
 *
 * @param {Object} options
 */
export function* savePost( options = {} ) {
	const isEditedPostSaveable = yield select(
		STORE_KEY,
		'isEditedPostSaveable'
	);
	if ( ! isEditedPostSaveable ) {
		return;
	}
	let edits = yield select(
		STORE_KEY,
		'getPostEdits'
	);
	const isAutosave = !! options.isAutosave;

	if ( isAutosave ) {
		edits = pick( edits, AUTOSAVE_PROPERTIES );
	}

	const isEditedPostNew = yield select(
		STORE_KEY,
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
		STORE_KEY,
		'getCurrentPost'
	);

	const editedPostContent = yield select(
		STORE_KEY,
		'getEditedPostContent'
	);

	let toSend = {
		...edits,
		content: editedPostContent,
		id: post.id,
	};

	const currentPostType = yield select(
		STORE_KEY,
		'getCurrentPostType'
	);

	const postType = yield resolveSelect(
		'core',
		'getPostType',
		currentPostType
	);

	yield dispatch(
		STORE_KEY,
		'__experimentalRequestPostUpdateStart',
		options,
	);

	// Optimistically apply updates under the assumption that the post
	// will be updated. See below logic in success resolution for revert
	// if the autosave is applied as a revision.
	yield dispatch(
		STORE_KEY,
		'__experimentalOptimisticUpdatePost',
		toSend
	);

	let path = `/wp/v2/${ postType.rest_base }/${ post.id }`;
	let method = 'PUT';
	if ( isAutosave ) {
		const currentUser = yield resolveSelect( 'core', 'getCurrentUser' );
		const currentUserId = currentUser ? currentUser.id : null;
		const autosavePost = yield resolveSelect( 'core', 'getAutosave', post.type, post.id, currentUserId );
		const mappedAutosavePost = mapValues( pick( autosavePost, AUTOSAVE_PROPERTIES ), getPostRawValue );

		// Ensure autosaves contain all expected fields, using autosave or
		// post values as fallback if not otherwise included in edits.
		toSend = {
			...pick( post, AUTOSAVE_PROPERTIES ),
			...mappedAutosavePost,
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

		if ( isAutosave ) {
			yield dispatch( 'core', 'receiveAutosaves', post.id, newPost );
		} else {
			yield dispatch( STORE_KEY, 'resetPost', newPost );
		}

		yield dispatch(
			STORE_KEY,
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
			STORE_KEY,
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
 * Action generator for handling refreshing the current post.
 */
export function* refreshPost() {
	const post = yield select(
		STORE_KEY,
		'getCurrentPost'
	);
	const postTypeSlug = yield select(
		STORE_KEY,
		'getCurrentPostType'
	);
	const postType = yield resolveSelect(
		'core',
		'getPostType',
		postTypeSlug
	);
	const newPost = yield apiFetch(
		{
			// Timestamp arg allows caller to bypass browser caching, which is
			// expected for this specific function.
			path: `/wp/v2/${ postType.rest_base }/${ post.id }` +
				`?context=edit&_timestamp=${ Date.now() }`,
		}
	);
	yield dispatch(
		STORE_KEY,
		'resetPost',
		newPost
	);
}

/**
 * Action generator for trashing the current post in the editor.
 */
export function* trashPost() {
	const postTypeSlug = yield select(
		STORE_KEY,
		'getCurrentPostType'
	);
	const postType = yield resolveSelect(
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
			STORE_KEY,
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
			STORE_KEY,
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
 * Action generator used in signalling that the post should autosave.
 *
 * @param {Object?} options Extra flags to identify the autosave.
 */
export function* autosave( options ) {
	yield dispatch(
		STORE_KEY,
		'savePost',
		{ isAutosave: true, ...options }
	);
}

/**
 * Returns an action object used in signalling that undo history should
 * restore last popped state.
 *
 * @return {Object} Action object.
 */
export function redo() {
	return { type: 'REDO' };
}

/**
 * Returns an action object used in signalling that undo history should pop.
 *
 * @return {Object} Action object.
 */
export function undo() {
	return { type: 'UNDO' };
}

/**
 * Returns an action object used in signalling that undo history record should
 * be created.
 *
 * @return {Object} Action object.
 */
export function createUndoLevel() {
	return { type: 'CREATE_UNDO_LEVEL' };
}

/**
 * Returns an action object used to lock the editor.
 *
 * @param {Object}  lock Details about the post lock status, user, and nonce.
 *
 * @return {Object} Action object.
 */
export function updatePostLock( lock ) {
	return {
		type: 'UPDATE_POST_LOCK',
		lock,
	};
}

/**
 * Returns an action object used to fetch a single reusable block or all
 * reusable blocks from the REST API into the store.
 *
 * @param {?string} id If given, only a single reusable block with this ID will
 *                     be fetched.
 *
 * @return {Object} Action object.
 */
export function __experimentalFetchReusableBlocks( id ) {
	return {
		type: 'FETCH_REUSABLE_BLOCKS',
		id,
	};
}

/**
 * Returns an action object used in signalling that reusable blocks have been
 * received. `results` is an array of objects containing:
 *  - `reusableBlock` - Details about how the reusable block is persisted.
 *  - `parsedBlock` - The original block.
 *
 * @param {Object[]} results Reusable blocks received.
 *
 * @return {Object} Action object.
 */
export function __experimentalReceiveReusableBlocks( results ) {
	return {
		type: 'RECEIVE_REUSABLE_BLOCKS',
		results,
	};
}

/**
 * Returns an action object used to save a reusable block that's in the store to
 * the REST API.
 *
 * @param {Object} id The ID of the reusable block to save.
 *
 * @return {Object} Action object.
 */
export function __experimentalSaveReusableBlock( id ) {
	return {
		type: 'SAVE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used to delete a reusable block via the REST API.
 *
 * @param {number} id The ID of the reusable block to delete.
 *
 * @return {Object} Action object.
 */
export function __experimentalDeleteReusableBlock( id ) {
	return {
		type: 'DELETE_REUSABLE_BLOCK',
		id,
	};
}

/**
 * Returns an action object used in signalling that a reusable block's title is
 * to be updated.
 *
 * @param {number} id    The ID of the reusable block to update.
 * @param {string} title The new title.
 *
 * @return {Object} Action object.
 */
export function __experimentalUpdateReusableBlockTitle( id, title ) {
	return {
		type: 'UPDATE_REUSABLE_BLOCK_TITLE',
		id,
		title,
	};
}

/**
 * Returns an action object used to convert a reusable block into a static
 * block.
 *
 * @param {string} clientId The client ID of the block to attach.
 *
 * @return {Object} Action object.
 */
export function __experimentalConvertBlockToStatic( clientId ) {
	return {
		type: 'CONVERT_BLOCK_TO_STATIC',
		clientId,
	};
}

/**
 * Returns an action object used to convert a static block into a reusable
 * block.
 *
 * @param {string} clientIds The client IDs of the block to detach.
 *
 * @return {Object} Action object.
 */
export function __experimentalConvertBlockToReusable( clientIds ) {
	return {
		type: 'CONVERT_BLOCK_TO_REUSABLE',
		clientIds: castArray( clientIds ),
	};
}

/**
 * Returns an action object used in signalling that the user has enabled the
 * publish sidebar.
 *
 * @return {Object} Action object
 */
export function enablePublishSidebar() {
	return {
		type: 'ENABLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user has disabled the
 * publish sidebar.
 *
 * @return {Object} Action object
 */
export function disablePublishSidebar() {
	return {
		type: 'DISABLE_PUBLISH_SIDEBAR',
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

/**
 * Returns an action object used to signal that the blocks have been updated.
 *
 * @param {Array}   blocks  Block Array.
 * @param {?Object} options Optional options.
 *
 * @return {Object} Action object
 */
export function resetEditorBlocks( blocks, options = {} ) {
	return {
		type: 'RESET_EDITOR_BLOCKS',
		blocks,
		shouldCreateUndoLevel: options.__unstableShouldCreateUndoLevel !== false,
	};
}

/*
 * Returns an action object used in signalling that the post editor settings have been updated.
 *
 * @param {Object} settings Updated settings
 *
 * @return {Object} Action object
 */
export function updateEditorSettings( settings ) {
	return {
		type: 'UPDATE_EDITOR_SETTINGS',
		settings,
	};
}

/**
 * Backward compatibility
 */

const getBlockEditorAction = ( name ) => function* ( ...args ) {
	yield dispatch( 'core/block-editor', name, ...args );
};

export const resetBlocks = getBlockEditorAction( 'resetBlocks' );
export const receiveBlocks = getBlockEditorAction( 'receiveBlocks' );
export const updateBlock = getBlockEditorAction( 'updateBlock' );
export const updateBlockAttributes = getBlockEditorAction( 'updateBlockAttributes' );
export const selectBlock = getBlockEditorAction( 'selectBlock' );
export const startMultiSelect = getBlockEditorAction( 'startMultiSelect' );
export const stopMultiSelect = getBlockEditorAction( 'stopMultiSelect' );
export const multiSelect = getBlockEditorAction( 'multiSelect' );
export const clearSelectedBlock = getBlockEditorAction( 'clearSelectedBlock' );
export const toggleSelection = getBlockEditorAction( 'toggleSelection' );
export const replaceBlocks = getBlockEditorAction( 'replaceBlocks' );
export const moveBlocksDown = getBlockEditorAction( 'moveBlocksDown' );
export const moveBlocksUp = getBlockEditorAction( 'moveBlocksUp' );
export const moveBlockToPosition = getBlockEditorAction( 'moveBlockToPosition' );
export const insertBlock = getBlockEditorAction( 'insertBlock' );
export const insertBlocks = getBlockEditorAction( 'insertBlocks' );
export const showInsertionPoint = getBlockEditorAction( 'showInsertionPoint' );
export const hideInsertionPoint = getBlockEditorAction( 'hideInsertionPoint' );
export const setTemplateValidity = getBlockEditorAction( 'setTemplateValidity' );
export const synchronizeTemplate = getBlockEditorAction( 'synchronizeTemplate' );
export const mergeBlocks = getBlockEditorAction( 'mergeBlocks' );
export const removeBlocks = getBlockEditorAction( 'removeBlocks' );
export const removeBlock = getBlockEditorAction( 'removeBlock' );
export const toggleBlockMode = getBlockEditorAction( 'toggleBlockMode' );
export const startTyping = getBlockEditorAction( 'startTyping' );
export const stopTyping = getBlockEditorAction( 'stopTyping' );
export const enterFormattedText = getBlockEditorAction( 'enterFormattedText' );
export const exitFormattedText = getBlockEditorAction( 'exitFormattedText' );
export const insertDefaultBlock = getBlockEditorAction( 'insertDefaultBlock' );
export const updateBlockListSettings = getBlockEditorAction( 'updateBlockListSettings' );
