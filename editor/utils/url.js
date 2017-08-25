/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Returns the Gutenberg page URL with extra query strings
 *
 * @param  {Object} query  Query Args
 *
 * @return {String}        URL
 */
export function getGutenbergURL( query = {} ) {
	return addQueryArgs( window.location.href, query );
}

/**
 * Returns the url of a WPAdmin Page
 *
 * @param  {String} page   page to navigate to
 * @param  {Object} query  Query Args
 *
 * @return {String}        URL
 */
export function getWPAdminURL( page, query ) {
	return addQueryArgs( page, query );
}

/**
 * Returns a url for display
 *
 * @param  {String} url    Original url
 *
 * @return {String}        Displayed URL
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
