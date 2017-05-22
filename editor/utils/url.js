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
	const parsedUrl = parse( url, true );
	const query = { ...parsedUrl.query, ...args };
	delete parsedUrl.search;

	return format( { ...parsedUrl, query } );
}
