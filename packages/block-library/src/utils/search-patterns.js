import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';

const { normalizeString, searchItems } = unlock( blockEditorPrivateApis );

/**
 * Sanitizes the search input string.
 *
 * @param {string} input The search input to normalize.
 *
 * @return {string} The normalized search input.
 */
export function normalizeSearchInput( input = '' ) {
	return normalizeString( input ).trim();
}

/**
 * Filters a pattern list given a search term.
 *
 * @param {Array}  patterns    Item list
 * @param {string} searchValue Search input.
 *
 * @return {Array} Filtered pattern list.
 */
export function searchPatterns( patterns = [], searchValue = '' ) {
	return searchItems( patterns, searchValue, {
		fields: [ { get: ( pattern ) => pattern.title } ],
	} );
}
