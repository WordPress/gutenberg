/**
 * External dependencies
 */
import { invert } from 'lodash';

/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { KIND, POST_TYPE, buildNavigationPostId } from './utils';

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
		return select( 'core' ).getEditedEntityRecord(
			KIND,
			POST_TYPE,
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
		return select( 'core' ).hasFinishedResolution( 'getEntityRecord', [
			KIND,
			POST_TYPE,
			buildNavigationPostId( menuId ),
		] );
	}
);

/**
 * Returns a menu item represented by the block with id clientId.
 *
 * @param {number} postId    Navigation post id
 * @param {number} clientId  Block clientId
 * @return {Object|null} Menu item entity
 */
export const getMenuItemForClientId = createRegistrySelector(
	( select ) => ( state, postId, clientId ) => {
		const mapping = invert( state.mapping[ postId ] );
		return select( 'core' ).getMenuItem( mapping[ clientId ] );
	}
);
