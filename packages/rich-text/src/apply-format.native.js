/**
 * External dependencies
 */

import { differenceBy } from 'lodash';

/**
 * Internal dependencies
 */

import { normaliseFormats } from './normalise-formats';

/**
 * Apply a format object to a Rich Text value from the given `startIndex` to the
 * given `endIndex`. Indices are retrieved from the selection if none are
 * provided.
 *
 * @param {Object} value      Value to modify.
 * @param {Object} formats    Formats to apply.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new value with the format applied.
 */
export function applyFormat(
	{ formats: currentFormats, formatPlaceholder, text, start, end },
	formats,
	startIndex = start,
	endIndex = end
) {
	if ( ! Array.isArray( formats ) ) {
		formats = [ formats ];
	}

	// The selection is collpased, insert a placeholder with the format so new input appears
	// with the format applied.
	if ( startIndex === endIndex ) {
		const previousFormats = currentFormats[ startIndex - 1 ] || [];
		const placeholderFormats = formatPlaceholder && formatPlaceholder.index === start && formatPlaceholder.formats;
		// Follow the same logic as in getActiveFormat: placeholderFormats has priority over previousFormats
		const activeFormats = ( placeholderFormats ? placeholderFormats : previousFormats ) || [];
		return {
			formats: currentFormats,
			text,
			start,
			end,
			formatPlaceholder: {
				index: start,
				formats: mergeFormats( activeFormats, formats ),
			},
		};
	}

	const newFormats = currentFormats.slice( 0 );

	for ( let index = startIndex; index < endIndex; index++ ) {
		applyFormats( newFormats, index, formats );
	}

	return normaliseFormats( { formats: newFormats, text, start, end } );
}

function mergeFormats( formats1, formats2 ) {
	const formats1Without2 = differenceBy( formats1, formats2, 'type' );
	return formats2.concat( formats1Without2 );
}

function applyFormats( formats, index, newFormats ) {
	if ( formats[ index ] ) {
		formats[ index ] = mergeFormats( formats[ index ], newFormats );
	} else {
		formats[ index ] = newFormats;
	}
}
