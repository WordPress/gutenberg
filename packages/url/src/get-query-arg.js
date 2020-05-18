/**
 * External dependencies
 */
import { parse } from 'qs';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef {{[key: string]: QueryArgParsed}} QueryArgObject
 */
/* eslint-enable */

/**
 * @typedef {string|string[]|QueryArgObject} QueryArgParsed
 */

/**
 * Returns a single query argument of the url
 *
 * @param {string} url URL.
 * @param {string} arg Query arg name.
 *
 * @example
 * ```js
 * const foo = getQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'foo' ); // bar
 * ```
 *
 * @return {QueryArgParsed|undefined} Query arg value.
 */
export function getQueryArg( url, arg ) {
	const queryStringIndex = url.indexOf( '?' );
	const query =
		queryStringIndex !== -1
			? parse( url.substr( queryStringIndex + 1 ) )
			: {};

	return query[ arg ];
}
