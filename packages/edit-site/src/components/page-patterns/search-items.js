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
const defaultHasCategory = () => false;

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
	const onlyFilterByCategory = ! normalizedSearchTerms.length;
	const searchRankConfig = { ...config, onlyFilterByCategory };

	// If we aren't filtering on search terms, matching on category is satisfactory.
	// If we are, then we need more than a category match.
	const threshold = onlyFilterByCategory ? 0 : 1;

	const rankedItems = items
		.map( ( item ) => {
			return [
				item,
				getItemSearchRank( item, searchInput, searchRankConfig ),
			];
		} )
		.filter( ( [ , rank ] ) => rank > threshold );

	// If we didn't have terms to search on, there's no point sorting.
	if ( normalizedSearchTerms.length === 0 ) {
		return rankedItems.map( ( [ item ] ) => item );
	}

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
function getItemSearchRank( item, searchTerm, config ) {
	const {
		categoryId,
		getName = defaultGetName,
		getTitle = defaultGetTitle,
		getDescription = defaultGetDescription,
		getKeywords = defaultGetKeywords,
		hasCategory = defaultHasCategory,
		onlyFilterByCategory,
	} = config;

	let rank = hasCategory( item, categoryId ) ? 1 : 0;

	// If an item doesn't belong to the current category or we don't have
	// search terms to filter by, return the initial rank value.
	if ( ! rank || onlyFilterByCategory ) {
		return rank;
	}

	const name = getName( item );
	const title = getTitle( item );
	const description = getDescription( item );
	const keywords = getKeywords( item );

	const normalizedSearchInput = normalizeSearchInput( searchTerm );
	const normalizedTitle = normalizeSearchInput( title );

	// Prefers exact matches
	// Then prefers if the beginning of the title matches the search term
	// name, keywords, description matches come later.
	if ( normalizedSearchInput === normalizedTitle ) {
		rank += 30;
	} else if ( normalizedTitle.startsWith( normalizedSearchInput ) ) {
		rank += 20;
	} else {
		const terms = [ name, title, description, ...keywords ].join( ' ' );
		const normalizedSearchTerms = extractWords( normalizedSearchInput );
		const unmatchedTerms = removeMatchingTerms(
			normalizedSearchTerms,
			terms
		);

		if ( unmatchedTerms.length === 0 ) {
			rank += 10;
		}
	}

	return rank;
}
