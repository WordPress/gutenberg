/**
 * Internal dependencies
 */

import { replace } from './replace';

/**
 * Split a Rich Text value in two at the given `startIndex` and `endIndex`, or
 * split at the given separator. This is similar to `String.prototype.split`.
 * Indices are retrieved from the selection if none are provided.
 *
 * @param {Object}        value   Value to modify.
 * @param {number|string} string  Start index, or string at which to split.
 * @param {number}        end     End index.
 *
 * @return {Array} An array of new values.
 */
export function split( { _formats, _text, _start, _end }, string ) {
	if ( typeof string !== 'string' ) {
		return splitAtSelection( ...arguments );
	}

	let nextStart = 0;

	return _text.split( string ).map( ( substring ) => {
		const startIndex = nextStart;
		const value = {
			_formats: _formats.slice( startIndex, startIndex + substring.length ),
			_text: substring,
		};

		nextStart += string.length + substring.length;

		if ( _start !== undefined && _end !== undefined ) {
			if ( _start > startIndex && _start < nextStart ) {
				value._start = _start - startIndex;
			} else if ( _start < startIndex && _end > startIndex ) {
				value._start = 0;
			}

			if ( _end > startIndex && _end < nextStart ) {
				value._end = _end - startIndex;
			} else if ( _start < nextStart && _end > nextStart ) {
				value._end = substring.length;
			}
		}

		return value;
	} );
}

function splitAtSelection(
	{ _formats, _text, _start, _end },
	startIndex = _start,
	endIndex = _end
) {
	const before = {
		_formats: _formats.slice( 0, startIndex ),
		_text: _text.slice( 0, startIndex ),
	};
	const after = {
		_formats: _formats.slice( endIndex ),
		_text: _text.slice( endIndex ),
		_start: 0,
		_end: 0,
	};

	return [
		// Ensure newlines are trimmed.
		replace( before, /\u2028+$/, '' ),
		replace( after, /^\u2028+/, '' ),
	];
}
