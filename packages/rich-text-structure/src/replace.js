/**
 * Replaces text in the given record with the given replacement text or record.
 *
 * Works like `String.prototype.replace()`.
 *
 * @param {Object}         record       The record to modify.
 * @param {RegExp|string}  pattern      A RegExp object or literal. Can also be
 *                                      a string. It is treated as a verbatim
 *                                      string and is not interpreted as a
 *                                      regular expression. Only the first
 *                                      occurrence will be replaced.
 * @param {Function|string} replacement The match or matches are replaced with
 *                                      the specified or the value returned by
 *                                      the specified function.
 *
 * @return {Object} A new record with replacements applied.
 */
export function replace( { formats, text }, pattern, replacement ) {
	text = text.replace( pattern, ( match, ...rest ) => {
		const offset = rest[ rest.length - 2 ];
		let newText = replacement;
		let newFormats;

		if ( typeof newText === 'function' ) {
			newText = replacement( match, ...rest );
		}

		if ( typeof newText === 'object' ) {
			newFormats = newText.formats;
			newText = newText.text;
		} else {
			newFormats = Array( newText.length );

			if ( formats[ offset ] ) {
				newFormats = newFormats.fill( formats[ offset ] );
			}
		}

		formats = formats.slice( 0, offset ).concat( newFormats, formats.slice( offset + match.length ) );

		return newText;
	} );

	return { formats, text };
}
