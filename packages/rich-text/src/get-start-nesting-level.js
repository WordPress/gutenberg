/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Returns the nesting level of the list at the selection start position.
 *
 * @param {Object} value     The rich-text value
 *
 * @return {number} The nesting level, starting from 0.
 */
export function getStartNestingLevel( value ) {
	const { text, replacements, start, end } = value;
	const startingLineIndex = getLineIndex( value, start );
	const startLineFormats = replacements[ startingLineIndex ] || [];
	return startLineFormats.length;
}
