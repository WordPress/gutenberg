/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Checks if the selected list item can be outdented.
 *
 * @param {Object} value Value to check.
 *
 * @return {boolean} Whether or not the selected list item can be outdented.
 */
export function canOutdentListItems( value ) {
	const { replacements, start } = value;
	const startingLineIndex = getLineIndex( value, start );
	return replacements[ startingLineIndex ] !== undefined;
}
