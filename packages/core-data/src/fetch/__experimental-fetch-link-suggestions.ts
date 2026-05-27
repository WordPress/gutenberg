/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

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
	type?: 'attachment' | 'post' | 'term' | 'post-format';
	/**
	 * Slug of the post-type or taxonomy.
	 */
	subtype?: string;
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

type PostAPIResult = {
	id: number;
	title: { rendered: string };
	link: string;
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
 * Maps a post subtype slug to its WP REST API base path.
 * Falls back to appending 's' for custom post types.
 *
 * @param subtype
 */
function getRestBase( subtype: string ): string {
	const map: Record< string, string > = {
		post: 'posts',
		page: 'pages',
		attachment: 'media',
	};
	return map[ subtype ] ?? `${ subtype }s`;
}

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

	// Slug-based post search. Query the individual REST endpoints
	// by slug to surface those results, then deduplicate below.
	if ( ( ! type || type === 'post' ) && search ) {
		const slugEndpoints = subtype
			? [ getRestBase( subtype ) ]
			: [ 'posts', 'pages' ];

		for ( const endpoint of slugEndpoints ) {
			queries.push(
				apiFetch< PostAPIResult[] >( {
					path: addQueryArgs( `/wp/v2/${ endpoint }`, {
						slug: search,
						per_page: perPage,
					} ),
				} )
					.then( ( results ) => {
						return results.map( ( result ) => ( {
							id: result.id,
							url: result.link,
							title:
								decodeEntities(
									result.title?.rendered || ''
								) || __( '(no title)' ),
							type: result.type,
							kind: 'post-type' as const,
						} ) );
					} )
					.catch( () => [] )
			);
		}
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
	// Deduplicate by id: slug search and title search can return the same post.
	// Keep the first occurrence (title-search results come first in `queries`).
	const seen = new Set< number | string >();
	results = results.filter( ( result ) => {
		if ( seen.has( result.id ) ) {
			return false;
		}
		seen.add( result.id );
		return true;
	} );
	results = sortResults( results, search );
	results = results.slice( 0, perPage );
	return results;
}

/**
 * Sort search results by relevance to the given query.
 *
 * Sorting is necessary as we're querying multiple endpoints and merging the results. For example
 * a taxonomy title might be more relevant than a post title, but by default taxonomy results will
 * be ordered after all the (potentially irrelevant) post results.
 *
 * We sort by scoring each result, where the score is the number of tokens in the title that are
 * also in the search query, divided by the total number of tokens in the title. This gives us a
 * score between 0 and 1, where 1 is a perfect match.
 *
 * @param results
 * @param search
 */
export function sortResults( results: SearchResult[], search: string ) {
	const searchTokens = tokenize( search );
	const scores: Record< string | number, number > = {};

	for ( const result of results ) {
		let score = 0;

		// Title-based scoring (exact match weight: 10, sub-match weight: ~1).
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
			score +=
				( exactMatchingTokens.length / titleTokens.length ) * 10 +
				subMatchingTokens.length / titleTokens.length;
		}

		// Slug-based scoring (exact match weight: 8, sub-match weight: ~0.5).
		// Sits between exact-title (≤10) and fuzzy-title (<1) so the final order is:
		//   1. exact title  2. exact slug  3. fuzzy title  4. fuzzy slug
		if ( result.url ) {
			const slug = extractSlug( result.url );
			if ( slug ) {
				const slugTokens = tokenize( slug );
				const exactSlugTokens = slugTokens.filter( ( slugToken ) =>
					searchTokens.some(
						( searchToken ) => slugToken === searchToken
					)
				);
				const subSlugTokens = slugTokens.filter( ( slugToken ) =>
					searchTokens.some(
						( searchToken ) =>
							slugToken !== searchToken &&
							slugToken.includes( searchToken )
					)
				);
				score +=
					( exactSlugTokens.length / slugTokens.length ) * 8 +
					( subSlugTokens.length / slugTokens.length ) * 0.5;
			}
		}

		scores[ result.id ] = score;
	}

	return results.sort( ( a, b ) => scores[ b.id ] - scores[ a.id ] );
}

export function extractSlug( url: string ): string {
	try {
		const { pathname } = new URL( url );
		const parts = pathname.replace( /\/$/, '' ).split( '/' );
		return parts[ parts.length - 1 ] || '';
	} catch {
		return '';
	}
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
