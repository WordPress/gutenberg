/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { DEFAULT_INSERTER_MENU_PANELS } from '../store/defaults';

export const SUGGESTED_PANEL = 'suggested';
export const SHARED_PANEL = 'shared';
export const CATEGORIES_PANEL = 'categories';

/**
 * Returns all the available block categories for inserter menu.
 *
 * @return {Array} List of block categories.
 */
export function getInserterMenuCats() {
	return DEFAULT_INSERTER_MENU_PANELS[ CATEGORIES_PANEL ];
}

/**
 * Returns open panels by default
 *
 * @return {Array} List of panels slugs
 */
export function getDefaultOpenPanels() {
	const panels = DEFAULT_INSERTER_MENU_PANELS;

	if ( panels[ SUGGESTED_PANEL ] ) {
		return [ SUGGESTED_PANEL ];
	} else if ( panels[ SHARED_PANEL ] ) {
		return [ SHARED_PANEL ];
	} else if ( panels[ CATEGORIES_PANEL ].length ) {
		return [ panels[ CATEGORIES_PANEL ][ 0 ].slug ];
	}
	return [];
}

/**
 * Checks if panel is available and visible
 *
 * @param  {string} slug Panel slug
 *
 * @return {boolean} True if panel is visible, false if not.
 */
function isPanelVisible( slug ) {
	const panels = DEFAULT_INSERTER_MENU_PANELS;
	return get( panels, [ slug ] ) && panels[ slug ];
}

/**
 * Checks if Suggested panel is available and visible
 *
 * @return {boolean} True if panel is visible, false if not.
 */
export function isSuggestedPanelVisible() {
	return isPanelVisible( SUGGESTED_PANEL );
}

/**
 * Checks if Shared panel is available and visible
 *
 * @return {boolean} True if panel is visible, false if not.
 */
export function isSharedPanelVisible() {
	return isPanelVisible( SHARED_PANEL );
}

