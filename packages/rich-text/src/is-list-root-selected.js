/**
 * Internal dependencies
 */

import { getLineListFormats } from './get-line-list-formats';

/**
 * Whether or not the root list is selected.
 *
 * @param {Object}   value  The internal rich-text value.
 *
 * @return {boolean} True if the root list or nothing is selected, false if an
 *                   inner list is selected.
 */
export function isListRootSelected( value ) {
	const startLineFormats = getLineListFormats( value );
	return startLineFormats.length < 1;
}
