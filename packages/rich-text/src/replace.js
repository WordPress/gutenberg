/**
 * Internal dependencies
 */

import { insert } from './insert';
import { create } from './create';
import {
	defineFormatsAccessor,
	getFormatsAtSelection,
	mapFromFormats,
} from './format-ranges';

/** @typedef {import('./types').RichTextValue} RichTextValue */

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
	if ( ! newValue._formats ) {
		newValue = defineFormatsAccessor( {
			...newValue,
			_formats: mapFromFormats( newValue.formats ),
		} );
	}

	newValue.text.replace( pattern, ( match, ...rest ) => {
		const offset = rest[ rest.length - 2 ];
		let valueToInsert = replacement;

		if ( typeof valueToInsert === 'function' ) {
			valueToInsert = replacement( match, ...rest );
		}

		if ( typeof valueToInsert === 'string' ) {
			const inheritedFormats = getFormatsAtSelection(
				newValue._formats,
				offset
			);
			valueToInsert = create( { text: valueToInsert } );
			if ( inheritedFormats.length > 0 ) {
				for ( const format of inheritedFormats ) {
					valueToInsert._formats.set( format, [
						0,
						valueToInsert.text.length,
					] );
				}
			}
		}

		newValue = insert(
			newValue,
			valueToInsert,
			offset,
			offset + match.length
		);
		return match;
	} );

	return newValue;
}
