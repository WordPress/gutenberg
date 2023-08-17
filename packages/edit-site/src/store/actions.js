/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';
import { addQueryArgs, getPathAndQueryString } from '@wordpress/url';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { speak } from '@wordpress/a11y';
import { store as preferencesStore } from '@wordpress/preferences';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { STORE_NAME as editSiteStoreName } from './constants';
import isTemplateRevertable from '../utils/is-template-revertable';

/**
 * Dispatches an action that toggles a feature flag.
 *
 * @param {string} featureName Feature name.
 */
export function toggleFeature( featureName ) {
	return function ( { registry } ) {
		deprecated( "select( 'core/edit-site' ).toggleFeature( featureName )", {
			since: '6.0',
			alternative:
				"select( 'core/preferences').toggle( 'core/edit-site', featureName )",
		} );

		registry
			.dispatch( preferencesStore )
			.toggle( 'core/edit-site', featureName );
	};
}

/**
 * Action that changes the width of the editing canvas.
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export function __experimentalSetPreviewDeviceType( deviceType ) {
	return {
		type: 'SET_PREVIEW_DEVICE_TYPE',
		deviceType,
	};
}

/**
 * Action that sets a template, optionally fetching it from REST API.
 *
 * @param {number} templateId   The template ID.
 * @param {string} templateSlug The template slug.
 * @return {Object} Action object.
 */
export const setTemplate =
	( templateId, templateSlug ) =>
	async ( { dispatch, registry } ) => {
		if ( ! templateSlug ) {
			try {
				const template = await registry
					.resolveSelect( coreStore )
					.getEntityRecord( 'postType', 'wp_template', templateId );
				templateSlug = template?.slug;
			} catch ( error ) {}
		}

		dispatch( {
			type: 'SET_EDITED_POST',
			postType: 'wp_template',
			id: templateId,
			context: { templateSlug },
		} );
	};

/**
 * Action that adds a new template and sets it as the current template.
 *
 * @param {Object} template The template.
 *
 * @return {Object} Action object used to set the current template.
 */
export const addTemplate =
	( template ) =>
	async ( { dispatch, registry } ) => {
		const newTemplate = await registry
			.dispatch( coreStore )
			.saveEntityRecord( 'postType', 'wp_template', template );

		if ( template.content ) {
			registry
				.dispatch( coreStore )
				.editEntityRecord(
					'postType',
					'wp_template',
					newTemplate.id,
					{ blocks: parse( template.content ) },
					{ undoIgnore: true }
				);
		}

		dispatch( {
			type: 'SET_EDITED_POST',
			postType: 'wp_template',
			id: newTemplate.id,
			context: { templateSlug: newTemplate.slug },
		} );
	};

/**
 * Action that removes a template.
 *
 * @param {Object} template The template object.
 */
export const removeTemplate =
	( template ) =>
	async ( { registry } ) => {
		try {
			await registry
				.dispatch( coreStore )
				.deleteEntityRecord( 'postType', template.type, template.id, {
					force: true,
				} );

			const lastError = registry
				.select( coreStore )
				.getLastEntityDeleteError(
					'postType',
					template.type,
					template.id
				);

			if ( lastError ) {
				throw lastError;
			}

			// Depending on how the entity was retrieved it's title might be
			// an object or simple string.
			const templateTitle =
				typeof template.title === 'string'
					? template.title
					: template.title?.rendered;

			registry.dispatch( noticesStore ).createSuccessNotice(
				sprintf(
					/* translators: The template/part's name. */
					__( '"%s" deleted.' ),
					decodeEntities( templateTitle )
				),
				{ type: 'snackbar', id: 'site-editor-template-deleted-success' }
			);
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while deleting the template.' );

			registry
				.dispatch( noticesStore )
				.createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

/**
 * Action that sets a template part.
 *
 * @param {string} templatePartId The template part ID.
 *
 * @return {Object} Action object.
 */
export function setTemplatePart( templatePartId ) {
	return {
		type: 'SET_EDITED_POST',
		postType: 'wp_template_part',
		id: templatePartId,
	};
}

/**
 * Action that sets a navigation menu.
 *
 * @param {string} navigationMenuId The Navigation Menu Post ID.
 *
 * @return {Object} Action object.
 */
export function setNavigationMenu( navigationMenuId ) {
	return {
		type: 'SET_EDITED_POST',
		postType: 'wp_navigation',
		id: navigationMenuId,
	};
}

/**
 * Action that sets an edited entity.
 *
 * @param {string} postType The entity's post type.
 * @param {string} postId   The entity's ID.
 *
 * @return {Object} Action object.
 */
export function setEditedEntity( postType, postId ) {
	return {
		type: 'SET_EDITED_POST',
		postType,
		id: postId,
	};
}

/**
 * @deprecated
 */
export function setHomeTemplateId() {
	deprecated( "dispatch( 'core/edit-site' ).setHomeTemplateId", {
		since: '6.2',
		version: '6.4',
	} );

	return {
		type: 'NOTHING',
	};
}

/**
 * Set's the current block editor context.
 *
 * @param {Object} context The context object.
 *
 * @return {number} The resolved template ID for the page route.
 */
export function setEditedPostContext( context ) {
	return {
		type: 'SET_EDITED_POST_CONTEXT',
		context,
	};
}

/**
 * Resolves the template for a page and displays both. If no path is given, attempts
 * to use the postId to generate a path like `?p=${ postId }`.
 *
 * @param {Object} page         The page object.
 * @param {string} page.type    The page type.
 * @param {string} page.slug    The page slug.
 * @param {string} page.path    The page path.
 * @param {Object} page.context The page context.
 *
 * @return {number} The resolved template ID for the page route.
 */
export const setPage =
	( page ) =>
	async ( { dispatch, registry } ) => {
		if ( ! page.path && page.context?.postId ) {
			const entity = await registry
				.resolveSelect( coreStore )
				.getEntityRecord(
					'postType',
					page.context.postType || 'post',
					page.context.postId
				);
			// If the entity is undefined for some reason, path will resolve to "/"
			page.path = getPathAndQueryString( entity?.link );
		}

		const template = await registry
			.resolveSelect( coreStore )
			.__experimentalGetTemplateForLink( page.path );

		if ( ! template ) {
			return;
		}

		dispatch( {
			type: 'SET_EDITED_POST',
			postType: 'wp_template',
			id: template.id,
			context: {
				...page.context,
				templateSlug: template.slug,
			},
		} );

		return template.id;
	};

/**
 * Action that sets the active navigation panel menu.
 *
 * @deprecated
 *
 * @return {Object} Action object.
 */
export function setNavigationPanelActiveMenu() {
	deprecated( "dispatch( 'core/edit-site' ).setNavigationPanelActiveMenu", {
		since: '6.2',
		version: '6.4',
	} );

	return { type: 'NOTHING' };
}

/**
 * Opens the navigation panel and sets its active menu at the same time.
 *
 * @deprecated
 */
export function openNavigationPanelToMenu() {
	deprecated( "dispatch( 'core/edit-site' ).openNavigationPanelToMenu", {
		since: '6.2',
		version: '6.4',
	} );

	return { type: 'NOTHING' };
}

/**
 * Sets whether the navigation panel should be open.
 *
 * @deprecated
 */
export function setIsNavigationPanelOpened() {
	deprecated( "dispatch( 'core/edit-site' ).setIsNavigationPanelOpened", {
		since: '6.2',
		version: '6.4',
	} );

	return { type: 'NOTHING' };
}

/**
 * Opens or closes the inserter.
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
 * Returns an action object used to update the settings.
 *
 * @param {Object} settings New settings.
 *
 * @return {Object} Action object.
 */
export function updateSettings( settings ) {
	return {
		type: 'UPDATE_SETTINGS',
		settings,
	};
}

/**
 * Sets whether the list view panel should be open.
 *
 * @param {boolean} isOpen If true, opens the list view. If false, closes it.
 *                         It does not toggle the state, but sets it directly.
 */
export function setIsListViewOpened( isOpen ) {
	return {
		type: 'SET_IS_LIST_VIEW_OPENED',
		isOpen,
	};
}

/**
 * Sets whether the save view panel should be open.
 *
 * @param {boolean} isOpen If true, opens the save view. If false, closes it.
 *                         It does not toggle the state, but sets it directly.
 */
export function setIsSaveViewOpened( isOpen ) {
	return {
		type: 'SET_IS_SAVE_VIEW_OPENED',
		isOpen,
	};
}

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
				{ context: 'edit', source: 'theme' }
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
					.createSuccessNotice( __( 'Template reverted.' ), {
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
 * Action that opens an editor sidebar.
 *
 * @param {?string} name Sidebar name to be opened.
 */
export const openGeneralSidebar =
	( name ) =>
	( { registry } ) => {
		registry
			.dispatch( interfaceStore )
			.enableComplementaryArea( editSiteStoreName, name );
	};

/**
 * Action that closes the sidebar.
 */
export const closeGeneralSidebar =
	() =>
	( { registry } ) => {
		registry
			.dispatch( interfaceStore )
			.disableComplementaryArea( editSiteStoreName );
	};

export const switchEditorMode =
	( mode ) =>
	( { registry } ) => {
		registry
			.dispatch( 'core/preferences' )
			.set( 'core/edit-site', 'editorMode', mode );

		// Unselect blocks when we switch to a non visual mode.
		if ( mode !== 'visual' ) {
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
		}

		if ( mode === 'visual' ) {
			speak( __( 'Visual editor selected' ), 'assertive' );
		} else if ( mode === 'text' ) {
			speak( __( 'Code editor selected' ), 'assertive' );
		}
	};

/**
 * Sets whether or not the editor allows only page content to be edited.
 *
 * @param {boolean} hasPageContentFocus True to allow only page content to be
 *                                      edited, false to allow template to be
 *                                      edited.
 */
export const setHasPageContentFocus =
	( hasPageContentFocus ) =>
	( { dispatch, registry } ) => {
		if ( hasPageContentFocus ) {
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
		}
		dispatch( {
			type: 'SET_HAS_PAGE_CONTENT_FOCUS',
			hasPageContentFocus,
		} );
	};
