/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs, prependHTTP } from '@wordpress/url';

/**
 * @typedef WPRemoteUrlData
 *
 * @property {string} title contents of the remote URL's `<title>` tag.
 */

/**
 * Fetches data about a remote URL.
 * eg: <title> tag, favicon...etc.
 *
 * @async
 * @param {string} url
 *
 * @example
 * ```js
 * import { __experimentalFetchRemoteUrlData as fetchRemoteUrlData } from '@wordpress/core-data';
 *
 * //...
 *
 * export function initialize( id, settings ) {
 *
 * settings.__experimentalFetchRemoteUrlData = (
 *     url
 * ) => fetchRemoteUrlData( url );
 * ```
 * @return {Promise< WPRemoteUrlData[] >} Remote URL data.
 */

const fetchRemoteUrlData = async ( url ) => {
	const endpoint = '/__experimental/url-details';

	const args = {
		url: prependHTTP( url ),
	};

	return apiFetch( {
		path: addQueryArgs( endpoint, args ),
	} );
};

export default fetchRemoteUrlData;
