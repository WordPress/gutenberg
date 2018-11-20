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
export function replace( value, pattern, replacement ) {
	const { formats, text, start, end } = value;

	let newFormats = formats.slice();
	let newStart = start;
	let newEnd = end;

	const newText = text.replace( pattern, ( match, ...rest ) => {
		const offset = rest[ rest.length - 2 ];
		let replacementText;
		let replacementFormats;

		if ( typeof replacement === 'function' ) {
			replacement = replacement( match, ...rest );
		}

		if ( typeof replacement === 'object' ) {
			replacementText = replacement.text;
			replacementFormats = replacement.formats;
		} else {
			replacementText = replacement;
			replacementFormats = Array( replacementText.length );

			if ( newFormats[ offset ] ) {
				replacementFormats = replacementFormats.fill( newFormats[ offset ] );
			}
		}

		newFormats = newFormats.slice( 0, offset ).concat( replacementFormats, newFormats.slice( offset + match.length ) );

		if ( newStart !== undefined && newStart >= offset ) {
			if ( newStart <= offset + match.length ) {
				newStart = offset + replacementText.length;
			} else {
				newStart = newStart - match.length + replacementText.length;
			}
		}

		if ( newEnd !== undefined && newEnd >= offset ) {
			if ( newEnd <= offset + match.length ) {
				newEnd = offset + replacementText.length;
			} else {
				newEnd = newEnd - match.length + replacementText.length;
			}
		}

		return replacementText;
	} );

	// No replacement occured.
	if ( text === newText ) {
		return value;
	}

	return normaliseFormats( {
		formats: newFormats,
		text: newText,
		start: newStart,
		end: newEnd,
	} );
}
