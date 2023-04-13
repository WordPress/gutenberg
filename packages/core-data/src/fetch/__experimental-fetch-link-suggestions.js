/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

/**
 * Filters the search by type
 *
 * @typedef { 'attachment' | 'post' | 'term' | 'post-format' } WPLinkSearchType
 */

/**
 * A link with an id may be of kind post-type or taxonomy
 *
 * @typedef { 'post-type' | 'taxonomy' } WPKind
 */

/**
 * @typedef WPLinkSearchOptions
 *
 * @property {boolean}          [isInitialSuggestions] Displays initial search suggestions, when true.
 * @property {WPLinkSearchType} [type]                 Filters by search type.
 * @property {string}           [subtype]              Slug of the post-type or taxonomy.
 * @property {number}           [page]                 Which page of results to return.
 * @property {number}           [perPage]              Search results per page.
 */

/**
 * @typedef WPLinkSearchResult
 *
 * @property {number} id     Post or term id.
 * @property {string} url    Link url.
 * @property {string} title  Title of the link.
 * @property {string} type   The taxonomy or post type slug or type URL.
 * @property {WPKind} [kind] Link kind of post-type or taxonomy
 */

/**
 * @typedef WPLinkSearchResultAugments
 *
 * @property {{kind: WPKind}} [meta]    Contains kind information.
 * @property {WPKind}         [subtype] Optional subtype if it exists.
 */

/**
 * @typedef {WPLinkSearchResult & WPLinkSearchResultAugments} WPLinkSearchResultAugmented
 */

/**
 * @typedef WPEditorSettings
 *
 * @property {boolean} [ disablePostFormats ] Disables post formats, when true.
 */

/**
 * Fetches link suggestions from the API.
 *
 * @async
 * @param {string}              search
 * @param {WPLinkSearchOptions} [searchOptions]
 * @param {WPEditorSettings}    [settings]
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
 * @return {Promise< WPLinkSearchResult[] >} List of search suggestions
 */
const fetchLinkSuggestions = async (
	search,
	searchOptions = {},
	settings = {}
) => {
	const {
		isInitialSuggestions = false,
		type = undefined,
		subtype = undefined,
		page = undefined,
		perPage = isInitialSuggestions ? 3 : 20,
	} = searchOptions;

	const { disablePostFormats = false } = settings;

	/** @type {Promise<WPLinkSearchResult>[]} */
	const queries = [];

	if ( ! type || type === 'post' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post',
					subtype,
				} ),
			} )
				.then( ( results ) => {
					return results.map( ( result ) => {
						return {
							...result,
							meta: { kind: 'post-type', subtype },
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	if ( ! type || type === 'term' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'term',
					subtype,
				} ),
			} )
				.then( ( results ) => {
					return results.map( ( result ) => {
						return {
							...result,
							meta: { kind: 'taxonomy', subtype },
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	if ( ! disablePostFormats && ( ! type || type === 'post-format' ) ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					page,
					per_page: perPage,
					type: 'post-format',
					subtype,
				} ),
			} )
				.then( ( results ) => {
					return results.map( ( result ) => {
						return {
							...result,
							meta: { kind: 'taxonomy', subtype },
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	if ( ! type || type === 'attachment' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/media', {
					search,
					page,
					per_page: perPage,
				} ),
			} )
				.then( ( results ) => {
					return results.map( ( result ) => {
						return {
							...result,
							meta: { kind: 'media' },
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	return Promise.all( queries ).then( ( results ) => {
		return results
			.reduce(
				( /** @type {WPLinkSearchResult[]} */ accumulator, current ) =>
					accumulator.concat( current ), // Flatten list.
				[]
			)
			.filter(
				/**
				 * @param {{ id: number }} result
				 */
				( result ) => {
					return !! result.id;
				}
			)
			.slice( 0, perPage )
			.map( ( /** @type {WPLinkSearchResultAugmented} */ result ) => {
				const isMedia = result.type === 'attachment';

				return {
					id: result.id,
					// @ts-ignore fix when we make this a TS file
					url: isMedia ? result.source_url : result.url,
					title:
						decodeEntities(
							isMedia
								? // @ts-ignore fix when we make this a TS file
								  result.title.rendered
								: result.title || ''
						) || __( '(no title)' ),
					type: result.subtype || result.type,
					kind: result?.meta?.kind,
				};
			} );
	} );
};

export default fetchLinkSuggestions;
