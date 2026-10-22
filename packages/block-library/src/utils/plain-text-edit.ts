import {
	create,
	insert,
	toHTMLString,
	type RichTextFormatList,
} from '@wordpress/rich-text';

/**
 * The text of a rich text attribute, for showing in a plain text field.
 *
 * @param html The attribute's value.
 * @return The text with the markup removed.
 */
export function getPlainText( html?: string ): string {
	return html ? create( { html } ).text : '';
}

/**
 * Applies an edit made in a plain text field to a rich text attribute.
 *
 * Only the characters that changed are replaced, so the formatting of the
 * rest of the text survives. Typed text takes the format of the character
 * before it, as it does on the canvas.
 *
 * @param html    The attribute's value before the edit.
 * @param newText The field's text after the edit.
 * @return The attribute's value after the edit.
 */
export function applyPlainTextEdit(
	html: string | undefined,
	newText: string
): string {
	const value = create( { html: html ?? '' } );
	const oldText = value.text;
	if ( oldText === newText ) {
		return html ?? '';
	}

	// The edit is the span between the longest common prefix and suffix.
	const max = Math.min( oldText.length, newText.length );
	let prefix = 0;
	while ( prefix < max && oldText[ prefix ] === newText[ prefix ] ) {
		prefix++;
	}
	let suffix = 0;
	while (
		suffix < max - prefix &&
		oldText[ oldText.length - 1 - suffix ] ===
			newText[ newText.length - 1 - suffix ]
	) {
		suffix++;
	}

	const inserted = create( {
		text: newText.slice( prefix, newText.length - suffix ),
	} );
	const formats: RichTextFormatList | undefined =
		prefix > 0 ? value.formats[ prefix - 1 ] : value.formats[ 0 ];
	if ( formats ) {
		inserted.formats = Array.from( inserted.text, () => formats );
	}

	return toHTMLString( {
		value: insert( value, inserted, prefix, oldText.length - suffix ),
	} );
}
