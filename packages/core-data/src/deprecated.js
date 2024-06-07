/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { fetchLinkSuggestions } from './fetch';

/**
 * Fetches link suggestions from the API.
 *
 * @async
 * @param {string}                                                  search
 * @param {import("./fetch/fetch-link-suggestions").SearchOptions}  [searchOptions]
 * @param {import("./fetch/fetch-link-suggestions").EditorSettings} [settings]
 *
 * @example
 * ```js
 * import { __experimentalFetchLinkSuggestions as fetchLinkSuggestions } from '@wordpress/core-data';
 *
 * //...
 *
 * export function initialize( id, settings ) {
 *
 * settings.__experimentalFetchLinkSuggestions = (
 *     search,
 *     searchOptions
 * ) => fetchLinkSuggestions( search, searchOptions, settings );
 * ```
 * @return {Promise< import("./fetch/fetch-link-suggestions").SearchResult[] >} List of search suggestions
 */
export function __experimentalFetchLinkSuggestions(
	search,
	searchOptions,
	settings
) {
	deprecated( 'wp.coreData.__experimentalFetchLinkSuggestions', {
		alternative: 'wp.coreData.fetchLinkSuggestions',
		since: '6.7',
	} );
	return fetchLinkSuggestions( search, searchOptions, settings );
}
