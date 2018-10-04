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
	{ _formats, _text, _start, _end },
	format,
	startIndex = _start,
	endIndex = _end
) {
	const newFormats = _formats.slice( 0 );

	for ( let index = startIndex; index < endIndex; index++ ) {
		if ( newFormats[ index ] ) {
			const newFormatsAtIndex = newFormats[ index ].filter( ( { type } ) => type !== format.type );
			newFormatsAtIndex.push( format );
			newFormats[ index ] = newFormatsAtIndex;
		} else {
			newFormats[ index ] = [ format ];
		}
	}

	return normaliseFormats( { _formats: newFormats, _text, _start, _end } );
}
