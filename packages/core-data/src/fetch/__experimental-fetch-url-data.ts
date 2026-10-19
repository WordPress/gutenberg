import apiFetch from '@wordpress/api-fetch';
import {
	addQueryArgs,
	prependHTTP,
	isURL,
	getProtocol,
	isValidProtocol,
} from '@wordpress/url';
import type { APIFetchOptions } from '@wordpress/api-fetch';
import type { RemoteUrlData } from './types';

/**
 * A simple in-memory cache for requests.
 * This avoids repeat HTTP requests which may be beneficial
 * for those wishing to preserve low-bandwidth.
 */
const CACHE = new Map< string, RemoteUrlData >();

/**
 * Fetches data about a remote URL.
 * eg: <title> tag, favicon...etc.
 *
 * @async
 * @param url     the URL to request details from.
 * @param options any options to pass to the underlying fetch.
 * @example
 * ```js
 * import { __experimentalFetchUrlData as fetchUrlData } from '@wordpress/core-data';
 *
 * //...
 *
 * export function initialize( id, settings ) {
 *
 * settings.__experimentalFetchUrlData = (
 * url
 * ) => fetchUrlData( url );
 * ```
 * @return Remote URL data.
 */
const fetchUrlData = async (
	url: string,
	options: APIFetchOptions< true > = {}
): Promise< RemoteUrlData > => {
	const endpoint = '/wp-block-editor/v1/url-details';

	const args = {
		url: prependHTTP( url ),
	};

	if ( ! isURL( url ) ) {
		return Promise.reject( `${ url } is not a valid URL.` );
	}

	// Test for "http" based URL as it is possible for valid
	// yet unusable URLs such as `tel:123456` to be passed.
	const protocol = getProtocol( url );

	if (
		! protocol ||
		! isValidProtocol( protocol ) ||
		! protocol.startsWith( 'http' ) ||
		! /^https?:\/\/[^\/\s]/i.test( url )
	) {
		return Promise.reject(
			`${ url } does not have a valid protocol. URLs must be "http" based`
		);
	}

	if ( CACHE.has( url ) ) {
		// Checked above.
		return CACHE.get( url )!;
	}

	return apiFetch< RemoteUrlData >( {
		path: addQueryArgs( endpoint, args ),
		...options,
	} ).then( ( res ) => {
		CACHE.set( url, res );
		return res;
	} );
};

export default fetchUrlData;
