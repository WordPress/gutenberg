/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { extractWords, getNormalizedSearchTerms, normalizeString } = unlock(
	blockEditorPrivateApis
);

/**
 * Internal dependencies
 */
import {
	TEMPLATE_PART_ALL_AREAS_CATEGORY,
	PATTERN_DEFAULT_CATEGORY,
	PATTERN_USER_CATEGORY,
	PATTERN_TYPES,
} from '../../utils/constants';

// Default search helpers.
const defaultGetName = ( item ) => item.name || '';
const defaultGetTitle = ( item ) => item.title;
const defaultGetDescription = ( item ) => item.description || '';
const defaultGetKeywords = ( item ) => item.keywords || [];
const defaultHasCategory = () => false;

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

	// Filter patterns by category: the default category indicates that all patterns will be shown.
	const onlyFilterByCategory =
		config.categoryId !== PATTERN_DEFAULT_CATEGORY &&
		! normalizedSearchTerms.length;
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

	let rank =
		categoryId === PATTERN_DEFAULT_CATEGORY ||
		categoryId === TEMPLATE_PART_ALL_AREAS_CATEGORY ||
		( categoryId === PATTERN_USER_CATEGORY &&
			item.type === PATTERN_TYPES.user ) ||
		hasCategory( item, categoryId )
			? 1
			: 0;

	// If an item doesn't belong to the current category or we don't have
	// search terms to filter by, return the initial rank value.
	if ( ! rank || onlyFilterByCategory ) {
		return rank;
	}

	const name = getName( item );
	const title = getTitle( item );
	const description = getDescription( item );
	const keywords = getKeywords( item );

	const normalizedSearchInput = normalizeString( searchTerm );
	const normalizedTitle = normalizeString( title );

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
