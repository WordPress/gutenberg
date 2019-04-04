/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Returns the nesting level of the list at the selection start position.
 *
 * @param {Object} value     The rich-text value
 *
 * @return {Object} Object with { nestingLevel, listFormat }.
 */
export function getStartListFormat( value ) {
	const { text, replacements, start, end } = value;
	const startingLineIndex = getLineIndex( value, start );
	const startLineFormats = replacements[ startingLineIndex ] || [];
	const [ listFormat ] = startLineFormats.slice( -1 );
	return { nestingLevel: startLineFormats.length, ...listFormat };
}
