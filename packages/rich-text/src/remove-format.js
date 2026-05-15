/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';
import { normaliseFormats } from './normalise-formats';
import {
	defineFormatsAccessor,
	mapFromFormats,
	materializeFormats,
} from './format-ranges';

/** @typedef {import('./types').RichTextValue} RichTextValue */

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
	const { activeFormats } = value;
	const sourceFormats = value._formats || mapFromFormats( value.formats );
	const materialised = materializeFormats( sourceFormats, value.text.length );
	const newFormats = materialised.slice();

	// If the selection is collapsed, expand start and end to the edges of the
	// format.
	if ( startIndex === endIndex ) {
		const format = newFormats[ startIndex ]?.find(
			( { type } ) => type === formatType
		);

		if ( format ) {
			// Expand across all adjacent same-type formats. Use structural
			// equality (not reference) because `_formats` may split a single
			// logical range across multiple Map entries when nesting depth
			// changes, materialising into different references at each depth.
			while (
				newFormats[ startIndex ]?.find( ( newFormat ) =>
					isFormatEqual( newFormat, format )
				)
			) {
				filterFormats( newFormats, startIndex, formatType );
				startIndex--;
			}

			endIndex++;

			while (
				newFormats[ endIndex ]?.find( ( newFormat ) =>
					isFormatEqual( newFormat, format )
				)
			) {
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

	return normaliseFormats(
		defineFormatsAccessor( {
			...value,
			_formats: mapFromFormats( newFormats ),
			activeFormats:
				activeFormats?.filter( ( { type } ) => type !== formatType ) ||
				[],
		} )
	);
}

function filterFormats( formats, index, formatType ) {
	const newFormats = formats[ index ].filter(
		( { type } ) => type !== formatType
	);

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		delete formats[ index ];
	}
}
