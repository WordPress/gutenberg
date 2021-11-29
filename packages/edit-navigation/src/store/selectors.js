/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { NAVIGATION_POST_KIND, NAVIGATION_POST_POST_TYPE } from '../constants';
import { buildNavigationPostId } from './utils';

/**
 * Returns the selected menu ID.
 *
 * @param {Object} state Global application state.
 * @return {number} The selected menu ID.
 */
export function getSelectedMenuId( state ) {
	return state.selectedMenuId ?? null;
}

/**
 * Returns a "stub" navigation post reflecting the contents of menu with id=menuId. The
 * post is meant as a convenient to only exists in runtime and should never be saved. It
 * enables a convenient way of editing the navigation by using a regular post editor.
 *
 * Related resolver fetches all menu items, converts them into blocks, and hydrates a new post with them.
 *
 * @param {number} menuId The id of menu to create a post from.
 * @return {null|Object} Post once the resolver fetches it, otherwise null
 */
export const getNavigationPostForMenu = createRegistrySelector(
	( select ) => ( state, menuId ) => {
		// When the record is unavailable, calling getEditedEntityRecord triggers a http
		// request via it's related resolver. Let's return nothing until getNavigationPostForMenu
		// resolver marks the record as resolved.
		if ( ! hasResolvedNavigationPost( state, menuId ) ) {
			return null;
		}
		return select( coreStore ).getEditedEntityRecord(
			NAVIGATION_POST_KIND,
			NAVIGATION_POST_POST_TYPE,
			buildNavigationPostId( menuId )
		);
	}
);

/**
 * Returns true if the navigation post related to menuId was already resolved.
 *
 * @param {number} menuId The id of menu.
 * @return {boolean} True if the navigation post related to menuId was already resolved, false otherwise.
 */
export const hasResolvedNavigationPost = createRegistrySelector(
	( select ) => ( state, menuId ) => {
		return select( coreStore ).hasFinishedResolution( 'getEntityRecord', [
			NAVIGATION_POST_KIND,
			NAVIGATION_POST_POST_TYPE,
			buildNavigationPostId( menuId ),
		] );
	}
);

/**
 * Returns true if the inserter is opened.
 *
 * @param {Object} state Global application state.
 * @return {boolean} Whether the inserter is opened.
 */
export function isInserterOpened( state = false ) {
	return !! state?.blockInserterPanel;
}
