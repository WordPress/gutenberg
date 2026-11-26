import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { unlock } from '../lock-unlock';

const { normalizeString, searchItems } = unlock( blockEditorPrivateApis );

/**
 * Sanitizes the search input string.
 *
 * @param input The search input to normalize.
 *
 * @return The normalized search input.
 */
export function normalizeSearchInput( input = '' ): string {
	return normalizeString( input ).trim();
}

/**
 * Filters a pattern list given a search term.
 *
 * @param patterns    Item list
 * @param searchValue Search input.
 *
 * @return Filtered pattern list.
 */
export function searchPatterns< T extends object >(
	patterns: T[] = [],
	searchValue = ''
): T[] {
	return searchItems( patterns, searchValue, {
		fields: [ { get: ( pattern: { title?: string } ) => pattern.title } ],
	} );
}
