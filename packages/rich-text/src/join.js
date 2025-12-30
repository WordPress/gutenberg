/**
 * Internal dependencies
 */

import { create } from './create';
import { normaliseFormats } from './normalise-formats';

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

	return normaliseFormats(
		values.reduce( ( accumulator, { formats, replacements, text } ) => ( {
			formats: accumulator.formats.concat( separator.formats, formats ),
			replacements: accumulator.replacements.concat(
				separator.replacements,
				replacements
			),
			text: accumulator.text + separator.text + text,
		} ) )
	);
}
