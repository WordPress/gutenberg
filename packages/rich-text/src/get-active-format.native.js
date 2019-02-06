/**
 * External dependencies
 */

import { find } from 'lodash';

/**
 * Gets the format object by type at the start of the selection. This can be
 * used to get e.g. the URL of a link format at the current selection, but also
 * to check if a format is active at the selection. Returns undefined if there
 * is no format at the selection.
 *
 * @param {Object} value      Value to inspect.
 * @param {string} formatType Format type to look for.
 *
 * @return {?Object} Active format object of the specified type, or undefined.
 */
export function getActiveFormat( { formats, formatPlaceholder, start, end }, formatType ) {
	if ( start === undefined ) {
		return;
	}

	// if selection is not empty, get the first character format
	if ( start !== end ) {
		return find( formats[ start ], { type: formatType } );
	}

	// if user picked (or unpicked) formats but didn't write anything in those formats yet return this format
	if ( formatPlaceholder && formatPlaceholder.index === start ) {
		return find( formatPlaceholder.formats, { type: formatType } );
	}

	// if we're at the start of text, use the first char to pick up the formats
	const startPos = start === 0 ? 0 : start - 1;

	// otherwise get the previous character format
	const previousLetterFormat = find( formats[ startPos ], { type: formatType } );

	if ( previousLetterFormat ) {
		return previousLetterFormat;
	}

	return undefined;
}
