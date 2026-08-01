/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';
import {
	defineFormatsAccessor,
	mapFromFormats,
	materializeFormats,
} from './format-ranges';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * Normalises formats: ensures subsequent adjacent equal formats have the same
 * reference. Materialises a sparse `formats` view from `_formats`, dedupes
 * adjacent format references (the original behaviour callers depend on for
 * identity comparisons), and rebuilds `_formats` so the canonical Map stays
 * in sync.
 *
 * @param {RichTextValue} value Value to normalise formats of.
 *
 * @return {RichTextValue} New value with normalised formats.
 */
export function normaliseFormats( value ) {
	const sourceFormats = value._formats || mapFromFormats( value.formats );
	const materialised = materializeFormats( sourceFormats, value.text.length );
	const newFormats = materialised.slice();

	newFormats.forEach( ( formatsAtIndex, index ) => {
		const formatsAtPreviousIndex = newFormats[ index - 1 ];

		if ( formatsAtPreviousIndex ) {
			const newFormatsAtIndex = formatsAtIndex.slice();

			newFormatsAtIndex.forEach( ( format, formatIndex ) => {
				const previousFormat = formatsAtPreviousIndex[ formatIndex ];

				if ( isFormatEqual( format, previousFormat ) ) {
					newFormatsAtIndex[ formatIndex ] = previousFormat;
				}
			} );

			newFormats[ index ] = newFormatsAtIndex;
		}
	} );

	return defineFormatsAccessor( {
		...value,
		_formats: mapFromFormats( newFormats ),
	} );
}
