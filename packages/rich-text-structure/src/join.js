/**
 * Internal dependencies
 */

import { create } from './create';

/**
 * Combines the given records into one record, separated by the given record or
 * text.
 *
 * Works like `Array.prototype.join()`.
 *
 * @param {Array}         records   An array of records to join.
 * @param {string|Object} separator Separator string or record.
 *
 * @return {Object} A new combined record.
 */
export function join( records, separator = '' ) {
	if ( typeof separator === 'string' ) {
		separator = create( separator );
	}

	return records.reduce( ( accumlator, { formats, text } ) => {
		return {
			text: accumlator.text + separator.text + text,
			formats: accumlator.formats.concat( separator.formats, formats ),
		};
	} );
}
