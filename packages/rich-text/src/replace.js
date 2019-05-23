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
export function replace( { formats, replacements, text, start, end }, pattern, replacement ) {
	text = text.replace( pattern, ( match, ...rest ) => {
		const offset = rest[ rest.length - 2 ];
		let newText = replacement;
		let newFormats;
		let newReplacements;

		if ( typeof newText === 'function' ) {
			newText = replacement( match, ...rest );
		}

		if ( typeof newText === 'object' ) {
			newFormats = newText.formats;
			newReplacements = newText.replacements;
			newText = newText.text;
		} else {
			newFormats = Array( newText.length );
			newReplacements = Array( newText.length );

			if ( formats[ offset ] ) {
				newFormats = newFormats.fill( formats[ offset ] );
			}
		}

		formats = formats.slice( 0, offset ).concat( newFormats, formats.slice( offset + match.length ) );
		replacements = replacements.slice( 0, offset ).concat( newReplacements, replacements.slice( offset + match.length ) );

		if ( start ) {
			start = end = offset + newText.length;
		}

		return newText;
	} );

	return normaliseFormats( { formats, replacements, text, start, end } );
}
