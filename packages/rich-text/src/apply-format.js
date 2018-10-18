/**
 * External dependencies
 */

import { find } from 'lodash';

/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';

/**
 * Apply a format object to a Rich Text value from the given `startIndex` to the
 * given `endIndex`. Indices are retrieved from the selection if none are
 * provided.
 *
 * @param {Object} value      Value to modify.
 * @param {Object} format     Format to apply.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new value with the format applied.
 */
export function applyFormat(
	{ formats, text, start, end },
	format,
	startIndex = start,
	endIndex = end
) {
	const newFormats = formats.slice( 0 );

	// If the selection is collapsed, expand start and end to the edges of the
	// format.
	if ( startIndex === endIndex ) {
		const startFormat = find( newFormats[ startIndex ], { type: format.type } );

		while ( find( newFormats[ startIndex ], startFormat ) ) {
			applyFormats( newFormats, startIndex, format );
			startIndex--;
		}

		endIndex++;

		while ( find( newFormats[ endIndex ], startFormat ) ) {
			applyFormats( newFormats, endIndex, format );
			endIndex++;
		}
	} else {
		for ( let index = startIndex; index < endIndex; index++ ) {
			applyFormats( newFormats, index, format );
		}
	}

	return normaliseFormats( { formats: newFormats, text, start, end } );
}

function applyFormats( formats, index, format ) {
	if ( formats[ index ] ) {
		const newFormatsAtIndex = formats[ index ].filter( ( { type } ) => type !== format.type );
		newFormatsAtIndex.push( format );
		formats[ index ] = newFormatsAtIndex;
	} else {
		formats[ index ] = [ format ];
	}
}
