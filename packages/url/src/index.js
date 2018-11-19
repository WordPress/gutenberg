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
 * Returns the protocol part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @return {?string} The protocol part of the URL.
 */
export function getProtocol( url ) {
	const matches = /^([^\s:]+:)/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}

/**
 * Tests if a url protocol is valid.
 *
 * @param {string} protocol The url protocol.
 *
 * @return {boolean} True if the argument is a valid protocol (e.g. http:, tel:).
 */
export function isValidProtocol( protocol ) {
	if ( ! protocol ) {
		return false;
	}
	return /^[a-z\-.\+]+[0-9]*:$/i.test( protocol );
}

/**
 * Returns the authority part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @return {?string} The authority part of the URL.
 */
export function getAuthority( url ) {
	const matches = /^[^\/\s:]+:(?:\/\/)?\/?([^\/\s#?]+)[\/#?]{0,1}\S*$/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}

/**
 * Checks for invalid characters within the provided authority.
 *
 * @param {string} authority A string containing the URL authority.
 *
 * @return {boolean} True if the argument contains a valid authority.
 */
export function isValidAuthority( authority ) {
	if ( ! authority ) {
		return false;
	}
	return /^[^\s#?]+$/.test( authority );
}

/**
 * Returns the path part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @return {?string} The path part of the URL.
 */
export function getPath( url ) {
	const matches = /^[^\/\s:]+:(?:\/\/)?[^\/\s#?]+[\/]([^\s#?]+)[#?]{0,1}\S*$/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}

/**
 * Checks for invalid characters within the provided path.
 *
 * @param {string} path The URL path.
 *
 * @return {boolean} True if the argument contains a valid path
 */
export function isValidPath( path ) {
	if ( ! path ) {
		return false;
	}
	return /^[^\s#?]+$/.test( path );
}

/**
 * Returns the query string part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @return {?string} The query string part of the URL.
 */
export function getQueryString( url ) {
	const matches = /^\S+?\?([^\s#]+)/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}

/**
 * Checks for invalid characters within the provided query string.
 *
 * @param {string} queryString The query string.
 *
 * @return {boolean} True if the argument contains a valid query string.
 */
export function isValidQueryString( queryString ) {
	if ( ! queryString ) {
		return false;
	}
	return /^[^\s#?\/]+$/.test( queryString );
}

/**
 * Returns the fragment part of the URL.
 *
 * @param {string} url The full URL
 *
 * @return {?string} The fragment part of the URL.
 */
export function getFragment( url ) {
	const matches = /^\S+?(#[^\s\?]*)/.exec( url );
	if ( matches ) {
		return matches[ 1 ];
	}
}

/**
 * Checks for invalid characters within the provided fragment.
 *
 * @param {string} fragment The url fragment.
 *
 * @return {boolean} True if the argument contains a valid fragment.
 */
export function isValidFragment( fragment ) {
	if ( ! fragment ) {
		return false;
	}
	return /^#[^\s#?\/]*$/.test( fragment );
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

/**
 * Returns a URL for display.
 *
 * @param {string} url Original URL.
 *
 * @return {string} Displayed URL.
 */
export function filterURLForDisplay( url ) {
	// Remove protocol and www prefixes.
	const filteredURL = url.replace( /^(?:https?:)\/\/(?:www\.)?/, '' );

	// Ends with / and only has that single slash, strip it.
	if ( filteredURL.match( /^[^\/]+\/$/ ) ) {
		return filteredURL.replace( '/', '' );
	}

	return filteredURL;
}
