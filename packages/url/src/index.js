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
 * @example
 * ```js
 * const isURL = isURL( 'https://wordpress.org' ); // true
 * ```
 *
 * @return {boolean} Whether or not it looks like a URL.
 */
export function isURL( url ) {
	return URL_REGEXP.test( url );
}

/**
 * Determines whether the given string looks like an email.
 *
 * @param {string} email The string to scrutinise.
 *
 * @example
 * ```js
 * const isEmail = isEmail( 'hello@wordpress.org' ); // true
 * ```
 *
 * @return {boolean} Whether or not it looks like an email.
 */
export function isEmail( email ) {
	return EMAIL_REGEXP.test( email );
}

/**
 * Returns the protocol part of the URL.
 *
 * @param {string} url The full URL.
 *
 * @example
 * ```js
 * const protocol1 = getProtocol( 'tel:012345678' ); // 'tel:'
 * const protocol2 = getProtocol( 'https://wordpress.org' ); // 'https:'
 * ```
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
 * @example
 * ```js
 * const isValid = isValidProtocol( 'https:' ); // true
 * const isNotValid = isValidProtocol( 'https :' ); // false
 * ```
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
 * @example
 * ```js
 * const authority1 = getAuthority( 'https://wordpress.org/help/' ); // 'wordpress.org'
 * const authority2 = getAuthority( 'https://localhost:8080/test/' ); // 'localhost:8080'
 * ```
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
 * @example
 * ```js
 * const isValid = isValidAuthority( 'wordpress.org' ); // true
 * const isNotValid = isValidAuthority( 'wordpress#org' ); // false
 * ```
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
 * @example
 * ```js
 * const path1 = getPath( 'http://localhost:8080/this/is/a/test?query=true' ); // 'this/is/a/test'
 * const path2 = getPath( 'https://wordpress.org/help/faq/' ); // 'help/faq'
 * ```
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
 * @example
 * ```js
 * const isValid = isValidPath( 'test/path/' ); // true
 * const isNotValid = isValidPath( '/invalid?test/path/' ); // false
 * ```
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
 * @example
 * ```js
 * const queryString1 = getQueryString( 'http://localhost:8080/this/is/a/test?query=true#fragment' ); // 'query=true'
 * const queryString2 = getQueryString( 'https://wordpress.org#fragment?query=false&search=hello' ); // 'query=false&search=hello'
 * ```
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
 * @example
 * ```js
 * const isValid = isValidQueryString( 'query=true&another=false' ); // true
 * const isNotValid = isValidQueryString( 'query=true?another=false' ); // false
 * ```
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
 * @example
 * ```js
 * const fragment1 = getFragment( 'http://localhost:8080/this/is/a/test?query=true#fragment' ); // '#fragment'
 * const fragment2 = getFragment( 'https://wordpress.org#another-fragment?query=true' ); // '#another-fragment'
 * ```
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
 * @example
 * ```js
 * const isValid = isValidFragment( '#valid-fragment' ); // true
 * const isNotValid = isValidFragment( '#invalid-#fragment' ); // false
 * ```
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
 * Appends arguments as querystring to the provided URL. If the URL already
 * includes query arguments, the arguments are merged with (and take precedent
 * over) the existing set.
 *
 * @param {?string} url  URL to which arguments should be appended. If omitted,
 *                       only the resulting querystring is returned.
 * @param {Object}  args Query arguments to apply to URL.
 *
 * @example
 * ```js
 * const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test
 * ```
 *
 * @return {string} URL with arguments applied.
 */
export function addQueryArgs( url = '', args ) {
	// If no arguments are to be appended, return original URL.
	if ( ! args || ! Object.keys( args ).length ) {
		return url;
	}

	let baseUrl = url;

	// Determine whether URL already had query arguments.
	const queryStringIndex = url.indexOf( '?' );
	if ( queryStringIndex !== -1 ) {
		// Merge into existing query arguments.
		args = Object.assign(
			parse( url.substr( queryStringIndex + 1 ) ),
			args
		);

		// Change working base URL to omit previous query arguments.
		baseUrl = baseUrl.substr( 0, queryStringIndex );
	}

	return baseUrl + '?' + stringify( args );
}

/**
 * Returns a single query argument of the url
 *
 * @param {string} url URL
 * @param {string} arg Query arg name
 *
 * @example
 * ```js
 * const foo = getQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'foo' ); // bar
 * ```
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
 * @example
 * ```js
 * const hasBar = hasQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'bar' ); // true
 * ```
 *
 * @return {boolean} Whether or not the URL contains the query arg.
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
 * @example
 * ```js
 * const newUrl = removeQueryArgs( 'https://wordpress.org?foo=bar&bar=baz&baz=foobar', 'foo', 'bar' ); // https://wordpress.org?baz=foobar
 * ```
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
 * @example
 * ```js
 * const actualURL = prependHTTP( 'wordpress.org' ); // http://wordpress.org
 * ```
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
 * @example
 * ```js
 * const badUri = safeDecodeURI( '%z' ); // does not throw an Error, simply returns '%z'
 * ```
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
 * @example
 * ```js
 * const displayUrl = filterURLForDisplay( 'https://www.wordpress.org/gutenberg/' ); // wordpress.org/gutenberg
 * ```
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

/**
 * Safely decodes a URI component with `decodeURIComponent`. Returns the URI component unmodified if
 * `decodeURIComponent` throws an error.
 *
 * @param {string} uriComponent URI component to decode.
 *
 * @return {string} Decoded URI component if possible.
 */
export function safeDecodeURIComponent( uriComponent ) {
	try {
		return decodeURIComponent( uriComponent );
	} catch ( uriComponentError ) {
		return uriComponent;
	}
}
