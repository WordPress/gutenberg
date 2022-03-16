/**
 * Internal dependencies
 */

import { canIndentCode } from './can-indent-code';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Indents any selected list items if possible.
 *
 * @param {RichTextValue}  value      Value to change.
 *
 * @return {RichTextValue} The changed value.
 */
export function indentCode( value ) {
	if ( ! canIndentCode( value ) ) {
		return value;
	}

	const { replacements } = value;
	const newFormats = replacements.slice();

	newFormats[ 0 ] = 'Z';
	newFormats[ 59 ] = '\t\t';

	return {
		...value,
		replacements: newFormats,
	};
}
