/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';

/**
 * Normalises formats: ensures subsequent equal formats have the same reference.
 *
 * @param {Object} value Value to normalise formats of.
 *
 * @return {Object} New value with normalised formats.
 */
export function normaliseFormats( value ) {
	const newFormats = value.formats.slice();

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

	return {
		...value,
		formats: newFormats,
	};
}
