/**
 * Internal dependencies
 */

import { getLineListFormats } from './get-line-list-formats';

/**
 * Wether or not the selected list has the given tag name.
 *
 * @param {string}  tagName     The tag name the list should have.
 * @param {string}  rootTagName The current root tag name, to compare with in
 *                              case nothing is selected.
 * @param {Object}  value       The internal rich-text value.
 *
 * @return {boolean}             [description]
 */
export function isActiveListType( tagName, rootTagName, value ) {
	const startLineFormats = getLineListFormats( value );
	const [ deepestListFormat ] = startLineFormats.slice( -1 );

	if ( ! deepestListFormat || ! deepestListFormat.type ) {
		return tagName === rootTagName;
	}

	return deepestListFormat.type.toLowerCase() === tagName;
}
