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
	 * The order to rank result types in, most wanted first. Each is named as the
	 * results spell it: a post type or taxonomy slug, such as `page`, `category`
	 * or `post_tag`.
	 *
	 * Defaults to `DEFAULT_TYPE_ORDER`. A caller that edits one kind of link
	 * leads with that kind:
	 *
	 *     typeOrder: [ 'category', 'page', 'post', 'post_tag', 'attachment', 'post-format' ]
	 */
	typeOrder?: string[];
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
		typeOrder,
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
	results = sortResults( results, search, typeOrder );
	results = results.slice( 0, perPage );
	return results;
}

/**
 * Whether a title answers the search: every word typed appears in it as a whole word.
 *
 * Matching whole words rather than any substring is what separates a title that is about what was
 * typed from one that merely shares some letters with it. Searching `coffee`, both `Coffee Roasting
 * Guide` and `Our Coffee` are about coffee, wherever the word sits; `Coffeehouse Rules` is about
 * something else.
 *
 * @param title
 * @param search
 *
 * @return True when the title contains every word that was typed.
 */
function isWholeMatch( title: string, search: string ): boolean {
	const searchTokens = tokenize( search );

	if ( ! searchTokens.length ) {
		return false;
	}

	const titleTokens = tokenize( title || '' );

	return searchTokens.every( ( searchToken ) =>
		titleTokens.includes( searchToken )
	);
}

/**
 * How directly a title answers what was typed.
 *
 * Only a whole-title or a start-of-title match counts. Anything less is left to the token score,
 * which cannot tell where in the title a match sits.
 *
 * @param title
 * @param search
 *
 * @return 2 for the whole title, 1 for the start of it, otherwise 0.
 */
function getMatchTier( title: string, search: string ): number {
	const haystack = ( title ?? '' ).toLowerCase().trim();
	const needle = ( search ?? '' ).toLowerCase().trim();

	if ( ! haystack || ! needle ) {
		return 0;
	}

	if ( haystack === needle ) {
		return 2;
	}

	return haystack.startsWith( needle ) ? 1 : 0;
}

/**
 * The order result types are ranked in when the caller names none.
 *
 * A link is most often to a page, then to a category, then to a post, then to a tag. An attachment
 * is a file rather than a destination and a post format is a way of styling a post, so both come
 * last: a link search is rarely looking for either, and on a site with a large media library they
 * crowd out everything else.
 */
export const DEFAULT_TYPE_ORDER = [
	'page',
	'category',
	'post',
	'post_tag',
	'attachment',
	'post-format',
];

/**
 * Where a result's type sits in the order the caller wants.
 *
 * A caller may name every type, or only the ones it wants to lead with. Types it leaves out keep
 * their `DEFAULT_TYPE_ORDER` positions, below the ones it named, so naming `[ 'category' ]` leads
 * with categories and orders the rest as usual.
 *
 * A custom post type or taxonomy is ranked with the built-in type closest to it, since nothing
 * general can be said about it.
 *
 * @param result
 * @param typeOrder
 *
 * @return 0 for the most wanted type, rising for each type after it.
 */
function getTypeRank( result: SearchResult, typeOrder: string[] ): number {
	const named = typeOrder.indexOf( result.type );

	if ( named !== -1 ) {
		return named;
	}

	const closest = DEFAULT_TYPE_ORDER.includes( result.type )
		? result.type
		: ( {
				media: 'attachment',
				taxonomy: 'post_tag',
			}[ result.kind as string ] ?? 'post' );

	const namedClosest = typeOrder.indexOf( closest );

	if ( namedClosest !== -1 ) {
		return namedClosest;
	}

	return typeOrder.length + DEFAULT_TYPE_ORDER.indexOf( closest );
}

/**
 * Sort search results by relevance to the given query.
 *
 * Sorting is necessary as we're querying multiple endpoints and merging the results. For example
 * a taxonomy title might be more relevant than a post title, but by default taxonomy results will
 * be ordered after all the (potentially irrelevant) post results.
 *
 * Above everything sits a title that is exactly what was typed. Nothing else lifts a result past
 * the rank of its type, so an attachment reaches the top only by being named exactly what was
 * searched for.
 *
 * Below that, a title that answers the search — one containing every word that was typed — ranks
 * above every title that does not. Nothing that fails to match should displace something that
 * matches.
 *
 * The type then decides, in `typeOrder` or `DEFAULT_TYPE_ORDER`. Beginning with the search term
 * orders titles within a type, but never lifts one type above another: the score below cannot see
 * where a match sits, because it divides by the title's length, so a long title is marked down for
 * being long even when the search term is its first word.
 *
 * The rest is sorted by scoring each result, where the score is the number of tokens in the title
 * that are also in the search query, divided by the total number of tokens in the title. This gives
 * us a score between 0 and 1, where 1 is a perfect match.
 *
 * @param results
 * @param search
 * @param typeOrder
 */
export function sortResults(
	results: SearchResult[],
	search: string,
	typeOrder: string[] = DEFAULT_TYPE_ORDER
) {
	const searchTokens = tokenize( search );

	// Give each result a unique key to avoid duplicate ids from different tables
	// overwriting another's score.
	const scoreKey = ( result: SearchResult ) =>
		`${ result.kind }:${ result.type }:${ result.id }`;

	const scores = {};
	const tiers = {};
	const matches = {};
	for ( const result of results ) {
		tiers[ scoreKey( result ) ] = getMatchTier( result.title, search );
		matches[ scoreKey( result ) ] = isWholeMatch( result.title, search );

		if ( result.title ) {
			const titleTokens = tokenize( result.title );
			const exactMatchingTokens = titleTokens.filter( ( titleToken ) =>
				searchTokens.some(
					( searchToken ) => titleToken === searchToken
				)
			);
			const subMatchingTokens = titleTokens.filter( ( titleToken ) =>
				searchTokens.some(
					( searchToken ) =>
						titleToken !== searchToken &&
						titleToken.includes( searchToken )
				)
			);

			// The score is a combination of exact matches and sub-matches.
			// More weight is given to exact matches, as they are more relevant (e.g. "cat" vs "caterpillar").
			// Diving by the total number of tokens in the title normalizes the score and skews
			// the results towards shorter titles.
			const exactMatchScore =
				( exactMatchingTokens.length / titleTokens.length ) * 10;

			const subMatchScore = subMatchingTokens.length / titleTokens.length;

			scores[ scoreKey( result ) ] = exactMatchScore + subMatchScore;
		} else {
			scores[ scoreKey( result ) ] = 0;
		}
	}

	// A title that is exactly what was typed leads, whatever its type. It is the one signal strong
	// enough to be worth a type the caller would otherwise rank last.
	const isExact = ( result: SearchResult ) =>
		tiers[ scoreKey( result ) ] === 2 ? 1 : 0;

	// Below that, a title that answers the search outranks one that does not, before any type is
	// considered.
	const isMatch = ( result: SearchResult ) =>
		matches[ scoreKey( result ) ] ? 1 : 0;

	return results.sort(
		( a, b ) =>
			isExact( b ) - isExact( a ) ||
			isMatch( b ) - isMatch( a ) ||
			getTypeRank( a, typeOrder ) - getTypeRank( b, typeOrder ) ||
			// Beginning with the search term orders titles within a type, but never lifts one type
			// above another.
			tiers[ scoreKey( b ) ] - tiers[ scoreKey( a ) ] ||
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
