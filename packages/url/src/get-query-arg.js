/**
 * Internal dependencies
 */
import { getQueryArgs } from './get-query-args';

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
 * @return {QueryArgParsed|void} Query arg value.
 */
export function getQueryArg( url, arg ) {
	return getQueryArgs( url )[ arg ];
}
