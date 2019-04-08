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
	return {
		...value,
		formats: value.formats.reduce( ( accumulator, charFormats, charIndex ) => {
			const prevCharFormats = accumulator[ charIndex - 1 ];

			// Only if there are formats at the previous character, the same
			// reference can be used.
			if ( prevCharFormats ) {
				accumulator[ charIndex ] = charFormats.map( ( format, formatIndex ) => {
					const ref = prevCharFormats[ formatIndex ];

					if ( isFormatEqual( format, ref ) ) {
						return ref;
					}

					return format;
				} );
			} else {
				accumulator[ charIndex ] = charFormats;
			}

			return accumulator;
		}, Array( value.formats.length ) ),
	};
}
