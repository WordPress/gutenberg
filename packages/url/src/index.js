/**
 * External dependencies
 */
import { parse, stringify } from 'qs';

const URL_REGEXP = /^(?:https?:)?\/\/\S+$/i;
const EMAIL_REGEXP = /^(mailto:)?[a-z0-9._%+-]+@[a-z0-9][a-z0-9.-]*\.[a-z]{2,63}$/i;
const USABLE_HREF_REGEXP = /^(?:[a-z]+:|#|\?|\.|\/)/i;

/**
 * Determines whether the given string looks like a URL.
 *
 * @param {string} url The string to scrutinise.
 *
 * @return {boolean} Whether or not it looks like a URL.
 */
export function isURL( url ) {
	return URL_REGEXP.test( url );
}

/**
 * Appends arguments to the query string of the url
 *
 * @param {string} url  URL
 * @param {Object} args Query Args
 *
 * @return {string} Updated URL
 */
export function addQueryArgs( url, args ) {
	const queryStringIndex = url.indexOf( '?' );
	const query = queryStringIndex !== -1 ? parse( url.substr( queryStringIndex + 1 ) ) : {};
	const baseUrl = queryStringIndex !== -1 ? url.substr( 0, queryStringIndex ) : url;

	return baseUrl + '?' + stringify( { ...query, ...args } );
}

/**
 * Returns a single query argument of the url
 *
 * @param {string} url URL
 * @param {string} arg Query arg name
 *
 * @return {Array|string} Query arg value.
 */
export function getQueryArg( url, arg ) {
	const queryStringIndex = url.indexOf( '?' );
	const query = queryStringIndex !== -1 ? parse( url.substr( queryStringIndex + 1 ) ) : {};

	return query[ arg ];
}

/**
 * Determines whether the URL contains a given query arg.
 *
 * @param {string} url URL
 * @param {string} arg Query arg name
 *
 * @return {boolean} Whether or not the URL contains the query aeg.
 */
export function hasQueryArg( url, arg ) {
	return getQueryArg( url, arg ) !== undefined;
}

/**
 * Removes arguments from the query string of the url
 *
 * @param {string} url  URL
 * @param {...string} args Query Args
 *
 * @return {string} Updated URL
 */
export function removeQueryArgs( url, ...args ) {
	const queryStringIndex = url.indexOf( '?' );
	const query = queryStringIndex !== -1 ? parse( url.substr( queryStringIndex + 1 ) ) : {};
	const baseUrl = queryStringIndex !== -1 ? url.substr( 0, queryStringIndex ) : url;

	args.forEach( ( arg ) => delete query[ arg ] );

	return baseUrl + '?' + stringify( query );
}

/**
 * Prepends "http://" to a url, if it looks like something that is meant to be a TLD.
 *
 * @param  {string} url The URL to test
 *
 * @return {string}     The updated URL
 */
export function prependHTTP( url ) {
	if ( ! USABLE_HREF_REGEXP.test( url ) && ! EMAIL_REGEXP.test( url ) ) {
		return 'http://' + url;
	}

	return url;
}

/**
 * Safely decodes a URI with `decodeURI`. Returns the URI unmodified if
 * `decodeURI` throws an error.
 *
 * @param {string} uri URI to decode.
 *
 * @return {string} Decoded URI if possible.
 */
export function safeDecodeURI( uri ) {
	try {
		return decodeURI( uri );
	} catch ( uriError ) {
		return uri;
	}
}
