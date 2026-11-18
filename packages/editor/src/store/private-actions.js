import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { addQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import isTemplateRevertable from './utils/is-template-revertable';
import { buildRevisionsPageQuery } from './private-selectors';
import {
	getDeviceTypeByCanvasWidth,
	VIEWPORT_STATE_BY_DEVICE_TYPE,
} from '../utils/device-type';
import { unlock } from '../lock-unlock';
import { BROWSER_BACKUP_NOTICE_ID, STORE_NAME } from './constants';
export * from '../dataviews/store/private-actions';

/**
 * Returns an action object used to set which template is currently being used/edited.
 *
 * @param {string} id Template Id.
 *
 * @return {Object} Action object.
 */
export function setCurrentTemplateId( id ) {
	return {
		type: 'SET_CURRENT_TEMPLATE_ID',
		id,
	};
}

/**
 * Create a block based template.
 *
 * @param {?Object} template Template to create and assign.
 */
export const createTemplate =
	( template ) =>
	async ( { select, dispatch, registry } ) => {
		const savedTemplate = await registry
			.dispatch( coreStore )
			.saveEntityRecord( 'postType', 'wp_template', template );
		registry
			.dispatch( coreStore )
			.editEntityRecord(
				'postType',
				select.getCurrentPostType(),
				select.getCurrentPostId(),
				{
					template: savedTemplate.slug,
				}
			);
		const { defaultRenderingMode, renderingMode } =
			select.getEditorSettings();
		registry
			.dispatch( noticesStore )
			.createSuccessNotice(
				__( "Custom template created. You're in template mode now." ),
				{
					type: 'snackbar',
					// An editor with a fixed rendering mode has no other mode
					// to go back to, so the action is not offered.
					actions: renderingMode
						? []
						: [
								{
									label: __( 'Back' ),
									onClick: () =>
										dispatch.setRenderingMode(
											defaultRenderingMode
										),
								},
							],
				}
			);
		return savedTemplate;
	};

/**
 * Update the provided block types to be visible.
 *
 * @param {string[]} blockNames Names of block types to show.
 */
export const showBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		const existingBlockNames =
			registry
				.select( preferencesStore )
				.get( 'core', 'hiddenBlockTypes' ) ?? [];

		const newBlockNames = existingBlockNames.filter(
			( type ) =>
				! (
					Array.isArray( blockNames ) ? blockNames : [ blockNames ]
				).includes( type )
		);

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'hiddenBlockTypes', newBlockNames );
	};

/**
 * Update the provided block types to be hidden.
 *
 * @param {string[]} blockNames Names of block types to hide.
 */
export const hideBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		const existingBlockNames =
			registry
				.select( preferencesStore )
				.get( 'core', 'hiddenBlockTypes' ) ?? [];

		const mergedBlockNames = new Set( [
			...existingBlockNames,
			...( Array.isArray( blockNames ) ? blockNames : [ blockNames ] ),
		] );

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'hiddenBlockTypes', [ ...mergedBlockNames ] );
	};

/**
 * Reverts a template to its original theme-provided file.
 *
 * @param {Object}  template            The template to revert.
 * @param {Object}  [options]
 * @param {boolean} [options.allowUndo] Whether to allow the user to undo
 *                                      reverting the template. Default true.
 */
export const revertTemplate =
	( template, { allowUndo = true } = {} ) =>
	async ( { registry } ) => {
		const noticeId = 'edit-site-template-reverted';
		registry.dispatch( noticesStore ).removeNotice( noticeId );
		if ( ! isTemplateRevertable( template ) ) {
			registry
				.dispatch( noticesStore )
				.createErrorNotice( __( 'This template is not revertable.' ), {
					type: 'snackbar',
				} );
			return;
		}

		try {
			const templateEntityConfig = registry
				.select( coreStore )
				.getEntityConfig( 'postType', template.type );

			if ( ! templateEntityConfig ) {
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
						__(
							'The editor has encountered an unexpected error. Please reload.'
						),
						{ type: 'snackbar' }
					);
				return;
			}

			const fileTemplatePath = addQueryArgs(
				`${ templateEntityConfig.baseURL }/${ template.id }`,
				{ context: 'edit', source: template.origin }
			);

			const fileTemplate = await apiFetch( { path: fileTemplatePath } );
			if ( ! fileTemplate ) {
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
						__(
							'The editor has encountered an unexpected error. Please reload.'
						),
						{ type: 'snackbar' }
					);
				return;
			}

			const serializeBlocks = ( {
				blocks: blocksForSerialization = [],
			} ) => __unstableSerializeAndClean( blocksForSerialization );

			const edited = registry
				.select( coreStore )
				.getEditedEntityRecord(
					'postType',
					template.type,
					template.id
				);

			// We are fixing up the undo level here to make sure we can undo
			// the revert in the header toolbar correctly.
			registry.dispatch( coreStore ).editEntityRecord(
				'postType',
				template.type,
				template.id,
				{
					content: serializeBlocks, // Required to make the `undo` behave correctly.
					blocks: edited.blocks, // Required to revert the blocks in the editor.
					source: 'custom', // required to avoid turning the editor into a dirty state
				},
				{
					undoIgnore: true, // Required to merge this edit with the last undo level.
				}
			);

			const blocks = parse( fileTemplate?.content?.raw );
			registry
				.dispatch( coreStore )
				.editEntityRecord( 'postType', template.type, fileTemplate.id, {
					content: serializeBlocks,
					blocks,
					source: 'theme',
				} );

			if ( allowUndo ) {
				const undoRevert = () => {
					registry
						.dispatch( coreStore )
						.editEntityRecord(
							'postType',
							template.type,
							edited.id,
							{
								content: serializeBlocks,
								blocks: edited.blocks,
								source: 'custom',
							}
						);
				};

				registry
					.dispatch( noticesStore )
					.createSuccessNotice( __( 'Template reset.' ), {
						type: 'snackbar',
						id: noticeId,
						actions: [
							{
								label: __( 'Undo' ),
								onClick: undoRevert,
							},
						],
					} );
			}
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'Template revert failed. Please reload.' );
			registry
				.dispatch( noticesStore )
				.createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

/**
 * Action that removes an array of templates, template parts or patterns.
 *
 * @param {Array} items An array of template,template part or pattern objects to remove.
 */
export const removeTemplates =
	( items ) =>
	async ( { registry } ) => {
		const isResetting = items.every( ( item ) => item?.has_theme_file );

		const promiseResult = await Promise.allSettled(
			items.map( ( item ) => {
				return registry
					.dispatch( coreStore )
					.deleteEntityRecord(
						'postType',
						item.type,
						item.id,
						{ force: true },
						{ throwOnError: true }
					);
			} )
		);

		// If all the promises were fulfilled with success.
		if ( promiseResult.every( ( { status } ) => status === 'fulfilled' ) ) {
			let successMessage;

			if ( items.length === 1 ) {
				// Depending on how the entity was retrieved its title might be
				// an object or simple string.
				let title;
				if ( typeof items[ 0 ].title === 'string' ) {
					title = items[ 0 ].title;
				} else if ( typeof items[ 0 ].title?.rendered === 'string' ) {
					title = items[ 0 ].title?.rendered;
				} else if ( typeof items[ 0 ].title?.raw === 'string' ) {
					title = items[ 0 ].title?.raw;
				}
				successMessage = isResetting
					? sprintf(
							/* translators: %s: The template/part's name. */
							__( '"%s" reset.' ),
							decodeEntities( title )
						)
					: sprintf(
							/* translators: %s: The template/part's name. */
							_x( '"%s" deleted.', 'template part' ),
							decodeEntities( title )
						);
			} else {
				successMessage = isResetting
					? __( 'Items reset.' )
					: __( 'Items deleted.' );
			}

			registry
				.dispatch( noticesStore )
				.createSuccessNotice( successMessage, {
					type: 'snackbar',
					id: 'editor-template-deleted-success',
				} );
		} else {
			// If there was at lease one failure.
			let errorMessage;
			// If we were trying to delete a single template.
			if ( promiseResult.length === 1 ) {
				if ( promiseResult[ 0 ].reason?.message ) {
					errorMessage = promiseResult[ 0 ].reason.message;
				} else {
					errorMessage = isResetting
						? __( 'An error occurred while reverting the item.' )
						: __( 'An error occurred while deleting the item.' );
				}
				// If we were trying to delete a multiple templates
			} else {
				const errorMessages = new Set();
				const failedPromises = promiseResult.filter(
					( { status } ) => status === 'rejected'
				);
				for ( const failedPromise of failedPromises ) {
					if ( failedPromise.reason?.message ) {
						errorMessages.add( failedPromise.reason.message );
					}
				}
				if ( errorMessages.size === 0 ) {
					errorMessage = __(
						'An error occurred while deleting the items.'
					);
				} else if ( errorMessages.size === 1 ) {
					errorMessage = isResetting
						? sprintf(
								/* translators: %s: an error message */
								__(
									'An error occurred while reverting the items: %s'
								),
								[ ...errorMessages ][ 0 ]
							)
						: sprintf(
								/* translators: %s: an error message */
								__(
									'An error occurred while deleting the items: %s'
								),
								[ ...errorMessages ][ 0 ]
							);
				} else {
					errorMessage = isResetting
						? sprintf(
								/* translators: %s: a list of comma separated error messages */
								__(
									'Some errors occurred while reverting the items: %s'
								),
								[ ...errorMessages ].join( ',' )
							)
						: sprintf(
								/* translators: %s: a list of comma separated error messages */
								__(
									'Some errors occurred while deleting the items: %s'
								),
								[ ...errorMessages ].join( ',' )
							);
				}
			}
			registry
				.dispatch( noticesStore )
				.createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

/**
 * Set the default rendering mode preference for the current post type.
 *
 * @param {string} mode The rendering mode to set as default.
 */
export const setDefaultRenderingMode =
	( mode ) =>
	( { select, registry } ) => {
		const postType = select.getCurrentPostType();
		const theme = registry
			.select( coreStore )
			.getCurrentTheme()?.stylesheet;
		const renderingModes =
			registry
				.select( preferencesStore )
				.get( 'core', 'renderingModes' )?.[ theme ] ?? {};

		if ( renderingModes[ postType ] === mode ) {
			return;
		}

		const newModes = {
			[ theme ]: {
				...renderingModes,
				[ postType ]: mode,
			},
		};

		registry
			.dispatch( preferencesStore )
			.set( 'core', 'renderingModes', newModes );
	};

/**
 * Set the current global styles navigation path.
 *
 * @param {string} path The navigation path.
 * @return {Object} Action object.
 */
export function setStylesPath( path ) {
	return {
		type: 'SET_STYLES_PATH',
		path,
	};
}

/**
 * Set whether the stylebook is visible.
 *
 * @param {boolean} show Whether to show the stylebook.
 * @return {Object} Action object.
 */
export function setShowStylebook( show ) {
	return {
		type: 'SET_SHOW_STYLEBOOK',
		show,
	};
}

/**
 * Reset the global styles navigation to initial state.
 *
 * @return {Object} Action object.
 */
export function resetStylesNavigation() {
	return {
		type: 'RESET_STYLES_NAVIGATION',
	};
}

/**
 * Set the width of the canvas.
 *
 * @param {number} width The width of the canvas in pixels.
 */
export function setCanvasWidth( width ) {
	return ( { dispatch, registry } ) => {
		dispatch( {
			type: 'SET_CANVAS_WIDTH',
			width,
		} );

		const blockEditorSelect = unlock( registry.select( blockEditorStore ) );

		// While Responsive editing is enabled, the canvas width also drives the
		// viewport style state, whether changed via the device preview or by
		// manually resizing the canvas.
		if ( blockEditorSelect.isResponsiveEditing() ) {
			const viewportSettings =
				blockEditorSelect.getSettings().__experimentalFeatures
					?.viewport;
			const deviceType = getDeviceTypeByCanvasWidth(
				width,
				viewportSettings
			);
			unlock(
				registry.dispatch( blockEditorStore )
			).setStyleStateViewport(
				VIEWPORT_STATE_BY_DEVICE_TYPE[ deviceType ] ?? 'default'
			);
		}
	};
}

/**
 * Set the calculated canvas height for the footer viewport status.
 *
 * @param {number|undefined} height Canvas height in pixels, or undefined when unconstrained.
 * @return {Object} Action object.
 */
export function setCanvasHeight( height ) {
	return {
		type: 'SET_CANVAS_HEIGHT',
		height,
	};
}

/**
 * Set the measured canvas width without changing the requested width.
 *
 * @param {number|undefined} width Rendered canvas width in pixels.
 * @return {Object} Action object.
 */
export function setPhysicalCanvasWidth( width ) {
	return {
		type: 'SET_PHYSICAL_CANVAS_WIDTH',
		width,
	};
}

/**
 * Set the current revision ID for revisions preview mode.
 * Pass a revision ID to enter revisions mode, or null to exit.
 *
 * @param {number|null} revisionId The revision ID, or null to exit revisions mode.
 * @return {Object} Action object.
 */
export function setCurrentRevisionId( revisionId ) {
	return {
		type: 'SET_CURRENT_REVISION_ID',
		revisionId,
	};
}

/**
 * Set the current revisions page number and select the newest
 * revision on that page once it loads.
 *
 * @param {number} page The page number.
 */
export const setRevisionPage =
	( page ) =>
	async ( { dispatch, select, registry } ) => {
		const postType = select.getCurrentPostType();
		const postId = select.getCurrentPostId();
		const entityConfig = registry
			.select( coreStore )
			.getEntityConfig( 'postType', postType );
		const revisionKey = entityConfig?.revisionKey || 'id';

		const revisions = await registry
			.resolveSelect( coreStore )
			.getRevisions(
				'postType',
				postType,
				postId,
				buildRevisionsPageQuery( revisionKey, page )
			);

		registry.batch( () => {
			dispatch( { type: 'SET_REVISION_PAGE', page } );
			if ( revisions?.length ) {
				dispatch.setCurrentRevisionId( revisions[ 0 ][ revisionKey ] );
			}
		} );
	};

function createRevisionsLoadFailedNotice( registry ) {
	registry
		.dispatch( noticesStore )
		.createNotice( 'warning', __( 'Revisions could not be loaded.' ), {
			type: 'snackbar',
			id: 'editor-revisions-load-failed',
		} );
}

/**
 * Open a revision from a shared URL and select the page that contains it.
 *
 * @param {number} revisionId The revision ID to open.
 */
export const openRevision =
	( revisionId ) =>
	async ( { dispatch, select, registry } ) => {
		// Set the revision before loading its page so the canvas and slider
		// can show loading states.
		dispatch.setCurrentRevisionId( revisionId );

		const postType = select.getCurrentPostType();
		const postId = select.getCurrentPostId();
		const entityConfig = registry
			.select( coreStore )
			.getEntityConfig( 'postType', postType );
		const revisionKey = entityConfig?.revisionKey || 'id';

		// Fetch all IDs in the slider's order so the revision's index points
		// to the right page.
		const revisions = await registry
			.resolveSelect( coreStore )
			.getRevisions( 'postType', postType, postId, {
				per_page: -1,
				context: 'edit',
				orderby: 'date',
				order: 'desc',
				_fields: revisionKey,
			} );

		// Ignore stale results if the user navigated during the request.
		if ( select.getCurrentRevisionId() !== revisionId ) {
			return;
		}

		// core-data swallows request errors, so a missing result means the
		// request failed. Keep the selection so a reload can try again.
		if ( ! revisions ) {
			createRevisionsLoadFailedNotice( registry );
			return;
		}

		const index = revisions.findIndex(
			( revision ) => revision[ revisionKey ] === revisionId
		);
		if ( index === -1 ) {
			// Autosaves can be missing from the collection when revisions are
			// disabled. Fetch the record directly so a request failure is not
			// mistaken for a 404.
			let revision;
			try {
				revision = await apiFetch( {
					path: addQueryArgs(
						entityConfig.getRevisionsUrl( postId, revisionId ),
						{ context: 'edit' }
					),
				} );
			} catch ( error ) {
				if ( select.getCurrentRevisionId() !== revisionId ) {
					return;
				}
				if ( error?.data?.status !== 404 ) {
					createRevisionsLoadFailedNotice( registry );
					return;
				}

				dispatch.setCurrentRevisionId( null );
				registry
					.dispatch( noticesStore )
					.createNotice( 'warning', __( 'Invalid revision ID.' ), {
						type: 'snackbar',
						id: 'editor-revision-invalid',
					} );
				return;
			}

			if ( select.getCurrentRevisionId() !== revisionId ) {
				return;
			}
			if ( ! revision ) {
				createRevisionsLoadFailedNotice( registry );
				return;
			}
			await registry
				.dispatch( coreStore )
				.receiveRevisions( 'postType', postType, postId, revision, {
					context: 'edit',
				} );
			return;
		}

		const page = Math.floor( index / select.getRevisionsPerPage() ) + 1;
		if ( page !== select.getRevisionPage() ) {
			// `setRevisionPage()` would replace the deep-linked revision with
			// the newest revision on the page.
			dispatch( { type: 'SET_REVISION_PAGE', page } );
		}
	};

/**
 * Set whether the revision diff highlighting is shown.
 *
 * @param {boolean} showDiff Whether to show diff highlighting.
 * @return {Object} Action object.
 */
export function setShowRevisionDiff( showDiff ) {
	return {
		type: 'SET_SHOW_REVISION_DIFF',
		showDiff,
	};
}

/**
 * Opens the revisions view on the backup kept in the browser, compared with
 * what the editor shows. Nothing is saved.
 *
 * @param {Object} backup         The backup.
 * @param {string} backup.title   The backed up title.
 * @param {string} backup.content The backed up content.
 * @param {string} backup.excerpt The backed up excerpt.
 * @param {number} [backup.time]  When the backup was made, in milliseconds.
 * @return {Object} Action object.
 */
export function viewBrowserBackup( { title, content, excerpt, time } ) {
	return {
		type: 'VIEW_BROWSER_BACKUP',
		backup: {
			date: time ? new Date( time ).toISOString() : undefined,
			title: { raw: title },
			content: { raw: content },
			excerpt: { raw: excerpt },
		},
	};
}

/**
 * Replaces the editor's content with the browser backup shown in the
 * revisions view. Like any edit, it is saved by the next save or autosave.
 *
 * For unpublished posts, the current content is saved first so that it is kept
 * as a revision.
 */
export const restoreBrowserBackup =
	() =>
	async ( { select, dispatch, registry } ) => {
		const backup = select.getBrowserBackup();
		if ( ! backup ) {
			return;
		}

		// A save that is already in progress would make the save below a
		// no-op, so wait for it to finish.
		if ( select.isSavingPost() ) {
			await new Promise( ( resolve ) => {
				const unsubscribe = registry.subscribe( () => {
					if ( ! select.isSavingPost() ) {
						unsubscribe();
						resolve();
					}
				}, STORE_NAME );
			} );
		}

		// Save the current content first so that it is stored as a revision.
		if (
			shouldSaveBeforeRestore( select, {
				title: backup.title.raw,
				content: backup.content.raw,
				excerpt: backup.excerpt.raw,
			} )
		) {
			await dispatch.savePost();
			if ( didSaveFail( select ) ) {
				registry.dispatch( noticesStore ).createErrorNotice(
					__(
						'The backup was not restored because the current version of the post could not be saved first. Your content has not been changed.'
					),
					// Revisions mode does not show inline notices, so use
					// a snackbar.
					{
						type: 'snackbar',
						explicitDismiss: true,
						id: 'editor-revision-restore-failed',
					}
				);
				return;
			}
		}

		dispatch.setCurrentRevisionId( null );
		dispatch.editPost( {
			title: backup.title.raw,
			excerpt: backup.excerpt.raw,
		} );
		dispatch.resetEditorBlocks( parse( backup.content.raw ) );
		registry
			.dispatch( noticesStore )
			.removeNotice( BROWSER_BACKUP_NOTICE_ID );

		// Replaces the "Draft saved" notice of the save above, which is about
		// the previous content, not the restored backup.
		registry
			.dispatch( noticesStore )
			.createSuccessNotice( __( 'Backup restored.' ), {
				type: 'snackbar',
				id: 'editor-save',
			} );
	};

/**
 * Creates the notice shown when a revision is not restored because the post
 * is saving.
 *
 * @param {Object} registry The data registry.
 */
function createRestoreWhileSavingNotice( registry ) {
	registry.dispatch( noticesStore ).createErrorNotice(
		__(
			'The revision could not be restored while the post is saving. Wait for the save to finish, then try again.'
		),
		// Revisions mode does not show inline notices, so use a snackbar.
		{
			type: 'snackbar',
			explicitDismiss: true,
			id: 'editor-revision-restore-failed',
		}
	);
}

/**
 * Statuses where saving the post does not change what visitors can see.
 */
const UNPUBLISHED_POST_STATUSES = [ 'auto-draft', 'draft', 'pending' ];

/**
 * Returns whether the given post fields differ from the edits a restore would
 * apply.
 *
 * @param {Object} fields         The post's title, content, excerpt, and meta.
 * @param {string} fields.title   The post title.
 * @param {string} fields.content The post content.
 * @param {string} fields.excerpt The post excerpt.
 * @param {Object} fields.meta    The post meta.
 * @param {Object} edits          The edits the restore would apply.
 * @return {boolean} Whether restoring would replace different content.
 */
function hasContentToReplace( fields, edits ) {
	const hasDifferentFields = [ 'title', 'content', 'excerpt' ].some(
		( attribute ) =>
			edits[ attribute ] !== undefined &&
			fields[ attribute ] !== edits[ attribute ]
	);
	if ( hasDifferentFields || edits.meta === undefined ) {
		return hasDifferentFields;
	}

	// Meta includes footnotes, which are not part of the post content. A
	// difference in key order is treated as a change, which only means an
	// extra save.
	return Object.keys( edits.meta ).some(
		( key ) =>
			JSON.stringify( fields.meta?.[ key ] ) !==
			JSON.stringify( edits.meta[ key ] )
	);
}

/**
 * Returns whether the last save of the current post failed. A save that was
 * stopped before the request, such as by an `editor.preSavePost` filter, does
 * not record a save error, so a post that is still dirty is treated as failed.
 *
 * @param {Object} select The editor store selectors.
 * @return {boolean} Whether the save failed.
 */
function didSaveFail( select ) {
	return select.didPostSaveRequestFail() || select.isEditedPostDirty();
}

/**
 * Returns whether the current content should be saved before a restore
 * replaces it: the post is saveable, neither its saved nor its edited status
 * is public, and the restore would change it.
 *
 * @param {Object} select The editor store selectors.
 * @param {Object} edits  The edits the restore would apply.
 * @return {boolean} Whether to save first.
 */
function shouldSaveBeforeRestore( select, edits ) {
	return (
		select.isEditedPostSaveable() &&
		UNPUBLISHED_POST_STATUSES.includes(
			select.getCurrentPostAttribute( 'status' )
		) &&
		UNPUBLISHED_POST_STATUSES.includes(
			select.getEditedPostAttribute( 'status' )
		) &&
		hasContentToReplace(
			{
				title: select.getEditedPostAttribute( 'title' ),
				content: select.getEditedPostContent(),
				excerpt: select.getEditedPostAttribute( 'excerpt' ),
				meta: select.getEditedPostAttribute( 'meta' ),
			},
			edits
		)
	);
}

/**
 * Restore a revision by replacing the current content with the revision's content
 * and auto-saving.
 *
 * For unpublished posts, the current content is saved first so that it is kept
 * as a revision. Otherwise content that only exists in the editor or in an
 * autosave could be lost when the restored revision is saved.
 *
 * @param {number} revisionId The revision ID to restore.
 */
export const restoreRevision =
	( revisionId ) =>
	async ( { select, dispatch, registry } ) => {
		const postType = select.getCurrentPostType();
		const postId = select.getCurrentPostId();

		const entityConfig = registry
			.select( coreStore )
			.getEntityConfig( 'postType', postType );
		const revisionKey = entityConfig?.revisionKey || 'id';

		// Use resolveSelect to ensure the revision is fetched if not yet
		// in the store. The _fields parameter matches the query used by
		// getRevisions so the result is served from cache without an
		// extra API call.
		const revision = await registry
			.resolveSelect( coreStore )
			.getRevision( 'postType', postType, postId, revisionId, {
				context: 'edit',
				_fields: [
					...new Set( [
						'id',
						'date',
						'modified',
						'author',
						'meta',
						'title',
						'excerpt',
						'content.raw',
						revisionKey,
					] ),
				].join(),
			} );

		if ( ! revision ) {
			return;
		}

		// Build the edits object with all restorable fields from the revision.
		const edits = {
			blocks: undefined,
			content: revision.content.raw,
		};
		if ( revision.title?.raw !== undefined ) {
			edits.title = revision.title.raw;
		}
		if ( revision.excerpt?.raw !== undefined ) {
			edits.excerpt = revision.excerpt.raw;
		}
		if ( revision.meta !== undefined ) {
			edits.meta = revision.meta;
		}

		// A save that is already in progress would make the save below a
		// no-op, so the current content could not be kept.
		if ( select.isSavingPost() ) {
			createRestoreWhileSavingNotice( registry );
			return;
		}

		// Save the current content first so that it is stored as a revision
		// and the restore can be undone. Only do this when neither the saved
		// nor the edited status is public, so that unsaved edits are not
		// published. A post that can't be saved has no title, content, or
		// excerpt to keep.
		if ( shouldSaveBeforeRestore( select, edits ) ) {
			await dispatch.savePost();
			if ( didSaveFail( select ) ) {
				registry.dispatch( noticesStore ).createErrorNotice(
					__(
						'The revision was not restored because the current version of the post could not be saved first. Your content has not been changed.'
					),
					// Revisions mode does not show inline notices, so use
					// a snackbar.
					{
						type: 'snackbar',
						explicitDismiss: true,
						id: 'editor-revision-restore-failed',
					}
				);
				return;
			}
		}

		// Keep the saved fields that the restore replaces, so it can be undone.
		const previousFields = {
			title: select.getCurrentPostAttribute( 'title' ),
			content: select.getCurrentPostAttribute( 'content' ),
			excerpt: select.getCurrentPostAttribute( 'excerpt' ),
		};
		if ( edits.meta !== undefined ) {
			const savedMeta = select.getCurrentPostAttribute( 'meta' ) ?? {};
			previousFields.meta = Object.fromEntries(
				Object.keys( edits.meta ).map( ( key ) => [
					key,
					savedMeta[ key ],
				] )
			);
		}

		// Check again, as an autosave may have started during the save above.
		// Nothing has been changed yet, so it is safe to stop here.
		if ( select.isSavingPost() ) {
			createRestoreWhileSavingNotice( registry );
			return;
		}

		// Apply edits and save.
		dispatch.editPost( edits );

		// Exit revisions mode.
		dispatch.setCurrentRevisionId( null );

		// Save the post to persist the restored revision.
		await dispatch.savePost();
		if ( didSaveFail( select ) ) {
			// The restored content is only in the editor. If the post was
			// saved above, it is now newer than the autosave, and the autosave
			// can be deleted the next time the editor loads.
			registry
				.dispatch( noticesStore )
				.createErrorNotice(
					__(
						'The revision was restored in the editor but could not be saved. Save the post before leaving this page to keep the restored content.'
					),
					{ id: 'editor-revision-restore-failed' }
				);
			return;
		}

		// The saved post is now newer than any autosave, so the
		// autosave notice is stale.
		registry.dispatch( noticesStore ).removeNotice( 'autosave-exists' );

		const undoRestore = async () => {
			// The editor may have moved on to a different post.
			if (
				select.getCurrentPostId() !== postId ||
				select.getCurrentPostType() !== postType
			) {
				return;
			}

			if ( select.isSavingPost() ) {
				registry
					.dispatch( noticesStore )
					.createErrorNotice(
						__(
							'The restore could not be undone while the post is saving. Wait for the save to finish, then try again.'
						),
						{ id: 'editor-revision-restore-failed' }
					);
				return;
			}

			dispatch.editPost( { blocks: undefined, ...previousFields } );
			await dispatch.savePost();
			if ( didSaveFail( select ) ) {
				return;
			}

			registry
				.dispatch( noticesStore )
				.createSuccessNotice( __( 'Restore undone.' ), {
					type: 'snackbar',
					id: 'editor-revision-restore-undone',
				} );
		};

		// Show success notice, with an Undo action when there is something
		// to undo.
		const canUndo = hasContentToReplace( previousFields, edits );
		registry.dispatch( noticesStore ).createSuccessNotice(
			sprintf(
				/* translators: %s: Date and time of the revision. */
				__( 'Restored to revision from %s.' ),
				dateI18n( getDateSettings().formats.datetime, revision.date )
			),
			{
				type: 'snackbar',
				id: 'editor-revision-restored',
				...( canUndo && {
					actions: [
						{
							label: __( 'Undo' ),
							onClick: undoRestore,
						},
					],
				} ),
			}
		);
	};

/**
 * Select a note by its ID, or clear the selection.
 *
 * @param {undefined|number|'new'} noteId          The note ID to select, 'new' to open the new note form, or undefined to clear.
 * @param {Object}                 [options]       Optional options for the selection.
 * @param {boolean}                [options.focus] Whether to focus the selected note. Default false.
 * @return {Object} Action object.
 */
export function selectNote( noteId, options = { focus: false } ) {
	return {
		type: 'SELECT_NOTE',
		noteId,
		options,
	};
}
