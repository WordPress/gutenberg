/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';

/**
 * Efficiently updates all the formats from `start` (including) until `end`
 * (excluding) with the active formats. Mutates `value`.
 *
 * @param  {Object} $1         Named paramentes.
 * @param  {Object} $1.value   Value te update.
 * @param  {number} $1.start   Index to update from.
 * @param  {number} $1.end     Index to update until.
 * @param  {Array}  $1.formats Replacement formats.
 *
 * @return {Object} Mutated value.
 */
export function updateFormats( { value, start, end, formats } ) {
	const formatsBefore = value.formats[ start - 1 ] || [];
	const formatsAfter = value.formats[ end ] || [];

	// First, fix the references. If any format right before or after are
	// equal, the replacement format should use the same reference.
	value.activeFormats = formats.map( ( format, index ) => {
		if ( formatsBefore[ index ] ) {
			if ( isFormatEqual( format, formatsBefore[ index ] ) ) {
				return formatsBefore[ index ];
			}
		} else if ( formatsAfter[ index ] ) {
			if ( isFormatEqual( format, formatsAfter[ index ] ) ) {
				return formatsAfter[ index ];
			}
		}

		return format;
	} );

	while ( --end >= start ) {
		if ( value.activeFormats.length > 0 ) {
			value.formats[ end ] = value.activeFormats;
		} else {
			delete value.formats[ end ];
		}
	}

	return value;
}
