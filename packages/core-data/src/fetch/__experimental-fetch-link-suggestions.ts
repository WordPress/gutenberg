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
	 * Which page of results to return. Only meaningful for a search narrowed by `type`, which is
	 * a single request; an unscoped search merges several and cannot be paged through.
	 */
	page?: number;
	/**
	 * Search results per page. Bounds each request, and bounds the results of a search narrowed by
	 * `type`; an unscoped search returns everything it found, so it can return more than this.
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
	// Returning all of them instead means dropping the ones that do not answer the search at all.
	// WordPress matches a post's body and excerpt as well as its title, so an unscoped search
	// returns titles with no sign of what was typed in them, and unbounded they would fill the
	// list. A title is kept when it has every word that was typed, wherever they sit in it —
	// the ranking below prefers them together, but a title is still an answer with them apart.
	// See https://github.com/WordPress/gutenberg/issues/83372.
	//
	// A narrowed search is left alone: it is paginated, and its `X-WP-Total` count comes from
	// WordPress, so dropping results here would leave the caller's page sizes and totals
	// disagreeing with each other.
	if ( ! type ) {
		const searchTokens = tokenize( search );

		results = results.filter( ( result ) => {
			const titleTokens = tokenize( result.title || '' );

			return searchTokens.every( ( searchToken ) =>
				titleTokens.includes( searchToken )
			);
		} );
	}

	results = sortResults( results, search );

	// Only an unscoped search is unbounded. With nothing typed there is no search to be an answer
	// to, so those results are a preview and there is nothing in them to lose by cutting.
	if ( type || ! search ) {
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
 * A link is usually to content, then to a taxonomy. An attachment is a file rather than a
 * destination, and a post format is a way of styling a post rather than somewhere to go, so those
 * come last: on a site with a large media library they otherwise crowd out what was being looked
 * for. See https://github.com/WordPress/gutenberg/issues/63683.
 *
 * Deliberately no finer than the search types themselves. Nothing general can be said about
 * whether a page is a better answer than a post, and ranking by search type means every custom
 * post type counts as content and every custom taxonomy counts as a taxonomy without being named.
 */
const TYPE_ORDER: SearchType[] = [
	'post',
	'term',
	'attachment',
	'post-format',
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
 * Sort search results by relevance to the given query.
 *
 * Sorting is necessary as we're querying multiple endpoints and merging the results. For example
 * a taxonomy title might be more relevant than a post title, but by default taxonomy results will
 * be ordered after all the (potentially irrelevant) post results.
 *
 * A title containing what was typed ranks above one that does not, whatever its type: a title
 * that does not contain the search is not an answer to it.
 *
 * The type comes next, then whether the title begins with what was typed.
 *
 * Last is how much of the search the title covers, counting a whole word for much more than a word
 * found inside a longer one. How much of the *title* the search covers is deliberately not
 * considered, so a long title is never marked down for being long, and repeating a word never
 * makes a title a better answer.
 *
 * @param results
 * @param search
 */
export function sortResults( results: SearchResult[], search: string ) {
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
				( wholeWords * 10 + partialWords ) / searchTokens.length;
		} else {
			scores[ scoreKey( result ) ] = 0;
		}
	}

	// Containing what was typed is decided before anything else: a title that does not contain it
	// is not an answer to the search, whatever its type.
	const contains = ( result: SearchResult ) =>
		matches[ scoreKey( result ) ] > 0 ? 1 : 0;

	// Then the type, before anything about where the match sits: an attachment is named after its
	// file, so it very often begins with what was typed, and that must not lift it above a page.
	const begins = ( result: SearchResult ) =>
		matches[ scoreKey( result ) ] === 2 ? 1 : 0;

	return results.sort(
		( a, b ) =>
			contains( b ) - contains( a ) ||
			getTypeWeight( b ) - getTypeWeight( a ) ||
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
