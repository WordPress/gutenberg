import { create, getActiveFormats, toHTMLString } from '@wordpress/rich-text';
import {
	SUGGESTION_TYPE_FORMAT,
	isSuggestionFormat,
	suggestionKindOf,
} from '../inline-suggestions';

/*
 * The formats typed text takes on live in the selected rich text's own state:
 * the formats around the caret, or the ones toggled on at it (Bold pressed
 * with nothing selected). Suggestion mode cancels the native insertion and
 * writes the text itself, so the suggestion markers' format `edit`, which is
 * handed that state, publishes it here for the addition keyboard to read.
 */

type CaretFormats = { text: string; start: number; formats: any[] };

let published: CaretFormats | null = null;
let restore: { text: string; caret: number } | null = null;

/**
 * The formats of a stack that are content, not suggestion markers.
 *
 * @param formats A format stack.
 * @return Its content formats.
 */
function contentFormats( formats: any[] | undefined ): any[] {
	return ( formats ?? [] ).filter(
		( format ) => ! isSuggestionFormat( format )
	);
}

/**
 * Publish the content formats active at the selected rich text's caret.
 *
 * Nothing is published for a selection, or inside a pending formatting
 * suggestion: the formatting there is that suggestion's proposal, which text
 * typed into it does not join.
 *
 * @param value The rich text value handed to a format `edit`, or null.
 */
export function publishCaretFormats( value: any ) {
	if (
		! value ||
		value.start === undefined ||
		value.start !== value.end ||
		typeof value.text !== 'string'
	) {
		published = null;
		return;
	}
	const active = getActiveFormats( value );
	const inFormatSuggestion = active.some(
		( format: any ) => suggestionKindOf( format ) === SUGGESTION_TYPE_FORMAT
	);
	published = {
		text: value.text,
		start: value.start,
		formats: inFormatSuggestion ? [] : contentFormats( active ),
	};
}

/**
 * Give typed text the formats active at the caret, as its HTML.
 *
 * @param text      The typed text.
 * @param fieldText The text of the field it is typed into.
 * @param start     The caret offset.
 * @return The formatted HTML, or null when no content format is active there.
 */
export function formatTypedText(
	text: string,
	fieldText: string,
	start: number
): string | null {
	if (
		! published ||
		! published.formats.length ||
		published.start !== start ||
		published.text !== fieldText
	) {
		return null;
	}
	const record = create( { text } );
	const { formats } = published;
	return toHTMLString( {
		value: {
			...record,
			formats: Array.from( record.text, () => formats ),
		},
	} );
}

/**
 * Ask for the caret to stay inside the formats of the text just written
 * before it. Rich text forgets its active formats when content and selection
 * are set from outside, and then reads the caret as sitting outside the
 * boundary of what was typed.
 *
 * @param text  The field's text after the write.
 * @param caret The caret offset after the write.
 */
export function keepCaretFormats( text: string, caret: number ) {
	restore = { text, caret };
}

/**
 * The active formats to put back on the rich text after a typed write, or
 * null when it already reads the caret as inside them.
 *
 * @param value The rich text value handed to a format `edit`.
 * @return The formats to restore, or null.
 */
export function takeCaretFormatsToRestore( value: any ): any[] | null {
	// The selection reaches the rich text a render ahead of the content.
	if ( ! restore || ! value || value.text !== restore.text ) {
		return null;
	}
	const { caret } = restore;
	restore = null;
	if ( value.start !== caret || value.end !== caret || caret < 1 ) {
		return null;
	}
	const before: any[] = value.formats?.[ caret - 1 ] ?? [];
	const wanted = contentFormats( before );
	const current = contentFormats( getActiveFormats( value ) );
	const same =
		wanted.length === current.length &&
		wanted.every( ( format, index ) => format === current[ index ] );
	return same ? null : before;
}
