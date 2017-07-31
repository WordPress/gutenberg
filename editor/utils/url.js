/**
 * External dependencies
 */
import { parse, format } from 'url';

/**
 * Appends arguments to the query string of the url
 *
 * @param  {String} url   URL
 * @param  {Object} args  Query Args
 *
 * @return {String}       Updated URL
 */
export function addQueryArgs( url, args ) {
	const parsedURL = parse( url, true );
	const query = { ...parsedURL.query, ...args };
	delete parsedURL.search;

	return format( { ...parsedURL, query } );
}

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
