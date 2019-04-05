/**
 * Internal dependencies
 */

import { getLineIndex } from './get-line-index';

/**
 * Whether or not the root list is selected.
 *
 * @param {Object} value The value to check.
 *
 * @return {boolean} True if the root list or nothing is selected, false if an
 *                   inner list is selected.
 */
export function isListRootSelected( value ) {
	const { replacements, start } = value;
	const lineIndex = getLineIndex( value, start );
	const replacement = replacements[ lineIndex ];

	return ! replacement || replacement.length < 1;
}
