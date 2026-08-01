/**
 * Internal dependencies
 */

import { create } from './create';
import { normaliseFormats } from './normalise-formats';
import {
	defineFormatsAccessor,
	mapFromFormats,
	mergeFormatsInto,
} from './format-ranges';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Combine an array of Rich Text values into one, optionally separated by
 * `separator`, which can be a Rich Text value, HTML string, or plain text
 * string. This is similar to `Array.prototype.join`.
 *
 * @param {Array<RichTextValue>} values      An array of values to join.
 * @param {string|RichTextValue} [separator] Separator string or value.
 *
 * @return {RichTextValue} A new combined value.
 */
export function join( values, separator = '' ) {
	if ( typeof separator === 'string' ) {
		separator = create( { text: separator } );
	}

	if ( ! separator._formats ) {
		separator = defineFormatsAccessor( {
			...separator,
			_formats: mapFromFormats( separator.formats ),
		} );
	}

	const accumulator = defineFormatsAccessor( {
		_formats: new Map(),
		replacements: [],
		text: '',
	} );

	values.forEach( ( value, index ) => {
		if ( index > 0 ) {
			mergeFormatsInto( accumulator, separator );
			accumulator.replacements = accumulator.replacements.concat(
				separator.replacements
			);
			accumulator.text += separator.text;
		}
		mergeFormatsInto( accumulator, value );
		accumulator.replacements = accumulator.replacements.concat(
			value.replacements
		);
		accumulator.text += value.text;
	} );

	return normaliseFormats( accumulator );
}
