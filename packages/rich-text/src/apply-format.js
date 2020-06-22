/**
 * External dependencies
 */

import { find, reject } from 'lodash';

/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';

function replace( array, index, value ) {
	array = array.slice();
	array[ index ] = value;
	return array;
}

/**
 * Apply a format object to a Rich Text value from the given `startIndex` to the
 * given `endIndex`. Indices are retrieved from the selection if none are
 * provided.
 *
 * @param {Object} value        Value to modify.
 * @param {Object} format       Format to apply.
 * @param {number} [startIndex] Start index.
 * @param {number} [endIndex]   End index.
 *
 * @return {Object} A new value with the format applied.
 */
export function applyFormat(
	value,
	format,
	startIndex = value.start,
	endIndex = value.end
) {
	const { formats, activeFormats } = value;
	const newFormats = formats.slice();

	// The selection is collapsed.
	if ( startIndex === endIndex ) {
		const startFormat = find( newFormats[ startIndex ], {
			type: format.type,
		} );

		// If the caret is at a format of the same type, expand start and end to
		// the edges of the format. This is useful to apply new attributes.
		if ( startFormat ) {
			const index = newFormats[ startIndex ].indexOf( startFormat );

			while (
				newFormats[ startIndex ] &&
				newFormats[ startIndex ][ index ] === startFormat
			) {
				newFormats[ startIndex ] = replace(
					newFormats[ startIndex ],
					index,
					format
				);
				startIndex--;
			}

			endIndex++;

			while (
				newFormats[ endIndex ] &&
				newFormats[ endIndex ][ index ] === startFormat
			) {
				newFormats[ endIndex ] = replace(
					newFormats[ endIndex ],
					index,
					format
				);
				endIndex++;
			}
		}
	} else {
		// Determine the highest position the new format can be inserted at.
		let position = +Infinity;

		for ( let index = startIndex; index < endIndex; index++ ) {
			if ( newFormats[ index ] ) {
				newFormats[ index ] = newFormats[ index ].filter(
					( { type } ) => type !== format.type
				);

				const length = newFormats[ index ].length;

				if ( length < position ) {
					position = length;
				}
			} else {
				newFormats[ index ] = [];
				position = 0;
			}
		}

		for ( let index = startIndex; index < endIndex; index++ ) {
			newFormats[ index ].splice( position, 0, format );
		}
	}

	return normaliseFormats( {
		...value,
		formats: newFormats,
		// Always revise active formats. This serves as a placeholder for new
		// inputs with the format so new input appears with the format applied,
		// and ensures a format of the same type uses the latest values.
		activeFormats: [
			...reject( activeFormats, { type: format.type } ),
			format,
		],
	} );
}
