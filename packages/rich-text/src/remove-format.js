/**
 * External dependencies
 */

import { find, reject } from 'lodash';

/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Remove any format object from a Rich Text value by type from the given
 * `startIndex` to the given `endIndex`. Indices are retrieved from the
 * selection if none are provided.
 *
 * @param {RichTextValue} value        Value to modify.
 * @param {string}        formatType   Format type to remove.
 * @param {number}        [startIndex] Start index.
 * @param {number}        [endIndex]   End index.
 *
 * @return {RichTextValue} A new value with the format applied.
 */
export function removeFormat(
	value,
	formatType,
	startIndex = value.start,
	endIndex = value.end
) {
	const { formats, activeFormats } = value;
	const newFormats = formats.slice();

	if ( typeof formatType !== 'string' ) {
		newFormats.forEach( ( f, i ) => {
			filterFormats( newFormats, i, formatType );
		} );

		return normaliseFormats( {
			...value,
			formats: newFormats,
			activeFormats: reject( activeFormats, formatType ),
		} );
	}

	// If the selection is collapsed, expand start and end to the edges of the
	// format.
	if ( startIndex === endIndex ) {
		const format = find( newFormats[ startIndex ], { type: formatType } );

		if ( format ) {
			while ( find( newFormats[ startIndex ], format ) ) {
				filterFormats( newFormats, startIndex, formatType );
				startIndex--;
			}

			endIndex++;

			while ( find( newFormats[ endIndex ], format ) ) {
				filterFormats( newFormats, endIndex, formatType );
				endIndex++;
			}
		}
	} else {
		for ( let i = startIndex; i < endIndex; i++ ) {
			if ( newFormats[ i ] ) {
				filterFormats( newFormats, i, formatType );
			}
		}
	}

	return normaliseFormats( {
		...value,
		formats: newFormats,
		activeFormats: reject( activeFormats, { type: formatType } ),
	} );
}

function filterFormats( formats, index, formatType ) {
	const fn =
		typeof formatType === 'string'
			? ( { type } ) => type !== formatType
			: ( format ) => format !== formatType;

	const newFormats = formats[ index ].filter( fn );

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		delete formats[ index ];
	}
}
