/**
 * External dependencies
 */
import { has } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import deprecated from '@wordpress/deprecated';
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
import { TRASH_POST_NOTICE_ID } from './constants';
import { localAutosaveSet } from './local-autosave';
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
export const setupEditor = ( post, edits, template ) => ( { dispatch } ) => {
	dispatch.setupEditorState( post );
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
		dispatch.resetEditorBlocks( blocks, {
			__unstableShouldCreateUndoLevel: false,
		} );
	}
	if (
		edits &&
		Object.values( edits ).some(
			( [ key, edit ] ) => edit !== ( post[ key ]?.raw ?? post[ key ] )
		)
	) {
		dispatch.editPost( edits );
	}
};

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
 * @deprecated Since WordPress 6.0.
 */
export function resetPost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).resetPost", {
		since: '6.0',
		version: '6.3',
		alternative: 'Initialize the editor with the setupEditorState action',
	} );
	return { type: 'DO_NOTHING' };
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
 */
export const editPost = ( edits, options ) => ( { select, registry } ) => {
	const { id, type } = select.getCurrentPost();
	registry
		.dispatch( coreStore )
		.editEntityRecord( 'postType', type, id, edits, options );
};

/**
 * Action for saving the current post in the editor.
 *
 * @param {Object} options
 */
export const savePost = ( options = {} ) => async ( {
	select,
	dispatch,
	registry,
} ) => {
	if ( ! select.isEditedPostSaveable() ) {
		return;
	}

	const content = select.getEditedPostContent();

	if ( ! options.isAutosave ) {
		dispatch.editPost( { content }, { undoIgnore: true } );
	}

	const previousRecord = select.getCurrentPost();
	const edits = {
		id: previousRecord.id,
		...registry
			.select( coreStore )
			.getEntityRecordNonTransientEdits(
				'postType',
				previousRecord.type,
				previousRecord.id
			),
		content,
	};
	dispatch( { type: 'REQUEST_POST_UPDATE_START', options } );
	await registry
		.dispatch( coreStore )
		.saveEntityRecord( 'postType', previousRecord.type, edits, options );
	dispatch( { type: 'REQUEST_POST_UPDATE_FINISH', options } );

	const error = registry
		.select( coreStore )
		.getLastEntitySaveError(
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
			registry.dispatch( noticesStore ).createErrorNotice( ...args );
		}
	} else {
		const updatedRecord = select.getCurrentPost();
		const args = getNotificationArgumentsForSaveSuccess( {
			previousPost: previousRecord,
			post: updatedRecord,
			postType: await registry
				.resolveSelect( coreStore )
				.getPostType( updatedRecord.type ),
			options,
		} );
		if ( args.length ) {
			registry.dispatch( noticesStore ).createSuccessNotice( ...args );
		}
		// Make sure that any edits after saving create an undo level and are
		// considered for change detection.
		if ( ! options.isAutosave ) {
			registry
				.dispatch( blockEditorStore )
				.__unstableMarkLastChangeAsPersistent();
		}
	}
};

/**
 * Action for refreshing the current post.
 *
 * @deprecated Since WordPress 6.0.
 */
export function refreshPost() {
	deprecated( "wp.data.dispatch( 'core/editor' ).refreshPost", {
		since: '6.0',
		version: '6.3',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Action for trashing the current post in the editor.
 */
export const trashPost = () => async ( { select, dispatch, registry } ) => {
	const postTypeSlug = select.getCurrentPostType();
	const postType = await registry
		.resolveSelect( coreStore )
		.getPostType( postTypeSlug );
	registry.dispatch( noticesStore ).removeNotice( TRASH_POST_NOTICE_ID );
	try {
		const post = select.getCurrentPost();
		await apiFetch( {
			path: `/wp/v2/${ postType.rest_base }/${ post.id }`,
			method: 'DELETE',
		} );

		await dispatch.savePost();
	} catch ( error ) {
		registry
			.dispatch( noticesStore )
			.createErrorNotice(
				...getNotificationArgumentsForTrashFail( { error } )
			);
	}
};

/**
 * Action that autosaves the current post.  This
 * includes server-side autosaving (default) and client-side (a.k.a. local)
 * autosaving (e.g. on the Web, the post might be committed to Session
 * Storage).
 *
 * @param {Object?} options Extra flags to identify the autosave.
 */
export const autosave = ( { local = false, ...options } = {} ) => async ( {
	select,
	dispatch,
} ) => {
	if ( local ) {
		const post = select.getCurrentPost();
		const isPostNew = select.isEditedPostNew();
		const title = select.getEditedPostAttribute( 'title' );
		const content = select.getEditedPostAttribute( 'content' );
		const excerpt = select.getEditedPostAttribute( 'excerpt' );
		localAutosaveSet( post.id, isPostNew, title, content, excerpt );
	} else {
		await dispatch.savePost( { isAutosave: true, ...options } );
	}
};

/**
 * Action that restores last popped state in undo history.
 */
export const redo = () => ( { registry } ) => {
	registry.dispatch( coreStore ).redo();
};

/**
 * Action that pops a record from undo history and undoes the edit.
 */
export const undo = () => ( { registry } ) => {
	registry.dispatch( coreStore ).undo();
};

/**
 * Action that creates an undo history record.
 *
 * @deprecated Since WordPress 6.0
 */
export function createUndoLevel() {
	deprecated( "wp.data.dispatch( 'core/editor' ).createUndoLevel", {
		since: '6.0',
		version: '6.3',
		alternative: 'Use the core entities store instead',
	} );
	return { type: 'DO_NOTHING' };
}

/**
 * Action that locks the editor.
 *
 * @param {Object} lock Details about the post lock status, user, and nonce.
 * @return {Object} Action object.
 */
export function updatePostLock( lock ) {
	return {
		type: 'UPDATE_POST_LOCK',
		lock,
	};
}

/**
 * Action that enables the publish sidebar.
 *
 * @return {Object} Action object
 */
export function enablePublishSidebar() {
	return {
		type: 'ENABLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Action that disables the publish sidebar.
 *
 * @return {Object} Action object
 */
export function disablePublishSidebar() {
	return {
		type: 'DISABLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Action that locks post saving.
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
 * Action that unlocks post saving.
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
 * Action that locks post autosaving.
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
 * Action that unlocks post autosaving.
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
 */
export const resetEditorBlocks = ( blocks, options = {} ) => ( {
	select,
	dispatch,
	registry,
} ) => {
	const { __unstableShouldCreateUndoLevel, selection } = options;
	const edits = { blocks, selection };

	if ( __unstableShouldCreateUndoLevel !== false ) {
		const { id, type } = select.getCurrentPost();
		const noChange =
			registry
				.select( coreStore )
				.getEditedEntityRecord( 'postType', type, id ).blocks ===
			edits.blocks;
		if ( noChange ) {
			registry
				.dispatch( coreStore )
				.__unstableCreateUndoLevel( 'postType', type, id );
			return;
		}

		// We create a new function here on every persistent edit
		// to make sure the edit makes the post dirty and creates
		// a new undo level.
		edits.content = ( { blocks: blocksForSerialization = [] } ) =>
			__unstableSerializeAndClean( blocksForSerialization );
	}

	dispatch.editPost( edits );
};

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

const getBlockEditorAction = ( name ) => ( ...args ) => ( { registry } ) => {
	deprecated( "`wp.data.dispatch( 'core/editor' )." + name + '`', {
		since: '5.3',
		alternative: "`wp.data.dispatch( 'core/block-editor' )." + name + '`',
		version: '6.2',
	} );
	registry.dispatch( blockEditorStore )[ name ]( ...args );
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
