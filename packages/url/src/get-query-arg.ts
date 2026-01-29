/**
 * Internal dependencies
 */
import { getQueryArgs } from './get-query-args';

export interface QueryArgObject {
	[ key: string ]: QueryArgParsed;
}

export type QueryArgParsed = string | string[] | QueryArgObject;

/**
 * Returns a single query argument of the url
 *
 * @param url URL.
 * @param arg Query arg name.
 *
 * @example
 * ```js
 * const foo = getQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'foo' ); // bar
 * ```
 *
 * @return Query arg value.
 */
export function getQueryArg(
	url: string,
	arg: string
): QueryArgParsed | undefined {
	return getQueryArgs( url )[ arg ];
}
