/**
 * External dependencies
 */
import { get } from 'lodash';
import createSelector from 'rememo';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import { uploadMedia } from '@wordpress/media-utils';

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
	select( 'core' ).canUser( 'create', 'media' )
);

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
			focusMode: isFeatureActive( state, 'focusMode' ),
			hasFixedToolbar: isFeatureActive( state, 'fixedToolbar' ),
			__experimentalSetIsInserterOpened: setIsInserterOpen,
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
	return state.home.templateId;
}

/**
 * Returns the current template ID.
 *
 * @param {Object} state Global application state.
 *
 * @return {number?} Template ID.
 */
export function getTemplateId( state ) {
	return state.templateId;
}

/**
 * Returns the current template part ID.
 *
 * @param {Object} state Global application state.
 *
 * @return {number?} Template part ID.
 */
export function getTemplatePartId( state ) {
	return state.templatePartId;
}

/**
 * Returns the current template type.
 *
 * @param {Object} state Global application state.
 *
 * @return {string?} Template type.
 */
export function getTemplateType( state ) {
	return state.templateType;
}

/**
 * Returns the current page object.
 *
 * @param {Object} state Global application state.
 *
 * @return {Object} Page.
 */
export function getPage( state ) {
	return state.page;
}

/**
 * Returns the site's current `show_on_front` setting.
 *
 * @param {Object} state Global application state.
 *
 * @return {string?} The setting.
 */
export function getShowOnFront( state ) {
	return state.home.showOnFront;
}

/**
 * Returns the site's current `page_on_front` setting.
 *
 * @param {Object} state Global application state.
 *
 * @return {number?} The setting.
 */
export function getPageOnFront( state ) {
	return state.home.pageOnFront;
}
