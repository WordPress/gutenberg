/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';

/**
 * Normalises formats: ensures subsequent equal formats have the same reference.
 *
 * @param  {Object} value Value to normalise formats of.
 *
 * @return {Object} New value with normalised formats.
 */
export function normaliseFormats( { formats, text, start, end } ) {
	const newFormats = formats.slice( 0 );

	newFormats.forEach( ( formatsAtIndex, index ) => {
		const lastFormatsAtIndex = newFormats[ index - 1 ];

		if ( lastFormatsAtIndex && formatsAtIndex ) {
			const newFormatsAtIndex = formatsAtIndex.slice( 0 );

			newFormatsAtIndex.forEach( ( format, formatIndex ) => {
				const lastFormat = lastFormatsAtIndex[ formatIndex ];

				if ( isFormatEqual( format, lastFormat ) ) {
					newFormatsAtIndex[ formatIndex ] = lastFormat;
				}
			} );

			newFormats[ index ] = newFormatsAtIndex;
		} else if ( ! formatsAtIndex ) {
			delete newFormats[ index ];
		}
	} );

	return { formats: newFormats, text, start, end };
}
