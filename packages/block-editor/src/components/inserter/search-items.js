/**
 * External dependencies
 */
import removeAccents from 'remove-accents';
import { noCase } from 'change-case';

// Default search helpers.
const defaultGetName = ( item ) => item.name || '';
const defaultGetTitle = ( item ) => item.title;
const defaultGetDescription = ( item ) => item.description || '';
const defaultGetKeywords = ( item ) => item.keywords || [];
const defaultGetCategory = ( item ) => item.category;
const defaultGetCollection = () => null;

/**
 * Extracts words from an input string.
 *
 * @param {string} input The input string.
 *
 * @return {Array} Words, extracted from the input string.
 */
function extractWords( input = '' ) {
	return noCase( input, {
		splitRegexp: [
			/([\p{Ll}\p{Lo}\p{N}])([\p{Lu}\p{Lt}])/gu, // One lowercase or digit, followed by one uppercase.
			/([\p{Lu}\p{Lt}])([\p{Lu}\p{Lt}][\p{Ll}\p{Lo}])/gu, // One uppercase followed by one uppercase and one lowercase.
		],
		stripRegexp: /(\p{C}|\p{P}|\p{S})+/giu, // Anything that's not a punctuation, symbol or control/format character.
	} )
		.split( ' ' )
		.filter( Boolean );
}

/**
 * Sanitizes the search input string.
 *
 * @param {string} input The search input to normalize.
 *
 * @return {string} The normalized search input.
 */
function normalizeSearchInput( input = '' ) {
	// Disregard diacritics.
	//  Input: "média"
	input = removeAccents( input );

	// Accommodate leading slash, matching autocomplete expectations.
	//  Input: "/media"
	input = input.replace( /^\//, '' );

	// Lowercase.
	//  Input: "MEDIA"
	input = input.toLowerCase();

	return input;
}

/**
 * Converts the search term into a list of normalized terms.
 *
 * @param {string} input The search term to normalize.
 *
 * @return {string[]} The normalized list of search terms.
 */
export const getNormalizedSearchTerms = ( input = '' ) => {
	return extractWords( normalizeSearchInput( input ) );
};

const removeMatchingTerms = ( unmatchedTerms, unprocessedTerms ) => {
	return unmatchedTerms.filter(
		( term ) =>
			! getNormalizedSearchTerms( unprocessedTerms ).some(
				( unprocessedTerm ) => unprocessedTerm.includes( term )
			)
	);
};

export const searchBlockItems = (
	items,
	categories,
	collections,
	searchInput
) => {
	const normalizedSearchTerms = getNormalizedSearchTerms( searchInput );
	if ( normalizedSearchTerms.length === 0 ) {
		return items;
	}

	const config = {
		getCategory: ( item ) =>
			categories.find( ( { slug } ) => slug === item.category )?.title,
		getCollection: ( item ) =>
			collections[ item.name.split( '/' )[ 0 ] ]?.title,
	};

	return searchItems( items, searchInput, config );
};

/**
 * Filters an item list given a search term.
 *
 * @param {Array}  items       Item list
 * @param {string} searchInput Search input.
 * @param {Object} config      Search Config.
 *
 * @return {Array} Filtered item list.
 */
export const searchItems = ( items = [], searchInput = '', config = {} ) => {
	const normalizedSearchTerms = getNormalizedSearchTerms( searchInput );
	if ( normalizedSearchTerms.length === 0 ) {
		return items;
	}

	const rankedItems = items
		.map( ( item ) => {
			return [ item, getItemSearchRank( item, searchInput, config ) ];
		} )
		.filter( ( [ , rank ] ) => rank > 0 );

	rankedItems.sort( ( [ , rank1 ], [ , rank2 ] ) => rank2 - rank1 );
	return rankedItems.map( ( [ item ] ) => item );
};

/**
 * Get the search rank for a given item and a specific search term.
 * The better the match, the higher the rank.
 * If the rank equals 0, it should be excluded from the results.
 *
 * @param {Object} item       Item to filter.
 * @param {string} searchTerm Search term.
 * @param {Object} config     Search Config.
 *
 * @return {number} Search Rank.
 */
export function getItemSearchRank( item, searchTerm, config = {} ) {
	const {
		getName = defaultGetName,
		getTitle = defaultGetTitle,
		getDescription = defaultGetDescription,
		getKeywords = defaultGetKeywords,
		getCategory = defaultGetCategory,
		getCollection = defaultGetCollection,
	} = config;

	const name = getName( item );
	const title = getTitle( item );
	const description = getDescription( item );
	const keywords = getKeywords( item );
	const category = getCategory( item );
	const collection = getCollection( item );

	const normalizedSearchInput = normalizeSearchInput( searchTerm );
	const normalizedTitle = normalizeSearchInput( title );

	let rank = 0;

	// Prefers exact matches
	// Then prefers if the beginning of the title matches the search term
	// name, keywords, categories, collection, variations match come later.
	if ( normalizedSearchInput === normalizedTitle ) {
		rank += 30;
	} else if ( normalizedTitle.startsWith( normalizedSearchInput ) ) {
		rank += 20;
	} else {
		const terms = [
			name,
			title,
			description,
			...keywords,
			category,
			collection,
		].join( ' ' );
		const normalizedSearchTerms = extractWords( normalizedSearchInput );
		const unmatchedTerms = removeMatchingTerms(
			normalizedSearchTerms,
			terms
		);

		if ( unmatchedTerms.length === 0 ) {
			rank += 10;
		}
	}

	// Give a better rank to "core" namespaced items.
	if ( rank !== 0 && name.startsWith( 'core/' ) ) {
		const isCoreBlockVariation = name !== item.id;
		// Give a bit better rank to "core" blocks over "core" block variations.
		rank += isCoreBlockVariation ? 1 : 2;
	}

	return rank;
}
