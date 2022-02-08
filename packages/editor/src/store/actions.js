/**
 * External dependencies
 */
import { has } from 'lodash';

/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { controls } from '@wordpress/data';
import { apiFetch } from '@wordpress/data-controls';
import {
	parse,
	synchronizeBlocksWithTemplate,
	__unstableSerializeAndClean,
} from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { STORE_NAME, TRASH_POST_NOTICE_ID } from './constants';
import {
	getNotificationArgumentsForSaveSuccess,
	getNotificationArgumentsForSaveFail,
	getNotificationArgumentsForTrashFail,
} from './utils/notice-builder';

/**
 * Returns an action generator used in signalling that editor has initialized with
 * the specified post object and editor settings.
 *
 * @param {Object} post     Post object.
 * @param {Object} edits    Initial edited attributes object.
 * @param {Array?} template Block Template.
 */
export function* setupEditor( post, edits, template ) {
	yield resetPost( post );
	yield {
		type: 'SETUP_EDITOR',
		post,
		edits,
		template,
	};
	yield setupEditorState( post );
	// Apply a template for new posts only, if exists.
	const isNewPost = post.status === 'auto-draft';
	if ( isNewPost && template ) {
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
		blocks = synchronizeBlocksWithTemplate( blocks, template );
		yield resetEditorBlocks( blocks, {
			__unstableShouldCreateUndoLevel: false,
		} );
	}
	if (
		edits &&
		Object.keys( edits ).some(
			( key ) =>
				edits[ key ] !==
				( has( post, [ key, 'raw' ] ) ? post[ key ].raw : post[ key ] )
		)
	) {
		yield editPost( edits );
	}
}

/**
 * Returns an action object signalling that the editor is being destroyed and
 * that any necessary state or side-effect cleanup should occur.
 *
 * @return {Object} Action object.
 */
export function __experimentalTearDownEditor() {
	return { type: 'TEAR_DOWN_EDITOR' };
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
 * Action for dispatching that a post update request has started.
 *
 * @param {Object} options
 *
 * @return {Object} An action object
 */
export function __experimentalRequestPostUpdateStart( options = {} ) {
	return {
		type: 'REQUEST_POST_UPDATE_START',
		options,
	};
}

/**
 * Action for dispatching that a post update request has finished.
 *
 * @param {Object} options
 *
 * @return {Object} An action object
 */
export function __experimentalRequestPostUpdateFinish( options = {} ) {
	return {
		type: 'REQUEST_POST_UPDATE_FINISH',
		options,
	};
}

/**
 * Returns an action object used in signalling that a patch of updates for the
 * latest version of the post have been received.
 *
 * @return {Object} Action object.
 * @deprecated since Gutenberg 9.7.0.
 */
export function updatePost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).updatePost", {
		since: '5.7',
		alternative: 'Use the core entities store instead',
	} );
	return {
		type: 'DO_NOTHING',
	};
}

/**
 * Returns an action object used to setup the editor state when first opening
 * an editor.
 *
 * @param {Object} post Post object.
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
 * @param {Object} edits   Post attributes to edit.
 * @param {Object} options Options for the edit.
 *
 * @yield {Object} Action object or control.
 */
export function* editPost( edits, options ) {
	const { id, type } = yield controls.select( STORE_NAME, 'getCurrentPost' );
	yield controls.dispatch(
		coreStore,
		'editEntityRecord',
		'postType',
		type,
		id,
		edits,
		options
	);
}

/**
 * Action generator for saving the current post in the editor.
 *
 * @param {Object} options
 */
export function* savePost( options = {} ) {
	if ( ! ( yield controls.select( STORE_NAME, 'isEditedPostSaveable' ) ) ) {
		return;
	}
	let edits = {
		content: yield controls.select( STORE_NAME, 'getEditedPostContent' ),
	};
	if ( ! options.isAutosave ) {
		yield controls.dispatch( STORE_NAME, 'editPost', edits, {
			undoIgnore: true,
		} );
	}

	yield __experimentalRequestPostUpdateStart( options );
	const previousRecord = yield controls.select(
		STORE_NAME,
		'getCurrentPost'
	);
	edits = {
		id: previousRecord.id,
		...( yield controls.select(
			coreStore,
			'getEntityRecordNonTransientEdits',
			'postType',
			previousRecord.type,
			previousRecord.id
		) ),
		...edits,
	};
	yield controls.dispatch(
		coreStore,
		'saveEntityRecord',
		'postType',
		previousRecord.type,
		edits,
		options
	);
	yield __experimentalRequestPostUpdateFinish( options );

	const error = yield controls.select(
		coreStore,
		'getLastEntitySaveError',
		'postType',
		previousRecord.type,
		previousRecord.id
	);
	if ( error ) {
		const args = getNotificationArgumentsForSaveFail( {
			post: previousRecord,
			edits,
			error,
		} );
		if ( args.length ) {
			yield controls.dispatch(
				noticesStore,
				'createErrorNotice',
				...args
			);
		}
	} else {
		const updatedRecord = yield controls.select(
			STORE_NAME,
			'getCurrentPost'
		);
		const args = getNotificationArgumentsForSaveSuccess( {
			previousPost: previousRecord,
			post: updatedRecord,
			postType: yield controls.resolveSelect(
				coreStore,
				'getPostType',
				updatedRecord.type
			),
			options,
		} );
		if ( args.length ) {
			yield controls.dispatch(
				noticesStore,
				'createSuccessNotice',
				...args
			);
		}
		// Make sure that any edits after saving create an undo level and are
		// considered for change detection.
		if ( ! options.isAutosave ) {
			yield controls.dispatch(
				blockEditorStore,
				'__unstableMarkLastChangeAsPersistent'
			);
		}
	}
}

/**
 * Action for refreshing the current post.
 *
 * @deprecated Since Gutenberg 13.0.0.
 */
export function refreshPost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).refreshPost", {
		since: '5.9',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Action generator for trashing the current post in the editor.
 */
export function* trashPost() {
	const postTypeSlug = yield controls.select(
		STORE_NAME,
		'getCurrentPostType'
	);
	const postType = yield controls.resolveSelect(
		coreStore,
		'getPostType',
		postTypeSlug
	);
	yield controls.dispatch(
		noticesStore,
		'removeNotice',
		TRASH_POST_NOTICE_ID
	);
	try {
		const post = yield controls.select( STORE_NAME, 'getCurrentPost' );
		yield apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ post.id }`,
			method: 'DELETE',
		} );

		yield controls.dispatch( STORE_NAME, 'savePost' );
	} catch ( error ) {
		yield controls.dispatch(
			noticesStore,
			'createErrorNotice',
			...getNotificationArgumentsForTrashFail( { error } )
		);
	}
}

/**
 * Action generator used in signalling that the post should autosave.  This
 * includes server-side autosaving (default) and client-side (a.k.a. local)
 * autosaving (e.g. on the Web, the post might be committed to Session
 * Storage).
 *
 * @param {Object?} options Extra flags to identify the autosave.
 */
export function* autosave( { local = false, ...options } = {} ) {
	if ( local ) {
		const post = yield controls.select( STORE_NAME, 'getCurrentPost' );
		const isPostNew = yield controls.select(
			STORE_NAME,
			'isEditedPostNew'
		);
		const title = yield controls.select(
			STORE_NAME,
			'getEditedPostAttribute',
			'title'
		);
		const content = yield controls.select(
			STORE_NAME,
			'getEditedPostAttribute',
			'content'
		);
		const excerpt = yield controls.select(
			STORE_NAME,
			'getEditedPostAttribute',
			'excerpt'
		);
		yield {
			type: 'LOCAL_AUTOSAVE_SET',
			postId: post.id,
			isPostNew,
			title,
			content,
			excerpt,
		};
	} else {
		yield controls.dispatch( STORE_NAME, 'savePost', {
			isAutosave: true,
			...options,
		} );
	}
}

/**
 * Returns an action object used in signalling that undo history should
 * restore last popped state.
 *
 * @yield {Object} Action object.
 */
export function* redo() {
	yield controls.dispatch( coreStore, 'redo' );
}

/**
 * Returns an action object used in signalling that undo history should pop.
 *
 * @yield {Object} Action object.
 */
export function* undo() {
	yield controls.dispatch( coreStore, 'undo' );
}

/**
 * Action that creates an undo history record.
 *
 * @deprecated Since Gutenberg 13.0.0
 */
export function createUndoLevel() {
	deprecated( "wp.data.dispatch( 'core/editor' ).createUndoLevel", {
		since: '5.9',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Returns an action object used to lock the editor.
 *
 * @param {Object} lock Details about the post lock status, user, and nonce.
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
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * const { subscribe } = wp.data;
 *
 * const initialPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 *
 * // Only allow publishing posts that are set to a future date.
 * if ( 'publish' !== initialPostStatus ) {
 *
 * 	// Track locking.
 * 	let locked = false;
 *
 * 	// Watch for the publish event.
 * 	let unssubscribe = subscribe( () => {
 * 		const currentPostStatus = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'status' );
 * 		if ( 'publish' !== currentPostStatus ) {
 *
 * 			// Compare the post date to the current date, lock the post if the date isn't in the future.
 * 			const postDate = new Date( wp.data.select( 'core/editor' ).getEditedPostAttribute( 'date' ) );
 * 			const currentDate = new Date();
 * 			if ( postDate.getTime() <= currentDate.getTime() ) {
 * 				if ( ! locked ) {
 * 					locked = true;
 * 					wp.data.dispatch( 'core/editor' ).lockPostSaving( 'futurelock' );
 * 				}
 * 			} else {
 * 				if ( locked ) {
 * 					locked = false;
 * 					wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'futurelock' );
 * 				}
 * 			}
 * 		}
 * 	} );
 * }
 * ```
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
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Unlock post saving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).unlockPostSaving( 'mylock' );
 * ```
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
 * Returns an action object used to signal that post autosaving is locked.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Lock post autosaving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).lockPostAutosaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function lockPostAutosaving( lockName ) {
	return {
		type: 'LOCK_POST_AUTOSAVING',
		lockName,
	};
}

/**
 * Returns an action object used to signal that post autosaving is unlocked.
 *
 * @param {string} lockName The lock name.
 *
 * @example
 * ```
 * // Unlock post saving with the lock key `mylock`:
 * wp.data.dispatch( 'core/editor' ).unlockPostAutosaving( 'mylock' );
 * ```
 *
 * @return {Object} Action object
 */
export function unlockPostAutosaving( lockName ) {
	return {
		type: 'UNLOCK_POST_AUTOSAVING',
		lockName,
	};
}

/**
 * Returns an action object used to signal that the blocks have been updated.
 *
 * @param {Array}   blocks  Block Array.
 * @param {?Object} options Optional options.
 *
 * @yield {Object} Action object
 */
export function* resetEditorBlocks( blocks, options = {} ) {
	const { __unstableShouldCreateUndoLevel, selection } = options;
	const edits = { blocks, selection };

	if ( __unstableShouldCreateUndoLevel !== false ) {
		const { id, type } = yield controls.select(
			STORE_NAME,
			'getCurrentPost'
		);
		const noChange =
			( yield controls.select(
				coreStore,
				'getEditedEntityRecord',
				'postType',
				type,
				id
			) ).blocks === edits.blocks;
		if ( noChange ) {
			return yield controls.dispatch(
				coreStore,
				'__unstableCreateUndoLevel',
				'postType',
				type,
				id
			);
		}

		// We create a new function here on every persistent edit
		// to make sure the edit makes the post dirty and creates
		// a new undo level.
		edits.content = ( { blocks: blocksForSerialization = [] } ) =>
			__unstableSerializeAndClean( blocksForSerialization );
	}
	yield* editPost( edits );
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

const getBlockEditorAction = ( name ) =>
	function* ( ...args ) {
		deprecated( "`wp.data.dispatch( 'core/editor' )." + name + '`', {
			since: '5.3',
			alternative:
				"`wp.data.dispatch( 'core/block-editor' )." + name + '`',
			version: '6.2',
		} );
		yield controls.dispatch( blockEditorStore, name, ...args );
	};

/**
 * @see resetBlocks in core/block-editor store.
 */
export const resetBlocks = getBlockEditorAction( 'resetBlocks' );

/**
 * @see receiveBlocks in core/block-editor store.
 */
export const receiveBlocks = getBlockEditorAction( 'receiveBlocks' );

/**
 * @see updateBlock in core/block-editor store.
 */
export const updateBlock = getBlockEditorAction( 'updateBlock' );

/**
 * @see updateBlockAttributes in core/block-editor store.
 */
export const updateBlockAttributes = getBlockEditorAction(
	'updateBlockAttributes'
);

/**
 * @see selectBlock in core/block-editor store.
 */
export const selectBlock = getBlockEditorAction( 'selectBlock' );

/**
 * @see startMultiSelect in core/block-editor store.
 */
export const startMultiSelect = getBlockEditorAction( 'startMultiSelect' );

/**
 * @see stopMultiSelect in core/block-editor store.
 */
export const stopMultiSelect = getBlockEditorAction( 'stopMultiSelect' );

/**
 * @see multiSelect in core/block-editor store.
 */
export const multiSelect = getBlockEditorAction( 'multiSelect' );

/**
 * @see clearSelectedBlock in core/block-editor store.
 */
export const clearSelectedBlock = getBlockEditorAction( 'clearSelectedBlock' );

/**
 * @see toggleSelection in core/block-editor store.
 */
export const toggleSelection = getBlockEditorAction( 'toggleSelection' );

/**
 * @see replaceBlocks in core/block-editor store.
 */
export const replaceBlocks = getBlockEditorAction( 'replaceBlocks' );

/**
 * @see replaceBlock in core/block-editor store.
 */
export const replaceBlock = getBlockEditorAction( 'replaceBlock' );

/**
 * @see moveBlocksDown in core/block-editor store.
 */
export const moveBlocksDown = getBlockEditorAction( 'moveBlocksDown' );

/**
 * @see moveBlocksUp in core/block-editor store.
 */
export const moveBlocksUp = getBlockEditorAction( 'moveBlocksUp' );

/**
 * @see moveBlockToPosition in core/block-editor store.
 */
export const moveBlockToPosition = getBlockEditorAction(
	'moveBlockToPosition'
);

/**
 * @see insertBlock in core/block-editor store.
 */
export const insertBlock = getBlockEditorAction( 'insertBlock' );

/**
 * @see insertBlocks in core/block-editor store.
 */
export const insertBlocks = getBlockEditorAction( 'insertBlocks' );

/**
 * @see showInsertionPoint in core/block-editor store.
 */
export const showInsertionPoint = getBlockEditorAction( 'showInsertionPoint' );

/**
 * @see hideInsertionPoint in core/block-editor store.
 */
export const hideInsertionPoint = getBlockEditorAction( 'hideInsertionPoint' );

/**
 * @see setTemplateValidity in core/block-editor store.
 */
export const setTemplateValidity = getBlockEditorAction(
	'setTemplateValidity'
);

/**
 * @see synchronizeTemplate in core/block-editor store.
 */
export const synchronizeTemplate = getBlockEditorAction(
	'synchronizeTemplate'
);

/**
 * @see mergeBlocks in core/block-editor store.
 */
export const mergeBlocks = getBlockEditorAction( 'mergeBlocks' );

/**
 * @see removeBlocks in core/block-editor store.
 */
export const removeBlocks = getBlockEditorAction( 'removeBlocks' );

/**
 * @see removeBlock in core/block-editor store.
 */
export const removeBlock = getBlockEditorAction( 'removeBlock' );

/**
 * @see toggleBlockMode in core/block-editor store.
 */
export const toggleBlockMode = getBlockEditorAction( 'toggleBlockMode' );

/**
 * @see startTyping in core/block-editor store.
 */
export const startTyping = getBlockEditorAction( 'startTyping' );

/**
 * @see stopTyping in core/block-editor store.
 */
export const stopTyping = getBlockEditorAction( 'stopTyping' );

/**
 * @see enterFormattedText in core/block-editor store.
 */
export const enterFormattedText = getBlockEditorAction( 'enterFormattedText' );

/**
 * @see exitFormattedText in core/block-editor store.
 */
export const exitFormattedText = getBlockEditorAction( 'exitFormattedText' );

/**
 * @see insertDefaultBlock in core/block-editor store.
 */
export const insertDefaultBlock = getBlockEditorAction( 'insertDefaultBlock' );

/**
 * @see updateBlockListSettings in core/block-editor store.
 */
export const updateBlockListSettings = getBlockEditorAction(
	'updateBlockListSettings'
);
