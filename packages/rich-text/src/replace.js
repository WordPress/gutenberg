/**
 * Internal dependencies
 */

import { insert } from './insert';

/** @typedef {import('./types').RichTextValue} RichTextValue */

function getFormatsAtIndex( value, index ) {
	const { _formats } = value;
	const formatsAtIndex = new Set();

	for ( const [ format, [ start, end ] ] of _formats ) {
		if ( start <= index && end > index ) {
			formatsAtIndex.add( format );
		}
	}

	return formatsAtIndex;
}

/**
 * Search a Rich Text value and replace the match(es) with `replacement`. This
 * is similar to `String.prototype.replace`.
 *
 * @param {RichTextValue}   value       The value to modify.
 * @param {RegExp|string}   pattern     A RegExp object or literal. Can also be
 *                                      a string. It is treated as a verbatim
 *                                      string and is not interpreted as a
 *                                      regular expression. Only the first
 *                                      occurrence will be replaced.
 * @param {Function|string} replacement The match or matches are replaced with
 *                                      the specified or the value returned by
 *                                      the specified function.
 *
 * @return {RichTextValue} A new value with replacements applied.
 */
export function replace( value, pattern, replacement ) {
	let newValue = value;
	value.text.replace( pattern, ( match, ...rest ) => {
		const offset = rest[ rest.length - 2 ];
		let valueToInsert = replacement;

		if ( typeof replacement === 'function' ) {
			valueToInsert = replacement( match, ...rest );
		} else if ( typeof replacement === 'string' ) {
			valueToInsert = {
				text: replacement,
				formats: Array( replacement.length ).fill(
					value.formats[ offset ]
				),
				_formats: new Map(
					Array.from( getFormatsAtIndex( value, offset ) ).map(
						( format ) => [ format, [ 0, replacement.length ] ]
					)
				),
				replacements: Array( replacement.length ),
			};
		}

		newValue = insert(
			newValue,
			valueToInsert,
			offset,
			offset + match.length
		);
	} );

	return newValue;
}
