/**
 * Internal dependencies
 */
import { WP_BASE_URL } from './shared/config';

/**
 * Creates new URL by parsing given WPPath and query params, relative to the WP base.
 *
 * Given `query` params are merged with the ones already present in the path.
 * Any overlapping ones will be overwritten.
 *
 * @example
 *
 * ```js
 * createURL( '/foo?a=b&bar=f', { bar: 'baz', fiz: 'a/b/c' } );
 * // "http://localhost:8889/foo?a=b&bar=baz&fiz=a%2Fb%2Fc"
 * ```
 *
 * @param {string}              [WPPath=''] String to be serialized as pathname.
 * @param {string|Object|Array} [query]     Query parameters in any format supported by {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/URLSearchParams | URLSearchParams}.
 * @return {string} String which represents full URL.
 */
export function createURL( WPPath = '', query = '' ) {
	const url = new URL( WPPath, WP_BASE_URL );

	// Merge query params if any.
	if ( query ) {
		for ( const [ key, value ] of new URLSearchParams( query ) ) {
			// Overwrite any params if already present.
			url.searchParams.set( key, value );
		}
	}

	return url.href;
}
