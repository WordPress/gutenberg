/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

type SearchOptions = {
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

type EditorSettings = {
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

type SearchResult = {
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
	if (
		searchOptions.isInitialSuggestions &&
		searchOptions.initialSuggestionsSearchOptions
	) {
		searchOptions = {
			...searchOptions,
			...searchOptions.initialSuggestionsSearchOptions,
		};
	}

	const {
		type,
		subtype,
		page,
		perPage = searchOptions.isInitialSuggestions ? 3 : 20,
	} = searchOptions;

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
 * We use cosine similarity to determine relevance. This is a common technique used in information
 * retrieval to determine how similar two documents are. In this case, we're treating the search
 * query as a document and the title of the search result as another document.
 *
 * @param results
 * @param search
 */
export function sortResults( results: SearchResult[], search: string ) {
	const searchTerms = tokenize( search );
	const searchTermFrequencies = getTermFrequencies( searchTerms );

	const scores = {};
	for ( const result of results ) {
		const titleTerms = tokenize( result.title );
		const titleTermFrequencies = getTermFrequencies( titleTerms );
		scores[ result.id ] = getCosineSimilarity(
			searchTermFrequencies,
			titleTermFrequencies
		);
	}

	return results.sort( ( a, b ) => scores[ b.id ] - scores[ a.id ] );
}

/**
 * Turns text into an array of tokens.
 *
 * For example, `"I'm having a ball"` becomes `[ "im", "having", "a", "ball" ]`.
 *
 * @param text
 */
function tokenize( text: string ) {
	return text
		.toLowerCase()
		.split( /\s+/ )
		.map( ( word ) => word.replace( /\W/g, '' ) )
		.filter( ( word ) => !! word );
}

/**
 * Returns a map of term frequencies.
 *
 * For example "the cat in the hat" becomes `{ the: 2, cat: 1, in: 1, hat: 1 }`.
 *
 * The map can be interpreted as a vector in a multi-dimensional space, where
 * each dimension corresponds to a unique word, and the value of the dimension
 * is the frequency of that word.
 *
 * @param terms
 */
function getTermFrequencies( terms: string[] ) {
	const frequencies = {};
	for ( const term of terms ) {
		frequencies[ term ] = ( frequencies[ term ] ?? 0 ) + 1;
	}
	return frequencies;
}

/**
 * Returns the cosine similarity between two vectors.
 *
 * Cosine similarity measures the cosine of the angle between two vectors, which gives an
 * indication of how similar the two vectors are.
 *
 * See https://en.wikipedia.org/wiki/Cosine_similarity for the mathematical definition.
 *
 * Cosine similarity ranges from -1 to 1:
 *
 * - A cosine similarity of 1 indicates that the two vectors are identical.
 * - A cosine similarity of 0 indicates that the two vectors are orthogonal (no similarity).
 * - A cosine similarity of -1 indicates that the two vectors are diametrically opposed.
 *
 * In the context of text similarity, a higher cosine similarity indicates that the documents share
 * more common terms and are therefore more similar in content.
 *
 * @param vector1
 * @param vector2
 */
function getCosineSimilarity(
	vector1: Record< string, number >,
	vector2: Record< string, number >
) {
	const dotProduct = Object.keys( vector1 ).reduce( ( sum, term ) => {
		return sum + vector1[ term ] * ( vector2[ term ] ?? 0 );
	}, 0 );
	const magnitute1 = Math.sqrt(
		Object.values( vector1 ).reduce( ( sum, value ) => {
			return sum + value ** 2;
		}, 0 )
	);
	const magnitute2 = Math.sqrt(
		Object.values( vector2 ).reduce( ( sum, value ) => {
			return sum + value ** 2;
		}, 0 )
	);
	return dotProduct / ( magnitute1 * magnitute2 );
}
