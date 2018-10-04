/**
 * Check if a Rich Text value is Empty, meaning it contains no text or any
 * objects (such as images).
 *
 * @param {Object} value Value to use.
 *
 * @return {boolean} True if the value is empty, false if not.
 */
export function isEmpty( { _text } ) {
	return _text.length === 0;
}

/**
 * Check if the current collapsed selection is on an empty line in case of a
 * multiline value.
 *
 * @param  {Object} value Value te check.
 *
 * @return {boolean} True if the line is empty, false if not.
 */
export function isEmptyLine( { _text, _start, _end } ) {
	if ( _start !== _end ) {
		return false;
	}

	if ( _text.length === 0 ) {
		return true;
	}

	if ( _start === 0 && _text.slice( 0, 1 ) === '\u2028' ) {
		return true;
	}

	if ( _start === _text.length && _text.slice( -1 ) === '\u2028' ) {
		return true;
	}

	return _text.slice( _start - 1, _end + 1 ) === '\u2028\u2028';
}
