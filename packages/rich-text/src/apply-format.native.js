/**
 * External dependencies
 */

import { find, without } from 'lodash';

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
 * @param {Object} format     Format to apply.
 * @param {number} startIndex Start index.
 * @param {number} endIndex   End index.
 *
 * @return {Object} A new value with the format applied.
 */
export function applyFormat(
	{ formats, formatPlaceholder, text, start, end },
	format,
	startIndex = start,
	endIndex = end
) {
	const newFormats = formats.slice( 0 );
	const previousFormats = newFormats[ startIndex - 1 ] || [];
	const placeholderFormats = formatPlaceholder && formatPlaceholder.index === start && formatPlaceholder.formats;
	// Follow the same logic as in getActiveFormat: placeholderFormats has priority over previousFormats
	const activeFormats = ( placeholderFormats ? placeholderFormats : previousFormats ) || [];
	const hasType = find( activeFormats, { type: format.type } );

	// The selection is collpased, insert a placeholder with the format so new input appears
	// with the format applied.
	if ( startIndex === endIndex ) {
		return {
			formats,
			text,
			start,
			end,
			formatPlaceholder: {
				index: start,
				formats: [
					...without( activeFormats, hasType ),
					...! hasType && [ format ],
				],
			},
		};
	}

	for ( let index = startIndex; index < endIndex; index++ ) {
		applyFormats( newFormats, index, format );
	}

	return normaliseFormats( { formats: newFormats, text, start, end } );
}

function applyFormats( formats, index, format ) {
	if ( formats[ index ] ) {
		const newFormatsAtIndex = formats[ index ].filter( ( { type } ) => type !== format.type );
		newFormatsAtIndex.push( format );
		formats[ index ] = newFormatsAtIndex;
	} else {
		formats[ index ] = [ format ];
	}
}
