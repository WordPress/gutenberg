import { create } from '@wordpress/rich-text';

/**
 * A keystroke run's range, in plain-text offsets of its rich-text attribute.
 */
export type RunAnchor = {
	start: number;
	end: number;
};

/**
 * Plain text of a rich-text attribute value, tolerating plain strings and
 * non-rich values.
 *
 * @param value Block attribute value.
 * @return The value's text, or '' when it carries none.
 */
export function readValueText( value: any ): string {
	if ( value && typeof value.toHTMLString === 'function' ) {
		return create( { html: value.toHTMLString() } ).text;
	}
	if ( typeof value === 'string' ) {
		return create( { html: value } ).text;
	}
	return '';
}

/**
 * Map a run's anchor, captured against `textBefore`, onto `textAfter`.
 *
 * A keyboard run reads its offsets at keystroke time and cancels every
 * keystroke, then writes its marker once the note's id resolves. In between,
 * the block may have changed: another run's marker landed, Enter split the
 * block, a collaborator typed. The write belongs to the content, not to the
 * caret, so it stays valid as long as the text it is anchored to is intact.
 *
 * The edit is read as one changed region between the common prefix and the
 * common suffix. An anchor wholly before that region keeps its offsets, one
 * wholly after it shifts by the length change, and one overlapping it no
 * longer has a defined position: the caller drops the run.
 *
 * @param anchor     The run's range in `textBefore`.
 * @param textBefore Attribute text when the run started.
 * @param textAfter  Attribute text now.
 * @return The range in `textAfter`, or null when the edit touched it.
 */
export function rebaseRunAnchor(
	anchor: RunAnchor,
	textBefore: string,
	textAfter: string
): RunAnchor | null {
	const { start, end } = anchor;
	if ( start < 0 || end < start || end > textBefore.length ) {
		return null;
	}
	if ( textBefore === textAfter ) {
		return { start, end };
	}
	const shorter = Math.min( textBefore.length, textAfter.length );
	let prefix = 0;
	while ( prefix < shorter && textBefore[ prefix ] === textAfter[ prefix ] ) {
		prefix++;
	}
	let suffix = 0;
	while (
		suffix < shorter - prefix &&
		textBefore[ textBefore.length - 1 - suffix ] ===
			textAfter[ textAfter.length - 1 - suffix ]
	) {
		suffix++;
	}
	// The changed region, in `textBefore` offsets.
	const changeStart = prefix;
	const changeEnd = textBefore.length - suffix;
	const delta = textAfter.length - textBefore.length;

	if ( changeStart === changeEnd ) {
		// A pure insertion at `changeStart`.
		if ( start >= changeStart ) {
			return { start: start + delta, end: end + delta };
		}
		if ( end <= changeStart ) {
			return { start, end };
		}
		// Inserted inside the run's selected range.
		return null;
	}
	if ( end <= changeStart ) {
		return { start, end };
	}
	if ( start >= changeEnd ) {
		return { start: start + delta, end: end + delta };
	}
	return null;
}
