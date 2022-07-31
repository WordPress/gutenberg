/**
 * Internal dependencies
 */

import { canIndentCode } from './can-indent-code';
import { insert } from './insert';

/** @typedef {import('./create').RichTextValue} RichTextValue */

/**
 * Indents any selected list items if possible.
 *
 * @param {RichTextValue} value Value to change.
 *
 * @return {RichTextValue} The changed value.
 */
export function indentCode( value ) {
	if ( ! canIndentCode( value ) ) {
		return value;
	}

	const { start, end, text } = value;

	const selectedText = text.slice( start, end );
	// The first line should be indented, even if it starts with `\n`
	// The last line should only be indented if includes any character after `\n`
	const lineBreakCount = /\n/g.exec( selectedText )?.length;

	if ( lineBreakCount > 0 ) {
		// Select full first line to replace everything at once
		const firstLineStart = text.lastIndexOf( '\n', start - 1 ) + 1;

		const newSelection = text.slice( firstLineStart, end - 1 );
		const indentedText = newSelection.replace(
			/^|\n/g, // Match all line starts
			'$&\t'
		);

		return insert( value, indentedText, firstLineStart, end - 1 );
	}
	return insert( value, '\t' );
}
