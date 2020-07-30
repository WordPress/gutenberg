/**
 * WordPress dependencies
 */
import { createRegistrySelector } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { KIND, POST_TYPE, buildSidebarsPostsQuery } from './utils';

/**
 * Returns a "stub" sidebar post reflecting the contents of a sidebar with id=sidebarId. The
 * post is meant as a convenient to only exists in runtime and should never be saved. It
 * enables a convenient way of editing the navigation by using a regular post editor.
 *
 * @param {number} menuId The id sidebar menu to create a post from.
 * @return {null|Object} Post once the resolver fetches it, otherwise null
 */
export const getSidebarsPosts = createRegistrySelector(
	( select ) => ( state ) => {
		// When the record is unavailable, calling getEditedEntityRecord triggers a http
		// request via it's related resolver. Let's return nothing until getNavigationPostForMenu
		// resolver marks the record as resolved.
		const postsQuery = buildSidebarsPostsQuery();
		if ( ! hasResolvedSidebarsPost( state, postsQuery ) ) {
			return null;
		}
		return select( 'core' ).getEntityRecords( KIND, POST_TYPE, postsQuery );
	}
);

/**
 * Returns true if the navigation post related to menuId was already resolved.
 *
 * @param {number} menuId The id of menu.
 * @return {boolean} True if the navigation post related to menuId was already resolved, false otherwise.
 */
export const hasResolvedSidebarsPost = createRegistrySelector(
	( select ) => ( state, query ) => {
		return select( 'core' ).hasFinishedResolution( 'getEntityRecords', [
			KIND,
			POST_TYPE,
			query,
		] );
	}
);
