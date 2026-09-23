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
	 * left out keeps its usual place behind them.
	 *
	 * An entry is a search type, covering everything of that type, or a search
	 * type with one subtype, covering only that subtype. A caller that edits
	 * one kind of link leads with that kind:
	 *
	 *     preferTypes: [ { type: 'term', subtype: 'category' } ]
	 */
	preferTypes?: TypeOrderEntry[];
	/**
	 * Which page of results to return. Only meaningful for a search narrowed by `type`.
	 * Unscoped searches across multiple types do not have paged results due to sorting
	 * and merging results across multiple tables.
	 */
	page?: number;
	/**
	 * The number of results to return.
	 *
	 * Important: perPage acts as a limiter when searching across types, as multi-type
	 * searches do not have pagination. If left as the default, this will return up to 80 results
	 * (20 results from each type). For a single type, perPage follows the standard
	 * WordPress meaning of number of results per page.
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

	const { type, subtype, preferTypes, page } = searchOptionsToUse;

	// Naming a number is asking for no more than that; naming none is taking whatever a page
	// holds, which an unscoped search may exceed.
	const limit = searchOptionsToUse.perPage;
	const perPage = limit ?? ( searchOptions.isInitialSuggestions ? 3 : 20 );

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
	results = sortResults( results, search, preferTypes );

	// A search narrowed to one type is a single request, so `perPage` bounds it and `page` pages
	// through it. With nothing typed there is no search to answer, so those results are a preview
	// and there is nothing in them to lose by cutting. And a caller that named a number gets it.
	if ( type || ! search || limit !== undefined ) {
		return results.slice( 0, perPage );
	}

	// An unscoped search merges four requests and cannot be paginated coherently — a result's
	// place is not known until every request has been ranked, and `page` applies to each request
	// separately — so a result cut here is one nothing could ask for again.
	//
	// A title holding every word that was typed answers the search and is never cut, however many
	// there are. They sort first, so they are the front of the list, and the rest fill whatever
	// room is left.
	const searchTokens = tokenize( search );
	const answers = results.filter(
		( result ) =>
			countWordsFound( result.title, searchTokens ) ===
			searchTokens.length
	).length;

	return results.slice( 0, Math.max( perPage, answers ) );
}

/**
 * How well a title answers what was typed.
 *
 * The search is compared as the string it was typed as, not word by word: a title contains it when
 * the whole string appears somewhere in the title, and beginning with it is the clearest sign the
 * title is the thing being looked for.
 *
 * @param title
 * @param search
 *
 * @return Whether the title contains the search, and whether it begins with it.
 */
function getTitleMatch(
	title: string,
	search: string
): { contains: boolean; begins: boolean } {
	// `get_the_title()` runs `wptexturize`, so a title comes back with curly quotes where it was
	// written with straight ones. Compare them as the same character.
	const plain = ( text: string ) =>
		( text ?? '' )
			.toLowerCase()
			.trim()
			.replace( /[\u2018\u2019]/g, "'" )
			.replace( /[\u201c\u201d]/g, '"' );

	const haystack = plain( title );
	const needle = plain( search );

	if ( ! haystack || ! needle ) {
		return { contains: false, begins: false };
	}

	return {
		contains: haystack.includes( needle ),
		begins: haystack.startsWith( needle ),
	};
}

/**
 * A position in a type order.
 *
 * Either a search type, which covers everything of that type, or a search type with one subtype,
 * which covers only that subtype. Naming a subtype lets it outrank the rest of its type, while a
 * plain search type catches every subtype at once — including custom post types and taxonomies,
 * which no caller can be expected to list.
 */
export type TypeOrderEntry = SearchType | { type: SearchType; subtype: string };

/**
 * The order result types are ranked in, most wanted first.
 *
 * A link is usually to content, then to a taxonomy. A post format is a way of styling a post
 * rather than somewhere to go, and an attachment is a file rather than a destination, so those
 * come last in the order they already had: on a site with a large media library they otherwise
 * crowd out what was being looked for. See https://github.com/WordPress/gutenberg/issues/63683.
 *
 * Deliberately no finer than the search types themselves. Nothing general can be said about
 * whether a page is a better answer than a post, and ranking by search type means every custom
 * post type counts as content and every custom taxonomy counts as a taxonomy without being named.
 */
const TYPE_ORDER: TypeOrderEntry[] = [
	'post',
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
 * How much a result's type counts towards its rank.
 *
 * Earlier entries are worth more, and anything a caller prefers outranks the usual order
 * entirely. A weight rather than a band, so a title that plainly answers the search can still
 * outrank a better-placed type that barely does.
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
	const covers = ( entry: TypeOrderEntry ) => {
		const searchType = getSearchType( result );

		return typeof entry === 'string'
			? entry === searchType
			: entry.type === searchType && entry.subtype === result.type;
	};

	const preferred = preferTypes.findIndex( covers );

	if ( preferred !== -1 ) {
		return TYPE_ORDER.length + ( preferTypes.length - preferred );
	}

	return TYPE_ORDER.length - TYPE_ORDER.findIndex( covers );
}

/**
 * How many of the words typed a title holds.
 *
 * A word counts whether it stands alone or sits inside a longer one, so "coffeehouse" holds
 * "coffee".
 *
 * @param title
 * @param searchTokens
 *
 * @return How many of the words typed appear in the title.
 */
function countWordsFound( title: string, searchTokens: string[] ): number {
	const titleTokens = tokenize( title || '' );

	return searchTokens.filter( ( searchToken ) =>
		titleTokens.some( ( titleToken ) => titleToken.includes( searchToken ) )
	).length;
}

/**
 * How much of the search a title covers.
 *
 * Counts how much of the search the title covers, not how much of the title the search covers: a
 * title is not a worse answer for having more words in it, and saying the same word twice does not
 * make it a better one.
 *
 * @param title
 * @param searchTokens
 *
 * @return 10 when every word typed is in the title whole, less as fewer are and as the words they
 *         were found in leave more out.
 */
function getCoverage( title: string, searchTokens: string[] ): number {
	if ( ! title || ! searchTokens.length ) {
		return 0;
	}

	const titleTokens = tokenize( title );

	// How much of the word it was found in a word typed accounts for: all of it when the two are
	// the same word, and less the more of that word it leaves out. So "cat" is worth little of
	// "caterpillar", "cater" is worth more of it, and "caterpillar" is worth all of it.
	const covered = searchTokens.reduce( ( total, searchToken ) => {
		const best = titleTokens.reduce(
			( most, titleToken ) =>
				titleToken.includes( searchToken )
					? Math.max( most, searchToken.length / titleToken.length )
					: most,
			0
		);

		return total + best;
	}, 0 );

	return ( covered / searchTokens.length ) * 10;
}

/**
 * Sort search results by relevance to the given query.
 *
 * Sorting is necessary as we're querying multiple endpoints and merging the results. For example
 * a taxonomy title might be more relevant than a post title, but by default taxonomy results will
 * be ordered after all the (potentially irrelevant) post results.
 *
 * A title holding every word that was typed ranks above one holding some, which ranks above one
 * holding none — whatever their types, and wherever in the title those words sit. Holding them
 * together, as the string that was typed, comes next.
 *
 * The type comes after that, then whether the title begins with what was typed.
 *
 * Last is how much of the search the title covers, counting a whole word for much more than a word
 * found inside a longer one. How much of the *title* the search covers is deliberately not
 * considered, so a long title is never marked down for being long, and repeating a word never
 * makes a title a better answer.
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

	const ranked = results.map( ( result ) => ( {
		result,
		found: countWordsFound( result.title, searchTokens ),
		...getTitleMatch( result.title, search ),
		type: getTypeWeight( result, preferTypes ),
		score: getCoverage( result.title, searchTokens ),
	} ) );

	ranked.sort(
		( a, b ) =>
			// How much of the search the title holds at all, before anything else: a title with
			// every word typed answers it, whatever its type and wherever those words sit.
			b.found - a.found ||
			// Then whether it holds them together, as one string.
			Number( b.contains ) - Number( a.contains ) ||
			b.type - a.type ||
			// After the type: an attachment is named after its file, so it very often begins with
			// what was typed, and that must not lift it above a page.
			Number( b.begins ) - Number( a.begins ) ||
			b.score - a.score
	);

	return ranked.map( ( { result } ) => result );
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
