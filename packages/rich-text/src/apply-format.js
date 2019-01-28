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

	// The selection is collapsed.
	if ( startIndex === endIndex ) {
		const startFormat = find( newFormats[ startIndex ], { type: format.type } );

		// If the caret is at a format of the same type, expand start and end to
		// the edges of the format. This is useful to apply new attributes.
		if ( startFormat ) {
			while ( find( newFormats[ startIndex ], startFormat ) ) {
				applyFormats( newFormats, startIndex, format );
				startIndex--;
			}

			endIndex++;

			while ( find( newFormats[ endIndex ], startFormat ) ) {
				applyFormats( newFormats, endIndex, format );
				endIndex++;
			}
		// Otherwise, insert a placeholder with the format so new input appears
		// with the format applied.
		} else {
			const previousFormat = newFormats[ startIndex - 1 ] || [];
			const hasType = find( previousFormat, { type: format.type } );

			return {
				formats,
				text,
				start,
				end,
				formatPlaceholder: {
					index: startIndex,
					format: hasType ? undefined : format,
				},
			};
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
