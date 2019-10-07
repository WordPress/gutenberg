/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Outdents any selected list items if possible.
 *
 * @param {Object} value Value to change.
 *
 * @return {Object} The changed value.
 */
export function canOutdentListItems( value ) {
	const { replacements, start } = value;
	const startingLineIndex = getLineIndex( value, start );
	return replacements[ startingLineIndex ] !== undefined;
}
