/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
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
import { applyFilters } from '@wordpress/hooks';
import { store as preferencesStore } from '@wordpress/preferences';
import { __ } from '@wordpress/i18n';

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
export const setupEditor =
	( post, edits, template ) =>
	( { dispatch } ) => {
		dispatch.setEditedPost( post.type, post.id );
		// Apply a template for new posts only, if exists.
		const isNewPost = post.status === 'auto-draft';
		if ( isNewPost && template ) {
			// In order to ensure maximum of a single parse during setup, edits are
			// included as part of editor setup action. Assume edited content as
			// canonical if provided, falling back to post.
			let content;
			if ( 'content' in edits ) {
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
				( [ key, edit ] ) =>
					edit !== ( post[ key ]?.raw ?? post[ key ] )
			)
		) {
			dispatch.editPost( edits );
		}
	};

/**
 * Returns an action object signalling that the editor is being destroyed and
 * that any necessary state or side-effect cleanup should occur.
 *
 * @deprecated
 *
 * @return {Object} Action object.
 */
export function __experimentalTearDownEditor() {
	deprecated(
		"wp.data.dispatch( 'core/editor' ).__experimentalTearDownEditor",
		{
			since: '6.5',
		}
	);
	return { type: 'DO_NOTHING' };
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
 * Setup the editor state.
 *
 * @deprecated
 *
 * @param {Object} post Post object.
 */
export function setupEditorState( post ) {
	deprecated( "wp.data.dispatch( 'core/editor' ).setupEditorState", {
		since: '6.5',
		alternative: "wp.data.dispatch( 'core/editor' ).setEditedPost",
	} );
	return setEditedPost( post.type, post.id );
}

/**
 * Returns an action that sets the current post Type and post ID.
 *
 * @param {string} postType Post Type.
 * @param {string} postId   Post ID.
 *
 * @return {Object} Action object.
 */
export function setEditedPost( postType, postId ) {
	return {
		type: 'SET_EDITED_POST',
		postType,
		postId,
	};
}

/**
 * Returns an action object used in signalling that attributes of the post have
 * been edited.
 *
 * @param {Object} edits   Post attributes to edit.
 * @param {Object} options Options for the edit.
 */
export const editPost =
	( edits, options ) =>
	( { select, registry } ) => {
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
export const savePost =
	( options = {} ) =>
	async ( { select, dispatch, registry } ) => {
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

		let error = false;
		try {
			error = await applyFilters(
				'editor.__unstablePreSavePost',
				Promise.resolve( false ),
				options
			);
		} catch ( err ) {
			error = err;
		}

		if ( ! error ) {
			try {
				await registry
					.dispatch( coreStore )
					.saveEntityRecord(
						'postType',
						previousRecord.type,
						edits,
						options
					);
			} catch ( err ) {
				error =
					err.message && err.code !== 'unknown_error'
						? err.message
						: __( 'An error occurred while updating.' );
			}
		}

		if ( ! error ) {
			error = registry
				.select( coreStore )
				.getLastEntitySaveError(
					'postType',
					previousRecord.type,
					previousRecord.id
				);
		}

		if ( ! error ) {
			await applyFilters(
				'editor.__unstableSavePost',
				Promise.resolve(),
				options
			).catch( ( err ) => {
				error = err;
			} );
		}
		dispatch( { type: 'REQUEST_POST_UPDATE_FINISH', options } );

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
				registry
					.dispatch( noticesStore )
					.createSuccessNotice( ...args );
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
export const trashPost =
	() =>
	async ( { select, dispatch, registry } ) => {
		const postTypeSlug = select.getCurrentPostType();
		const postType = await registry
			.resolveSelect( coreStore )
			.getPostType( postTypeSlug );
		registry.dispatch( noticesStore ).removeNotice( TRASH_POST_NOTICE_ID );
		const { rest_base: restBase, rest_namespace: restNamespace = 'wp/v2' } =
			postType;
		dispatch( { type: 'REQUEST_POST_DELETE_START' } );
		try {
			const post = select.getCurrentPost();
			await apiFetch( {
				path: `/${ restNamespace }/${ restBase }/${ post.id }`,
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
		dispatch( { type: 'REQUEST_POST_DELETE_FINISH' } );
	};

/**
 * Action that autosaves the current post.  This
 * includes server-side autosaving (default) and client-side (a.k.a. local)
 * autosaving (e.g. on the Web, the post might be committed to Session
 * Storage).
 *
 * @param {Object?} options Extra flags to identify the autosave.
 */
export const autosave =
	( { local = false, ...options } = {} ) =>
	async ( { select, dispatch } ) => {
		const post = select.getCurrentPost();

		// Currently template autosaving is not supported.
		if ( post.type === 'wp_template' ) {
			return;
		}

		if ( local ) {
			const isPostNew = select.isEditedPostNew();
			const title = select.getEditedPostAttribute( 'title' );
			const content = select.getEditedPostAttribute( 'content' );
			const excerpt = select.getEditedPostAttribute( 'excerpt' );
			localAutosaveSet( post.id, isPostNew, title, content, excerpt );
		} else {
			await dispatch.savePost( { isAutosave: true, ...options } );
		}
	};

export const __unstableSaveForPreview =
	( { forceIsAutosaveable } = {} ) =>
	async ( { select, dispatch } ) => {
		if (
			( forceIsAutosaveable || select.isEditedPostAutosaveable() ) &&
			! select.isPostLocked()
		) {
			const isDraft = [ 'draft', 'auto-draft' ].includes(
				select.getEditedPostAttribute( 'status' )
			);
			if ( isDraft ) {
				await dispatch.savePost( { isPreview: true } );
			} else {
				await dispatch.autosave( { isPreview: true } );
			}
		}

		return select.getEditedPostPreviewLink();
	};

/**
 * Action that restores last popped state in undo history.
 */
export const redo =
	() =>
	( { registry } ) => {
		registry.dispatch( coreStore ).redo();
	};

/**
 * Action that pops a record from undo history and undoes the edit.
 */
export const undo =
	() =>
	( { registry } ) => {
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
 * Enable the publish sidebar.
 */
export const enablePublishSidebar =
	() =>
	( { registry } ) => {
		registry
			.dispatch( preferencesStore )
			.set( 'core', 'isPublishSidebarEnabled', true );
	};

/**
 * Disables the publish sidebar.
 */
export const disablePublishSidebar =
	() =>
	( { registry } ) => {
		registry
			.dispatch( preferencesStore )
			.set( 'core', 'isPublishSidebarEnabled', false );
	};

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
export const resetEditorBlocks =
	( blocks, options = {} ) =>
	( { select, dispatch, registry } ) => {
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
 * Returns an action used to set the rendering mode of the post editor. We support multiple rendering modes:
 *
 * -   `post-only`: This mode extracts the post blocks from the template and renders only those. The idea is to allow the user to edit the post/page in isolation without the wrapping template.
 * -   `template-locked`: This mode renders both the template and the post blocks but the template blocks are locked and can't be edited. The post blocks are editable.
 *
 * @param {string} mode Mode (one of 'post-only' or 'template-locked').
 */
export const setRenderingMode =
	( mode ) =>
	( { dispatch, registry, select } ) => {
		if ( select.__unstableIsEditorReady() ) {
			// We clear the block selection but we also need to clear the selection from the core store.
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
			dispatch.editPost( { selection: undefined }, { undoIgnore: true } );
		}

		dispatch( {
			type: 'SET_RENDERING_MODE',
			mode,
		} );
	};

/**
 * Action that changes the width of the editing canvas.
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export function setDeviceType( deviceType ) {
	return {
		type: 'SET_DEVICE_TYPE',
		deviceType,
	};
}

/**
 * Returns an action object used to enable or disable a panel in the editor.
 *
 * @param {string} panelName A string that identifies the panel to enable or disable.
 *
 * @return {Object} Action object.
 */
export const toggleEditorPanelEnabled =
	( panelName ) =>
	( { registry } ) => {
		const inactivePanels =
			registry
				.select( preferencesStore )
				.get( 'core', 'inactivePanels' ) ?? [];

		const isPanelInactive = !! inactivePanels?.includes( panelName );

		// If the panel is inactive, remove it to enable it, else add it to
		// make it inactive.
		let updatedInactivePanels;
		if ( isPanelInactive ) {
			updatedInactivePanels = inactivePanels.filter(
				( invactivePanelName ) => invactivePanelName !== panelName
			);
		} else {
			updatedInactivePanels = [ ...inactivePanels, panelName ];
		}

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'inactivePanels', updatedInactivePanels );
	};

/**
 * Opens a closed panel and closes an open panel.
 *
 * @param {string} panelName A string that identifies the panel to open or close.
 */
export const toggleEditorPanelOpened =
	( panelName ) =>
	( { registry } ) => {
		const openPanels =
			registry.select( preferencesStore ).get( 'core', 'openPanels' ) ??
			[];

		const isPanelOpen = !! openPanels?.includes( panelName );

		// If the panel is open, remove it to close it, else add it to
		// make it open.
		let updatedOpenPanels;
		if ( isPanelOpen ) {
			updatedOpenPanels = openPanels.filter(
				( openPanelName ) => openPanelName !== panelName
			);
		} else {
			updatedOpenPanels = [ ...openPanels, panelName ];
		}

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'openPanels', updatedOpenPanels );
	};

/**
 * Returns an action object used to remove a panel from the editor.
 *
 * @param {string} panelName A string that identifies the panel to remove.
 *
 * @return {Object} Action object.
 */
export function removeEditorPanel( panelName ) {
	return {
		type: 'REMOVE_PANEL',
		panelName,
	};
}

/**
 * Returns an action object used to open/close the inserter.
 *
 * @param {boolean|Object} value                Whether the inserter should be
 *                                              opened (true) or closed (false).
 *                                              To specify an insertion point,
 *                                              use an object.
 * @param {string}         value.rootClientId   The root client ID to insert at.
 * @param {number}         value.insertionIndex The index to insert at.
 *
 * @return {Object} Action object.
 */
export function setIsInserterOpened( value ) {
	return {
		type: 'SET_IS_INSERTER_OPENED',
		value,
	};
}

/**
 * Returns an action object used to open/close the list view.
 *
 * @param {boolean} isOpen A boolean representing whether the list view should be opened or closed.
 * @return {Object} Action object.
 */
export function setIsListViewOpened( isOpen ) {
	return {
		type: 'SET_IS_LIST_VIEW_OPENED',
		isOpen,
	};
}

/**
 * Action that toggles Distraction free mode.
 * Distraction free mode expects there are no sidebars, as due to the
 * z-index values set, you can't close sidebars.
 */
export const toggleDistractionFree =
	() =>
	( { dispatch, registry } ) => {
		const isDistractionFree = registry
			.select( preferencesStore )
			.get( 'core', 'distractionFree' );
		if ( isDistractionFree ) {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'fixedToolbar', false );
		}
		if ( ! isDistractionFree ) {
			registry.batch( () => {
				registry
					.dispatch( preferencesStore )
					.set( 'core', 'fixedToolbar', true );
				dispatch.setIsInserterOpened( false );
				dispatch.setIsListViewOpened( false );
			} );
		}
		registry.batch( () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'distractionFree', ! isDistractionFree );
			registry
				.dispatch( noticesStore )
				.createInfoNotice(
					isDistractionFree
						? __( 'Distraction free off.' )
						: __( 'Distraction free on.' ),
					{
						id: 'core/editor/distraction-free-mode/notice',
						type: 'snackbar',
						actions: [
							{
								label: __( 'Undo' ),
								onClick: () => {
									registry.batch( () => {
										registry
											.dispatch( preferencesStore )
											.set(
												'core',
												'fixedToolbar',
												isDistractionFree ? true : false
											);
										registry
											.dispatch( preferencesStore )
											.toggle(
												'core',
												'distractionFree'
											);
									} );
								},
							},
						],
					}
				);
		} );
	};

/**
 * Triggers an action used to switch editor mode.
 *
 * @param {string} mode The editor mode.
 */
export const switchEditorMode =
	( mode ) =>
	( { dispatch, registry } ) => {
		registry.dispatch( preferencesStore ).set( 'core', 'editorMode', mode );

		// Unselect blocks when we switch to a non visual mode.
		if ( mode !== 'visual' ) {
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
		}

		if ( mode === 'visual' ) {
			speak( __( 'Visual editor selected' ), 'assertive' );
		} else if ( mode === 'text' ) {
			const isDistractionFree = registry
				.select( preferencesStore )
				.get( 'core', 'distractionFree' );
			if ( isDistractionFree ) {
				dispatch.toggleDistractionFree();
			}
			speak( __( 'Code editor selected' ), 'assertive' );
		}
	};

/**
 * Returns an action object used in signalling that the user opened the publish
 * sidebar.
 *
 * @return {Object} Action object
 */
export function openPublishSidebar() {
	return {
		type: 'OPEN_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user closed the
 * publish sidebar.
 *
 * @return {Object} Action object.
 */
export function closePublishSidebar() {
	return {
		type: 'CLOSE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggles the publish sidebar.
 *
 * @return {Object} Action object
 */
export function togglePublishSidebar() {
	return {
		type: 'TOGGLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Backward compatibility
 */

const getBlockEditorAction =
	( name ) =>
	( ...args ) =>
	( { registry } ) => {
		deprecated( "`wp.data.dispatch( 'core/editor' )." + name + '`', {
			since: '5.3',
			alternative:
				"`wp.data.dispatch( 'core/block-editor' )." + name + '`',
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
