/**
 * Internal dependencies
 */

import { LINE_SEPARATOR } from './special-characters';
import { normaliseFormats } from './normalise-formats';
import { getLineIndex } from './get-line-index';
import { getParentLineIndex } from './get-parent-line-index';

/**
 * Outdents any selected list items if possible.
 *
 * @param {Object} value Value to change.
 *
 * @return {Object} The changed value.
 */
export function outdentListItems( value ) {
	const { text, formats, start, end } = value;
	const lineIndex = getLineIndex( value );
	const lineFormats = formats[ lineIndex ];

	if ( lineFormats === undefined ) {
		return value;
	}

	const newFormats = formats.slice( 0 );
	const parentFormats = formats[ getParentLineIndex( value, lineIndex ) ] || [];

	for ( let index = lineIndex; index < end; index++ ) {
		if ( text[ index ] !== LINE_SEPARATOR ) {
			continue;
		}

		// Omit the indentation level where the selection starts.
		newFormats[ index ] = parentFormats.concat(
			newFormats[ index ].slice( parentFormats.length + 1 )
		);

		if ( newFormats[ index ].length === 0 ) {
			delete newFormats[ lineIndex ];
		}
	}

	return normaliseFormats( {
		text,
		formats: newFormats,
		start,
		end,
	} );
}
