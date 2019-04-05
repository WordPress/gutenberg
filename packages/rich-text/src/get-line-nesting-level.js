/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Returns the nesting level of the list at the selection start position.
 *
 * @param {Object} value     The rich-text value
 *
 * @return {number} The list nesting level, starting from 0.
 */
export function getLineNestingLevel( value ) {
	const { replacements, start } = value;
	const startingLineIndex = getLineIndex( value, start );
	const startLineFormats = replacements[ startingLineIndex ] || [];
	return startLineFormats.length;
}
