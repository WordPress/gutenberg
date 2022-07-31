/**
 * Internal dependencies
 */
import { getLineIndex } from './get-line-index';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Checks if the selected list item can be indented.
 *
 * @param {RichTextValue} value Value to check.
 *
 * @return {boolean} Whether or not the selected list item can be indented.
 */
export function canIndentCode( value ) {
	const lineIndex = getLineIndex( value );

	// There is only one line, so the line cannot be indented.
	if ( lineIndex === undefined ) {
		return false;
	}

	const { replacements } = value;
	const previousLineIndex = getLineIndex( value, lineIndex );
	const formatsAtLineIndex = replacements[ lineIndex ] || [];
	const formatsAtPreviousLineIndex = replacements[ previousLineIndex ] || [];

	// If the indentation of the current line is greater than previous line,
	// then the line cannot be furter indented.
	return formatsAtLineIndex.length <= formatsAtPreviousLineIndex.length;
}
