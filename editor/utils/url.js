/**
 * External dependencies
 */
import { parse, format } from 'url';
import { parse as parseQueryString, stringify } from 'querystring';

/**
 * Appends arguments to the query string of the url
 *
 * @param  {String} url   URL
 * @param  {Object} args  Query Args
 *
 * @return {String}       Updated URL
 */
export function addQueryArgs( url, args ) {
	const parsedUrl = parse( url, true );
	const query = { ...parsedUrl.query, ...args };
	delete parsedUrl.search;

	return format( { ...parsedUrl, query } );
}

/**
 * Returns the Gutenberg page URL with extra query strings
 *
 * @param  {Object} query  Query Args
 *
 * @return {String}        URL
 */
export function getGutenbergURL( query = {} ) {
	const [ baseUrl, currentQuery ] = window.location.href.split( '?' );
	const qs = parseQueryString( currentQuery || '' );
	return baseUrl + '?' + stringify( {
		...qs,
		...query,
	} );
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
	const querystring = query ? '?' + stringify( query ) : '';
	return page + querystring;
}
