/**
 * External dependencies
 */

import { find, without } from 'lodash';

/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';

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
	{ formats, formatPlaceholder, text, start, end },
	formatType,
	startIndex = start,
	endIndex = end
) {
	const newFormats = formats.slice( 0 );
	let newFormatPlaceholder = null;

	if ( start === end && formatPlaceholder && formatPlaceholder.index === start ) {
		newFormatPlaceholder = {
			...formatPlaceholder,
			formats: without( formatPlaceholder.formats || [], find( formatPlaceholder.formats || [], { type: formatType } ) ),
		};
	}

	// Do not remove format if selection is empty
	for ( let i = startIndex; i < endIndex; i++ ) {
		if ( newFormats[ i ] ) {
			filterFormats( newFormats, i, formatType );
		}
	}

	return normaliseFormats( { formats: newFormats, formatPlaceholder: newFormatPlaceholder, text, start, end } );
}

function filterFormats( formats, index, formatType ) {
	const newFormats = formats[ index ].filter( ( { type } ) => type !== formatType );

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		delete formats[ index ];
	}
}
