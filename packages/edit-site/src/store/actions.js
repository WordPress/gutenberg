/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import deprecated from '@wordpress/deprecated';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	NAVIGATION_POST_TYPE,
} from '../utils/constants';
import { unlock } from '../lock-unlock';

const { interfaceStore } = unlock( editorPrivateApis );

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
export const removeTemplate =
	( template ) =>
	( { registry } ) => {
		return unlock( registry.dispatch( editorStore ) ).removeTemplates( [
			template,
		] );
	};

/**
 * Action that sets a template part.
 *
 * @deprecated
 * @param {string} templatePartId The template part ID.
 *
 * @return {Object} Action object.
 */
export function setTemplatePart( templatePartId ) {
	deprecated( "dispatch( 'core/edit-site' ).setTemplatePart", {
		since: '6.8',
	} );

	return {
		type: 'SET_EDITED_POST',
		postType: TEMPLATE_PART_POST_TYPE,
		id: templatePartId,
	};
}

/**
 * Action that sets a navigation menu.
 *
 * @deprecated
 * @param {string} navigationMenuId The Navigation Menu Post ID.
 *
 * @return {Object} Action object.
 */
export function setNavigationMenu( navigationMenuId ) {
	deprecated( "dispatch( 'core/edit-site' ).setNavigationMenu", {
		since: '6.8',
	} );

	return {
		type: 'SET_EDITED_POST',
		postType: NAVIGATION_POST_TYPE,
		id: navigationMenuId,
	};
}

/**
 * Action that sets an edited entity.
 *
 * @deprecated
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
 * @deprecated
 * @param {Object} context The context object.
 *
 * @return {Object} Action object.
 */
export function setEditedPostContext( context ) {
	deprecated( "dispatch( 'core/edit-site' ).setEditedPostContext", {
		since: '6.8',
	} );
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
 * @return {Object} Action object.
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
	( template, options ) =>
	( { registry } ) => {
		return unlock( registry.dispatch( editorStore ) ).revertTemplate(
			template,
			options
		);
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
			.enableComplementaryArea( 'core', name );
	};

/**
 * Action that closes the sidebar.
 */
export const closeGeneralSidebar =
	() =>
	( { registry } ) => {
		registry.dispatch( interfaceStore ).disableComplementaryArea( 'core' );
	};

/**
 * Triggers an action used to switch editor mode.
 *
 * @deprecated
 *
 * @param {string} mode The editor mode.
 */
export const switchEditorMode =
	( mode ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-site' ).switchEditorMode", {
			since: '6.6',
			alternative: "dispatch( 'core/editor').switchEditorMode",
		} );
		registry.dispatch( editorStore ).switchEditorMode( mode );
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
 *
 * @deprecated
 */
export const toggleDistractionFree =
	() =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-site' ).toggleDistractionFree", {
			since: '6.6',
			alternative: "dispatch( 'core/editor').toggleDistractionFree",
		} );
		registry.dispatch( editorStore ).toggleDistractionFree();
	};
