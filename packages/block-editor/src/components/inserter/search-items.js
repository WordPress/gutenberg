/**
 * External dependencies
 */
import {
	find,
	some,
	deburr,
} from 'lodash';

/**
 * Converts the search term into a normalized term.
 *
 * @param {string} term The search term to normalize.
 *
 * @return {string} The normalized search term.
 */
export const normalizeTerm = ( term ) => {
	// Disregard diacritics.
	//  Input: "média"
	term = deburr( term );

	// Accommodate leading slash, matching autocomplete expectations.
	//  Input: "/media"
	term = term.replace( /^\//, '' );

	// Lowercase.
	//  Input: "MEDIA"
	term = term.toLowerCase();

	// Strip leading and trailing whitespace.
	//  Input: " media "
	term = term.trim();

	return term;
};

/**
 * Filters an item list given a search term.
 *
 * @param {Array} items        Item list
 * @param {string} categories  Available categories.
 * @param {string} searchTerm  Search term.
 *
 * @return {Array}             Filtered item list.
 */
export const searchItems = ( items, categories, searchTerm ) => {
	const normalizedSearchTerm = normalizeTerm( searchTerm );
	const matchSearch = ( string ) => normalizeTerm( string ).indexOf( normalizedSearchTerm ) !== -1;

	return items.filter( ( item ) => {
		const itemCategory = find( categories, { slug: item.category } );
		return matchSearch( item.title ) || some( item.keywords, matchSearch ) ||
			( itemCategory && matchSearch( itemCategory.title ) );
	} );
};
