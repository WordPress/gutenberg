/**
 * Internal dependencies
 */
import { WP_BASE_URL } from './shared/config';

/**
 * Creates new URL by parsing given WPPath and query string, relative to the WP base.
 *
 * @param {string} [WPPath=''] String to be serialized as pathname.
 * @param {string} [query]     String to be serialized as query portion of URL.
 * @return {string} String which represents full URL.
 */
export function createURL( WPPath = '', query = '' ) {
	const url = new URL( WPPath, WP_BASE_URL );

	url.search = query;

	return url.href;
}
