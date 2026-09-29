import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

type SearchType = 'attachment' | 'post' | 'term' | 'post-format';

/**
 * A type to rank first: a search type, covering everything of that type, or a search type with
 * one post type or taxonomy, covering only that one.
 */
export type TypeOrderEntry = SearchType | { type: SearchType; subtype: string };

export type SearchOptions = {
	/**
	 * Displays initial search suggestions, when true.
	 */
	isInitialSuggestions?: boolean;
	/**
	 * Search options for initial suggestions.
	 */
	initialSuggestionsSearchOptions?: Omit<
		SearchOptions,
		'isInitialSuggestions' | 'initialSuggestionsSearchOptions'
	>;
	/**
	 * Search types to search. Every type when left out.
	 */
	type?: SearchType | SearchType[];
	/**
	 * Post types and taxonomies to search. Every one when left out.
	 */
	subtype?: string | string[];
	/**
	 * Search types to leave out.
	 */
	typeExclude?: SearchType[];
	/**
	 * Post types and taxonomies to leave out.
	 */
	subtypeExclude?: string[];
	/**
	 * Types to rank above the usual order, most wanted first. Everything left out keeps its usual
	 * place behind them. Only the type is reordered: a better match still ranks first.
	 *
	 *     preferTypes: [ { type: 'term', subtype: 'category' } ]
	 */
	preferTypes?: TypeOrderEntry[];
	/**
	 * Which page of results to return.
	 */
	page?: number;
	/**
	 * Search results per page.
	 */
	perPage?: number;
};

export type EditorSettings = {
	/**
	 * Disables post formats, when true.
	 */
	disablePostFormats?: boolean;
};

type LinkSuggestionAPIResult = {
	id: number;
	title: string;
	url: string;
	type: SearchType;
	subtype: string;
};

/**
 * The kind of link each search type makes.
 */
const KINDS: Record< SearchType, string > = {
	post: 'post-type',
	term: 'taxonomy',
	'post-format': 'taxonomy',
	attachment: 'media',
};

export type SearchResult = {
	/**
	 * Post or term id.
	 */
	id: number;
	/**
	 * Link url.
	 */
	url: string;
	/**
	 * Title of the link.
	 */
	title: string;
	/**
	 * The taxonomy or post type slug or type URL.
	 */
	type: string;
	/**
	 * Link kind of post-type or taxonomy
	 */
	kind?: string;
};

/**
 * Fetches link suggestions from the WordPress API.
 *
 * Posts, terms, post formats and media are searched, ranked and paged together on the server, so
 * each page is a slice of one ordered list.
 *
 * @param search
 * @param searchOptions
 * @param editorSettings
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
 */
export default async function fetchLinkSuggestions(
	search: string,
	searchOptions: SearchOptions = {},
	editorSettings: EditorSettings = {}
): Promise< SearchResult[] > {
	const searchOptionsToUse =
		searchOptions.isInitialSuggestions &&
		searchOptions.initialSuggestionsSearchOptions
			? {
					...searchOptions,
					...searchOptions.initialSuggestionsSearchOptions,
				}
			: searchOptions;

	const {
		type,
		subtype,
		typeExclude = [],
		subtypeExclude,
		preferTypes,
		page,
		perPage = searchOptions.isInitialSuggestions ? 3 : 20,
	} = searchOptionsToUse;

	const { disablePostFormats = false } = editorSettings;

	try {
		const results = await apiFetch< LinkSuggestionAPIResult[] >( {
			path: addQueryArgs( '/wp-block-editor/v1/link-suggestions', {
				search,
				page,
				per_page: perPage,
				type,
				subtype,
				type_exclude: disablePostFormats
					? [ ...typeExclude, 'post-format' ]
					: typeExclude,
				subtype_exclude: subtypeExclude,
				prefer_types: preferTypes,
			} ),
		} );

		return results.map( ( result ) => ( {
			id: result.id,
			url: result.url,
			title: decodeEntities( result.title || '' ) || __( '(no title)' ),
			type: result.subtype,
			kind: KINDS[ result.type ],
		} ) );
	} catch {
		// Fail by returning no results.
		return [];
	}
}
