/**
 * External dependencies
 */

import { find } from 'lodash';

/**
 * Internal dependencies
 */

import { getActiveFormats } from './get-active-formats';

/**
 * Gets the format object by type at the start of the selection. This can be
 * used to get e.g. the URL of a link format at the current selection, but also
 * to check if a format is active at the selection. Returns undefined if there
 * is no format at the selection.
 *
 * @param {Object} value      Value to inspect.
 * @param {string} formatType Format type to look for.
 *
 * @return {Object|undefined} Active format object of the specified type, or undefined.
 */
export function getActiveFormat( value, formatType ) {
	return find( getActiveFormats( value ), { type: formatType } );
}
