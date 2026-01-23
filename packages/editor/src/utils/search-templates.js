/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * Sanitizes the search input string.
 *
 * @param {string} input The search input to normalize.
 *
 * @return {string} The normalized search input.
 */
function normalizeSearchInput( input = '' ) {
	// Disregard diacritics.
	input = removeAccents( input );

	// Trim & Lowercase.
	input = input.trim().toLowerCase();

	return input;
}

/**
 * Get the search rank for a given template and a specific search term.
 *
 * @param {Object} template    Template to rank
 * @param {string} searchValue Search term
 *
 * @return {number} A template search rank
 */
function getTemplateSearchRank( template, searchValue ) {
	const normalizedSearchValue = normalizeSearchInput( searchValue );
	const normalizedTitle = normalizeSearchInput( template.title );

	let rank = 0;

	if ( normalizedSearchValue === normalizedTitle ) {
		rank += 30;
	} else if ( normalizedTitle.startsWith( normalizedSearchValue ) ) {
		rank += 20;
	} else {
		const searchTerms = normalizedSearchValue.split( ' ' );
		const hasMatchedTerms = searchTerms.every( ( searchTerm ) =>
			normalizedTitle.includes( searchTerm )
		);

		// Prefer template with every search word in the title.
		if ( hasMatchedTerms ) {
			rank += 10;
		}
	}

	return rank;
}

/**
 * Filters a template list given a search term.
 *
 * @param {Array}  templates   Item list
 * @param {string} searchValue Search input.
 *
 * @return {Array} Filtered template list.
 */
export function searchTemplates( templates = [], searchValue = '' ) {
	if ( ! searchValue ) {
		return templates;
	}

	const rankedTemplates = templates
		.map( ( template ) => {
			return [ template, getTemplateSearchRank( template, searchValue ) ];
		} )
		.filter( ( [ , rank ] ) => rank > 0 );

	rankedTemplates.sort( ( [ , rank1 ], [ , rank2 ] ) => rank2 - rank1 );
	return rankedTemplates.map( ( [ template ] ) => template );
}
