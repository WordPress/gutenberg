/**
 * Internal dependencies
 */
import { getQueryArg } from './get-query-arg';

/**
 * Determines whether the URL contains a given query arg.
 *
 * @param {string} url URL.
 * @param {string} arg Query arg name.
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
