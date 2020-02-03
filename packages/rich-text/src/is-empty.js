/**
 * Internal dependencies
 */
import { LINE_SEPARATOR } from './special-characters';

/**
 * Check if a Rich Text value is Empty, meaning it contains no text or any
 * objects (such as images).
 *
 * @param {Object} value Value to use.
 *
 * @return {boolean} True if the value is empty, false if not.
 */
export function isEmpty( { text } ) {
	return text.length === 0;
}

/**
 * Check if the current collapsed selection is on an empty line in case of a
 * multiline value.
 *
 * @param  {Object} value Value te check.
 *
 * @return {boolean} True if the line is empty, false if not.
 */
export function isEmptyLine( { text, start, end } ) {
	if ( start !== end ) {
		return false;
	}

	if ( text.length === 0 ) {
		return true;
	}

	if ( start === 0 && text.slice( 0, 1 ) === LINE_SEPARATOR ) {
		return true;
	}

	if ( start === text.length && text.slice( -1 ) === LINE_SEPARATOR ) {
		return true;
	}

	return (
		text.slice( start - 1, end + 1 ) ===
		`${ LINE_SEPARATOR }${ LINE_SEPARATOR }`
	);
}
