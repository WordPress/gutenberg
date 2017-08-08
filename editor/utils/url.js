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
