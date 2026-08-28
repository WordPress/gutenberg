import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __, _x, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import apiFetch from '@wordpress/api-fetch';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import { decodeEntities } from '@wordpress/html-entities';
import isTemplateRevertable from './utils/is-template-revertable';
import { setRestoredRevisionNotice } from '../utils/restored-revision-notice';
import { buildRevisionsPageQuery } from './private-selectors';
import {
	getDeviceTypeByCanvasWidth,
	VIEWPORT_STATE_BY_DEVICE_TYPE,
} from '../utils/device-type';
import { unlock } from '../lock-unlock';
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
		registry
			.dispatch( noticesStore )
			.createSuccessNotice(
				__( "Custom template created. You're in template mode now." ),
				{
					type: 'snackbar',
					actions: [
						{
							label: __( 'Go back' ),
							onClick: () =>
								dispatch.setRenderingMode(
									select.getEditorSettings()
										.defaultRenderingMode
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
 * Restore a revision on the server and reload the editor.
 *
 * Restoring runs `wp_restore_post_revision()`, the same function the classic
 * revision.php screen uses, so that everything the revision holds is restored,
 * including meta that the editor does not know about. Classic meta boxes are
 * rendered and saved by PHP, and would submit their stale values on the next
 * save, so the editor is loaded again to pick up the restored values.
 *
 * @param {number} revisionId The revision ID to restore.
 */
export const restoreRevision =
	( revisionId ) =>
	async ( { select, registry } ) => {
		const postType = select.getCurrentPostType();
		const postId = select.getCurrentPostId();

		const entityConfig = registry
			.select( coreStore )
			.getEntityConfig( 'postType', postType );

		let restored;
		try {
			restored = await apiFetch( {
				path: `${ entityConfig.getRevisionsUrl(
					postId,
					revisionId
				) }/restore`,
				method: 'POST',
			} );
		} catch ( error ) {
			registry
				.dispatch( noticesStore )
				.createErrorNotice(
					error.message ||
						__( 'The revision could not be restored.' ),
					{
						type: 'snackbar',
						id: 'editor-revision-restore-failed',
					}
				);
			return;
		}

		// The notice outlives the page it was created on.
		setRestoredRevisionNotice( {
			postType,
			postId,
			date: restored?.date,
		} );

		window.location.href = removeQueryArgs(
			window.location.href,
			'revision'
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
