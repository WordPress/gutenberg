/**
 * External dependencies
 */
import { castArray, pick, has, compact, map, uniqueId } from 'lodash';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

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
	STORE_KEY,
	POST_UPDATE_TRANSACTION_ID,
	SAVE_POST_NOTICE_ID,
	TRASH_POST_NOTICE_ID,
	REUSABLE_BLOCK_NOTICE_ID,
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
	serialize,
	createBlock,
	isReusableBlock,
	cloneBlock,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';
import { getPostRawValue } from './reducer';
import { __ } from '@wordpress/i18n';

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

	yield dispatch(
		STORE_KEY,
		'resetEditorBlocks',
		blocks
	);

	yield dispatch(
		STORE_KEY,
		'setupEditorState',
		post
	);
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
		edits = pick( edits, [ 'title', 'content', 'excerpt' ] );
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
		const autoSavePost = yield select(
			STORE_KEY,
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

		yield dispatch( STORE_KEY, resetAction, newPost );

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
 * Returns an action generator used to fetch a single reusable block or all
 * reusable blocks from the REST API into the store.
 *
 * @param {?string} id If given, only a single reusable block with this ID will
 *                     be fetched.
 */
export function* __experimentalFetchReusableBlocks( id ) {
	yield {
		type: 'FETCH_REUSABLE_BLOCKS',
		id,
	};
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = yield apiFetch( { path: '/wp/v2/types/wp_block' } );
	if ( ! postType ) {
		return;
	}

	try {
		let posts;

		if ( id ) {
			posts = [ yield apiFetch( { path: `/wp/v2/${ postType.rest_base }/${ id }` } ) ];
		} else {
			posts = yield apiFetch( { path: `/wp/v2/${ postType.rest_base }?per_page=-1` } );
		}

		const results = compact( map( posts, ( post ) => {
			if ( post.status !== 'publish' || post.content.protected ) {
				return null;
			}

			const parsedBlocks = parse( post.content.raw );
			return {
				reusableBlock: {
					id: post.id,
					title: getPostRawValue( post.title ),
				},
				parsedBlock: parsedBlocks.length === 1 ?
					parsedBlocks[ 0 ] :
					createBlock( 'core/template', {}, parsedBlocks ),
			};
		} ) );

		if ( results.length ) {
			yield dispatch(
				STORE_KEY,
				'__experimentalReceiveReusableBlocks',
				results
			);
		}

		yield {
			type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
			id,
		};
	} catch ( error ) {
		yield {
			type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
			id,
			error,
		};
	}
}

/**
 * Returns an action generator used in signalling that reusable blocks have been
 * received. `results` is an array of objects containing:
 *  - `reusableBlock` - Details about how the reusable block is persisted.
 *  - `parsedBlock` - The original block.
 *
 * @param {Object[]} results Reusable blocks received.
 */
export function* __experimentalReceiveReusableBlocks( results ) {
	yield {
		type: 'RECEIVE_REUSABLE_BLOCKS',
		results,
	};
	yield dispatch(
		'core/block-editor',
		'receiveBlocks',
		map( results, 'parsedBlock' )
	);
}

/**
 * Returns an action generator used to save a reusable block that's in the store to
 * the REST API.
 *
 * @param {Object} id The ID of the reusable block to save.
 */
export function* __experimentalSaveReusableBlock( id ) {
	yield {
		type: 'SAVE_REUSABLE_BLOCK',
		id,
	};
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = yield apiFetch( { path: '/wp/v2/types/wp_block' } );
	if ( ! postType ) {
		return;
	}
	const { clientId, title, isTemporary } = yield select(
		STORE_KEY,
		'__experimentalGetReusableBlock',
		id
	);
	const reusableBlock = yield select(
		'core/block-editor',
		'getBlock',
		clientId
	);
	const content = serialize( reusableBlock.name === 'core/template' ?
		reusableBlock.innerBlocks :
		reusableBlock );
	const data = isTemporary ?
		{ title, content, status: 'publish' } :
		{ id, title, content, status: 'publish' };
	const path = isTemporary ?
		`/wp/v2/${ postType.rest_base }` :
		`/wp/v2/${ postType.rest_base }/${ id }`;
	const method = isTemporary ? 'POST' : 'PUT';

	try {
		const updatedReusableBlock = yield apiFetch( { path, data, method } );
		yield {
			type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
			updatedId: updatedReusableBlock.id,
			id,
		};
		const message = isTemporary ?
			__( 'Block created.' ) :
			__( 'Block updated.' );
		yield dispatch(
			'core/notices',
			'createSuccessNotice',
			message,
			{ id: REUSABLE_BLOCK_NOTICE_ID }
		);
		yield dispatch(
			'core/block-editor',
			'__unstableSaveReusableBlock',
			id,
			updatedReusableBlock.id
		);
	} catch ( error ) {
		yield { type: 'SAVE_REUSABLE_BLOCK_FAILURE', id };
		yield dispatch(
			'core/notices',
			'createErrorNotice',
			error.message,
			{ id: REUSABLE_BLOCK_NOTICE_ID }
		);
	}
}

/**
 * Returns an action generator used to delete a reusable block via the REST API.
 *
 * @param {number} id The ID of the reusable block to delete.
 */
export function* __experimentalDeleteReusableBlock( id ) {
	// TODO: these are potentially undefined, this fix is in place
	// until there is a filter to not use reusable blocks if undefined
	const postType = yield apiFetch( { path: '/wp/v2/types/wp_block' } );
	if ( ! postType ) {
		return;
	}

	// Don't allow a reusable block with a temporary ID to be deleted
	const reusableBlock = yield select(
		STORE_KEY,
		'__experimentalGetReusableBlock',
		id
	);
	if ( ! reusableBlock || reusableBlock.isTemporary ) {
		return;
	}

	// Remove any other blocks that reference this reusable block
	const allBlocks = yield select( 'core/block-editor', 'getBlocks' );
	const associatedBlocks = allBlocks.filter(
		( block ) => isReusableBlock( block ) && block.attributes.ref === id
	);
	const associatedBlockClientIds = associatedBlocks.map(
		( block ) => block.clientId
	);

	const transactionId = uniqueId();

	yield {
		type: 'REMOVE_REUSABLE_BLOCK',
		id,
		optimist: { type: BEGIN, id: transactionId },
	};

	yield dispatch(
		'core/block-editor',
		'removeBlocks',
		[
			...associatedBlockClientIds,
			reusableBlock.clientId,
		]
	);

	try {
		yield apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ id }`,
			method: 'DELETE',
		} );
		yield {
			type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
			id,
			optimist: { type: COMMIT, id: transactionId },
		};

		yield dispatch(
			'core/notices',
			'createSuccessNotice',
			__( 'Block deleted.' ),
			{ id: REUSABLE_BLOCK_NOTICE_ID }
		);
	} catch ( error ) {
		yield {
			type: 'DELETE_REUSABLE_BLOCK_FAILURE',
			id,
			optimist: { type: REVERT, id: transactionId },
		};
		yield dispatch(
			'core/notices',
			error.message,
			{ id: REUSABLE_BLOCK_NOTICE_ID }
		);
	}
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
 * Returns an action generator used to convert a reusable block into a static
 * block.
 *
 * @param {string} clientId The client ID of the block to attach.
 */
export function* __experimentalConvertBlockToStatic( clientId ) {
	const oldBlock = yield select(
		'core/block-editor',
		'getBlock',
		clientId
	);
	const reusableBlock = yield select(
		STORE_KEY,
		'__experimentalGetReusableBlock',
		oldBlock.attributes.ref
	);
	const referencedBlock = yield select(
		'core/block-editor',
		'getBlock',
		reusableBlock.clientId
	);
	let newBlocks;
	if ( referencedBlock.name === 'core/template' ) {
		newBlocks = referencedBlock.innerBlocks.map(
			( innerBlock ) => cloneBlock( innerBlock )
		);
	} else {
		newBlocks = [ cloneBlock( referencedBlock ) ];
	}
	yield dispatch(
		'core/block-editor',
		'replaceBlocks',
		oldBlock.clientId,
		newBlocks
	);
}

/**
 * Returns an action generator used to convert a static block into a reusable
 * block.
 *
 * @param {string} clientIds The client IDs of the block to detach.
 */
export function* __experimentalConvertBlockToReusable( clientIds ) {
	let parsedBlock;
	clientIds = castArray( clientIds );
	if ( clientIds.length === 1 ) {
		parsedBlock = yield select(
			'core/block-editor',
			'getBlock',
			clientIds[ 0 ]
		);
	} else {
		const blocks = yield select(
			'core/block-editor',
			'getBlocksByClientId',
			clientIds
		);
		parsedBlock = createBlock(
			'core/template',
			{},
			blocks
		);

		// This shouldn't be necessary but at the moment
		// we expect the content of the shared blocks to live in the blocks state.
		yield dispatch(
			'core/block-editor',
			'receiveBlocks',
			[ parsedBlock ]
		);
	}

	const reusableBlock = {
		id: uniqueId( 'reusable' ),
		clientId: parsedBlock.clientId,
		title: __( 'Untitled Reusable Block' ),
	};

	yield dispatch(
		STORE_KEY,
		'__experimentalReceiveReusableBlocks',
		[ { reusableBlock, parsedBlock } ]
	);

	yield dispatch(
		'core/block-editor',
		'replaceBlocks',
		clientIds,
		createBlock( 'core/block', { ref: reusableBlock.id } )
	);

	// Re-add the original block to the store, since replaceBlock() will have removed it
	yield dispatch(
		'core/block-editor',
		'receiveBlocks',
		[ parsedBlock ]
	);

	yield dispatch(
		STORE_KEY,
		'__experimentalSaveReusableBlock',
		reusableBlock.id
	);
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
