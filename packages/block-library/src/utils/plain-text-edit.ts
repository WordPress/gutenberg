import {
	create,
	insert,
	toHTMLString,
	type RichTextFormatList,
	type RichTextValue,
} from '@wordpress/rich-text';

/**
 * What a single-line field shows for the characters it cannot hold: the
 * newline of a line break, which an input drops from its value, and the
 * object replacement character that stands for an inline image, which
 * renders as a box.
 */
const FIELD_SYMBOLS: Record< string, string > = {
	'\n': '↵',
	'￼': '🖼️',
};

/**
 * The text of a rich text value as a single-line field shows it, with the
 * field offset at which each character of the value starts. The emoji spans
 * several UTF-16 code units, so the two texts do not line up by index.
 *
 * @param value The rich text value.
 * @return The field text and, for each value index, its field offset. The
 *         last entry is the length of the field text.
 */
function toFieldText( value: RichTextValue ): {
	text: string;
	offsets: number[];
} {
	let text = '';
	const offsets: number[] = [];
	// Step by UTF-16 index, not code point, as the formats and the offsets
	// passed to insert do.
	for ( let index = 0; index < value.text.length; index++ ) {
		const character = value.text[ index ];
		offsets.push( text.length );
		text += FIELD_SYMBOLS[ character ] ?? character;
	}
	offsets.push( text.length );
	return { text, offsets };
}

/**
 * The text of a rich text attribute, for showing in a plain text field.
 *
 * @param html The attribute's value.
 * @return The text with the markup removed.
 */
export function getPlainText( html?: string ): string {
	return html ? toFieldText( create( { html } ) ).text : '';
}

/**
 * Applies an edit made in a plain text field to a rich text attribute.
 *
 * Only the characters that changed are replaced, so the formatting, line
 * breaks and inline images in the rest of the text survive. Typed text takes
 * the format of the character before it, as it does on the canvas.
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
	const { text: oldText, offsets } = toFieldText( value );
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

	// Map the span back onto the value. A symbol the span cuts through
	// counts as changed, so the whole symbol is replaced.
	let start = 0;
	while ( offsets[ start + 1 ] <= prefix ) {
		start++;
	}
	let end = value.text.length;
	while ( offsets[ end - 1 ] >= oldText.length - suffix ) {
		end--;
	}

	const inserted = create( {
		text: newText.slice(
			offsets[ start ],
			newText.length - ( oldText.length - offsets[ end ] )
		),
	} );
	const formats: RichTextFormatList | undefined =
		start > 0 ? value.formats[ start - 1 ] : value.formats[ 0 ];
	if ( formats ) {
		inserted.formats = Array.from(
			{ length: inserted.text.length },
			() => formats
		);
	}

	return toHTMLString( { value: insert( value, inserted, start, end ) } );
}
