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

	const { type, subtype, page } = searchOptionsToUse;

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

	if ( searchOptions.isInitialSuggestions || ! search ) {
		return sortResults( results, search ).slice( 0, perPage );
	}

	const sortedResults = rankResults( results, search );

	// Determine how many results to return
	//
	// If a search is unscoped (any type), we don't want to limit it to the perPage as it might discard
	// valid results from a lower tier (i.e. attachments). So, unscoped default searches return
	// every title matching a word typed even if they exceed 20. Titles matching no word typed are
	// left out: `/wp/v2/search` matches post content and excerpts too, with no way to narrow it.
	// Explicitly passed perPage unscoped searches respect the perPage value.
	const matches = sortedResults.filter( ( { found } ) => found > 0 );

	const bounded = type || limit !== undefined;
	const kept = bounded ? matches.slice( 0, perPage ) : matches;

	return kept.map( ( { result } ) => result );
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
const TYPE_ORDER: SearchType[] = [
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
 * Earlier entries in `TYPE_ORDER` are worth more. A weight rather than a band, so a title that
 * plainly answers the search can still outrank a better-placed type that barely does.
 *
 * @param result
 *
 * @return The weight to add to the result's score.
 */
function getTypeWeight( result: SearchResult ): number {
	return TYPE_ORDER.length - TYPE_ORDER.indexOf( getSearchType( result ) );
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
 * Example scoring for title "Caterpillars are great"
 *   cat                = 2.5    3 characters of the 12 in "caterpillars"
 *   cater              = 4.17   5 of the 12
 *   caterpillars       = 10     the whole word
 *   great caterpillars = 10     whole word match
 *
 * @param title
 * @param searchTokens
 *
 * @return 10 when every word typed is in the title whole, less relative to the number of
 *         characters of a matched word.
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

type ScoredResult = {
	result: SearchResult;
	/**
	 * How many of the words typed the title holds.
	 */
	found: number;
	/**
	 * Whether the title holds what was typed as one string.
	 */
	contains: boolean;
	/**
	 * Whether the title begins with what was typed.
	 */
	begins: boolean;
	/**
	 * Where the result's type sits in the wanted order, the most wanted highest.
	 */
	type: number;
	/**
	 * How much of the search the title covers.
	 */
	score: number;
};

/**
 * Work out how well each result answers the query, and order them by it.
 *
 * The scores come back attached to the results, so that deciding how many to keep can read what a
 * result matched instead of working it out a second time.
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
 */
function rankResults(
	results: SearchResult[],
	search: string
): ScoredResult[] {
	const searchTokens = tokenize( search );

	const scored = results.map( ( result ) => ( {
		result,
		found: countWordsFound( result.title, searchTokens ),
		...getTitleMatch( result.title, search ),
		type: getTypeWeight( result ),
		score: getCoverage( result.title, searchTokens ),
	} ) );

	scored.sort(
		( a, b ) =>
			// Does the title contain all words searched or just one?
			// If the search is "black cat" then "Black is my favorite color" should rank lower than "Cats that are black"
			b.found - a.found ||
			// Then whether it holds them together, as one string: i.e. "Black cats are great" vs "Cats that are black"
			Number( b.contains ) - Number( a.contains ) ||
			// Matches are equal so far, so enforce banding by type
			b.type - a.type ||
			// Within a band, rank matches that start with the search string higher than mid-string matches:
			// i.e the search "cat" ranks the title "caterpillar" higher than "concatenate"
			Number( b.begins ) - Number( a.begins ) ||
			// Rank by how much of the matched word the search contains: the search
			// "cat" ranks the title "Cats" above the title "Caterpillar" since cat is 75% of "Cats"
			// and only 27% of "Caterpillar"
			b.score - a.score
	);

	return scored;
}

/**
 * Sort search results by relevance to the given query.
 *
 * See `rankResults` for the order this puts them in.
 *
 * @param results
 * @param search
 */
export function sortResults( results: SearchResult[], search: string ) {
	return rankResults( results, search ).map( ( { result } ) => result );
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
