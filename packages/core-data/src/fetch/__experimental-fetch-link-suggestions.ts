import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

type SearchType = 'attachment' | 'post' | 'term' | 'post-format';

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
	 * Filters by search type.
	 */
	type?: SearchType;
	/**
	 * Slug of the post-type or taxonomy.
	 */
	subtype?: string;
	/**
	 * Result types to rank above the usual order, most wanted first. Everything
	 * left out keeps its usual place below them.
	 *
	 * An entry is a search type, covering everything of that type, or a search
	 * type with one subtype, covering only that subtype. A caller that edits one
	 * kind of link leads with that kind:
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

type SearchAPIResult = {
	id: number;
	title: string;
	url: string;
	type: string;
	subtype: string;
};

type MediaAPIResult = {
	id: number;
	title: { rendered: string };
	source_url: string;
	type: string;
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
 * WordPress does not support searching multiple tables at once, e.g. posts and terms, so we
 * perform multiple queries at the same time and then merge the results together.
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
		preferTypes,
		page,
		perPage = searchOptions.isInitialSuggestions ? 3 : 20,
	} = searchOptionsToUse;

	const { disablePostFormats = false } = editorSettings;

	const queries: Promise< SearchResult[] >[] = [];

	if ( ! type || type === 'post' ) {
		queries.push(
			apiFetch< SearchAPIResult[] >( {
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
							id: result.id,
							url: result.url,
							title:
								decodeEntities( result.title || '' ) ||
								__( '(no title)' ),
							type: result.subtype || result.type,
							kind: 'post-type',
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	if ( ! type || type === 'term' ) {
		queries.push(
			apiFetch< SearchAPIResult[] >( {
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
							id: result.id,
							url: result.url,
							title:
								decodeEntities( result.title || '' ) ||
								__( '(no title)' ),
							type: result.subtype || result.type,
							kind: 'taxonomy',
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	if ( ! disablePostFormats && ( ! type || type === 'post-format' ) ) {
		queries.push(
			apiFetch< SearchAPIResult[] >( {
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
							id: result.id,
							url: result.url,
							title:
								decodeEntities( result.title || '' ) ||
								__( '(no title)' ),
							type: result.subtype || result.type,
							kind: 'taxonomy',
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	if ( ! type || type === 'attachment' ) {
		queries.push(
			apiFetch< MediaAPIResult[] >( {
				path: addQueryArgs( '/wp/v2/media', {
					search,
					page,
					per_page: perPage,
				} ),
			} )
				.then( ( results ) => {
					return results.map( ( result ) => {
						return {
							id: result.id,
							url: result.source_url,
							title:
								decodeEntities( result.title.rendered || '' ) ||
								__( '(no title)' ),
							type: result.type,
							kind: 'media',
						};
					} );
				} )
				.catch( () => [] ) // Fail by returning no results.
		);
	}

	const responses = await Promise.all( queries );

	let results = responses.flat();
	results = results.filter( ( result ) => !! result.id );

	// A search narrowed to one type comes from a single request, so `perPage` already bounds it
	// and `page` pages through it. An unscoped search merges four requests, which cannot be
	// paginated coherently — a result's place is not known until every request has been ranked —
	// so cutting it would discard results that nothing could ever ask for again.
	//
	// Returning all of them instead means dropping the ones that do not answer the search.
	// WordPress matches a post's body and excerpt as well as its title, so an unscoped search
	// returns titles with no sign of what was typed in them, and unbounded they would fill the
	// list. See https://github.com/WordPress/gutenberg/issues/83372.
	//
	// A narrowed search is left alone: it is paginated, and its `X-WP-Total` count comes from
	// WordPress, so dropping results here would leave the caller's page sizes and totals
	// disagreeing with each other.
	if ( ! type && search ) {
		results = results.filter(
			( result ) => getMatchRank( result.title, search ) > 0
		);
	}

	results = sortResults( results, search, preferTypes );

	if ( type ) {
		results = results.slice( 0, perPage );
	}

	return results;
}

/**
 * How well a title answers what was typed.
 *
 * The search string is compared as typed, not word by word: a title "contains" it when the whole
 * string appears somewhere in the title, and it counts for more when the title begins with it.
 * Beginning with what was typed is the clearest sign a title is the thing being looked for.
 *
 * @param title
 * @param search
 *
 * @return 2 when the title begins with the search, 1 when it contains it, otherwise 0.
 */
function getMatchRank( title: string, search: string ): number {
	const haystack = ( title ?? '' ).toLowerCase().trim();
	const needle = ( search ?? '' ).toLowerCase().trim();

	if ( ! haystack || ! needle ) {
		return 0;
	}

	if ( haystack.startsWith( needle ) ) {
		return 2;
	}

	return haystack.includes( needle ) ? 1 : 0;
}

/**
 * The order result types are ranked in, most wanted first.
 *
 * An entry is either a search type, which covers everything of that type, or a search type with
 * one subtype, which covers only that subtype. Listing both lets a specific subtype outrank the
 * rest of its type while the plain entry catches everything else — so a page outranks a post, and
 * a custom post type nobody has heard of still ranks as content rather than falling off the end.
 *
 * A link is usually to content, then to a taxonomy. An attachment is a file rather than a
 * destination and a post format is a way of styling a post, so both come last: on a site with a
 * large media library they otherwise crowd out what was being looked for. See
 * https://github.com/WordPress/gutenberg/issues/63683.
 */
export type TypeOrderEntry = SearchType | { type: SearchType; subtype: string };

const TYPE_ORDER: TypeOrderEntry[] = [
	{ type: 'post', subtype: 'page' },
	'post',
	{ type: 'term', subtype: 'category' },
	'term',
	'post-format',
	'attachment',
];

/**
 * Which search type a result belongs to.
 *
 * Results name themselves by post type or taxonomy slug, so the search type they came back from
 * has to be recovered from the kind.
 *
 * @param result
 *
 * @return The search type.
 */
function getSearchType( result: SearchResult ): SearchType {
	if ( result.kind === 'media' ) {
		return 'attachment';
	}

	if ( result.type === 'post-format' ) {
		return 'post-format';
	}

	return result.kind === 'taxonomy' ? 'term' : 'post';
}

/**
 * Whether an entry in a type order describes a result.
 *
 * @param entry
 * @param result
 *
 * @return True when the entry covers that result.
 */
function coversResult( entry: TypeOrderEntry, result: SearchResult ): boolean {
	const searchType = getSearchType( result );

	return typeof entry === 'string'
		? entry === searchType
		: entry.type === searchType && entry.subtype === result.type;
}

/**
 * How much a result's type counts towards its rank.
 *
 * Earlier entries are worth more, and anything a caller prefers outranks the usual order entirely.
 * A weight rather than a band, so a title that plainly answers the search can still outrank a
 * better-placed type that barely does.
 *
 * @param result
 * @param preferTypes
 *
 * @return The weight to add to the result's score.
 */
function getTypeWeight(
	result: SearchResult,
	preferTypes: TypeOrderEntry[] = []
): number {
	const preferred = preferTypes.findIndex( ( entry ) =>
		coversResult( entry, result )
	);

	if ( preferred !== -1 ) {
		return TYPE_ORDER.length + ( preferTypes.length - preferred );
	}

	const rank = TYPE_ORDER.findIndex( ( entry ) =>
		coversResult( entry, result )
	);

	return rank === -1 ? 0 : TYPE_ORDER.length - rank;
}

/**
 * Sort search results by relevance to the given query.
 *
 * Sorting is necessary as we're querying multiple endpoints and merging the results. For example
 * a taxonomy title might be more relevant than a post title, but by default taxonomy results will
 * be ordered after all the (potentially irrelevant) post results.
 *
 * A title containing what was typed ranks above one that does not, whatever its type: a title
 * that does not contain the search is not an answer to it.
 *
 * Beginning with what was typed comes next, since a title that opens with the search is the
 * clearest sign it is the thing being looked for.
 *
 * Last is a score: how much of the search the title covers, counting a whole word for much more
 * than a word found inside a longer one, plus a weight for the result's type. How much of the
 * *title* the search covers is deliberately not considered, so a long title is never marked down
 * for being long, and repeating a word never makes a title a better answer.
 *
 * The rest is sorted by scoring each result, where the score is the number of tokens in the title
 * that are also in the search query, divided by the total number of tokens in the title. This gives
 * us a score between 0 and 1, where 1 is a perfect match.
 *
 * @param results
 * @param search
 * @param preferTypes
 */
export function sortResults(
	results: SearchResult[],
	search: string,
	preferTypes?: TypeOrderEntry[]
) {
	const searchTokens = tokenize( search );

	// Give each result a unique key to avoid duplicate ids from different tables
	// overwriting another's score.
	const scoreKey = ( result: SearchResult ) =>
		`${ result.kind }:${ result.type }:${ result.id }`;

	const scores = {};
	const matches = {};
	for ( const result of results ) {
		matches[ scoreKey( result ) ] = getMatchRank( result.title, search );

		if ( result.title && searchTokens.length ) {
			const titleTokens = tokenize( result.title );

			// Count how much of the search the title covers, not how much of the title the search
			// covers. A title is not a worse answer for having more words in it, and saying the same
			// word twice does not make it a better one.
			const wholeWords = searchTokens.filter( ( searchToken ) =>
				titleTokens.includes( searchToken )
			).length;

			// A word typed that only appears inside a longer one, as "coffee" does in
			// "coffeehouse", is worth much less than the word itself.
			const partialWords = searchTokens.filter(
				( searchToken ) =>
					! titleTokens.includes( searchToken ) &&
					titleTokens.some( ( titleToken ) =>
						titleToken.includes( searchToken )
					)
			).length;

			scores[ scoreKey( result ) ] =
				( wholeWords * 10 + partialWords ) / searchTokens.length +
				getTypeWeight( result, preferTypes );
		} else {
			scores[ scoreKey( result ) ] = getTypeWeight( result, preferTypes );
		}
	}

	// Containing what was typed is decided before anything else: a title that does not contain it
	// is not an answer to the search, whatever its type.
	const contains = ( result: SearchResult ) =>
		matches[ scoreKey( result ) ] > 0 ? 1 : 0;

	// Where the match sits is decided after the type, so naming an order drops the advantage a
	// title would otherwise get from beginning with the search.
	const begins = ( result: SearchResult ) =>
		matches[ scoreKey( result ) ] === 2 ? 1 : 0;

	return results.sort(
		( a, b ) =>
			contains( b ) - contains( a ) ||
			begins( b ) - begins( a ) ||
			scores[ scoreKey( b ) ] - scores[ scoreKey( a ) ]
	);
}

/**
 * Turns text into an array of tokens, with whitespace and punctuation removed.
 *
 * For example, `"I'm having a ball."` becomes `[ "im", "having", "a", "ball" ]`.
 *
 * @param text
 */
export function tokenize( text: string ): string[] {
	// \p{L} matches any kind of letter from any language.
	// \p{N} matches any kind of numeric character.
	return text.toLowerCase().match( /[\p{L}\p{N}]+/gu ) || [];
}
