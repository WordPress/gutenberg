/**
 * External dependencies
 */

import { find } from 'lodash';

/**
 * Remove any format object from a Rich Text value by type from the given
 * `startIndex` to the given `endIndex`. Indices are retrieved from the
 * selection if none are provided.
 *
 * @param {Object} value      Value to modify.
 * @param {string} formatType Format type to remove.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new value with the format applied.
 */
export function removeFormat(
	{ formats, text, start, end },
	formatType,
	startIndex = start,
	endIndex = end
) {
	const newFormats = formats.slice( 0 );

	// If the selection is collapsed, expand start and end to the edges of the
	// format.
	if ( startIndex === endIndex ) {
		const format = find( newFormats[ startIndex ], { type: formatType } );

		while ( find( newFormats[ startIndex ], format ) ) {
			filterFormats( newFormats, startIndex, formatType );
			startIndex--;
		}

		endIndex++;

		while ( find( newFormats[ endIndex ], format ) ) {
			filterFormats( newFormats, endIndex, formatType );
			endIndex++;
		}
	} else {
		for ( let i = startIndex; i < endIndex; i++ ) {
			if ( newFormats[ i ] ) {
				filterFormats( newFormats, i, formatType );
			}
		}
	}

	return { formats: newFormats, text, start, end };
}

function filterFormats( formats, index, formatType ) {
	const newFormats = formats[ index ].filter( ( { type } ) => type !== formatType );

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		delete formats[ index ];
	}
}
