/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Returns the list format of the line at the selection start position.
 *
 * @param {Object} value     The rich-text value
 *
 * @return {Array} Array of the list formats on the selected line.
 */
export function getLineListFormats( value ) {
	const { replacements, start } = value;
	const startingLineIndex = getLineIndex( value, start );
	const startLineFormats = replacements[ startingLineIndex ] || [];
	return startLineFormats;
}
