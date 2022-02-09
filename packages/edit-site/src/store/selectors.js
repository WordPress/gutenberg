/**
 * External dependencies
 */
import { get, map, keyBy } from 'lodash';
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { store as coreDataStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';
import { isTemplatePart } from '@wordpress/blocks';
import { Platform } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	MENU_ROOT,
	MENU_TEMPLATE_PARTS,
	MENU_TEMPLATES_UNUSED,
	TEMPLATE_PARTS_SUB_MENUS,
} from '../components/navigation-sidebar/navigation-panel/constants';
import {
	getTemplateLocation,
	isTemplateSuperseded,
} from '../components/navigation-sidebar/navigation-panel/template-hierarchy';

/**
 * @typedef {'template'|'template_type'} TemplateType Template type.
 */

/**
 * Returns whether the given feature is enabled or not.
 *
 * @param {Object} state   Global application state.
 * @param {string} feature Feature slug.
 *
 * @return {boolean} Is active.
 */
export function isFeatureActive( state, feature ) {
	return get( state.preferences.features, [ feature ], false );
}

/**
 * Returns the current editing canvas device type.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Device type.
 */
export function __experimentalGetPreviewDeviceType( state ) {
	return state.deviceType;
}

/**
 * Returns whether the current user can create media or not.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Whether the current user can create media or not.
 */
export const getCanUserCreateMedia = createRegistrySelector( ( select ) => () =>
	select( coreDataStore ).canUser( 'create', 'media' )
);

/**
 * Returns any available Reusable blocks.
 *
 * @param {Object} state Global application state.
 *
 * @return {Array} The available reusable blocks.
 */
export const getReusableBlocks = createRegistrySelector( ( select ) => () => {
	const isWeb = Platform.OS === 'web';
	return isWeb
		? select( coreDataStore ).getEntityRecords( 'postType', 'wp_block', {
				per_page: -1,
		  } )
		: [];
} );

/**
 * Returns the settings, taking into account active features and permissions.
 *
 * @param {Object}   state             Global application state.
 * @param {Function} setIsInserterOpen Setter for the open state of the global inserter.
 *
 * @return {Object} Settings.
 */
export const getSettings = createSelector(
	( state, setIsInserterOpen ) => {
		const settings = {
			...state.settings,
			outlineMode: true,
			focusMode: isFeatureActive( state, 'focusMode' ),
			hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
			__experimentalSetIsInserterOpened: setIsInserterOpen,
			__experimentalReusableBlocks: getReusableBlocks( state ),
			__experimentalPrioritizePatternsOnQuickInserterRoot:
				'wp_template' === getEditedPostType( state ),
		};

		const canUserCreateMedia = getCanUserCreateMedia( state );
		if ( ! canUserCreateMedia ) {
			return settings;
		}

		settings.mediaUpload = ( { onError, ...rest } ) => {
			uploadMedia( {
				wpAllowedMimeTypes: state.settings.allowedMimeTypes,
				onError: ( { message } ) => onError( message ),
				...rest,
			} );
		};
		return settings;
	},
	( state ) => [
		getCanUserCreateMedia( state ),
		state.settings,
		isFeatureActive( state, 'focusMode' ),
		isFeatureActive( state, 'fixedToolbar' ),
		getReusableBlocks( state ),
		getEditedPostType( state ),
	]
);

/**
 * Returns the current home template ID.
 *
 * @param {Object} state Global application state.
 *
 * @return {number?} Home template ID.
 */
export function getHomeTemplateId( state ) {
	return state.homeTemplateId;
}

function getCurrentEditedPost( state ) {
	return state.editedPost;
}

/**
 * Returns the current edited post type (wp_template or wp_template_part).
 *
 * @param {Object} state Global application state.
 *
 * @return {TemplateType?} Template type.
 */
export function getEditedPostType( state ) {
	return getCurrentEditedPost( state ).type;
}

/**
 * Returns the ID of the currently edited template or template part.
 *
 * @param {Object} state Global application state.
 *
 * @return {string?} Post ID.
 */
export function getEditedPostId( state ) {
	return getCurrentEditedPost( state ).id;
}

/**
 * Returns the current page object.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Page.
 */
export function getPage( state ) {
	return getCurrentEditedPost( state ).page;
}

/**
 * Returns the active menu in the navigation panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Active menu.
 */
export function getNavigationPanelActiveMenu( state ) {
	return state.navigationPanel.menu;
}

/**
 * Returns the current template or template part's corresponding
 * navigation panel's sub menu, to be used with `openNavigationPanelToMenu`.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} The current template or template part's sub menu.
 */
export const getCurrentTemplateNavigationPanelSubMenu = createRegistrySelector(
	( select ) => ( state ) => {
		const templateType = getEditedPostType( state );
		const templateId = getEditedPostId( state );
		const template = templateId
			? select( coreDataStore ).getEntityRecord(
					'postType',
					templateType,
					templateId
			  )
			: null;

		if ( ! template ) {
			return MENU_ROOT;
		}

		if ( 'wp_template_part' === templateType ) {
			return (
				TEMPLATE_PARTS_SUB_MENUS.find(
					( submenu ) => submenu.area === template?.area
				)?.menu || MENU_TEMPLATE_PARTS
			);
		}

		const templates = select( coreDataStore ).getEntityRecords(
			'postType',
			'wp_template'
		);
		const showOnFront = select( coreDataStore ).getEditedEntityRecord(
			'root',
			'site'
		).show_on_front;

		if (
			isTemplateSuperseded(
				template.slug,
				map( templates, 'slug' ),
				showOnFront
			)
		) {
			return MENU_TEMPLATES_UNUSED;
		}

		return getTemplateLocation( template.slug );
	}
);

/**
 * Returns the current opened/closed state of the navigation panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if the navigation panel should be open; false if closed.
 */
export function isNavigationOpened( state ) {
	return state.navigationPanel.isOpen;
}

/**
 * Returns the current opened/closed state of the inserter panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if the inserter panel should be open; false if closed.
 */
export function isInserterOpened( state ) {
	return !! state.blockInserterPanel;
}

/**
 * Get the insertion point for the inserter.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} The root client ID, index to insert at and starting filter value.
 */
export function __experimentalGetInsertionPoint( state ) {
	const {
		rootClientId,
		insertionIndex,
		filterValue,
	} = state.blockInserterPanel;
	return { rootClientId, insertionIndex, filterValue };
}

/**
 * Returns the current opened/closed state of the list view panel.
 *
 * @param {Object} state Global application state.
 *
 * @return {boolean} True if the list view panel should be open; false if closed.
 */
export function isListViewOpened( state ) {
	return state.listViewPanel;
}

/**
 * Returns the template parts and their blocks for the current edited template.
 *
 * @param {Object} state Global application state.
 * @return {Array} Template parts and their blocks in an array.
 */
export const getCurrentTemplateTemplateParts = createRegistrySelector(
	( select ) => ( state ) => {
		const templateType = getEditedPostType( state );
		const templateId = getEditedPostId( state );
		const template = select( coreDataStore ).getEditedEntityRecord(
			'postType',
			templateType,
			templateId
		);

		const templateParts = select(
			coreDataStore
		).getEntityRecords( 'postType', 'wp_template_part', { per_page: -1 } );
		const templatePartsById = keyBy(
			templateParts,
			( templatePart ) => templatePart.id
		);

		return ( template.blocks ?? [] )
			.filter( ( block ) => isTemplatePart( block ) )
			.map( ( block ) => {
				const {
					attributes: { theme, slug },
				} = block;
				const templatePartId = `${ theme }//${ slug }`;
				const templatePart = templatePartsById[ templatePartId ];

				return {
					templatePart,
					block,
				};
			} )
			.filter( ( { templatePart } ) => !! templatePart );
	}
);

/**
 * Returns the current editing mode.
 *
 * @param {Object} state Global application state.
 *
 * @return {string} Editing mode.
 */
export function getEditorMode( state ) {
	return state.preferences.editorMode || 'visual';
}
