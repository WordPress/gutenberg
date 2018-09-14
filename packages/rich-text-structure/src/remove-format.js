/**
 * External dependencies
 */

import { find } from 'lodash';

/**
 * Removes a given format from a record from the given start to the given end.
 * If either start or end are omitted, the record's selection will be used.
 * If the selection is collapsed, the start and end will be expanded to the
 * boundaries of the format.
 *
 * @param {Object} record     Record to modify.
 * @param {string} formatType Format type to remove.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new record with the format applied.
 */
export function removeFormat(
	{ formats, text, start, end },
	formatType,
	startIndex = start,
	endIndex = end
) {
	// If the selection is collapsed, expand start and end to the edges of the
	// format.
	if ( startIndex === endIndex ) {
		const format = find( formats[ startIndex ], { type: formatType } );

		while ( find( formats[ startIndex ], format ) ) {
			filterFormats( formats, startIndex, formatType );
			startIndex--;
		}

		endIndex++;

		while ( find( formats[ endIndex ], format ) ) {
			filterFormats( formats, endIndex, formatType );
			endIndex++;
		}
	} else {
		for ( let i = startIndex; i < endIndex; i++ ) {
			if ( formats[ i ] ) {
				filterFormats( formats, i, formatType );
			}
		}
	}

	return { formats, text, start, end };
}

function filterFormats( formats, index, formatType ) {
	const newFormats = formats[ index ].filter( ( { type } ) => type !== formatType );

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		delete formats[ index ];
	}
}
