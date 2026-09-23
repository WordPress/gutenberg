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
	 * How many results to ask each request for, and at most how many to return. Naming a number
	 * here is taken as asking for no more than that, and it is honoured.
	 *
	 * Left out, it defaults to 20, or 3 for initial suggestions — and an unscoped search may
	 * return more. Such a search merges several requests and cannot be paged with `page`, so a
	 * result it drops is one nothing could ask for again, and a title holding every word that was
	 * typed is kept however many there are.
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

	// A caller that names a number is asking for at most that many, and gets them. One that names
	// none is taking whatever a page holds, so it can be given more.
	const asksForExactly = searchOptionsToUse.perPage !== undefined;
	const perPage =
		searchOptionsToUse.perPage ??
		( searchOptions.isInitialSuggestions ? 3 : 20 );

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

	results = sortResults( results, search );

	// A search narrowed to one type is a single request, so `perPage` bounds it and `page` pages
	// through it. With nothing typed there is no search to answer, so those results are a preview
	// and there is nothing in them to lose by cutting. And a caller that named a number gets it.
	if ( type || ! search || asksForExactly ) {
		return results.slice( 0, perPage );
	}

	// An unscoped search merges four requests and cannot be paginated coherently — a result's
	// place is not known until every request has been ranked, and `page` applies to each request
	// separately — so a result cut here is one nothing could ask for again.
	//
	// A title holding every word that was typed answers the search, wherever those words sit in
	// it, and is never cut. The rest fill whatever room is left, so a search never returns fewer
	// results than it used to: first the titles holding some of what was typed, then those
	// holding none, which WordPress returned because it matched a body or an excerpt.
	const searchTokens = tokenize( search );
	const answers: SearchResult[] = [];
	const partial: SearchResult[] = [];
	const rest: SearchResult[] = [];

	for ( const result of results ) {
		const titleTokens = tokenize( result.title || '' );
		const found = searchTokens.filter( ( searchToken ) =>
			titleTokens.some( ( titleToken ) =>
				titleToken.includes( searchToken )
			)
		).length;

		if ( found === searchTokens.length ) {
			answers.push( result );
		} else if ( found ) {
			partial.push( result );
		} else {
			rest.push( result );
		}
	}

	return [
		...answers,
		...[ ...partial, ...rest ].slice(
			0,
			Math.max( 0, perPage - answers.length )
		),
	];
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
 * How much of the search a title covers.
 *
 * Counts how much of the search the title covers, not how much of the title the search covers: a
 * title is not a worse answer for having more words in it, and saying the same word twice does not
 * make it a better one.
 *
 * @param title
 * @param searchTokens
 *
 * @return 10 when every word typed is in the title whole, less as fewer are.
 */
function getCoverage( title: string, searchTokens: string[] ): number {
	if ( ! title || ! searchTokens.length ) {
		return 0;
	}

	const titleTokens = tokenize( title );

	const wholeWords = searchTokens.filter( ( searchToken ) =>
		titleTokens.includes( searchToken )
	).length;

	// A word typed that only appears inside a longer one, as "coffee" does in "coffeehouse", is
	// worth much less than the word itself.
	const partialWords = searchTokens.filter(
		( searchToken ) =>
			! titleTokens.includes( searchToken ) &&
			titleTokens.some( ( titleToken ) =>
				titleToken.includes( searchToken )
			)
	).length;

	return ( wholeWords * 10 + partialWords ) / searchTokens.length;
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

	const ranked = results.map( ( result ) => ( {
		result,
		...getTitleMatch( result.title, search ),
		type: getTypeWeight( result ),
		score: getCoverage( result.title, searchTokens ),
	} ) );

	ranked.sort(
		( a, b ) =>
			// A title that does not contain what was typed is not an answer to the search, whatever
			// its type.
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
