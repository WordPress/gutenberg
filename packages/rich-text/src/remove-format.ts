import { normaliseFormats } from './normalise-formats';
import type { RichTextFormatList, RichTextValue } from './types';

/**
 * Remove any format object from a Rich Text value by type from the given
 * `startIndex` to the given `endIndex`. Indices are retrieved from the
 * selection if none are provided.
 *
 * @param value        Value to modify.
 * @param formatType   Format type to remove.
 * @param [startIndex] Start index.
 * @param [endIndex]   End index.
 *
 * @return A new value with the format applied.
 */
export function removeFormat(
	value: RichTextValue,
	formatType: string,
	startIndex = value.start,
	endIndex = value.end
) {
	const { formats, activeFormats } = value;
	const newFormats = formats.slice();

	// If the selection is collapsed, expand start and end to the edges of the
	// format.
	if ( startIndex === endIndex ) {
		const format = newFormats[ startIndex ]?.find(
			( { type } ) => type === formatType
		);

		if ( format ) {
			while (
				newFormats[ startIndex ]?.find(
					( newFormat ) => newFormat === format
				)
			) {
				filterFormats( newFormats, startIndex, formatType );
				startIndex--;
			}

			endIndex++;

			while (
				newFormats[ endIndex ]?.find(
					( newFormat ) => newFormat === format
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

	return normaliseFormats( {
		...value,
		formats: newFormats,
		activeFormats:
			activeFormats?.filter( ( { type } ) => type !== formatType ) || [],
	} );
}

function filterFormats(
	formats: RichTextFormatList[],
	index: number,
	formatType: string
) {
	const newFormats = formats[ index ].filter(
		( { type } ) => type !== formatType
	);

	if ( newFormats.length ) {
		formats[ index ] = newFormats;
	} else {
		delete formats[ index ];
	}
}
