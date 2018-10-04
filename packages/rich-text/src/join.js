/**
 * Internal dependencies
 */

import { create } from './create';
import { normaliseFormats } from './normalise-formats';

/**
 * Combine an array of Rich Text values into one, optionally separated by
 * `separator`, which can be a Rich Text value, HTML string, or plain text
 * string. This is similar to `Array.prototype.join`.
 *
 * @param {Array}         values    An array of values to join.
 * @param {string|Object} separator Separator string or value.
 *
 * @return {Object} A new combined value.
 */
export function join( values, separator = '' ) {
	if ( typeof separator === 'string' ) {
		separator = create( { text: separator } );
	}

	return normaliseFormats( values.reduce( ( accumlator, { _formats, _text } ) => ( {
		_text: accumlator._text + separator._text + _text,
		_formats: accumlator._formats.concat( separator._formats, _formats ),
	} ) ) );
}
