import { isFormatEqual } from './is-format-equal';
import type { RichTextValue } from './types';

/**
 * Normalises formats: ensures subsequent adjacent equal formats have the same
 * reference.
 *
 * @param value Value to normalise formats of.
 *
 * @return New value with normalised formats.
 */
export function normaliseFormats( value: RichTextValue ) {
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
