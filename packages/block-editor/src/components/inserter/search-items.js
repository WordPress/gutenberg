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
 * Converts the search term into a list of normalized terms.
 *
 * @param {string} term The search term to normalize.
 *
 * @return {string[]} The normalized list of search terms.
 */
export const normalizeSearchTerm = ( term = '' ) => {
	// Disregard diacritics.
	//  Input: "média"
	term = deburr( term );

	// Accommodate leading slash, matching autocomplete expectations.
	//  Input: "/media"
	term = term.replace( /^\//, '' );

	// Lowercase.
	//  Input: "MEDIA"
	term = term.toLowerCase();

	// Extract words.
	return words( term );
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

	return searchItems( items, searchTerm, {
		getCategory: ( item ) =>
			find( categories, { slug: item.category } )?.title,
		getCollection: ( item ) =>
			collections[ item.name.split( '/' )[ 0 ] ]?.title,
		getVariations: ( item ) =>
			( item.variations || [] ).map( ( variation ) => variation.title ),
	} ).map( ( item ) => {
		if ( isEmpty( item.variations ) ) {
			return item;
		}

		const matchedVariations = item.variations.filter( ( variation ) => {
			return (
				intersectionWith(
					normalizedSearchTerms,
					normalizeSearchTerm( variation.title ),
					( termToMatch, labelTerm ) =>
						labelTerm.includes( termToMatch )
				).length > 0
			);
		} );
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
export const searchItems = ( items, searchTerm, config = {} ) => {
	const normalizedSearchTerms = normalizeSearchTerm( searchTerm );
	if ( normalizedSearchTerms.length === 0 ) {
		return items;
	}

	const defaultGetTitle = ( item ) => item.title;
	const defaultGetKeywords = ( item ) => item.keywords || [];
	const defaultGetCategory = ( item ) => item.category;
	const defaultGetCollection = () => null;
	const defaultGetVariations = () => [];
	const {
		getTitle = defaultGetTitle,
		getKeywords = defaultGetKeywords,
		getCategory = defaultGetCategory,
		getCollection = defaultGetCollection,
		getVariations = defaultGetVariations,
	} = config;

	return items.filter( ( item ) => {
		const title = getTitle( item );
		const keywords = getKeywords( item );
		const category = getCategory( item );
		const collection = getCollection( item );
		const variations = getVariations( item );

		const terms = [
			title,
			...keywords,
			category,
			collection,
			...variations,
		].join( ' ' );

		const unmatchedTerms = removeMatchingTerms(
			normalizedSearchTerms,
			terms
		);

		return unmatchedTerms.length === 0;
	} );
};
