/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Returns the Post's Edit URL
 *
 * @param  {Number} postId  Post ID
 *
 * @returns {String} Post edit URL.
 */
export function getPostEditUrl( postId ) {
	return getWPAdminURL( 'post.php', { post: postId, action: 'edit' } );
}

/**
 * Returns the url of a WPAdmin Page
 *
 * @param  {String} page   page to navigate to
 * @param  {Object} query  Query Args
 *
 * @returns {String} WPAdmin URL.
 */
export function getWPAdminURL( page, query ) {
	return addQueryArgs( page, query );
}

/**
 * Returns a url for display
 *
 * @param  {String} url    Original url
 *
 * @returns {String} Displayed URL.
 */
export function filterURLForDisplay( url ) {
	// remove protocol and www prefixes
	const filteredURL = url.replace( new RegExp( '^https?://(www\.)?' ), '' );

	// ends with / and only has that single slash, strip it
	if ( filteredURL.match( '^[^/]+/$' ) ) {
		return filteredURL.replace( '/', '' );
	}

	return filteredURL;
}
