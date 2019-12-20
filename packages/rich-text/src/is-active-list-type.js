/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Wether or not the selected list has the given tag name.
 *
 * @param {Object}  value    The value to check.
 * @param {string}  type     The tag name the list should have.
 * @param {string}  rootType The current root tag name, to compare with in case
 *                           nothing is selected.
 *
 * @return {boolean} True if the current list type matches `type`, false if not.
 */
export function isActiveListType( value, type, rootType ) {
	const { replacements, start } = value;
	const lineIndex = getLineIndex( value, start );
	const replacement = replacements[ lineIndex ];

	if ( ! replacement || replacement.length === 0 ) {
		return type === rootType;
	}

	const lastFormat = replacement[ replacement.length - 1 ];

	return lastFormat.type === type;
}
