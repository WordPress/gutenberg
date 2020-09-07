/**
 * External dependencies
 */
import {
	deburr,
	differenceWith,
	find,
	intersectionWith,
	isEmpty,
	words,
} from 'lodash';

/**
 * Sanitizes the search term string.
 *
 * @param {string} term The search term to santize.
 *
 * @return {string} The sanitized search term.
 */
function sanitizeTerm( term = '' ) {
	// Disregard diacritics.
	//  Input: "média"
	term = deburr( term );

	// Accommodate leading slash, matching autocomplete expectations.
	//  Input: "/media"
	term = term.replace( /^\//, '' );

	// Lowercase.
	//  Input: "MEDIA"
	term = term.toLowerCase();

	return term;
}

/**
 * Converts the search term into a list of normalized terms.
 *
 * @param {string} term The search term to normalize.
 *
 * @return {string[]} The normalized list of search terms.
 */
export const normalizeSearchTerm = ( term = '' ) => {
	// Extract words.
	return words( sanitizeTerm( term ) );
};

const removeMatchingTerms = ( unmatchedTerms, unprocessedTerms ) => {
	return differenceWith(
		unmatchedTerms,
		normalizeSearchTerm( unprocessedTerms ),
		( unmatchedTerm, unprocessedTerm ) =>
			unprocessedTerm.includes( unmatchedTerm )
	);
};

export const searchBlockItems = (
	items,
	categories,
	collections,
	searchTerm
) => {
	const normalizedSearchTerms = normalizeSearchTerm( searchTerm );
	if ( normalizedSearchTerms.length === 0 ) {
		return items;
	}

	const config = {
		getCategory: ( item ) =>
			find( categories, { slug: item.category } )?.title,
		getCollection: ( item ) =>
			collections[ item.name.split( '/' )[ 0 ] ]?.title,
		getVariations: ( { variations = [] } ) =>
			Array.from(
				variations.reduce(
					( accumulator, { title, keywords = [] } ) => {
						accumulator.add( title );
						keywords.forEach( ( keyword ) =>
							accumulator.add( keyword )
						);
						return accumulator;
					},
					new Set()
				)
			),
	};
	return searchItems( items, searchTerm, config ).map( ( item ) => {
		if ( isEmpty( item.variations ) ) {
			return item;
		}

		const matchedVariations = item.variations.filter(
			( { title, keywords = [] } ) => {
				return (
					intersectionWith(
						normalizedSearchTerms,
						normalizeSearchTerm( title ).concat( keywords ),
						( termToMatch, labelTerm ) =>
							labelTerm.includes( termToMatch )
					).length > 0
				);
			}
		);
		// When no variations matched, fallback to all variations.
		if ( isEmpty( matchedVariations ) ) {
			return item;
		}

		return {
			...item,
			variations: matchedVariations,
		};
	} );
};

/**
 * Filters an item list given a search term.
 *
 * @param {Array} items       Item list
 * @param {string} searchTerm Search term.
 * @param {Object} config     Search Config.
 * @return {Array}            Filtered item list.
 */
export const searchItems = ( items = [], searchTerm = '', config = {} ) => {
	const normalizedSearchTerms = normalizeSearchTerm( searchTerm );
	if ( normalizedSearchTerms.length === 0 ) {
		return items;
	}

	const rankedItems = items
		.map( ( item ) => {
			return [ item, getItemSearchRank( item, searchTerm, config ) ];
		} )
		.filter( ( [ , rank ] ) => rank > 0 );

	rankedItems.sort( ( [ , rank1 ], [ , rank2 ] ) => rank2 - rank1 );
	return rankedItems.map( ( [ item ] ) => item );
};

/**
 * Get the search rank for a given iotem and a specific search term.
 * The higher is higher for items with the best match.
 * If the rank equals 0, it should be excluded from the results.
 *
 * @param {Object} item       Item to filter.
 * @param {string} searchTerm Search term.
 * @param {Object} config     Search Config.
 * @return {number}           Search Rank.
 */
export function getItemSearchRank( item, searchTerm, config = {} ) {
	const defaultGetName = ( it ) => it.name || '';
	const defaultGetTitle = ( it ) => it.title;
	const defaultGetKeywords = ( it ) => it.keywords || [];
	const defaultGetCategory = ( it ) => it.category;
	const defaultGetCollection = () => null;
	const defaultGetVariations = () => [];

	const {
		getName = defaultGetName,
		getTitle = defaultGetTitle,
		getKeywords = defaultGetKeywords,
		getCategory = defaultGetCategory,
		getCollection = defaultGetCollection,
		getVariations = defaultGetVariations,
	} = config;

	const name = getName( item );
	const title = getTitle( item );
	const keywords = getKeywords( item );
	const category = getCategory( item );
	const collection = getCollection( item );
	const variations = getVariations( item );

	const sanitizedSearchTerm = sanitizeTerm( searchTerm );
	const sanitizedTitle = sanitizeTerm( title );

	let rank = 0;

	// Prefers exact matchs
	// Then prefers if the beginning of the title matches the search term
	// Keywords, categories, collection, variations match come later.
	if ( sanitizedSearchTerm === sanitizedTitle ) {
		rank += 30;
	} else if ( sanitizedTitle.indexOf( sanitizedSearchTerm ) === 0 ) {
		rank += 20;
	} else {
		const terms = [
			title,
			...keywords,
			category,
			collection,
			...variations,
		].join( ' ' );
		const normalizedSearchTerms = words( sanitizedSearchTerm );
		const unmatchedTerms = removeMatchingTerms(
			normalizedSearchTerms,
			terms
		);

		if ( unmatchedTerms.length === 0 ) {
			rank += 10;
		}
	}

	// Give a better rank to "core" namespaced items.
	if ( rank !== 0 && name.indexOf( 'core/' ) === 0 ) {
		rank++;
	}

	return rank;
}
