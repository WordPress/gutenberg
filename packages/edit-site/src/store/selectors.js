/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import deprecated from '@wordpress/deprecated';
import { Platform } from '@wordpress/element';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { getFilteredTemplatePartBlocks } from './utils';
import { TEMPLATE_PART_POST_TYPE } from '../utils/constants';
import { unlock } from '../lock-unlock';

/**
 * @typedef {'template'|'template_type'} TemplateType Template type.
 */

/**
 * Returns whether the given feature is enabled or not.
 *
 * @deprecated
 * @param {Object} state       Global application state.
 * @param {string} featureName Feature slug.
 *
 * @return {boolean} Is active.
 */
export const isFeatureActive = createRegistrySelector(
	( select ) => ( _, featureName ) => {
		deprecated( `select( 'core/edit-site' ).isFeatureActive`, {
			since: '6.0',
			alternative: `select( 'core/preferences' ).get`,
		} );

		return !! select( preferencesStore ).get(
			'core/edit-site',
			featureName
		);
	}
);

/**
 * Returns the current editing canvas device type.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Device type.
 */
export const __experimentalGetPreviewDeviceType = createRegistrySelector(
	( select ) => () => {
		deprecated(
			`select( 'core/edit-site' ).__experimentalGetPreviewDeviceType`,
			{
				since: '6.5',
				version: '6.7',
				alternative: `select( 'core/editor' ).getDeviceType`,
			}
		);
		return select( editorStore ).getDeviceType();
	}
);

/**
 * Returns whether the current user can create media or not.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Whether the current user can create media or not.
 */
export const getCanUserCreateMedia = createRegistrySelector(
	( select ) => () => select( coreDataStore ).canUser( 'create', 'media' )
);

/**
 * Returns any available Reusable blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} The available reusable blocks.
 */
export const getReusableBlocks = createRegistrySelector( ( select ) => () => {
	deprecated(
		"select( 'core/core' ).getEntityRecords( 'postType', 'wp_block' )",
		{
			since: '6.5',
			version: '6.8',
		}
	);
	const isWeb = Platform.OS === 'web';
	return isWeb
		? select( coreDataStore ).getEntityRecords( 'postType', 'wp_block', {
				per_page: -1,
		  } )
		: [];
} );

/**
 * Returns the site editor settings.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Settings.
 */
export function getSettings( state ) {
	// It is important that we don't inject anything into these settings locally.
	// The reason for this is that we have an effect in place that calls setSettings based on the previous value of getSettings.
	// If we add computed settings here, we'll be adding these computed settings to the state which is very unexpected.
	return state.settings;
}

/**
 * @deprecated
 */
export function getHomeTemplateId() {
	deprecated( "select( 'core/edit-site' ).getHomeTemplateId", {
		since: '6.2',
		version: '6.4',
	} );
}

/**
 * Returns the current edited post type (wp_template or wp_template_part).
 *
 * @param {Object} state Global application state.
 *
 * @return {TemplateType?} Template type.
 */
export function getEditedPostType( state ) {
	return state.editedPost.postType;
}

/**
 * Returns the ID of the currently edited template or template part.
 *
 * @param {Object} state Global application state.
 *
 * @return {string?} Post ID.
 */
export function getEditedPostId( state ) {
	return state.editedPost.id;
}

/**
 * Returns the edited post's context object.
 *
 * @deprecated
 * @param {Object} state Global application state.
 *
 * @return {Object} Page.
 */
export function getEditedPostContext( state ) {
	return state.editedPost.context;
}

/**
 * Returns the current page object.
 *
 * @deprecated
 * @param {Object} state Global application state.
 *
 * @return {Object} Page.
 */
export function getPage( state ) {
	return { context: state.editedPost.context };
}

/**
 * Returns true if the inserter is opened.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the inserter is opened.
 */
export const isInserterOpened = createRegistrySelector( ( select ) => () => {
	deprecated( `select( 'core/edit-site' ).isInserterOpened`, {
		since: '6.5',
		alternative: `select( 'core/editor' ).isInserterOpened`,
	} );
	return select( editorStore ).isInserterOpened();
} );

/**
 * Get the insertion point for the inserter.
 *
 * @deprecated
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID, index to insert at and starting filter value.
 */
export const __experimentalGetInsertionPoint = createRegistrySelector(
	( select ) => () => {
		deprecated(
			`select( 'core/edit-site' ).__experimentalGetInsertionPoint`,
			{
				since: '6.5',
				version: '6.7',
			}
		);
		return unlock( select( editorStore ) ).getInsertionPoint();
	}
);

/**
 * Returns true if the list view is opened.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether the list view is opened.
 */
export const isListViewOpened = createRegistrySelector( ( select ) => () => {
	deprecated( `select( 'core/edit-site' ).isListViewOpened`, {
		since: '6.5',
		alternative: `select( 'core/editor' ).isListViewOpened`,
	} );
	return select( editorStore ).isListViewOpened();
} );

/**
 * Returns the current opened/closed state of the save panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if the save panel should be open; false if closed.
 */
export function isSaveViewOpened( state ) {
	return state.saveViewPanel;
}

/**
 * Returns the template parts and their blocks for the current edited template.
 *
 * @param {Object} state Global application state.
 * @return {Array} Template parts and their blocks in an array.
 */
export const getCurrentTemplateTemplateParts = createRegistrySelector(
	( select ) => () => {
		const templateParts = select( coreDataStore ).getEntityRecords(
			'postType',
			TEMPLATE_PART_POST_TYPE,
			{ per_page: -1 }
		);

		const clientIds =
			select( blockEditorStore ).getBlocksByName( 'core/template-part' );
		const blocks =
			select( blockEditorStore ).getBlocksByClientId( clientIds );

		return getFilteredTemplatePartBlocks( blocks, templateParts );
	}
);

/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editing mode.
 */
export const getEditorMode = createRegistrySelector( ( select ) => () => {
	return select( preferencesStore ).get( 'core', 'editorMode' );
} );

/**
 * @deprecated
 */
export function getCurrentTemplateNavigationPanelSubMenu() {
	deprecated(
		"dispatch( 'core/edit-site' ).getCurrentTemplateNavigationPanelSubMenu",
		{
			since: '6.2',
			version: '6.4',
		}
	);
}

/**
 * @deprecated
 */
export function getNavigationPanelActiveMenu() {
	deprecated( "dispatch( 'core/edit-site' ).getNavigationPanelActiveMenu", {
		since: '6.2',
		version: '6.4',
	} );
}

/**
 * @deprecated
 */
export function isNavigationOpened() {
	deprecated( "dispatch( 'core/edit-site' ).isNavigationOpened", {
		since: '6.2',
		version: '6.4',
	} );
}

/**
 * Whether or not the editor has a page loaded into it.
 *
 * @see setPage
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} Whether or not the editor has a page loaded into it.
 */
export function isPage( state ) {
	return !! state.editedPost.context?.postId;
}

/**
 * Whether or not the editor allows only page content to be edited.
 *
 * @deprecated
 *
 * @return {boolean} Whether or not focus is on editing page content.
 */
export function hasPageContentFocus() {
	deprecated( `select( 'core/edit-site' ).hasPageContentFocus`, {
		since: '6.5',
	} );

	return false;
}
