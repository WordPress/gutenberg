/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';

/**
 * Search a Rich Text value and replace the match(es) with `replacement`. This
 * is similar to `String.prototype.replace`.
 *
 * @param {Object}         value        The value to modify.
 * @param {RegExp|string}  pattern      A RegExp object or literal. Can also be
 *                                      a string. It is treated as a verbatim
 *                                      string and is not interpreted as a
 *                                      regular expression. Only the first
 *                                      occurrence will be replaced.
 * @param {Function|string} replacement The match or matches are replaced with
 *                                      the specified or the value returned by
 *                                      the specified function.
 *
 * @return {Object} A new value with replacements applied.
 */
export function replace( { _formats, _text, _start, _end }, pattern, replacement ) {
	_text = _text.replace( pattern, ( match, ...rest ) => {
		const offset = rest[ rest.length - 2 ];
		let newText = replacement;
		let newFormats;

		if ( typeof newText === 'function' ) {
			newText = replacement( match, ...rest );
		}

		if ( typeof newText === 'object' ) {
			newFormats = newText._formats;
			newText = newText._text;
		} else {
			newFormats = Array( newText.length );

			if ( _formats[ offset ] ) {
				newFormats = newFormats.fill( _formats[ offset ] );
			}
		}

		_formats = _formats.slice( 0, offset ).concat( newFormats, _formats.slice( offset + match.length ) );

		if ( _start ) {
			_start = _end = offset + newText.length;
		}

		return newText;
	} );

	return normaliseFormats( { _formats, _text, _start, _end } );
}
