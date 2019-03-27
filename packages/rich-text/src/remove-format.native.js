/**
 * External dependencies
 */

import { cloneDeep } from 'lodash';

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
	value,
	formatType,
	startIndex = value.start,
	endIndex = value.end
) {
	const { formats, formatPlaceholder, start, end } = value;
	const newFormats = formats.slice( 0 );
	let newFormatPlaceholder = null;

	if ( start === end ) {
		if ( formatPlaceholder && formatPlaceholder.index === start ) {
			const placeholderFormats = ( formatPlaceholder.formats || [] ).slice( 0 );
			newFormatPlaceholder = {
				...formatPlaceholder,
				// make sure we do not reuse the formats reference in our placeholder `formats` array
				formats: cloneDeep( placeholderFormats.filter( ( { type } ) => type !== formatType ) ),
			};
		} else if ( ! formatPlaceholder ) {
			const previousFormat = ( start > 0 ? formats[ start - 1 ] : formats[ 0 ] ) || [];
			newFormatPlaceholder = {
				index: start,
				formats: cloneDeep( previousFormat.filter( ( { type } ) => type !== formatType ) ),
			};
		}
	}

	// Do not remove format if selection is empty
	for ( let i = startIndex; i < endIndex; i++ ) {
		if ( newFormats[ i ] ) {
			filterFormats( newFormats, i, formatType );
		}
	}

	return normaliseFormats( { ...value, formats: newFormats, formatPlaceholder: newFormatPlaceholder } );
}

function filterFormats( formats, index, formatType ) {
	const newFormats = formats[ index ].filter( ( { type } ) => type !== formatType );

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		delete formats[ index ];
	}
}
