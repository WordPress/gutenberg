/**
 * Internal dependencies
 */

import { isFormatEqual } from './is-format-equal';

/**
 * Normalises formats: ensures subsequent adjacent equal formats have the same
 * reference.
 *
 * @param {Object} value Value to normalise formats of.
 *
 * @return {Object} New value with normalised formats.
 */
export function normaliseFormats( value ) {
	const newFormats = value.formats.reduce( ( accumulator, charFormats, charIndex ) => {
		const prevCharFormats = accumulator[ charIndex - 1 ];

		// Only if there are formats at the previous character, the same
		// reference can be used.
		if ( prevCharFormats ) {
			const newCharFormats = charFormats.map( ( format, formatIndex ) => {
				const ref = prevCharFormats[ formatIndex ];

				if ( isFormatEqual( format, ref ) ) {
					return ref;
				}

				return format;
			} );

			if (
				newCharFormats.length === prevCharFormats.length &&
				newCharFormats.every( ( ref, index ) => ref === prevCharFormats[ index ] )
			) {
				accumulator[ charIndex ] = prevCharFormats;
			} else {
				accumulator[ charIndex ] = newCharFormats;
			}
		} else {
			accumulator[ charIndex ] = charFormats;
		}

		return accumulator;
	}, Array( value.formats.length ) );

	return {
		...value,
		formats: newFormats,
	};
}
