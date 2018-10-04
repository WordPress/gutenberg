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
export function getActiveFormat( { _formats, _start }, formatType ) {
	if ( _start === undefined ) {
		return;
	}

	return find( _formats[ _start ], { type: formatType } );
}
