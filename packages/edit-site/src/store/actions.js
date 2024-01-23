/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { parse, __unstableSerializeAndClean } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import { speak } from '@wordpress/a11y';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { STORE_NAME as editSiteStoreName } from './constants';
import isTemplateRevertable from '../utils/is-template-revertable';
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
} from '../utils/constants';
import { removeTemplates } from './private-actions';

/**
 * Dispatches an action that toggles a feature flag.
 *
 * @param {string} featureName Feature name.
 */
export function toggleFeature( featureName ) {
	return function ( { registry } ) {
		deprecated(
			"dispatch( 'core/edit-site' ).toggleFeature( featureName )",
			{
				since: '6.0',
				alternative:
					"dispatch( 'core/preferences').toggle( 'core/edit-site', featureName )",
			}
		);

		registry
			.dispatch( preferencesStore )
			.toggle( 'core/edit-site', featureName );
	};
}

/**
 * Action that changes the width of the editing canvas.
 *
 * @deprecated
 *
 * @param {string} deviceType
 *
 * @return {Object} Action object.
 */
export const __experimentalSetPreviewDeviceType =
	( deviceType ) =>
	( { registry } ) => {
		deprecated(
			"dispatch( 'core/edit-site' ).__experimentalSetPreviewDeviceType",
			{
				since: '6.5',
				version: '6.7',
				hint: 'registry.dispatch( editorStore ).setDeviceType',
			}
		);
		registry.dispatch( editorStore ).setDeviceType( deviceType );
	};

/**
 * Action that sets a template, optionally fetching it from REST API.
 *
 * @return {Object} Action object.
 */
export function setTemplate() {
	deprecated( "dispatch( 'core/edit-site' ).setTemplate", {
		since: '6.5',
		version: '6.8',
		hint: 'The setTemplate is not needed anymore, the correct entity is resolved from the URL automatically.',
	} );

	return {
		type: 'NOTHING',
	};
}

/**
 * Action that adds a new template and sets it as the current template.
 *
 * @param {Object} template The template.
 *
 * @deprecated
 *
 * @return {Object} Action object used to set the current template.
 */
export const addTemplate =
	( template ) =>
	async ( { dispatch, registry } ) => {
		deprecated( "dispatch( 'core/edit-site' ).addTemplate", {
			since: '6.5',
			version: '6.8',
			hint: 'use saveEntityRecord directly',
		} );

		const newTemplate = await registry
			.dispatch( coreStore )
			.saveEntityRecord( 'postType', TEMPLATE_POST_TYPE, template );

		if ( template.content ) {
			registry
				.dispatch( coreStore )
				.editEntityRecord(
					'postType',
					TEMPLATE_POST_TYPE,
					newTemplate.id,
					{ blocks: parse( template.content ) },
					{ undoIgnore: true }
				);
		}

		dispatch( {
			type: 'SET_EDITED_POST',
			postType: TEMPLATE_POST_TYPE,
			id: newTemplate.id,
		} );
	};

/**
 * Action that removes a template.
 *
 * @param {Object} template The template object.
 */
export const removeTemplate = ( template ) => {
	return removeTemplates( [ template ] );
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
		postType: TEMPLATE_PART_POST_TYPE,
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
		postType: NAVIGATION_POST_TYPE,
		id: navigationMenuId,
	};
}

/**
 * Action that sets an edited entity.
 *
 * @param {string} postType The entity's post type.
 * @param {string} postId   The entity's ID.
 * @param {Object} context  The entity's context.
 *
 * @return {Object} Action object.
 */
export function setEditedEntity( postType, postId, context ) {
	return {
		type: 'SET_EDITED_POST',
		postType,
		id: postId,
		context,
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
 * @return {Object} Action object.
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
 * @deprecated
 *
 * @return {number} The resolved template ID for the page route.
 */
export function setPage() {
	deprecated( "dispatch( 'core/edit-site' ).setPage", {
		since: '6.5',
		version: '6.8',
		hint: 'The setPage is not needed anymore, the correct entity is resolved from the URL automatically.',
	} );

	return { type: 'NOTHING' };
}

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
 * Returns an action object used to open/close the inserter.
 *
 * @deprecated
 *
 * @param {boolean|Object} value Whether the inserter should be opened (true) or closed (false).
 */
export const setIsInserterOpened =
	( value ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-site' ).setIsInserterOpened", {
			since: '6.5',
			alternative: "dispatch( 'core/editor').setIsInserterOpened",
		} );
		registry.dispatch( editorStore ).setIsInserterOpened( value );
	};

/**
 * Returns an action object used to open/close the list view.
 *
 * @deprecated
 *
 * @param {boolean} isOpen A boolean representing whether the list view should be opened or closed.
 */
export const setIsListViewOpened =
	( isOpen ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-site' ).setIsListViewOpened", {
			since: '6.5',
			alternative: "dispatch( 'core/editor').setIsListViewOpened",
		} );
		registry.dispatch( editorStore ).setIsListViewOpened( isOpen );
	};

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
	( { dispatch, registry } ) => {
		const isDistractionFree = registry
			.select( preferencesStore )
			.get( 'core', 'distractionFree' );
		if ( isDistractionFree ) {
			dispatch.toggleDistractionFree();
		}
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
	( { dispatch, registry } ) => {
		registry
			.dispatch( 'core/preferences' )
			.set( 'core', 'editorMode', mode );

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
 * Sets whether or not the editor allows only page content to be edited.
 *
 * @param {boolean} hasPageContentFocus True to allow only page content to be
 *                                      edited, false to allow template to be
 *                                      edited.
 */
export const setHasPageContentFocus =
	( hasPageContentFocus ) =>
	( { dispatch, registry } ) => {
		deprecated( `dispatch( 'core/edit-site' ).setHasPageContentFocus`, {
			since: '6.5',
		} );

		if ( hasPageContentFocus ) {
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
		}
		dispatch( {
			type: 'SET_HAS_PAGE_CONTENT_FOCUS',
			hasPageContentFocus,
		} );
	};

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
		if ( ! isDistractionFree ) {
			registry.batch( () => {
				registry
					.dispatch( preferencesStore )
					.set( 'core', 'fixedToolbar', true );
				registry.dispatch( editorStore ).setIsInserterOpened( false );
				registry.dispatch( editorStore ).setIsListViewOpened( false );
				dispatch.closeGeneralSidebar();
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
						id: 'core/edit-site/distraction-free-mode/notice',
						type: 'snackbar',
						actions: [
							{
								label: __( 'Undo' ),
								onClick: () => {
									registry
										.dispatch( preferencesStore )
										.toggle( 'core', 'distractionFree' );
								},
							},
						],
					}
				);
		} );
	};
